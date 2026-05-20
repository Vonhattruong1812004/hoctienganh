'use client';

import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileQuestion,
  GraduationCap,
  LineChart,
  ShieldAlert,
  Target,
  TimerReset,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../../components/app-shell';
import { getEtsAnswerKeysForQuestions } from '../../../lib/ets-answer-keys';
import {
  etsAttemptStoragePrefix,
  formatEtsClock,
  getEtsPartsByIds,
  getEtsQuestionList,
  parseEtsKeyText,
  type EtsAttemptPayload,
} from '../../../lib/ets-attempt';
import { etsQuestionInsight, getEtsPracticeTest } from '../../../lib/ets-practice-library';
import { ApiError, apiGet } from '../../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../lib/session';

type LinkedStudent = {
  id: string;
  fullName: string;
  email: string;
  currentLevel: string | null;
  learningGoal: string | null;
  totalPoints: number;
  learningStreak: number;
  completedLessons: number;
  activeLessons: number;
  lockedLessons: number;
  averageProgress: number;
};

type ParentQuizResult = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  quizId: string;
  quizTitle: string;
  quizType: string;
  passingScore: number;
  durationMinutes: number | null;
  attemptNumber: number;
  score: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  status: string;
  passed: boolean;
  startedAt: string | null;
  submittedAt: string | null;
  lessonId: string;
  lessonTitle: string;
  stageName: string | null;
  pathName: string | null;
};

type ToeicAttemptSummary = {
  id: string;
  title: string;
  partLabels: string;
  sectionLabel: string;
  finishedAt: string;
  durationSecondsUsed: number;
  totalQuestions: number;
  answered: number;
  correct: number;
  wrong: number;
  skipped: number;
  unchecked: number;
  accuracy: number;
  scorePercent: number;
  weakTopics: string[];
};

type ResultTab = 'overview' | 'quiz' | 'toeic';

