'use client';

import {
  ArrowRight,
  BarChart3,
  Award,
  BookOpen,
  CheckCircle2,
  FileQuestion,
  Filter,
  LockKeyhole,
  PlusCircle,
  Search,
  ShieldAlert,
  Sparkles,
  TimerReset,
  TrendingUp,
  LibraryBig,
  Target,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../components/app-shell';
import { ApiError, apiGet, apiPatch, apiPost } from '../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';

type LearningPathSummary = {
  id: string;
  name: string;
  description: string;
  level: string;
  targetAudience: string;
  status: string;
};

type LearningPathDetail = LearningPathSummary & {
  stages: Array<{
    id: string;
    name: string;
    orderIndex: number;
    lessons: Array<{
      id: string;
      title: string;
      orderIndex: number;
    }>;
  }>;
};

type LessonSummary = {
  id: string;
  title: string;
  orderIndex: number;
  stageOrder: number;
};

type LessonDetail = {
  id: string;
  title: string;
  topicName: string;
  quizzes: Array<{
    id: string;
    title: string;
    type: string;
    durationMinutes: number | null;
    passingScore: number;
  }>;
};

type ProgressRow = {
  lessonId: string;
  status: string;
  percentComplete: number;
  bestScore: number;
};

type QuizRow = LessonDetail['quizzes'][number] & {
  lessonId: string;
  lessonTitle: string;
  topicName: string;
  lessonStatus: string;
  lessonProgress: number;
};

type QuizManagementSummary = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  durationMinutes: number | null;
  passingScore: number;
  maxAttempts: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  lessonId: string;
  lessonTitle: string;
  lessonStatus: string;
  lessonLevel: string | null;
  lessonOrder: number;
  topicName: string | null;
  stageName: string | null;
  stageOrder: number | null;
  pathName: string | null;
  questionsCount: number;
  attemptsCount: number;
  passedAttemptsCount: number;
  averageScore: number;
  latestAttemptAt: string | null;
};

type ManagedLessonChoice = {
  id: string;
  title: string;
  lessonOrder: number;
  lessonLevel: string | null;
  pathName: string | null;
  stageName: string | null;
  status: string;
};

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

type ManagementFilter = 'all' | 'published' | 'draft';

const managementFilterLabels: Record<ManagementFilter, string> = {
  all: 'Tất cả',
  published: 'Đã công bố',
  draft: 'Bản nháp / ẩn',
};

type QuizManagementState = 'Nhap' | 'CongBo' | 'An';

const quizManagementStatusLabels: Record<QuizManagementState, string> = {
  Nhap: 'Bản nháp',
  CongBo: 'Công bố',
  An: 'Đang ẩn',
};

const quizTypeLabels: Record<string, string> = {
  LuyenTap: 'Luyện tập',
  CuoiBai: 'Cuối bài',
  CuoiNgay: 'Cuối ngày',
};

