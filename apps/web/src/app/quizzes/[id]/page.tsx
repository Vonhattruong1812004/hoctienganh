'use client';

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleDot,
  LogOut,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { SpeechButton } from '../../../components/speech-button';
import { ThemeToggleButton } from '../../../components/theme-toggle';
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

const quizTypeLabels: Record<string, string> = {
  CuoiBai: 'Cuối bài',
  CuoiNgay: 'Cuối ngày',
  LuyenTap: 'Luyện tập',
};

const questionTypeLabels: Record<string, string> = {
  MotDapAn: 'Một đáp án',
  NhieuDapAn: 'Nhiều đáp án',
  DienTu: 'Điền từ',
  Nghe: 'Nghe',
};

const difficultyLabels: Record<string, string> = {
  De: 'Dễ',
  TrungBinh: 'Trung bình',
  Kho: 'Khó',
};

const statusLabels: Record<string, string> = {
  Dat: 'Đạt',
  KhongDat: 'Không đạt',
  DangLam: 'Đang làm',
  DaNop: 'Đã nộp',
  CongBo: 'Đã công bố',
  Nhap: 'Bản nháp',
  An: 'Đang ẩn',
};

const vietnameseTextFixes: Record<string, string> = {
  'Cau nao dung de hoi ten nguoi khac?': 'Câu nào dùng để hỏi tên người khác?',
  'Dien tu con thieu: My ____ is Khang.': 'Điền từ còn thiếu: My ____ is Khang.',
  'Nice to meet you nghia la gi?': 'Nice to meet you nghĩa là gì?',
  'Nghe audio va chon loi chao ban nghe duoc.': 'Nghe audio và chọn lời chào bạn nghe được.',
  'Tu nao co nghia la quyen sach?': 'Từ nào có nghĩa là quyển sách?',
  'Chon cau dung khi gioi thieu vat o gan.': 'Chọn câu đúng khi giới thiệu vật ở gần.',
  'Dien tu: That is a blue ____.': 'Điền từ: That is a blue ____.',
  'Chair nghia la gi?': 'Chair nghĩa là gì?',
  'Father nghia la gi?': 'Father nghĩa là gì?',
  'Dien tu: She is my ____.': 'Điền từ: She is my ____.',
  'Cau nao dung de gioi thieu me cua toi?': 'Câu nào đúng để giới thiệu mẹ của tôi?',
  'My dung de dien ta dieu gi?': 'My dùng để diễn tả điều gì?',
  'Chon loi chao dung trong tieng Anh.': 'Chọn lời chào đúng trong tiếng Anh.',
  'Book, pen, chair thuoc chu de nao?': 'Book, pen, chair thuộc chủ đề nào?',
  'I study English every day dung thi nao?': 'I study English every day dùng thì nào?',
  'Dien tu: I like ____.': 'Điền từ: I like ____.',
  'Nghe audio va chon chu de cua doan nghe.': 'Nghe audio và chọn chủ đề của đoạn nghe.',
  'Rat vui duoc gap ban': 'Rất vui được gặp bạn',
  'Tam biet ban': 'Tạm biệt bạn',
  'cai ghe': 'cái ghế',
  'cai ban': 'cái bàn',
  'bo/cha': 'bố/cha',
  'anh trai': 'anh/em trai',
  'cua toi': 'của tôi',
  'cua ban': 'của bạn',
  'Do vat trong lop hoc': 'Đồ vật trong lớp học',
  'Thanh vien gia dinh': 'Thành viên gia đình',
  'Hien tai don': 'Hiện tại đơn',
  'Qua khu don': 'Quá khứ đơn',
  'Dap an goi y': 'Đáp án gợi ý',
};

function displayText(value: string | null | undefined) {
  if (!value) return '';
  return vietnameseTextFixes[value] ?? value;
}

function formatApiError(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    try {
      const body = JSON.parse(err.body) as { message?: string; error?: string };
      return body.message ?? body.error ?? fallback;
    } catch {
      return err.body || fallback;
    }
  }

  return err instanceof Error ? err.message : fallback;
}

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
        setError(formatApiError(err, 'Không tải được bài kiểm tra.'));
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
  const canSubmit = !isStaff && !!quiz && completion === 100 && !submitting && !result;
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
      setError(formatApiError(err, 'Nộp bài thất bại.'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    clearStoredSession();
    router.replace('/login');
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở quiz...</p>
      </main>
    );
  }

  return (
    <main className="studentUcStandalone quizTakingStandalone">
      <header className="studentUcTopbar">
        <div>
          <p className="eyebrow">Học viên</p>
          <h1>Làm bài kiểm tra</h1>
        </div>
        <div className="topbarActions">
          <ThemeToggleButton />
          <button className="secondaryButton" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </header>

      <header className="detailHero quizTakingHero">
        <div>
          <Link className="backLink" href={lessonLink}>
            <ArrowLeft size={16} />
            Về bài học
          </Link>
          <p className="eyebrow">{quiz ? quizTypeLabels[quiz.type] ?? 'Làm quiz' : 'Làm quiz'}</p>
          <h1>{quiz?.title ?? 'Đang tải bài kiểm tra...'}</h1>
          <p>{displayText(quiz?.description)}</p>
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
              <span>{statusLabels[result.attempt.status] ?? result.attempt.status}</span>
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
        <div className="sectionTitle quizTakingSectionTitle">
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
            <button className="primaryButton" type="button" onClick={handleSubmit} disabled={!canSubmit}>
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
          {!isStaff && completion < 100 ? (
            <span className="inlineBadge warningBadge">Cần trả lời đủ {quiz?.questions.length ?? 0} câu</span>
          ) : null}
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
                      <strong>{displayText(question.content)}</strong>
                      <small>
                        {questionTypeLabels[question.type] ?? question.type} •{' '}
                        {difficultyLabels[question.difficulty ?? ''] ?? question.difficulty ?? 'Dễ'} • {question.score} điểm
                      </small>
                    </div>
                    <CircleDot size={16} />
                  </div>

                  {question.audio ? (
                    <div className="questionAudio">
                      <SpeechButton text={displayText(question.content)} audioUrl={question.audio} label="Nghe câu hỏi" />
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
                          <span>{displayText(correctAnswer?.content) || 'Chưa có đáp án đúng'}</span>
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
                              <span>{displayText(answer.content)}</span>
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
                            <span>{displayText(answer.content)}</span>
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