export default function ParentResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [quizResults, setQuizResults] = useState<ParentQuizResult[]>([]);
  const [toeicAttempts, setToeicAttempts] = useState<ToeicAttemptSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [activeTab, setActiveTab] = useState<ResultTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    if (!storedSession.user.roles.includes(USER_ROLES.PARENT)) {
      router.replace('/dashboard');
      return;
    }

    setSession(storedSession);
    setToeicAttempts(readToeicAttemptsFromDevice());
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;
    async function loadResults() {
      try {
        const [studentResponse, resultResponse] = await Promise.all([
          apiGet<LinkedStudent[]>('/parents/me/students', currentSession.accessToken),
          apiGet<ParentQuizResult[]>('/parents/me/quiz-results', currentSession.accessToken),
        ]);

        if (!active) return;
        setStudents(studentResponse);
        setQuizResults(resultResponse);
        setSelectedStudentId((current) =>
          current === 'all' || studentResponse.some((student) => student.id === current) ? current : 'all',
        );
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được kết quả học tập.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadResults();
    return () => {
      active = false;
    };
  }, [router, session]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [selectedStudentId, students],
  );

  const visibleQuizResults = useMemo(() => {
    if (selectedStudentId === 'all') return quizResults;
    return quizResults.filter((result) => result.studentId === selectedStudentId);
  }, [quizResults, selectedStudentId]);

  const summary = useMemo(() => {
    const quizAttempts = visibleQuizResults.length;
    const passedQuiz = visibleQuizResults.filter((result) => result.passed).length;
    const failedQuiz = quizAttempts - passedQuiz;
    const averageQuiz = quizAttempts
      ? Math.round(visibleQuizResults.reduce((sum, result) => sum + Number(result.percentage ?? 0), 0) / quizAttempts)
      : 0;
    const bestQuiz = visibleQuizResults.reduce((max, result) => Math.max(max, Number(result.percentage ?? 0)), 0);
    const toeicAverage = toeicAttempts.length
      ? Math.round(toeicAttempts.reduce((sum, attempt) => sum + attempt.scorePercent, 0) / toeicAttempts.length)
      : 0;
    const bestToeic = toeicAttempts.reduce((max, attempt) => Math.max(max, attempt.scorePercent), 0);

    return {
      quizAttempts,
      passedQuiz,
      failedQuiz,
      averageQuiz,
      bestQuiz: Math.round(bestQuiz),
      toeicAttempts: toeicAttempts.length,
      toeicAverage,
      bestToeic: Math.round(bestToeic),
    };
  }, [toeicAttempts, visibleQuizResults]);

  const latestQuizResults = visibleQuizResults.slice(0, 8);
  const failedResults = visibleQuizResults.filter((result) => !result.passed).slice(0, 4);
  const latestToeicAttempts = toeicAttempts.slice(0, 6);
  const topWeakTopics = useMemo(() => {
    const counts = new Map<string, number>();
    toeicAttempts.flatMap((attempt) => attempt.weakTopics).forEach((topic) => counts.set(topic, (counts.get(topic) ?? 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [toeicAttempts]);

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở kết quả học tập...</p>
      </main>
    );
  }

  return (
    <AppShell
      session={session}
      active="parentResults"
      roleContext={USER_ROLES.PARENT}
      showSidebar={false}
      eyebrow="Phụ huynh"
      title="Kết quả học tập và thi thử"
    >
      <section className="parentResultsHero">
        <div>
          <p className="eyebrow">Bảng điểm của con</p>
          <h2>Quiz học tập, bài cần ôn và thi thử TOEIC trong một màn.</h2>
          <p>Theo dõi điểm, độ chính xác, lượt đạt/chưa đạt và nhóm kỹ năng cần cải thiện.</p>
        </div>
        <Link className="secondaryButton" href="/dashboard">
          Về dashboard
          <ArrowRight size={16} />
        </Link>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải kết quả học tập...</div> : null}

      <section className="parentResultsStudents" aria-label="Chọn học viên">
        <button
          className={selectedStudentId === 'all' ? 'active' : ''}
          type="button"
          onClick={() => setSelectedStudentId('all')}
        >
          <Users size={16} />
          Tất cả học viên
        </button>
        {students.map((student) => (
          <button
            className={selectedStudentId === student.id ? 'active' : ''}
            key={student.id}
            type="button"
            onClick={() => setSelectedStudentId(student.id)}
          >
            <GraduationCap size={16} />
            {student.fullName}
          </button>
        ))}
      </section>

      <section className="parentResultsStats" aria-label="Tổng quan kết quả">
        <article>
          <FileQuestion size={18} />
          <span>Lượt quiz</span>
          <strong>{summary.quizAttempts}</strong>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <span>Đã đạt</span>
          <strong>{summary.passedQuiz}</strong>
        </article>
        <article>
          <ShieldAlert size={18} />
          <span>Cần ôn</span>
          <strong>{summary.failedQuiz}</strong>
        </article>
        <article>
          <Award size={18} />
          <span>Quiz tốt nhất</span>
          <strong>{summary.bestQuiz}%</strong>
        </article>
        <article>
          <Trophy size={18} />
          <span>Thi thử TOEIC</span>
          <strong>{summary.toeicAttempts}</strong>
        </article>
        <article>
          <BarChart3 size={18} />
          <span>TOEIC tốt nhất</span>
          <strong>{summary.bestToeic}%</strong>
        </article>
      </section>

      <section className="parentResultsTabs" aria-label="Chọn nhóm kết quả">
        {[
          ['overview', 'Tổng quan'],
          ['quiz', 'Quiz học tập'],
          ['toeic', 'Thi thử TOEIC'],
        ].map(([key, label]) => (
          <button
            className={activeTab === key ? 'active' : ''}
            key={key}
            type="button"
            onClick={() => setActiveTab(key as ResultTab)}
          >
            {label}
          </button>
        ))}
      </section>

      {activeTab === 'overview' ? (
        <section className="parentResultsLayout">
          <div className="panel parentResultsPanel">
            <div className="sectionTitle">
              <div>
                <h2>Kết quả gần nhất</h2>
                <span>{selectedStudent?.fullName ?? 'Toàn bộ học viên'}</span>
              </div>
              <LineChart size={20} />
            </div>
            <div className="parentResultRows">
              {latestQuizResults.map((result) => (
                <QuizResultRow key={result.id} result={result} showStudent={selectedStudentId === 'all'} />
              ))}
              {!latestQuizResults.length && !loading ? <div className="subtleBox">Chưa có lượt làm quiz.</div> : null}
            </div>
          </div>

          <aside className="parentResultsAside">
            <section className="panel">
              <div className="sectionTitle">
                <div>
                  <h2>Cần ôn</h2>
                  <span>Các bài quiz chưa đạt yêu cầu.</span>
                </div>
                <Target size={20} />
              </div>
              <div className="parentResultFocusList">
                {failedResults.map((result) => (
                  <article key={result.id}>
                    <strong>{result.quizTitle}</strong>
                    <span>{selectedStudentId === 'all' ? result.studentName : result.lessonTitle}</span>
                    <em>{Math.round(result.percentage)}% / cần {Math.round(result.passingScore)}%</em>
                  </article>
                ))}
                {!failedResults.length ? <div className="subtleBox">Không có quiz cần ôn nổi bật.</div> : null}
              </div>
            </section>

            <section className="panel">
              <div className="sectionTitle">
                <div>
                  <h2>Thi thử</h2>
                  <span>Kết quả TOEIC lưu trên thiết bị này.</span>
                </div>
                <Trophy size={20} />
              </div>
              <div className="parentResultFocusList">
                {latestToeicAttempts.slice(0, 3).map((attempt) => (
                  <article key={attempt.id}>
                    <strong>{attempt.title}</strong>
                    <span>{attempt.partLabels}</span>
                    <em>{attempt.scorePercent}% · {formatEtsClock(attempt.durationSecondsUsed)}</em>
                  </article>
                ))}
                {!latestToeicAttempts.length ? <div className="subtleBox">Chưa có lượt thi thử trên thiết bị này.</div> : null}
              </div>
            </section>
          </aside>
        </section>
      ) : null}

      {activeTab === 'quiz' ? (
        <section className="panel parentResultsPanel">
          <div className="sectionTitle">
            <div>
              <h2>Quiz học tập</h2>
              <span>Điểm theo bài học, lần làm, số câu đúng/sai và trạng thái đạt.</span>
            </div>
          </div>
          <div className="parentResultRows">
            {visibleQuizResults.map((result) => (
              <QuizResultRow key={result.id} result={result} showStudent={selectedStudentId === 'all'} />
            ))}
            {!visibleQuizResults.length && !loading ? <div className="subtleBox">Chưa có lượt làm quiz.</div> : null}
          </div>
        </section>
      ) : null}

      {activeTab === 'toeic' ? (
        <section className="parentResultsLayout">
          <div className="panel parentResultsPanel">
            <div className="sectionTitle">
              <div>
                <h2>Thi thử TOEIC</h2>
                <span>Lấy từ các lượt làm trong UC Thi thử trên cùng thiết bị.</span>
              </div>
            </div>
            <div className="parentToeicAttemptList">
              {latestToeicAttempts.map((attempt) => (
                <article className="parentToeicAttemptCard" key={attempt.id}>
                  <div>
                    <p className="eyebrow">{attempt.sectionLabel}</p>
                    <strong>{attempt.title}</strong>
                    <span>{attempt.partLabels}</span>
                  </div>
                  <div className="parentToeicScore">
                    <strong>{attempt.scorePercent}%</strong>
                    <span>{attempt.correct} đúng / {attempt.wrong} sai / {attempt.skipped} bỏ qua</span>
                    <em>{formatDate(attempt.finishedAt)} · {formatEtsClock(attempt.durationSecondsUsed)}</em>
                  </div>
                  <div className="progressRail">
                    <div className="progressFill" style={{ width: `${Math.min(100, Math.max(0, attempt.scorePercent))}%` }} />
                  </div>
                </article>
              ))}
              {!latestToeicAttempts.length ? (
                <div className="subtleBox">Chưa có lượt thi thử TOEIC nào được lưu trên thiết bị này.</div>
              ) : null}
            </div>
          </div>

          <aside className="parentResultsAside">
            <section className="panel">
              <div className="sectionTitle">
                <div>
                  <h2>Chủ điểm yếu</h2>
                  <span>Dựa trên câu sai trong các lượt thi thử.</span>
                </div>
                <XCircle size={20} />
              </div>
              <div className="parentResultFocusList">
                {topWeakTopics.map(([topic, count]) => (
                  <article key={topic}>
                    <strong>{topic}</strong>
                    <span>{count} lần sai</span>
                    <em>Nên luyện lại dạng câu này.</em>
                  </article>
                ))}
                {!topWeakTopics.length ? <div className="subtleBox">Chưa đủ dữ liệu câu sai để phân tích.</div> : null}
              </div>
            </section>
          </aside>
        </section>
      ) : null}
    </AppShell>
  );
}

