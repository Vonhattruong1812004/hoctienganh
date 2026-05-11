'use client';

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleDot,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { SpeechButton } from '../../../components/speech-button';
import { ApiError, apiGet, apiPost, resolveApiAssetUrl } from '../../../lib/api';
import { clearStoredSession } from '../../../lib/session';
import { getStoredSession, type WebAuthSession } from '../../../lib/session';

type QuizDetail = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  durationMinutes: number | null;
  passingScore: number;
  maxAttempts: number | null;
  lessonId: string;
  lessonTitle: string;
  lessonLevel: string | null;
  topicName: string | null;
  stageName: string | null;
  stageOrder: number | null;
  pathName: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  questions: Array<{
    id: string;
    content: string;
    type: string;
    score: number;
    difficulty: string | null;
    audio: string | null;
    imageUrl: string | null;
    orderIndex: number;
    answers: Array<{
      id: string;
      content: string;
      orderIndex: number;
      isCorrect?: boolean;
    }>;
  }>;
};

type SubmitResponse = {
  quiz: {
    id: string;
    title: string;
    passingScore: number;
  };
  attempt: {
    id: string;
    attemptNumber: number;
    score: number;
    totalScore: number;
    percentage: number;
    passed: boolean;
    status: string;
    correctCount: number;
    wrongCount: number;
  };
  progress: {
    lessonId: string;
    status: string;
    percentComplete: number;
    bestScore: number;
  };
  nextLesson: {
    id: string;
    title: string;
  } | null;
};

