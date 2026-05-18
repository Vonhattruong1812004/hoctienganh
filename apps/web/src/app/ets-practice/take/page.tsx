'use client';

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Headphones,
  LogOut,
  Send,
  Target,
  TimerReset,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ThemeToggleButton } from '../../../components/theme-toggle';
import {
  etsAttemptStorageKey,
  formatEtsClock,
  getEtsDurationMinutes,
  getEtsPartsByIds,
  getEtsQuestionList,
  parseEtsKeyText,
  parseEtsPartIds,
  type EtsToeicType,
} from '../../../lib/ets-attempt';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../lib/session';
import {
  etsAudioTracksForPart,
  etsPart1QuestionImageAssets,
  etsPart3QuestionGroupImageAssets,
  etsPart4QuestionGroupImageAssets,
  etsPartPaperAsset,
  etsQuestionInsight,
  getEtsPracticeTest,
} from '../../../lib/ets-practice-library';

type AnswerMap = Record<number, string>;

function choicesForQuestion(question: number) {
  return question >= 7 && question <= 31 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
}

function normalizeTestNumber(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10 ? parsed : 1;
}

export default function EtsPracticeTakePage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [toeicType, setToeicType] = useState<EtsToeicType>('lr');
  const [testNumber, setTestNumber] = useState(1);
  const [partIds, setPartIds] = useState<string[]>([]);
  const [partId, setPartId] = useState('part-1');
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [keyText, setKeyText] = useState('');
  const [running, setRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(120 * 60);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);

    const params = new URLSearchParams(window.location.search);
    const nextType = params.get('type') === 'sw' ? 'sw' : 'lr';
    const nextTestNumber = normalizeTestNumber(params.get('test'));
    const nextPartIds = parseEtsPartIds(params.get('parts'));
    setToeicType(nextType);
    setTestNumber(nextTestNumber);
    setPartIds(nextPartIds);
    setPartId(nextPartIds[0]);
    setStartedAt(new Date().toISOString());
    setRunning(true);
  }, [router]);

  const selectedTest = useMemo(() => getEtsPracticeTest(testNumber), [testNumber]);
  const selectedParts = useMemo(() => getEtsPartsByIds(partIds), [partIds]);
  const selectedPart = useMemo(
    () => selectedParts.find((part) => part.id === partId) ?? selectedParts[0],
    [partId, selectedParts],
  );
  const activeQuestions = useMemo(() => getEtsQuestionList(selectedParts), [selectedParts]);
  const totalDurationMinutes = useMemo(() => getEtsDurationMinutes(selectedParts), [selectedParts]);
  const answeredCount = activeQuestions.filter((question) => answers[question]).length;
  const keyAnswers = useMemo(() => parseEtsKeyText(keyText, activeQuestions), [activeQuestions, keyText]);
  const keyCount = activeQuestions.filter((question) => keyAnswers[question]).length;
  const correctCount = activeQuestions.filter((question) => answers[question] && answers[question] === keyAnswers[question]).length;
  const scorePercent = keyCount ? Math.round((correctCount / keyCount) * 100) : 0;
  const currentPaper = useMemo(() => etsPartPaperAsset(testNumber, selectedPart), [selectedPart, testNumber]);
  const audioTracks = useMemo(() => etsAudioTracksForPart(testNumber, selectedPart), [selectedPart, testNumber]);
  const partOneImages = useMemo(() => etsPart1QuestionImageAssets(testNumber), [testNumber]);
  const partThreeGroups = useMemo(() => etsPart3QuestionGroupImageAssets(testNumber), [testNumber]);
  const partFourGroups = useMemo(() => etsPart4QuestionGroupImageAssets(testNumber), [testNumber]);
  const listeningQuestionGroups = selectedPart.id === 'part-4' ? partFourGroups : partThreeGroups;
  const usesInlineListening =
    selectedPart.id === 'part-1' || selectedPart.id === 'part-2' || selectedPart.id === 'part-3' || selectedPart.id === 'part-4';
  const firstActiveQuestion = activeQuestions[0] ?? selectedPart.from;
  const lastActiveQuestion = activeQuestions[activeQuestions.length - 1] ?? selectedPart.to;
  const paperMeta =
    selectedPart.id === 'part-3' || selectedPart.id === 'part-4'
      ? `${listeningQuestionGroups.length} cụm ${selectedPart.id === 'part-3' ? 'hội thoại' : 'bài nói'}`
      : selectedPart.id === 'part-1'
        ? `${partOneImages.length} ảnh đã cắt`
        : selectedPart.id === 'part-2'
          ? `${audioTracks.length} câu nghe`
        : `Trang đề ${currentPaper.page}`;

  function scrollToQuestion(question: number) {
    document.getElementById(`question-${question}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function finishAttempt() {
    const attemptId = `${Date.now()}`;
    const totalSeconds = totalDurationMinutes * 60;
    const durationSecondsUsed = Math.max(0, totalSeconds - remainingSeconds);
    window.localStorage.setItem(
      etsAttemptStorageKey(attemptId),
      JSON.stringify({
        id: attemptId,
        type: toeicType,
        testNumber,
        partIds: selectedParts.map((part) => part.id),
        startedAt,
        finishedAt: new Date().toISOString(),
        durationSecondsUsed,
        totalDurationSeconds: totalSeconds,
        answers,
        keyText,
      }),
    );
    router.replace(`/ets-practice/result?attempt=${attemptId}`);
  }

  useEffect(() => {
    setRemainingSeconds(totalDurationMinutes * 60);
    setRunning(true);
  }, [partIds.join(','), testNumber, totalDurationMinutes]);

  useEffect(() => {
    if (!running || remainingSeconds <= 0) return;
    const timerId = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          window.setTimeout(() => finishAttempt(), 0);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [answers, keyText, remainingSeconds, running, selectedParts, startedAt, testNumber, toeicType, totalDurationMinutes]);

  if (!session) {
    return <main className="studentUcStandalone">Đang chuyển hướng...</main>;
  }

  if (toeicType === 'sw') {
    return (
      <main className="studentUcStandalone etsPracticePage">
        <header className="studentUcTopbar">
          <Link className="secondaryButton" href="/ets-practice">
            <ArrowLeft size={16} />
            Quay lại
          </Link>
          <div>
            <p className="eyebrow">Thi thử TOEIC</p>
            <h1>Speaking & Writing</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <section className="etsPracticeHero">
          <div>
            <p className="eyebrow">Chưa bật làm bài</p>
            <h2>Phần này cần bộ đề Speaking & Writing riêng.</h2>
            <p>Hiện thư mục ETS của bạn đang có dữ liệu LC/RC, audio và key cho Listening & Reading.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="studentUcStandalone etsPracticePage">
      <header className="studentUcTopbar">
        <Link className="secondaryButton" href="/ets-practice">
          <ArrowLeft size={16} />
          Chọn Part
        </Link>
        <div>
          <p className="eyebrow">Phòng thi TOEIC</p>
          <h1>{selectedTest.title}</h1>
        </div>
        <div className="topbarActions">
          <ThemeToggleButton />
          <button
            className="secondaryButton"
            type="button"
            onClick={() => {
              clearStoredSession();
              router.replace('/login');
            }}
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </header>

      <section className="etsPracticeHero etsTakingHero">
        <div>
          <p className="eyebrow">Hướng dẫn làm bài</p>
          <h2>{selectedParts.map((part) => part.label).join(' • ')}</h2>
          <p>{selectedPart.direction}</p>
        </div>
        <div className="etsTimerCard">
          <TimerReset size={30} />
          <strong>{formatEtsClock(remainingSeconds)}</strong>
          <span>
            {answeredCount}/{activeQuestions.length} câu • {totalDurationMinutes} phút
          </span>
        </div>
      </section>

      <section className="etsPracticeControls" aria-label="Điều khiển bài thi">
        <div className="etsModeSwitch">
          {selectedParts.map((part) => (
            <button className={part.id === selectedPart.id ? 'active' : ''} type="button" onClick={() => setPartId(part.id)} key={part.id}>
              {part.label}
            </button>
          ))}
        </div>

        <button className="primaryButton etsSubmitButton" type="button" onClick={finishAttempt}>
          <Send size={17} />
          Nộp bài
        </button>
      </section>

      <section className="etsPracticeLayout">
        <section className="etsPracticeMain">
          <div className="etsExamPaperHeader">
            <div>
              <p className="eyebrow">{selectedPart.section}</p>
              <h2>
                {selectedPart.label}: {selectedPart.title}
              </h2>
            </div>
            <span>
              Câu {selectedPart.from}-{selectedPart.to} • {paperMeta}
            </span>
          </div>

          {selectedPart.section === 'Listening' && !usesInlineListening ? (
            <section className="etsIntegratedAudio" aria-label="Audio của Part đang làm">
              <div className="etsPanelHeading">
                <Headphones size={18} />
                <strong>Audio theo câu/cụm câu</strong>
                <span>{audioTracks.length} track của {selectedPart.label}</span>
              </div>
              <div className="etsAudioList integrated">
                {audioTracks.map((track) => (
                  <article key={track.url}>
                    <span>{track.label}</span>
                    <audio controls preload="none" src={track.url} />
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {selectedPart.id === 'part-1' ? (
            <section className="etsPartOneBoard" aria-label="Ảnh Part 1 đã cắt theo từng câu">
              <div className="etsPanelHeading">
                <FileText size={18} />
                <strong>Part 1 đã cắt thành từng câu</strong>
                <span>Không còn kéo cả PDF. Mỗi câu có ảnh, audio và đáp án ngay bên dưới.</span>
              </div>

              <div className="etsPartOneGrid">
                {partOneImages.map((image) => {
                  const answer = answers[image.question];
                  const track = audioTracks.find((item) => item.from === image.question);
                  return (
                    <article key={image.question} id={`question-${image.question}`}>
                      <div className="etsPartOneImageFrame">
                        <img src={image.url} alt={image.alt} loading="lazy" />
                      </div>
                      <div className="etsPartOneQuestionBar">
                        <strong>Câu {image.question}</strong>
                        {track ? <audio controls preload="none" src={track.url} /> : null}
                      </div>
                      <div className="etsPartOneChoices" aria-label={`Chọn đáp án câu ${image.question}`}>
                        {choicesForQuestion(image.question).map((choice) => (
                          <button
                            className={answer === choice ? 'selected' : ''}
                            type="button"
                            onClick={() => setAnswers((current) => ({ ...current, [image.question]: choice }))}
                            key={choice}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : selectedPart.id === 'part-2' ? (
            <section className="etsPartTwoBoard" aria-label="Part 2 nghe từng câu và chọn đáp án">
              <div className="etsPanelHeading">
                <Headphones size={18} />
                <strong>Part 2 nghe từng câu</strong>
                <span>Mỗi câu chỉ có audio và 3 lựa chọn A/B/C, đúng như answer sheet của Part 2.</span>
              </div>

              <div className="etsPartTwoGrid">
                {audioTracks.map((track) => {
                  const question = track.from;
                  return (
                    <article key={track.url} id={`question-${question}`}>
                      <div className="etsPartTwoQuestionHead">
                        <small>Question-Response</small>
                        <strong>Câu {question}</strong>
                      </div>
                      <audio controls preload="none" src={track.url} />
                      <div className="etsPartTwoChoices" aria-label={`Chọn đáp án câu ${question}`}>
                        {choicesForQuestion(question).map((choice) => (
                          <button
                            className={answers[question] === choice ? 'selected' : ''}
                            type="button"
                            onClick={() => setAnswers((current) => ({ ...current, [question]: choice }))}
                            key={choice}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : selectedPart.id === 'part-3' || selectedPart.id === 'part-4' ? (
            <section className="etsPartThreeBoard" aria-label={`${selectedPart.label} đã cắt theo cụm câu hỏi`}>
              <div className="etsPanelHeading">
                <FileText size={18} />
                <strong>{selectedPart.label} đã cắt theo từng cụm 3 câu</strong>
                <span>
                  Mỗi cụm có đúng audio {selectedPart.id === 'part-3' ? 'hội thoại' : 'bài nói'}, ảnh câu hỏi và đáp án
                  nằm cùng một khối.
                </span>
              </div>

              <div className="etsPartThreeList">
                {listeningQuestionGroups.map((group) => {
                  const track = audioTracks.find((item) => item.from === group.from && item.to === group.to);
                  return (
                    <article key={group.id} id={`question-${group.from}`}>
                      <div className="etsPartThreeCardHead">
                        <div>
                          <small>{selectedPart.id === 'part-3' ? 'Conversation' : 'Talk'} {group.index}</small>
                          <strong>
                            Câu {group.from}-{group.to}
                          </strong>
                        </div>
                        {track ? <audio controls preload="none" src={track.url} /> : null}
                      </div>

                      <div className="etsPartThreeImageFrame">
                        <img src={group.url} alt={group.alt} loading="lazy" />
                      </div>

                      <div className="etsPartThreeAnswerStack">
                        {group.questions.map((question) => (
                          <div className="etsPartThreeAnswerRow" id={`question-${question}`} key={question}>
                            <strong>Câu {question}</strong>
                            <div>
                              {choicesForQuestion(question).map((choice) => (
                                <button
                                  className={answers[question] === choice ? 'selected' : ''}
                                  type="button"
                                  onClick={() => setAnswers((current) => ({ ...current, [question]: choice }))}
                                  key={choice}
                                >
                                  {choice}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="etsIntegratedPaper" aria-label="Đề tích hợp theo Part">
              <div className="etsPanelHeading">
                <FileText size={18} />
                <strong>Đề hiển thị ngay trong phòng thi</strong>
                <span>Khung đề tự mở đúng vùng Part đang làm. Không cần rời khỏi màn làm bài.</span>
              </div>
              <div className="etsPdfViewer integrated">
                <iframe title={currentPaper.label} src={currentPaper.url} />
              </div>
            </section>
          )}
        </section>

        <aside className="etsAnswerPanel">
          <div className="etsPanelHeading">
            <CheckCircle2 size={18} />
            <strong>Answer sheet</strong>
            <span>
              Câu {firstActiveQuestion}-{lastActiveQuestion} • {answeredCount}/{activeQuestions.length} câu đã chọn
            </span>
          </div>

          {usesInlineListening ? (
            <div className="etsAnswerStatusStrip">
              <span>
                <Clock3 size={16} />
                {totalDurationMinutes} phút
              </span>
              <span>
                <Target size={16} />
                {activeQuestions.length} câu
              </span>
              <span>{answeredCount} đã trả lời</span>
            </div>
          ) : (
            <div className="etsScoreStrip">
              <span>
                <Clock3 size={16} />
                {totalDurationMinutes} phút
              </span>
              <span>
                <Target size={16} />
                {keyCount ? `${correctCount}/${keyCount} đúng` : 'Chưa nhập key'}
              </span>
              <span>{keyCount ? `${scorePercent}%` : 'Có thể dán key trước khi nộp'}</span>
            </div>
          )}

          {usesInlineListening ? (
            <div className="etsAnswerStatusGrid" aria-label={`Trạng thái trả lời câu ${firstActiveQuestion}-${lastActiveQuestion}`}>
              {activeQuestions.map((question) => {
                const answered = Boolean(answers[question]);
                const insight = etsQuestionInsight(question);
                return (
                  <button
                    className={answered ? 'answered' : ''}
                    type="button"
                    onClick={() => scrollToQuestion(question)}
                    title={`${insight.topic} • ${answered ? `Đã trả lời ${answers[question]}` : 'Chưa trả lời'}`}
                    key={question}
                  >
                    <strong>{question}</strong>
                    <span>{answered ? 'Đã trả lời' : 'Chưa'}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="etsAnswerGrid">
              {activeQuestions.map((question) => {
                const answer = answers[question];
                const insight = etsQuestionInsight(question);
                return (
                  <div className="etsAnswerRow" key={question} title={insight.topic}>
                    <strong>{question}</strong>
                    <div>
                      {choicesForQuestion(question).map((choice) => (
                        <button
                          className={answer === choice ? 'selected' : ''}
                          type="button"
                          onClick={() => setAnswers((current) => ({ ...current, [question]: choice }))}
                          key={choice}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!usesInlineListening ? (
            <label className="etsKeyBox">
              <span>Key để chấm tự động</span>
              <textarea
                value={keyText}
                onChange={(event) => setKeyText(event.target.value)}
                placeholder="Dán đáp án theo thứ tự câu đã chọn, ví dụ: A B C D A..."
              />
            </label>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