function QuizResultRow({ result, showStudent }: { result: ParentQuizResult; showStudent: boolean }) {
  return (
    <article className={`parentResultRow ${result.passed ? 'passed' : 'failed'}`}>
      <div className="parentResultMain">
        <p className="eyebrow">{showStudent ? result.studentName : result.pathName ?? 'Bài học'}</p>
        <strong>{result.quizTitle}</strong>
        <span>{result.lessonTitle}</span>
        <div className="parentResultMeta">
          <em>
            <BookOpen size={14} />
            {result.stageName ?? 'Chặng học'}
          </em>
          <em>
            <TimerReset size={14} />
            Lần {result.attemptNumber}
          </em>
          <em>
            <Clock3 size={14} />
            {formatDate(result.submittedAt)}
          </em>
        </div>
      </div>
      <div className="parentResultScore">
        <strong>{Math.round(result.percentage)}%</strong>
        <span>{result.correctCount} đúng / {result.wrongCount} sai</span>
        <em>{result.passed ? 'Đạt yêu cầu' : 'Cần ôn tập'}</em>
      </div>
    </article>
  );
}

function readToeicAttemptsFromDevice() {
  if (typeof window === 'undefined') return [];

  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(etsAttemptStoragePrefix))
    .map((key) => {
      try {
        return JSON.parse(window.localStorage.getItem(key) ?? '') as EtsAttemptPayload;
      } catch {
        return null;
      }
    })
    .filter((attempt): attempt is EtsAttemptPayload => Boolean(attempt?.id))
    .map(buildToeicAttemptSummary)
    .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());
}