const statusLabels: Record<string, string> = {
  CongBo: 'Đã công bố',
  Nhap: 'Bản nháp',
  An: 'Đang ẩn',
  LuuTru: 'Lưu trữ',
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function QuizzesPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [managementQuizzes, setManagementQuizzes] = useState<QuizManagementSummary[]>([]);
  const [managedLessons, setManagedLessons] = useState<ManagedLessonChoice[]>([]);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [parentResults, setParentResults] = useState<ParentQuizResult[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [managementQuery, setManagementQuery] = useState('');
  const [managementFilter, setManagementFilter] = useState<ManagementFilter>('all');
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [newQuizType, setNewQuizType] = useState<'LuyenTap' | 'CuoiBai' | 'CuoiNgay'>('CuoiBai');
  const [newQuizDurationMinutes, setNewQuizDurationMinutes] = useState(10);
  const [newQuizPassingScore, setNewQuizPassingScore] = useState(80);
  const [newQuizMaxAttempts, setNewQuizMaxAttempts] = useState(3);
  const [newQuizStatus, setNewQuizStatus] = useState<QuizManagementState>('Nhap');
  const [newQuizLessonId, setNewQuizLessonId] = useState('');
  const [createQuizBusy, setCreateQuizBusy] = useState(false);
  const [quizActionBusyId, setQuizActionBusyId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    setSession(storedSession);
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;
    const isManagementMode = currentSession.user.roles.some(
      (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
    );

    async function load() {
      try {
        if (isManagementMode) {
          const [quizResponse, lessonResponse] = await Promise.all([
            apiGet<QuizManagementSummary[]>('/quizzes/manage', currentSession.accessToken),
            apiGet<ManagedLessonChoice[]>('/lessons/manage', currentSession.accessToken),
          ]);

          if (!active) return;
          setManagementQuizzes(quizResponse);
          setManagedLessons(lessonResponse);
          setQuizzes([]);
          setLinkedStudents([]);
          setParentResults([]);
          setSelectedStudentId('');
          return;
        }

        if (currentSession.user.roles.includes(USER_ROLES.PARENT)) {
          const [students, results] = await Promise.all([
            apiGet<LinkedStudent[]>('/parents/me/students', currentSession.accessToken),
            apiGet<ParentQuizResult[]>('/parents/me/quiz-results', currentSession.accessToken),
          ]);

          if (!active) return;
          setManagementQuizzes([]);
          setManagedLessons([]);
          setLinkedStudents(students);
          setParentResults(results);
          setSelectedStudentId((currentSelected) =>
            students.some((student) => student.id === currentSelected)
              ? currentSelected
              : students[0]?.id ?? '',
          );
          return;
        }

        const paths = await apiGet<LearningPathSummary[]>('/learning-paths', currentSession.accessToken);
        const firstPath = paths[0]
          ? await apiGet<LearningPathDetail>(`/learning-paths/${paths[0].id}`, currentSession.accessToken)
          : null;
        const progressRows = currentSession.user.roles.includes('HocVien')
          ? await apiGet<ProgressRow[]>(`/progress/students/${currentSession.user.id}`, currentSession.accessToken)
          : [];
        const lessonSummaries: LessonSummary[] =
          firstPath?.stages.flatMap((stage) =>
            stage.lessons.map((lesson) => ({
              ...lesson,
              stageOrder: stage.orderIndex,
            })),
          ) ?? [];
        const lessonDetails = await Promise.all(
          lessonSummaries.map((lesson) => apiGet<LessonDetail>(`/lessons/${lesson.id}`, currentSession.accessToken)),
        );
        const progressByLesson = new Map(progressRows.map((item) => [item.lessonId, item]));
        const quizRows = lessonDetails.flatMap((lesson, index) => {
          const lessonSummary = lessonSummaries[index];
          const lessonProgress = progressByLesson.get(lesson.id);
          const lessonStatus =
            lessonProgress?.status ??
            (lessonSummary?.stageOrder === 1 && lessonSummary?.orderIndex === 1 ? 'ChuaHoc' : 'BiKhoa');

          return lesson.quizzes.map((quiz) => ({
            ...quiz,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            topicName: lesson.topicName,
            lessonStatus,
            lessonProgress: lessonProgress?.percentComplete ?? 0,
          }));
        });

        if (!active) return;
        setQuizzes(quizRows);
        setManagementQuizzes([]);
        setManagedLessons([]);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được bài kiểm tra.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router, session]);

  const isManagementMode =
    session?.user.roles.some((role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN) ?? false;
  const isParent = !isManagementMode && (session?.user.roles.includes(USER_ROLES.PARENT) ?? false);
  const selectedStudent = useMemo(
    () => linkedStudents.find((student) => student.id === selectedStudentId) ?? linkedStudents[0] ?? null,
    [linkedStudents, selectedStudentId],
  );
  const visibleResults = useMemo(() => {
    if (!selectedStudent) return [];
    return parentResults.filter((result) => result.studentId === selectedStudent.id);
  }, [parentResults, selectedStudent]);
  const parentSummary = useMemo(() => {
    const totalAttempts = visibleResults.length;
    const passedAttempts = visibleResults.filter((result) => result.passed).length;
    const needsReview = totalAttempts - passedAttempts;
    const averageScore = totalAttempts
      ? Math.round(visibleResults.reduce((sum, result) => sum + Number(result.percentage ?? 0), 0) / totalAttempts)
      : 0;
    const bestScore = visibleResults.reduce((max, result) => Math.max(max, Number(result.percentage ?? 0)), 0);

    return {
      totalAttempts,
      passedAttempts,
      needsReview,
      averageScore,
      bestScore: Math.round(bestScore),
    };
  }, [visibleResults]);

  const managementStats = useMemo(() => {
    const totalQuizzes = managementQuizzes.length;
    const publishedQuizzes = managementQuizzes.filter((quiz) => quiz.status === 'CongBo').length;
    const draftQuizzes = totalQuizzes - publishedQuizzes;
    const totalQuestions = managementQuizzes.reduce((sum, quiz) => sum + Number(quiz.questionsCount ?? 0), 0);
    const totalAttempts = managementQuizzes.reduce((sum, quiz) => sum + Number(quiz.attemptsCount ?? 0), 0);
    const passedAttempts = managementQuizzes.reduce((sum, quiz) => sum + Number(quiz.passedAttemptsCount ?? 0), 0);
    const averageScore = totalQuizzes
      ? Math.round(
          managementQuizzes.reduce((sum, quiz) => sum + Number(quiz.averageScore ?? 0), 0) / totalQuizzes,
        )
      : 0;
    const averageDuration = totalQuizzes
      ? Math.round(
          managementQuizzes.reduce((sum, quiz) => sum + Number(quiz.durationMinutes ?? 0), 0) / totalQuizzes,
        )
      : 0;

    return {
      totalQuizzes,
      publishedQuizzes,
      draftQuizzes,
      totalQuestions,
      totalAttempts,
      passedAttempts,
      averageScore,
      averageDuration,
      publishRate: totalQuizzes ? Math.round((publishedQuizzes / totalQuizzes) * 100) : 0,
    };
  }, [managementQuizzes]);

  const lessonOptions = useMemo(() => {
    return [...managedLessons].sort((a, b) => {
      const pathCompare = String(a.pathName ?? '').localeCompare(String(b.pathName ?? ''), 'vi-VN');
      if (pathCompare !== 0) return pathCompare;
      const stageCompare = String(a.stageName ?? '').localeCompare(String(b.stageName ?? ''), 'vi-VN');
      if (stageCompare !== 0) return stageCompare;
      const orderCompare = Number(a.lessonOrder ?? 0) - Number(b.lessonOrder ?? 0);
      if (orderCompare !== 0) return orderCompare;
      return a.title.localeCompare(b.title, 'vi-VN');
    });
  }, [managedLessons]);

  const visibleManagementQuizzes = useMemo(() => {
    const normalizedQuery = normalizeText(managementQuery.trim());

    return managementQuizzes
      .filter((quiz) => {
        if (managementFilter === 'published') return quiz.status === 'CongBo';
        if (managementFilter === 'draft') return quiz.status !== 'CongBo';
        return true;
      })
      .filter((quiz) => {
        if (!normalizedQuery) return true;

        return [
          quiz.title,
          quiz.description ?? '',
          quiz.type,
          quiz.lessonTitle,
          quiz.topicName ?? '',
          quiz.stageName ?? '',
          quiz.pathName ?? '',
          quiz.lessonStatus,
        ].some((value) => normalizeText(String(value)).includes(normalizedQuery));
      })
      .sort((a, b) => {
        const pathCompare = String(a.pathName ?? '').localeCompare(String(b.pathName ?? ''), 'vi-VN');
        if (pathCompare !== 0) return pathCompare;
        const stageCompare = Number(a.stageOrder ?? 0) - Number(b.stageOrder ?? 0);
        if (stageCompare !== 0) return stageCompare;
        const lessonCompare = Number(a.lessonOrder ?? 0) - Number(b.lessonOrder ?? 0);
        if (lessonCompare !== 0) return lessonCompare;
        return a.title.localeCompare(b.title, 'vi-VN');
      });
  }, [managementFilter, managementQuizzes, managementQuery]);

  useEffect(() => {
    if (!newQuizLessonId && lessonOptions[0]) {
      setNewQuizLessonId(lessonOptions[0].id);
      return;
    }

    if (newQuizLessonId && !lessonOptions.some((lesson) => lesson.id === newQuizLessonId)) {
      setNewQuizLessonId(lessonOptions[0]?.id ?? '');
    }
  }, [lessonOptions, newQuizLessonId]);

  async function handleCreateQuiz() {
    if (!session) return;
    setError('');
    setSuccessMessage('');

    if (newQuizTitle.trim().length < 5 || newQuizDescription.trim().length < 10) {
      setError('Tên quiz cần ít nhất 5 ký tự và mô tả cần ít nhất 10 ký tự.');
      return;
    }

    if (!newQuizLessonId) {
      setError('Cần chọn một bài học để gắn quiz.');
      return;
    }

    setCreateQuizBusy(true);
    try {
      const created = await apiPost<QuizManagementSummary>(
        '/quizzes',
        {
          lessonId: newQuizLessonId,
          title: newQuizTitle,
          description: newQuizDescription,
          type: newQuizType,
          durationMinutes: newQuizDurationMinutes,
          passingScore: newQuizPassingScore,
          maxAttempts: newQuizMaxAttempts,
          status: newQuizStatus,
        },
        session.accessToken,
      );

      setManagementQuizzes((current) => [created, ...current.filter((quiz) => quiz.id !== created.id)]);
      setNewQuizTitle('');
      setNewQuizDescription('');
      setNewQuizType('CuoiBai');
      setNewQuizDurationMinutes(10);
      setNewQuizPassingScore(80);
      setNewQuizMaxAttempts(3);
      setNewQuizStatus('Nhap');
      setSuccessMessage(`Đã tạo quiz "${created.title}".`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không tạo được quiz.');
    } finally {
      setCreateQuizBusy(false);
    }
  }

  async function handleUpdateQuizStatus(quiz: QuizManagementSummary, status: QuizManagementState) {
    if (!session || quiz.status === status) return;
    setError('');
    setSuccessMessage('');
    setQuizActionBusyId(quiz.id);

    try {
      const updated = await apiPatch<QuizManagementSummary>(`/quizzes/${quiz.id}/status`, { status }, session.accessToken);
      setManagementQuizzes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSuccessMessage(
        `Đã chuyển "${updated.title}" sang trạng thái ${
          quizManagementStatusLabels[updated.status as QuizManagementState] ?? updated.status
        }.`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái quiz.');
    } finally {
      setQuizActionBusyId('');
    }
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang chuyển hướng...</p>
      </main>
    );
  }

  if (isManagementMode) {
    return (
      <AppShell session={session} active="quizzes" eyebrow="Quiz Management" title="Quản lý quiz">
        <section className="pageHeroCompact">
          <div>
            <p className="eyebrow">UC riêng của giáo viên và quản trị viên</p>
            <h2>Rà soát quiz theo lộ trình, bài học, trạng thái công bố và hiệu suất làm bài.</h2>
            <p>
              Màn hình này gom số câu hỏi, lượt làm, tỷ lệ đạt, thời lượng và trạng thái nội dung để quản lý
              nhanh.
            </p>
          </div>
          <span className="inlineBadge">
            <FileQuestion size={16} />
            {managementStats.totalQuizzes} quiz
          </span>
        </section>

        {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
        {successMessage ? <div className="subtleBox dashboardMessage">{successMessage}</div> : null}
        {loading ? <div className="subtleBox dashboardMessage">Đang tải dữ liệu quiz...</div> : null}

        <section className="lessonInsightGrid" aria-label="Tổng quan quản lý quiz">
          <div className="lessonInsightCard">
            <LibraryBig size={18} />
            <span>Tổng quiz</span>
            <strong>{managementStats.totalQuizzes}</strong>
          </div>
          <div className="lessonInsightCard">
            <CheckCircle2 size={18} />
            <span>Đã công bố</span>
            <strong>{managementStats.publishedQuizzes}</strong>
          </div>
          <div className="lessonInsightCard">
            <ShieldAlert size={18} />
            <span>Bản nháp / ẩn</span>
            <strong>{managementStats.draftQuizzes}</strong>
          </div>
          <div className="lessonInsightCard">
            <BarChart3 size={18} />
            <span>Tổng câu hỏi</span>
            <strong>{managementStats.totalQuestions}</strong>
          </div>
        </section>

        <section className="panel dashboardMessage">
          <div className="sectionTitle">
            <div>
              <h2>Bộ lọc quản lý</h2>
              <span>Tìm theo tên quiz, bài học, lộ trình, giai đoạn, chủ đề hoặc trạng thái.</span>
            </div>
            <span className="inlineBadge">
              <Sparkles size={14} />
              {visibleManagementQuizzes.length}/{managementQuizzes.length}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <label className="field" style={{ minWidth: 0 }}>
              <span>Tìm quiz</span>
              <div className="parentSearchInput">
                <Search size={16} />
                <input
                  value={managementQuery}
                  onChange={(event) => setManagementQuery(event.target.value)}
                  placeholder="Nhập tên quiz, bài học, lộ trình hoặc chủ đề"
                />
              </div>
            </label>

            <div className="parentFilterGroup" role="tablist" aria-label="Lọc trạng thái quiz">
              {(['all', 'published', 'draft'] as ManagementFilter[]).map((filter) => (
                <button
                  className={`lessonFilterButton ${managementFilter === filter ? 'active' : ''}`}
                  key={filter}
                  type="button"
                  onClick={() => setManagementFilter(filter)}
                  aria-pressed={managementFilter === filter}
                >
                  <Filter size={15} />
                  {managementFilterLabels[filter]}
                </button>
              ))}
            </div>
          </div>

          <div className="featureMeta" style={{ marginTop: 14 }}>
            <em>
              <TimerReset size={14} />
              {managementStats.averageDuration} phút trung bình
            </em>
            <em>
              <Target size={14} />
              Tỷ lệ công bố {managementStats.publishRate}%
            </em>
            <em>
              <TrendingUp size={14} />
              {managementStats.totalAttempts} lượt làm
            </em>
            <em>
              <CheckCircle2 size={14} />
              {managementStats.passedAttempts} lượt đạt
            </em>
            <em>
              <Award size={14} />
              Điểm TB {managementStats.averageScore}%
            </em>
          </div>
        </section>

        <section className="panel dashboardMessage">
          <div className="sectionTitle">
            <div>
              <h2>Tạo quiz mới</h2>
              <span>Chọn bài học đích, rồi khai báo loại quiz, thời lượng và ngưỡng đạt.</span>
            </div>
            <span className="inlineBadge">
              <PlusCircle size={14} />
              CRUD
            </span>
          </div>

          <div className="teacherSupportGrid">
            <label className="field">
              <span>Tiêu đề quiz</span>
              <input value={newQuizTitle} onChange={(event) => setNewQuizTitle(event.target.value)} />
            </label>
            <label className="field">
              <span>Bài học</span>
              <select value={newQuizLessonId} onChange={(event) => setNewQuizLessonId(event.target.value)}>
                <option value="">Chọn bài học</option>
                {lessonOptions.map((lesson) => (
                  <option value={lesson.id} key={lesson.id}>
                    {lesson.pathName ?? 'Lộ trình'} / {lesson.stageName ?? 'Giai đoạn'} / Bài {lesson.lessonOrder} -{' '}
                    {lesson.title} ({statusLabels[lesson.status] ?? lesson.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="field teacherSupportTextarea">
              <span>Mô tả</span>
              <textarea
                rows={3}
                value={newQuizDescription}
                onChange={(event) => setNewQuizDescription(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Loại quiz</span>
              <select value={newQuizType} onChange={(event) => setNewQuizType(event.target.value as typeof newQuizType)}>
                <option value="LuyenTap">{quizTypeLabels.LuyenTap}</option>
                <option value="CuoiBai">{quizTypeLabels.CuoiBai}</option>
                <option value="CuoiNgay">{quizTypeLabels.CuoiNgay}</option>
              </select>
            </label>
            <label className="field">
              <span>Thời lượng (phút)</span>
              <input
                type="number"
                min={1}
                max={480}
                value={newQuizDurationMinutes}
                onChange={(event) => setNewQuizDurationMinutes(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Điểm đạt yêu cầu (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={newQuizPassingScore}
                onChange={(event) => setNewQuizPassingScore(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Số lần làm tối đa</span>
              <input
                type="number"
                min={1}
                max={20}
                value={newQuizMaxAttempts}
                onChange={(event) => setNewQuizMaxAttempts(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Trạng thái</span>
              <select
                value={newQuizStatus}
                onChange={(event) => setNewQuizStatus(event.target.value as QuizManagementState)}
              >
                <option value="Nhap">Bản nháp</option>
                <option value="CongBo">Công bố</option>
                <option value="An">Đang ẩn</option>
              </select>
            </label>
          </div>

          <div className="parentStudentActions" style={{ marginTop: 12 }}>
            <button className="primaryButton" type="button" disabled={createQuizBusy} onClick={() => void handleCreateQuiz()}>
              {createQuizBusy ? 'Đang tạo...' : 'Tạo quiz'}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="quizManagementGrid">
          {visibleManagementQuizzes.map((quiz) => {
            const passRate = quiz.attemptsCount ? Math.round((quiz.passedAttemptsCount / quiz.attemptsCount) * 100) : 0;

            return (
              <article className="lessonListCard quizManagementCard" key={quiz.id}>
                <div className="pathCardTop">
                  <div className="featureIcon">
                    {quiz.status === 'CongBo' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
                  </div>
                  <span className="inlineBadge">
                    {quiz.status === 'CongBo' ? 'Đã công bố' : statusLabels[quiz.status] ?? quiz.status}
                  </span>
                </div>

                <div>
                  <strong>{quiz.title}</strong>
                  <p>{quiz.description ?? 'Chưa có mô tả cho quiz này.'}</p>
                </div>

                <div className="featureMeta">
                  <em>{quiz.pathName ?? 'Chưa gắn lộ trình'}</em>
                  <em>{quiz.stageName ?? 'Chưa gắn giai đoạn'}</em>
                  <em>{quiz.lessonTitle}</em>
                  <em>{quiz.topicName ?? 'Chưa gắn chủ đề'}</em>
                </div>

                <div className="featureMeta">
                  <em>
                    <BookOpen size={14} />
                    {quizTypeLabels[quiz.type] ?? quiz.type}
                  </em>
                  <em>
                    <TimerReset size={14} />
                    {quiz.durationMinutes ?? 0} phút
                  </em>
                  <em>
                    <Target size={14} />
                    Đạt {quiz.passingScore}%
                  </em>
                  <em>{quiz.maxAttempts ?? 'Không giới hạn'} lượt làm</em>
                </div>

                <div className="progressRail" aria-label={`Tỷ lệ đạt của ${quiz.title}`}>
                  <div className="progressFill" style={{ width: `${Math.max(passRate, quiz.attemptsCount ? 8 : 8)}%` }} />
                </div>

                <div className="pathCardStats">
                  <span>{quiz.questionsCount} câu hỏi</span>
                  <span>{quiz.attemptsCount} lượt làm</span>
                  <span>{quiz.passedAttemptsCount} lượt đạt</span>
                </div>

                <div className="featureMeta">
                  <em>Tỷ lệ đạt {passRate}%</em>
                  <em>TB {Math.round(Number(quiz.averageScore ?? 0))}%</em>
                  <em>{formatDateLabel(quiz.createdAt)}</em>
                  <em>{formatDateLabel(quiz.latestAttemptAt)}</em>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <Link className="primaryButton fullWidth" href={`/quizzes/${quiz.id}`}>
                    Mở chi tiết quản lý
                    <ArrowRight size={16} />
                  </Link>
                  <Link className="secondaryButton fullWidth" href={`/lessons/${quiz.lessonId}`}>
                    Về bài học
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="parentStudentActions">
                  <button
                    type="button"
                    className="secondaryButton"
                    disabled={quizActionBusyId === quiz.id || quiz.status === 'CongBo'}
                    onClick={() => void handleUpdateQuizStatus(quiz, 'CongBo')}
                  >
                    Công bố
                  </button>
                  <button
                    type="button"
                    className="secondaryButton"
                    disabled={quizActionBusyId === quiz.id || quiz.status === 'Nhap'}
                    onClick={() => void handleUpdateQuizStatus(quiz, 'Nhap')}
                  >
                    Đưa về nháp
                  </button>
                  <button
                    type="button"
                    className="secondaryButton"
                    disabled={quizActionBusyId === quiz.id || quiz.status === 'An'}
                    onClick={() => void handleUpdateQuizStatus(quiz, 'An')}
                  >
                    Ẩn
                  </button>
                </div>
              </article>
            );
          })}

          {!visibleManagementQuizzes.length && !loading ? (
            <div className="subtleBox">Không có quiz nào khớp bộ lọc hiện tại.</div>
          ) : null}
        </section>
      </AppShell>
    );
  }

  if (isParent) {
    return (
      <AppShell session={session} active="quizzes" eyebrow="Kết quả kiểm tra" title="Kết quả kiểm tra">
        <section className="pageHeroCompact">
          <div>
            <p className="eyebrow">Luyện tập và đánh giá</p>
            <h2>Phụ huynh xem lịch sử làm quiz, điểm số và bài cần ôn của từng học viên.</h2>
            <p>Màn này chỉ dùng để theo dõi kết quả, không cho phụ huynh làm bài thay học viên.</p>
          </div>
          <span className="inlineBadge">
            <FileQuestion size={16} />
            {parentResults.length} lượt làm
          </span>
        </section>

        {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
        {loading ? <div className="subtleBox dashboardMessage">Đang tải quiz...</div> : null}

        <section className="parentStudentStrip" aria-label="Chọn học viên để xem kết quả kiểm tra">
          {linkedStudents.map((student) => {
            const active = selectedStudent?.id === student.id;
            const attempts = parentResults.filter((result) => result.studentId === student.id);
            const passed = attempts.filter((result) => result.passed).length;
            const initials = student.fullName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('');

            return (
              <button
                key={student.id}
                type="button"
                className={`parentStudentChip ${active ? 'active' : ''}`}
                onClick={() => setSelectedStudentId(student.id)}
                aria-pressed={active}
              >
                <div className="parentStudentChipHead">
                  <div className="parentChipAvatar">{initials || 'HV'}</div>
                  <div>
                    <strong>{student.fullName}</strong>
                    <span>{student.currentLevel ?? 'Chưa rõ cấp độ'}</span>
                  </div>
                </div>
                <div className="progressRail">
                  <div
                    className="progressFill"
                    style={{
                      width: `${attempts.length ? Math.round((passed / attempts.length) * 100) : 0}%`,
                    }}
                  />
                </div>
                <small>
                  {attempts.length} lượt làm • {passed} lượt đạt • {student.learningGoal ?? 'Chưa cập nhật mục tiêu'}
                </small>
              </button>
            );
          })}

          {!linkedStudents.length && !loading ? (
            <div className="emptyState">
              <Users size={28} />
              <h2>Chưa có học viên liên kết.</h2>
              <p>Khi có học viên được liên kết, phụ huynh sẽ xem được kết quả kiểm tra tại đây.</p>
            </div>
          ) : null}
        </section>

        {selectedStudent ? (
          <>
            <section className="metricGrid">
              <div className="metric">
                <FileQuestion size={20} />
                <span>Lượt làm</span>
                <strong>{parentSummary.totalAttempts}</strong>
              </div>
              <div className="metric">
                <CheckCircle2 size={20} />
                <span>Đã đạt</span>
                <strong>{parentSummary.passedAttempts}</strong>
              </div>
              <div className="metric">
                <ShieldAlert size={20} />
                <span>Cần ôn</span>
                <strong>{parentSummary.needsReview}</strong>
              </div>
              <div className="metric">
                <Award size={20} />
                <span>Điểm tốt nhất</span>
                <strong>{parentSummary.bestScore}%</strong>
              </div>
            </section>

            <section className="parentQuizBoard">
              <div className="sectionTitle">
                <div>
                  <h2>Kết quả quiz của {selectedStudent.fullName}</h2>
                  <span>
                    Điểm trung bình {parentSummary.averageScore}% trên {parentSummary.totalAttempts} lượt làm
                  </span>
                </div>
                <span className="inlineBadge">
                  <TrendingUp size={14} />
                  {parentSummary.passedAttempts}/{parentSummary.totalAttempts} lượt đạt
                </span>
              </div>

              <div className="parentQuizResultList">
                {visibleResults.map((result) => (
                  <article
                    className={`parentQuizResultCard ${result.passed ? 'passed' : 'failed'}`}
                    key={result.id}
                  >
                    <div className="parentQuizResultMain">
                      <p className="eyebrow">{result.pathName ?? 'Lộ trình hiện tại'}</p>
                      <strong>{result.quizTitle}</strong>
                      <span>{result.lessonTitle}</span>
                      <div className="quizMetaRow parentQuizMeta">
                        <em>
                          <BookOpen size={14} />
                          {result.stageName ?? 'Chặng học'}
                        </em>
                        <em>
                          <TimerReset size={14} />
                          {result.durationMinutes ?? 0} phút
                        </em>
                        <em>Lần {result.attemptNumber}</em>
                        <em>Đạt {result.passingScore}%</em>
                        <em>{formatDate(result.submittedAt)}</em>
                      </div>
                      <div className="progressRail">
                        <div
                          className="progressFill"
                          style={{ width: `${Math.min(100, Math.max(0, result.percentage))}%` }}
                        />
                      </div>
                    </div>

                    <div className="parentQuizScore">
                      <strong>{Math.round(result.percentage)}%</strong>
                      <span>
                        {result.correctCount} đúng / {result.wrongCount} sai
                      </span>
                      <em className={`parentQuizStatus ${result.passed ? 'passed' : 'failed'}`}>
                        {result.passed ? 'Đạt yêu cầu' : 'Cần ôn tập'}
                      </em>
                      <Link className="secondaryButton" href={`/lessons/${result.lessonId}`}>
                        Xem bài học
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                ))}

                {!visibleResults.length && !loading ? (
                  <div className="subtleBox">
                    Học viên này chưa có lượt làm quiz nào. Khi học viên nộp bài, kết quả sẽ xuất hiện ở đây.
                  </div>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </AppShell>
    );
  }

  return (
    <AppShell session={session} active="quizzes" eyebrow="Kiểm tra" title="Kiểm tra">
      <section className="pageHeroCompact">
        <div>
          <p className="eyebrow">Luyện tập và đánh giá</p>
          <h2>Toàn bộ quiz nằm trong một trang riêng để người học vào làm bài nhanh.</h2>
          <p>Quiz liên kết với từng bài học, có thời lượng, điểm đạt và đường dẫn quay lại nội dung học.</p>
        </div>
        <span className="inlineBadge">
          <FileQuestion size={16} />
          {quizzes.length} quiz
        </span>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải quiz...</div> : null}

      <section className="featureList">
        {quizzes.map((quiz) => (
          <article className="featureRow" key={quiz.id}>
            <div className="featureIcon">
              {quiz.lessonStatus === 'BiKhoa' ? <LockKeyhole size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <strong>{quiz.title}</strong>
              <span>{quiz.lessonTitle}</span>
              <div className="featureMeta">
                <em>{quiz.topicName}</em>
                <em>{quiz.lessonStatus === 'BiKhoa' ? 'Bị khóa' : `${quiz.lessonProgress}% bài học`}</em>
                <em>
                  <TimerReset size={14} />
                  {quiz.durationMinutes ?? 0} phút
                </em>
                <em>Đạt {quiz.passingScore}%</em>
                <em>{quiz.type}</em>
              </div>
            </div>
            {quiz.lessonStatus === 'BiKhoa' ? (
              <span className="primaryButton disabledAction" aria-disabled="true">
                Bị khóa
                <ArrowRight size={16} />
              </span>
            ) : (
              <Link className="primaryButton" href={`/quizzes/${quiz.id}`}>
                Làm bài
                <ArrowRight size={16} />
              </Link>
            )}
          </article>
        ))}

        {!quizzes.length && !loading ? <div className="subtleBox">Chưa có quiz công bố.</div> : null}
      </section>
    </AppShell>
  );
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa nộp';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDateLabel(value: string | Date | null | undefined) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}
