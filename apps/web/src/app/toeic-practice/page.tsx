'use client';

import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Headphones,
  LogOut,
  Mic2,
  Pause,
  PenLine,
  Play,
  RefreshCw,
  Send,
  Target,
  TimerReset,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { SpeechButton } from '../../components/speech-button';
import { ThemeToggleButton } from '../../components/theme-toggle';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';
import {
  getToeicPracticeTest,
  toeicPracticeTests,
  type ToeicPracticeItem,
  type ToeicPracticePart,
  type ToeicPracticeType,
} from '../../lib/toeic-practice-library';

const testTypeCopy: Record<
  ToeicPracticeType,
  {
    label: string;
    title: string;
    description: string;
  }
> = {
  'listening-reading': {
    label: 'Listening & Reading',
    title: 'Bài thi Nghe - Đọc',
    description: 'Mô phỏng 7 Part TOEIC L&R: nghe ảnh, hỏi đáp, hội thoại, bài nói và đọc hiểu.',
  },
  'speaking-writing': {
    label: 'Speaking & Writing',
    title: 'Bài thi Nói - Viết',
    description: 'Mô phỏng các task TOEIC S&W: đọc to, mô tả ảnh, trả lời, email và essay.',
  },
};

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function sectionIcon(section: ToeicPracticePart['section']) {
  if (section === 'Listening') return Headphones;
  if (section === 'Speaking') return Mic2;
  if (section === 'Writing') return PenLine;
  return BookOpenCheck;
}

function isChoiceItem(item: ToeicPracticeItem) {
  return item.kind === 'choice' && Array.isArray(item.choices);
}