function buildToeicAttemptSummary(attempt: EtsAttemptPayload): ToeicAttemptSummary {
  const selectedParts = getEtsPartsByIds(attempt.partIds);
  const activeQuestions = getEtsQuestionList(selectedParts);
  const autoKeyAnswers = getEtsAnswerKeysForQuestions(attempt.testNumber, activeQuestions);
  const pastedKeyAnswers = parseEtsKeyText(attempt.keyText, activeQuestions);
  const keyAnswers = { ...autoKeyAnswers, ...pastedKeyAnswers };
  const statusList = activeQuestions.map((question) => ({
    question,
    status: answerStatus(question, attempt.answers, keyAnswers),
  }));
  const correct = statusList.filter((item) => item.status === 'correct').length;
  const wrong = statusList.filter((item) => item.status === 'wrong').length;
  const skipped = statusList.filter((item) => item.status === 'skipped').length;
  const unchecked = statusList.filter((item) => item.status === 'unchecked').length;
  const checkedTotal = correct + wrong;
  const totalQuestions = activeQuestions.length;
  const partsBySection = new Set(selectedParts.map((part) => part.section));
  const weakTopics = statusList
    .filter((item) => item.status === 'wrong')
    .map((item) => etsQuestionInsight(item.question).topic)
    .filter((topic, index, list) => list.indexOf(topic) === index)
    .slice(0, 4);

  return {
    id: attempt.id,
    title: getEtsPracticeTest(attempt.testNumber).title,
    partLabels: selectedParts.map((part) => part.label).join(', '),
    sectionLabel: partsBySection.size > 1 ? 'Listening & Reading' : selectedParts[0]?.section ?? 'TOEIC',
    finishedAt: attempt.finishedAt,
    durationSecondsUsed: attempt.durationSecondsUsed,
    totalQuestions,
    answered: totalQuestions - skipped,
    correct,
    wrong,
    skipped,
    unchecked,
    accuracy: checkedTotal ? Math.round((correct / checkedTotal) * 1000) / 10 : 0,
    scorePercent: totalQuestions ? Math.round((correct / totalQuestions) * 1000) / 10 : 0,
    weakTopics,
  };
}

function answerStatus(question: number, answers: Record<string, string>, keyAnswers: Record<number, string>) {
  const chosen = answers[String(question)];
  const key = keyAnswers[question];
  if (!chosen) return 'skipped';
  if (!key) return 'unchecked';
  return chosen === key ? 'correct' : 'wrong';
}

function formatDate(value: string | null) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