export default function QuizDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const quizId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lessonLink = quiz?.lessonId ? `/lessons/${quiz.lessonId}` : '/dashboard';
  const isStaff =
    session?.user.roles.some((role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN) ?? false;

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    setSession(storedSession);
  }, [router]);

  useEffect(() => {
    if (!session || !quizId) return;

    const currentSession = session;
    let active = true;

    async function load() {
      try {
        const response = await apiGet<QuizDetail>(`/quizzes/${quizId}`, currentSession.accessToken);
        if (!active) return;
        setQuiz(response);
        setSecondsLeft(response.durationMinutes && !isStaff ? response.durationMinutes * 60 : null);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được bài kiểm tra.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [isStaff, quizId, session]);

  useEffect(() => {
    if (isStaff || result || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (!submitting && quiz) {
        void handleSubmit();
      }
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current === null ? null : Math.max(0, current - 1)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isStaff, quiz, result, secondsLeft, submitting]);

  const completion = useMemo(() => {
    if (!quiz?.questions.length) return 0;
    const answered = quiz.questions.filter((question) => (answers[question.id] ?? '').trim().length > 0);
    return Math.round((answered.length / quiz.questions.length) * 100);
  }, [answers, quiz]);

  const answeredCount = quiz?.questions.filter((question) => (answers[question.id] ?? '').trim().length > 0).length ?? 0;
  const questionStatuses = quiz?.questions.map((question) => ({
    id: question.id,
    answered: (answers[question.id] ?? '').trim().length > 0,
    content: question.content,
  })) ?? [];

  async function handleSubmit() {
    if (!session || !quiz || isStaff) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        answers: quiz.questions.map((question) =>
          question.type === 'DienTu'
            ? {
                questionId: question.id,
                textAnswer: answers[question.id] ?? '',
              }
            : {
                questionId: question.id,
                ...(answers[question.id] ? { answerId: answers[question.id] } : {}),
              },
        ),
      };

      const response = await apiPost<SubmitResponse>(
        `/quizzes/${quiz.id}/submit`,
        payload,
        session.accessToken,
      );
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Nộp bài thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang chuyển hướng...</p>
      </main>
    );
  }

  return (
    <main className="detailPage">
      <header className="detailHero">
        <div>
          <Link className="backLink" href={lessonLink}>
            <ArrowLeft size={16} />
            Về bài học
          </Link>
          <p className="eyebrow">Làm quiz</p>
          <h1>{quiz?.title ?? 'Đang tải bài kiểm tra...'}</h1>
          <p>{quiz?.description}</p>
        </div>

        <div className="detailStats">
          <div>
            <span>Thời gian</span>
            <strong>
              {quiz?.durationMinutes ? `${quiz.durationMinutes} phút` : 'Không giới hạn'}
            </strong>
          </div>
          <div>
            <span>Đạt yêu cầu</span>
            <strong>{quiz?.passingScore ?? 80}%</strong>
          </div>
          <div>
            <span>Số câu</span>
            <strong>{quiz?.questions.length ?? 0}</strong>
          </div>
          {isStaff ? (
            <div>
              <span>Trạng thái</span>
              <strong>{quiz?.status ?? 'Chưa rõ'}</strong>
            </div>
          ) : null}
        </div>
      </header>

      {error ? <div className="errorBox detailMessage">{error}</div> : null}
      {loading && !quiz ? <div className="subtleBox detailMessage">Đang tải bài kiểm tra...</div> : null}

      {result ? (
        <section className={`resultBanner ${result.attempt.passed ? 'passed' : 'failed'}`}>
          <div>
            <p className="eyebrow">Kết quả nộp bài</p>
            <h2>{result.attempt.passed ? 'Bạn đã đạt bài' : 'Cần ôn tập thêm'}</h2>
            <p>
              Điểm {result.attempt.percentage}% | Đúng {result.attempt.correctCount} /{' '}
              {result.attempt.correctCount + result.attempt.wrongCount}
            </p>
          </div>

          <div className="resultActions">
            <div className="resultScore">
              <strong>{result.attempt.percentage}%</strong>
              <span>{result.attempt.status}</span>
            </div>
            {result.nextLesson ? (
              <Link className="primaryButton" href={`/lessons/${result.nextLesson.id}`}>
                Sang bài tiếp
                <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="detailSection">
        <div className="sectionTitle">
          <div>
            <h2>{isStaff ? 'Xem cấu trúc quiz' : 'Câu hỏi'}</h2>
            <span>
              {isStaff
                ? 'Chế độ quản lý dành cho giáo viên và quản trị viên để rà soát nội dung, đáp án và trạng thái.'
                : 'Hoàn thành hết các câu hỏi rồi nộp bài'}
            </span>
          </div>
          {isStaff ? (
            <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
              <span className="inlineBadge">
                <ShieldCheck size={14} />
                Chế độ quản lý
              </span>
              <Link className="secondaryButton" href={lessonLink}>
                Về bài học
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <button className="primaryButton" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>

        <div className="quizMetaRow">
          <span className="inlineBadge">
            <TimerReset size={14} />
            {secondsLeft !== null
              ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
              : isStaff
                ? 'Không áp dụng'
                : 'Không giới hạn'}
          </span>
          <span className="inlineBadge">
            <CheckCircle2 size={14} />
            {isStaff ? `${quiz?.questions.length ?? 0} câu hỏi` : `Đã trả lời ${completion}%`}
          </span>
          <span className="inlineBadge">Lần làm tối đa {quiz?.maxAttempts ?? 'không giới hạn'}</span>
          {isStaff ? <span className="inlineBadge">{quiz?.status ?? 'Chưa rõ trạng thái'}</span> : null}
        </div>

        <div className="quizWorkspace">
          <div className="questionStack">
            {quiz?.questions.map((question, index) => {
              const selectedAnswer = answers[question.id];
              const correctAnswer = question.answers.find((answer) => answer.isCorrect);

              return (
                <article className="questionCard" id={`quiz-question-${question.id}`} key={question.id}>
                  <div className="questionHead">
                    <div>
                      <span className="questionIndex">Câu {index + 1}</span>
                      <strong>{question.content}</strong>
                      <small>
                        {question.type} • {question.difficulty ?? 'Dễ'} • {question.score} điểm
                      </small>
                    </div>
                    <CircleDot size={16} />
                  </div>

                  {question.audio ? (
                    <div className="questionAudio">
                      <SpeechButton text={question.content} audioUrl={question.audio} label="Nghe câu hỏi" />
                    </div>
                  ) : null}

                  {question.imageUrl ? (
                    <div className="questionMedia">
                      <img src={resolveApiAssetUrl(question.imageUrl) ?? question.imageUrl} alt={question.content} />
                    </div>
                  ) : null}

                  {isStaff ? (
                    question.type === 'DienTu' ? (
                      <div className="optionStack">
                        <div className="optionButton selected" aria-readonly="true">
                          <CheckCircle2 size={16} />
                          <span>{correctAnswer?.content ?? 'Chưa có đáp án đúng'}</span>
                        </div>
                        <small>
                          Đáp án gợi ý{selectedAnswer ? ` • Đã chọn: ${selectedAnswer}` : ''}
                        </small>
                      </div>
                    ) : (
                      <div className="optionStack">
                        {question.answers.map((answer) => {
                          const correct = !!answer.isCorrect;
                          return (
                            <div
                              key={answer.id}
                              className={`optionButton ${correct ? 'selected' : ''}`}
                              aria-readonly="true"
                            >
                              {correct ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                              <span>{answer.content}</span>
                              {correct ? <em style={{ marginLeft: 'auto', fontStyle: 'normal' }}>Đáp án đúng</em> : null}
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : question.type === 'DienTu' ? (
                    <label className="field">
                      <span>Nhập câu trả lời</span>
                      <input
                        value={answers[question.id] ?? ''}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: event.target.value,
                          }))
                        }
                        placeholder="Nhập đáp án"
                      />
                    </label>
                  ) : (
                    <div className="optionStack">
                      {question.answers.map((answer) => {
                        const selected = answers[question.id] === answer.id;
                        return (
                          <button
                            key={answer.id}
                            className={`optionButton ${selected ? 'selected' : ''}`}
                            type="button"
                            onClick={() =>
                              setAnswers((current) => ({
                                ...current,
                                [question.id]: answer.id,
                              }))
                            }
                          >
                            {selected ? <CircleDot size={16} /> : <Circle size={16} />}
                            <span>{answer.content}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <aside className="quizSidebar">
            <div className="quizSidebarCard">
              <p className="eyebrow">{isStaff ? 'Thông tin quản lý' : 'Tổng quan'}</p>
              {isStaff ? (
                <>
                  <strong>{quiz?.lessonTitle ?? 'Bài học liên kết'}</strong>
                  <small>{quiz?.pathName ?? 'Chưa gắn lộ trình'}</small>
                  <small>{quiz?.stageName ?? 'Chưa gắn giai đoạn'}</small>
                  <small>{quiz?.topicName ?? 'Chưa gắn chủ đề'}</small>
                  <small>{quiz?.lessonLevel ?? 'Chưa rõ cấp độ'}</small>
                </>
              ) : (
                <>
                  <strong>
                    {answeredCount}/{quiz?.questions.length ?? 0} câu đã trả lời
                  </strong>
                  <div className="progressRail">
                    <div className="progressFill" style={{ width: `${completion}%` }} />
                  </div>
                  <small>{completion}% hoàn thành</small>
                </>
              )}
            </div>

            <div className="quizSidebarCard">
              <p className="eyebrow">Điều hướng</p>
              <div className="quizNavigator">
                {questionStatuses.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    className={`quizNavButton ${question.answered ? 'done' : 'pending'}`}
                    onClick={() =>
                      document.getElementById(`quiz-question-${question.id}`)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      })
                    }
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="quizSidebarCard">
              <p className="eyebrow">Thiết lập</p>
              <small>{quiz?.maxAttempts ?? 'Không giới hạn'} lượt làm</small>
              <small>Đạt tối thiểu {quiz?.passingScore ?? 80}%</small>
              {isStaff ? <small>Trạng thái: {quiz?.status ?? 'Chưa rõ'}</small> : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
