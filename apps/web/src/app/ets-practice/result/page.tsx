'use client';

import { ArrowLeft, BarChart3, CheckCircle2, Clock3, FileText, LogOut, Target, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ThemeToggleButton } from '../../../components/theme-toggle';
import {
  etsAttemptStorageKey,
  formatEtsClock,
  getEtsPartsByIds,
  getEtsQuestionList,
  parseEtsKeyText,
  type EtsAttemptPayload,
} from '../../../lib/ets-attempt';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../lib/session';
import { etsKeyAsset, etsQuestionInsight, getEtsPracticeTest } from '../../../lib/ets-practice-library';

type AnalysisRow = {
  label: string;
  correct: number;
  wrong: number;
  skipped: number;
  questions: number[];
};

function answerStatus(question: number, answers: Record<string, string>, keyAnswers: Record<number, string>) {
  const chosen = answers[String(question)];
  const key = keyAnswers[question];
  if (!chosen) return 'skipped';
  if (!key) return 'unchecked';
  return chosen === key ? 'correct' : 'wrong';
}

export default function EtsPracticeResultPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [attempt, setAttempt] = useState<EtsAttemptPayload | null>(null);
  const [activeDetail, setActiveDetail] = useState<number | null>(null);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);

    const params = new URLSearchParams(window.location.search);
    const attemptId = params.get('attempt');
    if (!attemptId) return;
    const raw = window.localStorage.getItem(etsAttemptStorageKey(attemptId));
    if (!raw) return;
    try {
      setAttempt(JSON.parse(raw) as EtsAttemptPayload);
    } catch {
      setAttempt(null);
    }
  }, [router]);

  const selectedParts = useMemo(() => getEtsPartsByIds(attempt?.partIds ?? []), [attempt?.partIds]);
  const activeQuestions = useMemo(() => getEtsQuestionList(selectedParts), [selectedParts]);
  const keyAnswers = useMemo(() => parseEtsKeyText(attempt?.keyText ?? '', activeQuestions), [activeQuestions, attempt?.keyText]);
  const selectedTest = useMemo(() => getEtsPracticeTest(attempt?.testNumber ?? 1), [attempt?.testNumber]);
  const correct = activeQuestions.filter((question) => answerStatus(question, attempt?.answers ?? {}, keyAnswers) === 'correct').length;
  const wrong = activeQuestions.filter((question) => answerStatus(question, attempt?.answers ?? {}, keyAnswers) === 'wrong').length;
  const skipped = activeQuestions.filter((question) => answerStatus(question, attempt?.answers ?? {}, keyAnswers) === 'skipped').length;
  const checkedTotal = correct + wrong;
  const accuracy = checkedTotal ? Math.round((correct / checkedTotal) * 1000) / 10 : 0;
  const scorePercent = activeQuestions.length ? Math.round((correct / activeQuestions.length) * 1000) / 10 : 0;

  const analysisRows = useMemo(() => {
    const rows = new Map<string, AnalysisRow>();
    activeQuestions.forEach((question) => {
      const part = selectedParts.find((item) => question >= item.from && question <= item.to);
      const insight = etsQuestionInsight(question);
      const label = `[${part?.label ?? 'Part'}] ${insight.topic}`;
      const row = rows.get(label) ?? { label, correct: 0, wrong: 0, skipped: 0, questions: [] };
      const status = answerStatus(question, attempt?.answers ?? {}, keyAnswers);
      if (status === 'correct') row.correct += 1;
      if (status === 'wrong') row.wrong += 1;
      if (status === 'skipped') row.skipped += 1;
      row.questions.push(question);
      rows.set(label, row);
    });
    return Array.from(rows.values());
  }, [activeQuestions, attempt?.answers, keyAnswers, selectedParts]);

  if (!session) {
    return <main className="studentUcStandalone">Đang chuyển hướng...</main>;
  }

  if (!attempt) {
    return (
      <main className="studentUcStandalone etsPracticePage">
        <header className="studentUcTopbar">
          <Link className="secondaryButton" href="/ets-practice">
            <ArrowLeft size={16} />
            Về thi thử
          </Link>
          <div>
            <p className="eyebrow">Kết quả</p>
            <h1>Chưa có bài làm</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <section className="etsPracticeHero">
          <div>
            <p className="eyebrow">Không tìm thấy phiên làm bài</p>
            <h2>Hãy chọn đề và làm bài trước.</h2>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="studentUcStandalone etsPracticePage etsResultPage">
      <header className="studentUcTopbar">
        <Link className="secondaryButton" href="/ets-practice">
          <ArrowLeft size={16} />
          Làm đề khác
        </Link>
        <div>
          <p className="eyebrow">Kết quả luyện tập</p>
          <h1>
            {selectedTest.title} {selectedParts.map((part) => part.label).join(' ')}
          </h1>
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

      <section className="etsPracticeHero etsResultHero">
        <div>
          <p className="eyebrow">Kết quả làm bài</p>
          <h2>
            {correct}/{activeQuestions.length}
          </h2>
          <p>
            Độ chính xác tính theo số câu đã có key và đã trả lời. Bên dưới có phân tích đúng, sai, bỏ qua, chủ điểm cần
            ôn và đáp án từng câu.
          </p>
        </div>
        <div className="etsTimerCard">
          <Target size={30} />
          <strong>{accuracy}%</strong>
          <span>độ chính xác</span>
        </div>
      </section>

      <section className="etsResultStats">
        <article>
          <CheckCircle2 size={22} />
          <span>Trả lời đúng</span>
          <strong>{correct}</strong>
        </article>
        <article>
          <XCircle size={22} />
          <span>Trả lời sai</span>
          <strong>{wrong}</strong>
        </article>
        <article>
          <FileText size={22} />
          <span>Bỏ qua</span>
          <strong>{skipped}</strong>
        </article>
        <article>
          <Clock3 size={22} />
          <span>Thời gian hoàn thành</span>
          <strong>{formatEtsClock(attempt.durationSecondsUsed)}</strong>
        </article>
        <article>
          <BarChart3 size={22} />
          <span>Điểm theo tổng câu</span>
          <strong>{scorePercent}%</strong>
        </article>
      </section>

      <section className="etsResultLayout">
        <div className="etsResultMain">
          <section className="etsAnalysisPanel">
            <div className="etsPanelHeading">
              <BarChart3 size={18} />
              <strong>Phân tích chi tiết</strong>
              <span>Gom câu theo Part và dạng lỗi để biết phải ôn gì tiếp theo.</span>
            </div>
            <div className="etsAnalysisTable">
              <div className="head">
                <span>Phân loại câu hỏi</span>
                <span>Đúng</span>
                <span>Sai</span>
                <span>Bỏ qua</span>
                <span>Độ chính xác</span>
                <span>Câu hỏi</span>
              </div>
              {analysisRows.map((row) => {
                const done = row.correct + row.wrong;
                const rowAccuracy = done ? Math.round((row.correct / done) * 10000) / 100 : 0;
                return (
                  <div className="row" key={row.label}>
                    <span>{row.label}</span>
                    <b>{row.correct}</b>
                    <b>{row.wrong}</b>
                    <b>{row.skipped}</b>
                    <b>{rowAccuracy}%</b>
                    <em>{row.questions.join(' ')}</em>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="etsAnswerReviewPanel">
            <div className="etsPanelHeading">
              <FileText size={18} />
              <strong>Đáp án</strong>
              <span>Bấm chi tiết để xem lý do sai, chủ điểm và tài liệu key cần đối chiếu.</span>
            </div>

            {selectedParts.map((part) => (
              <div className="etsReviewPart" id={part.id} key={part.id}>
                <h3>{part.label}</h3>
                <div className="etsAnswerReviewGrid">
                  {activeQuestions
                    .filter((question) => question >= part.from && question <= part.to)
                    .map((question) => {
                      const status = answerStatus(question, attempt.answers, keyAnswers);
                      const chosen = attempt.answers[String(question)] ?? 'chưa trả lời';
                      const key = keyAnswers[question] ?? '?';
                      const insight = etsQuestionInsight(question);
                      const keyUrl = etsKeyAsset(attempt.testNumber, part.section);
                      return (
                        <article className={status} key={question}>
                          <button type="button" onClick={() => setActiveDetail((current) => (current === question ? null : question))}>
                            <strong>{question}</strong>
                            <span>
                              {key}: {chosen}
                            </span>
                            <em>Chi tiết</em>
                          </button>
                          {activeDetail === question ? (
                            <div className="etsAnswerExplanation">
                              <b>{status === 'correct' ? 'Đúng' : status === 'wrong' ? 'Sai' : 'Bỏ qua'}</b>
                              <p>
                                Bạn chọn: {chosen}. Đáp án đúng: {key}.
                              </p>
                              <p>{insight.reason}</p>
                              <small>Chủ điểm: {insight.focus}</small>
                              <a href={keyUrl} target="_blank" rel="noreferrer">
                                Mở key và giải thích gốc
                              </a>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                </div>
              </div>
            ))}
          </section>
        </div>

        <aside className="etsPracticeSide">
          <div className="etsSideTitle">
            <Target size={18} />
            <strong>Part đã làm</strong>
            <span>{selectedParts.length} Part • {activeQuestions.length} câu</span>
          </div>
          <div className="etsPartRail">
            {selectedParts.map((part) => (
              <a href={`#${part.id}`} key={part.id}>
                <span>{part.label}</span>
                <strong>{part.title}</strong>
                <small>
                  Câu {part.from}-{part.to}
                </small>
              </a>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