export default function ToeicPracticePage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [testType, setTestType] = useState<ToeicPracticeType>('listening-reading');
  const [selectedTestId, setSelectedTestId] = useState('lr-office-set-a');
  const [mode, setMode] = useState<'part' | 'full'>('part');
  const [selectedPartId, setSelectedPartId] = useState('part-1');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [running, setRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);
  }, [router]);

  const availableTests = useMemo(() => toeicPracticeTests.filter((test) => test.type === testType), [testType]);
  const selectedTest = useMemo(() => getToeicPracticeTest(selectedTestId), [selectedTestId]);
  const selectedPart = useMemo(
    () => selectedTest.parts.find((part) => part.id === selectedPartId) ?? selectedTest.parts[0],
    [selectedPartId, selectedTest],
  );
  const activeParts = useMemo(
    () => (mode === 'full' ? selectedTest.parts : selectedPart ? [selectedPart] : []),
    [mode, selectedPart, selectedTest.parts],
  );
  const activeItems = useMemo(() => activeParts.flatMap((part) => part.items), [activeParts]);
  const choiceItems = useMemo(() => activeItems.filter(isChoiceItem), [activeItems]);
  const totalDurationMinutes = mode === 'full' ? selectedTest.fullDurationMinutes : selectedPart?.durationMinutes ?? 0;
  const answeredChoiceCount = choiceItems.filter((item) => answers[item.id]).length;
  const answeredOpenCount = activeItems.filter((item) => !isChoiceItem(item) && answers[item.id]?.trim()).length;
  const correctCount = choiceItems.filter((item) => answers[item.id] && answers[item.id] === item.answer).length;
  const scorePercent = choiceItems.length ? Math.round((correctCount / choiceItems.length) * 100) : 0;

  useEffect(() => {
    const firstTest = availableTests[0];
    if (!firstTest) return;
    setSelectedTestId(firstTest.id);
    setSelectedPartId(firstTest.parts[0]?.id ?? '');
    setMode('part');
  }, [availableTests]);

  useEffect(() => {
    setSelectedPartId(selectedTest.parts[0]?.id ?? '');
  }, [selectedTest]);

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setRunning(false);
    setRemainingSeconds(totalDurationMinutes * 60);
  }, [selectedTestId, selectedPartId, mode, totalDurationMinutes]);

  useEffect(() => {
    if (!running || remainingSeconds <= 0) return;
    const timerId = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          setRunning(false);
          setSubmitted(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [remainingSeconds, running]);

  if (!session) {
    return <main className="studentUcStandalone">Đang chuyển hướng...</main>;
  }

  return (
    <main className="studentUcStandalone toeicPracticePage">
      <header className="studentUcTopbar">
        <Link className="secondaryButton" href="/dashboard">
          <ArrowLeft size={16} />
          Về dashboard
        </Link>
        <div>
          <p className="eyebrow">Học viên</p>
          <h1>Ôn luyện bài thi mẫu TOEIC</h1>
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

      <section className="toeicPracticeHero">
        <div>
          <p className="eyebrow">TOEIC Mock Test Room</p>
          <h2>Làm quen bài thi TOEIC như phòng thi thật.</h2>
          <p>
            Học viên chọn Listening & Reading hoặc Speaking & Writing, chọn từng Part để luyện trọng điểm hoặc Full
            test để chạy đồng hồ theo thời lượng TOEIC. Bộ câu hỏi trong hệ thống là đề luyện tự xây dựng theo format
            chính thức, không sao chép đề bản quyền.
          </p>
        </div>
        <div className="toeicPracticeHeroCard">
          <TimerReset size={30} />
          <strong>{formatClock(remainingSeconds)}</strong>
          <span>{mode === 'full' ? 'Full test' : selectedPart?.label}</span>
        </div>
      </section>

      <section className="toeicPracticeSwitch" aria-label="Chọn nhóm bài thi">
        {(['listening-reading', 'speaking-writing'] as ToeicPracticeType[]).map((type) => {
          const Icon = type === 'listening-reading' ? Headphones : Mic2;
          return (
            <button className={testType === type ? 'active' : ''} type="button" onClick={() => setTestType(type)} key={type}>
              <Icon size={22} />
              <span>{testTypeCopy[type].label}</span>
              <strong>{testTypeCopy[type].title}</strong>
              <small>{testTypeCopy[type].description}</small>
            </button>
          );
        })}
      </section>

      <section className="toeicPracticeLayout">
        <aside className="toeicPracticeSelector">
          <div className="toeicPracticePanelTitle">
            <FileText size={18} />
            <strong>Chọn đề luyện</strong>
          </div>
          <div className="toeicPracticeTestList">
            {availableTests.map((test) => (
              <button
                className={selectedTest.id === test.id ? 'active' : ''}
                type="button"
                onClick={() => setSelectedTestId(test.id)}
                key={test.id}
              >
                <span>{test.level}</span>
                <strong>{test.title}</strong>
                <small>{test.description}</small>
              </button>
            ))}
          </div>

          <div className="toeicPracticeModePicker">
            <button className={mode === 'part' ? 'active' : ''} type="button" onClick={() => setMode('part')}>
              Từng Part
            </button>
            <button className={mode === 'full' ? 'active' : ''} type="button" onClick={() => setMode('full')}>
              Full test
            </button>
          </div>

          {mode === 'part' ? (
            <div className="toeicPracticePartRail" aria-label="Chọn Part">
              {selectedTest.parts.map((part) => {
                const Icon = sectionIcon(part.section);
                return (
                  <button
                    className={selectedPart?.id === part.id ? 'active' : ''}
                    type="button"
                    onClick={() => setSelectedPartId(part.id)}
                    key={part.id}
                  >
                    <Icon size={17} />
                    <span>{part.label}</span>
                    <strong>{part.title}</strong>
                    <small>
                      {part.officialQuestions} câu • {part.durationMinutes} phút luyện
                    </small>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="toeicPracticeFullCard">
              <Target size={20} />
              <strong>{selectedTest.officialTotalQuestions}</strong>
              <span>{selectedTest.fullDurationMinutes} phút theo full test</span>
            </div>
          )}
        </aside>

        <section className="toeicPracticeWorkspace" aria-label="Phòng làm bài TOEIC mẫu">
          <div className="toeicPracticeExamHeader">
            <div>
              <p className="eyebrow">{selectedTest.title}</p>
              <h2>{mode === 'full' ? 'Full test mô phỏng' : `${selectedPart?.label} - ${selectedPart?.title}`}</h2>
              <p>
                {mode === 'full'
                  ? 'Làm lần lượt toàn bộ Part trong đề để luyện nhịp thi thật.'
                  : selectedPart?.directions}
              </p>
            </div>
            <div className="toeicPracticeTimerBox">
              <span>Đồng hồ</span>
              <strong>{formatClock(remainingSeconds)}</strong>
              <div className="toeicPracticeTimerActions">
                <button type="button" onClick={() => setRunning((value) => !value)}>
                  {running ? <Pause size={16} /> : <Play size={16} />}
                  {running ? 'Tạm dừng' : 'Bắt đầu'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRunning(false);
                    setRemainingSeconds(totalDurationMinutes * 60);
                  }}
                >
                  <RefreshCw size={16} />
                  Đặt lại
                </button>
              </div>
            </div>
          </div>

          <div className="toeicPracticeStats">
            <span>
              <Clock3 size={17} />
              {totalDurationMinutes} phút
            </span>
            <span>
              <CheckCircle2 size={17} />
              {answeredChoiceCount + answeredOpenCount}/{activeItems.length} câu đã làm
            </span>
            <span>
              <Target size={17} />
              {submitted && choiceItems.length ? `${scorePercent}% phần trắc nghiệm` : 'Chưa nộp'}
            </span>
          </div>

          {activeParts.map((part) => {
            const PartIcon = sectionIcon(part.section);
            return (
              <section className="toeicPracticePartSection" key={part.id}>
                <div className="toeicPracticePartHead">
                  <span className="toeicPracticePartIcon">
                    <PartIcon size={22} />
                  </span>
                  <div>
                    <p className="eyebrow">
                      {part.section} • {part.label}
                    </p>
                    <h3>{part.title}</h3>
                    <p>{part.directions}</p>
                  </div>
                </div>

                <div className="toeicPracticeStrategy">
                  {part.strategy.map((tip) => (
                    <span key={tip}>
                      <CheckCircle2 size={15} />
                      {tip}
                    </span>
                  ))}
                </div>

                <div className="toeicPracticeQuestionList">
                  {part.items.map((item, index) => {
                    const chosen = answers[item.id] ?? '';
                    const isCorrect = submitted && isChoiceItem(item) && chosen === item.answer;
                    const isWrong = submitted && isChoiceItem(item) && Boolean(chosen) && chosen !== item.answer;
                    return (
                      <article className="toeicPracticeQuestion" key={item.id}>
                        <div className="toeicPracticeQuestionHead">
                          <span>Câu {index + 1}</span>
                          <strong>{item.kind === 'choice' ? 'Trắc nghiệm' : item.kind === 'speaking' ? 'Nói' : 'Viết'}</strong>
                        </div>

                        {item.imageUrl ? (
                          <figure className="toeicPracticePhoto">
                            <img src={item.imageUrl} alt={item.imageAlt ?? item.stimulus ?? 'TOEIC Part 1 photograph'} />
                            <figcaption>{item.imageCredit ?? item.stimulus}</figcaption>
                          </figure>
                        ) : item.stimulus ? (
                          <div className="toeicPracticeStimulus">{item.stimulus}</div>
                        ) : null}
                        {item.audioText ? (
                          <div className="toeicPracticeAudio">
                            <Headphones size={18} />
                            <span>Audio mô phỏng</span>
                            <SpeechButton text={item.audioText} label="Nghe đề" />
                          </div>
                        ) : null}

                        <h4>{item.prompt}</h4>

                        {isChoiceItem(item) ? (
                          <div className="toeicPracticeChoices">
                            {item.choices?.map((choice) => (
                              <button
                                className={[
                                  chosen === choice ? 'selected' : '',
                                  submitted && choice === item.answer ? 'correct' : '',
                                  isWrong && chosen === choice ? 'wrong' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                type="button"
                                onClick={() => {
                                  if (!submitted) setAnswers((current) => ({ ...current, [item.id]: choice }));
                                }}
                                key={choice}
                              >
                                {choice}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            value={chosen}
                            onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))}
                            placeholder={
                              item.kind === 'speaking'
                                ? 'Ghi nhanh ý chính bạn sẽ nói, rồi luyện đọc thành tiếng...'
                                : 'Viết câu trả lời/email/essay của bạn...'
                            }
                          />
                        )}

                        {submitted ? (
                          <div className={isCorrect ? 'toeicPracticeFeedback correct' : 'toeicPracticeFeedback'}>
                            {isChoiceItem(item) ? (
                              <strong>
                                Đáp án: {item.answer} {isCorrect ? '• Đúng' : chosen ? '• Cần xem lại' : '• Chưa trả lời'}
                              </strong>
                            ) : item.sampleAnswer ? (
                              <strong>Mẫu tham khảo: {item.sampleAnswer}</strong>
                            ) : null}
                            <p>{item.explanation}</p>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div className="toeicPracticeSubmitBar">
            <div>
              <strong>{submitted ? 'Đã nộp bài luyện' : 'Sẵn sàng nộp bài mô phỏng'}</strong>
              <span>
                {submitted
                  ? choiceItems.length
                    ? `${correctCount}/${choiceItems.length} câu trắc nghiệm đúng`
                    : 'Đã lưu phần luyện nói/viết để tự đối chiếu mẫu'
                  : 'Sau khi nộp, hệ thống hiện đáp án, giải thích và mẫu trả lời.'}
              </span>
            </div>
            <button className="primaryButton" type="button" onClick={() => setSubmitted(true)}>
              <Send size={17} />
              Nộp bài mô phỏng
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
