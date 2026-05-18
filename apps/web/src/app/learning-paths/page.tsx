'use client';

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  Filter,
  Layers3,
  LibraryBig,
  LockKeyhole,
  PlayCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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

type LearningPathManagementSummary = LearningPathSummary & {
  createdAt: string | Date;
  stagesCount: number;
  lessonsCount: number;
  publishedLessonsCount: number;
  quizzesCount: number;
  publishedQuizzesCount: number;
};

type LearningPathDetail = LearningPathSummary & {
  stages: Array<{
    id: string;
    name: string;
    type: string;
    orderIndex: number;
    description: string;
    lessons: Array<{
      id: string;
      title: string;
      description: string;
      level: string;
      orderIndex: number;
      passingScore: number;
    }>;
  }>;
};

type ProgressRow = {
  lessonId: string;
  status: string;
  percentComplete: number;
  bestScore: number;
};

type PathViewModel = LearningPathSummary & {
  stagesCount: number;
  lessonsCount: number;
  completedCount: number;
  unlockedCount: number;
  lockedCount: number;
  completionRate: number;
  bestScore: number;
  activeLessonId: string | null;
  currentLessonTitle: string;
  nextLockedLessonTitle: string | null;
  stagePreview: Array<{
    id: string;
    name: string;
    orderIndex: number;
    lessonsCount: number;
    completedCount: number;
    lockedCount: number;
    completionRate: number;
  }>;
};

type ManagementFilter = 'all' | 'published' | 'draft';
type LearningPathFilter = 'all' | 'active' | 'completed' | 'locked';

const statusLabels: Record<string, string> = {
  ChuaHoc: 'Chưa học',
  DangHoc: 'Đang học',
  HoanThanh: 'Hoàn thành',
  BiKhoa: 'Bị khóa',
  CongBo: 'Công bố',
  Nhap: 'Bản nháp',
  An: 'Đang ẩn',
  LuuTru: 'Lưu trữ',
};

const managementFilterLabels: Record<ManagementFilter, string> = {
  all: 'Tất cả',
  published: 'Đã công bố',
  draft: 'Bản nháp / ẩn',
};

const learningPathFilterLabels: Record<LearningPathFilter, string> = {
  all: 'Tất cả',
  active: 'Đang học',
  completed: 'Hoàn thành',
  locked: 'Còn khóa',
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatDateLabel(value: string | Date | null | undefined) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

export default function LearningPathsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [pathDetails, setPathDetails] = useState<LearningPathDetail[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [managementPaths, setManagementPaths] = useState<LearningPathManagementSummary[]>([]);
  const [managementQuery, setManagementQuery] = useState('');
  const [managementFilter, setManagementFilter] = useState<ManagementFilter>('all');
  const [studentQuery, setStudentQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState<LearningPathFilter>('all');
  const [newPathName, setNewPathName] = useState('');
  const [newPathDescription, setNewPathDescription] = useState('');
  const [newPathLevel, setNewPathLevel] = useState('A1');
  const [newPathAudience, setNewPathAudience] = useState('Học viên mới bắt đầu');
  const [newPathStatus, setNewPathStatus] = useState<'Nhap' | 'CongBo' | 'LuuTru'>('Nhap');
  const [pathActionBusyId, setPathActionBusyId] = useState('');
  const [createBusy, setCreateBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    if (storedSession.user.roles.includes(USER_ROLES.ADMIN) && pathname === '/learning-paths') {
      router.replace('/admin/learning-paths');
      return;
    }

    setSession(storedSession);
  }, [pathname, router]);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    const isManagementMode = currentSession.user.roles.some(
      (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
    );
    let active = true;
    async function load() {
      try {
        if (isManagementMode) {
          const response = await apiGet<LearningPathManagementSummary[]>(
            '/learning-paths/manage',
            currentSession.accessToken,
          );

          if (!active) return;
          setManagementPaths(response);
          setPaths([]);
          setPathDetails([]);
          setProgress([]);
        } else {
          const response = await apiGet<LearningPathSummary[]>('/learning-paths', currentSession.accessToken);
          const [detailsResponse, progressResponse] = await Promise.all([
            Promise.all(
              response.map((path) =>
                apiGet<LearningPathDetail>(`/learning-paths/${path.id}`, currentSession.accessToken),
              ),
            ),
            currentSession.user.roles.includes(USER_ROLES.STUDENT)
              ? apiGet<ProgressRow[]>(`/progress/students/${currentSession.user.id}`, currentSession.accessToken)
              : Promise.resolve([]),
          ]);

          if (!active) return;
          setPaths(response);
          setPathDetails(detailsResponse);
          setProgress(progressResponse);
          setManagementPaths([]);
        }
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được lộ trình.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router, session]);

  const pathViews = useMemo<PathViewModel[]>(() => {
    const detailByPath = new Map(pathDetails.map((detail) => [detail.id, detail]));
    const progressByLesson = new Map(
      progress.map((item) => [
        item.lessonId,
        {
          ...item,
          percentComplete: Number(item.percentComplete ?? 0),
          bestScore: Number(item.bestScore ?? 0),
        },
      ]),
    );

    return paths.map((path) => {
      const detail = detailByPath.get(path.id);
      const lessons =
        detail?.stages.flatMap((stage) =>
          stage.lessons.map((lesson) => ({
            ...lesson,
            stageOrder: stage.orderIndex,
          })),
        ) ?? [];
      const lessonStates = lessons.map((lesson) => {
        const progressRow = progressByLesson.get(lesson.id);
        const isFirstLesson = lesson.stageOrder === 1 && lesson.orderIndex === 1;
        const status = progressRow?.status ?? (isFirstLesson ? 'ChuaHoc' : 'BiKhoa');

        return {
          ...lesson,
          status,
          canOpen: status !== 'BiKhoa',
        };
      });
      const completedCount = lessonStates.filter((lesson) => lesson.status === 'HoanThanh').length;
      const unlockedCount = lessonStates.filter((lesson) => lesson.canOpen && lesson.status !== 'HoanThanh').length;
      const lockedCount = lessonStates.filter((lesson) => lesson.status === 'BiKhoa').length;
      const bestScore = lessonStates.length
        ? Math.max(...lessonStates.map((lesson) => progressByLesson.get(lesson.id)?.bestScore ?? 0))
        : 0;
      const activeLesson =
        lessonStates.find((lesson) => lesson.status === 'DangHoc') ??
        lessonStates.find((lesson) => lesson.status === 'ChuaHoc') ??
        lessonStates.find((lesson) => lesson.canOpen && lesson.status !== 'HoanThanh') ??
        null;
      const nextLockedLesson = lessonStates.find((lesson) => lesson.status === 'BiKhoa') ?? null;
      const stagePreview =
        detail?.stages.map((stage) => {
          const stageLessons = lessonStates.filter((lesson) => lesson.stageOrder === stage.orderIndex);
          const stageCompleted = stageLessons.filter((lesson) => lesson.status === 'HoanThanh').length;
          const stageLocked = stageLessons.filter((lesson) => lesson.status === 'BiKhoa').length;

          return {
            id: stage.id,
            name: stage.name,
            orderIndex: stage.orderIndex,
            lessonsCount: stageLessons.length,
            completedCount: stageCompleted,
            lockedCount: stageLocked,
            completionRate: stageLessons.length ? Math.round((stageCompleted / stageLessons.length) * 100) : 0,
          };
        }) ?? [];

      return {
        ...path,
        stagesCount: detail?.stages.length ?? 0,
        lessonsCount: lessonStates.length,
        completedCount,
        unlockedCount,
        lockedCount,
        completionRate: lessonStates.length ? Math.round((completedCount / lessonStates.length) * 100) : 0,
        bestScore,
        activeLessonId: activeLesson?.id ?? null,
        currentLessonTitle: activeLesson?.title ?? 'Chưa có bài đang mở',
        nextLockedLessonTitle: nextLockedLesson?.title ?? null,
        stagePreview,
      };
    });
  }, [pathDetails, paths, progress]);

  const isManagementMode = session?.user.roles.some(
    (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
  );
  const visibleManagementPaths = useMemo(() => {
    const normalizedQuery = normalizeText(managementQuery.trim());

    return managementPaths
      .filter((path) => {
        const isPublished = path.status === 'CongBo';
        if (managementFilter === 'published') return isPublished;
        if (managementFilter === 'draft') return !isPublished;
        return true;
      })
      .filter((path) => {
        if (!normalizedQuery) return true;

        return normalizeText(
          [path.name, path.description, path.level, path.targetAudience, path.status].join(' '),
        ).includes(normalizedQuery);
      });
  }, [managementFilter, managementPaths, managementQuery]);

  const managementStats = useMemo(() => {
    const totalPaths = managementPaths.length;
    const publishedPaths = managementPaths.filter((path) => path.status === 'CongBo').length;
    const draftPaths = totalPaths - publishedPaths;
    const totalLessons = managementPaths.reduce((sum, path) => sum + Number(path.lessonsCount ?? 0), 0);
    const publishedLessons = managementPaths.reduce(
      (sum, path) => sum + Number(path.publishedLessonsCount ?? 0),
      0,
    );
    const totalQuizzes = managementPaths.reduce((sum, path) => sum + Number(path.quizzesCount ?? 0), 0);
    const publishedQuizzes = managementPaths.reduce(
      (sum, path) => sum + Number(path.publishedQuizzesCount ?? 0),
      0,
    );

    return {
      totalPaths,
      publishedPaths,
      draftPaths,
      totalLessons,
      publishedLessons,
      totalQuizzes,
      publishedQuizzes,
      lessonCoverage: totalLessons ? Math.round((publishedLessons / totalLessons) * 100) : 0,
      quizCoverage: totalQuizzes ? Math.round((publishedQuizzes / totalQuizzes) * 100) : 0,
    };
  }, [managementPaths]);
  const focusManagementPath = visibleManagementPaths[0] ?? null;
  const focusLessonCoverage = focusManagementPath
    ? Math.round(
        (Number(focusManagementPath.publishedLessonsCount ?? 0) /
          Math.max(1, Number(focusManagementPath.lessonsCount ?? 0))) *
          100,
      )
    : 0;
  const focusQuizCoverage = focusManagementPath
    ? Math.round(
        (Number(focusManagementPath.publishedQuizzesCount ?? 0) /
          Math.max(1, Number(focusManagementPath.quizzesCount ?? 0))) *
          100,
      )
    : 0;
  const focusReadiness = focusManagementPath ? Math.round((focusLessonCoverage + focusQuizCoverage) / 2) : 0;
  const focusWarnings = focusManagementPath
    ? [
        focusManagementPath.status !== 'CongBo'
          ? 'Lộ trình chưa được công bố chính thức.'
          : null,
        Number(focusManagementPath.publishedLessonsCount ?? 0) < Number(focusManagementPath.lessonsCount ?? 0)
          ? 'Vẫn còn bài học chưa được công bố.'
          : null,
        Number(focusManagementPath.publishedQuizzesCount ?? 0) < Number(focusManagementPath.quizzesCount ?? 0)
          ? 'Vẫn còn quiz chưa sẵn sàng công bố.'
          : null,
      ].filter((warning): warning is string => Boolean(warning))
    : [];

  const totalLessons = pathViews.reduce((total, path) => total + path.lessonsCount, 0);
  const totalCompleted = pathViews.reduce((total, path) => total + path.completedCount, 0);
  const averageCompletion = totalLessons ? Math.round((totalCompleted / totalLessons) * 100) : 0;
  const visiblePathViews = useMemo(() => {
    const normalizedQuery = normalizeText(studentQuery.trim());

    return pathViews
      .filter((path) => {
        if (studentFilter === 'active') return path.unlockedCount > 0 && path.completionRate < 100;
        if (studentFilter === 'completed') return path.lessonsCount > 0 && path.completedCount === path.lessonsCount;
        if (studentFilter === 'locked') return path.lockedCount > 0;
        return true;
      })
      .filter((path) => {
        if (!normalizedQuery) return true;

        return normalizeText(
          [
            path.name,
            path.description,
            path.level,
            path.targetAudience,
            path.currentLessonTitle,
            path.nextLockedLessonTitle ?? '',
          ].join(' '),
        ).includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (a.completionRate !== b.completionRate) return b.completionRate - a.completionRate;
        if (a.unlockedCount !== b.unlockedCount) return b.unlockedCount - a.unlockedCount;
        return a.name.localeCompare(b.name, 'vi');
      });
  }, [pathViews, studentFilter, studentQuery]);
  const activePath =
    visiblePathViews.find((path) => path.unlockedCount > 0 && path.completionRate < 100) ??
    visiblePathViews.find((path) => path.completedCount > 0) ??
    visiblePathViews[0] ??
    pathViews[0] ??
    null;

  async function handleCreatePath() {
    if (!session) return;
    setError('');
    setSuccessMessage('');

    if (newPathName.trim().length < 5 || newPathDescription.trim().length < 20) {
      setError('Tên lộ trình cần ít nhất 5 ký tự và mô tả cần ít nhất 20 ký tự.');
      return;
    }

    setCreateBusy(true);
    try {
      const created = await apiPost<LearningPathManagementSummary>(
        '/learning-paths',
        {
          name: newPathName,
          description: newPathDescription,
          level: newPathLevel,
          targetAudience: newPathAudience,
          status: newPathStatus,
        },
        session.accessToken,
      );
      setManagementPaths((current) => [created, ...current.filter((path) => path.id !== created.id)]);
      setNewPathName('');
      setNewPathDescription('');
      setNewPathLevel('A1');
      setNewPathAudience('Học viên mới bắt đầu');
      setNewPathStatus('Nhap');
      setSuccessMessage(`Đã tạo lộ trình "${created.name}".`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không tạo được lộ trình.');
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleUpdatePathStatus(path: LearningPathManagementSummary, status: 'Nhap' | 'CongBo' | 'LuuTru') {
    if (!session || path.status === status) return;
    setError('');
    setSuccessMessage('');
    setPathActionBusyId(path.id);

    try {
      const updated = await apiPatch<LearningPathManagementSummary>(
        `/learning-paths/${path.id}/status`,
        { status },
        session.accessToken,
      );
      setManagementPaths((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSuccessMessage(`Đã chuyển "${updated.name}" sang trạng thái ${statusLabels[updated.status] ?? updated.status}.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái lộ trình.');
    } finally {
      setPathActionBusyId('');
    }
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang tải lộ trình...</p>
      </main>
    );
  }

  if (isManagementMode) {
    return (
    <AppShell
      session={session}
      active="paths"
      eyebrow="Điều phối lộ trình"
      title="Quản lý lộ trình học"
    >
      <section className="pageHeroCompact">
        <div>
          <p className="eyebrow">Điều phối nội dung học tập</p>
          <h2>
            Quản lý toàn bộ lộ trình, theo dõi trạng thái công bố và kiểm tra mức độ sẵn sàng
            của nội dung học.
            </h2>
            <p>
              Màn hình này cho phép rà soát lộ trình, số chặng, số bài học, số quiz và tỷ lệ nội
              dung đã công bố. Giáo viên và quản trị viên có thể tìm nhanh lộ trình cần xử lý rồi
              đi thẳng vào chi tiết để xem cấu trúc đầy đủ.
            </p>
          </div>
          <span className="inlineBadge">
            <LibraryBig size={16} />
            {managementStats.totalPaths} lộ trình
          </span>
        </section>

        {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
        {successMessage ? <div className="subtleBox dashboardMessage">{successMessage}</div> : null}
        {loading ? <div className="subtleBox dashboardMessage">Đang tải dữ liệu quản lý...</div> : null}

        <section className="pathInsightGrid" aria-label="Tổng quan quản lý lộ trình">
          <div className="pathInsightCard">
            <LibraryBig size={18} />
            <span>Tổng lộ trình</span>
            <strong>{managementStats.totalPaths}</strong>
          </div>
          <div className="pathInsightCard">
            <CheckCircle2 size={18} />
            <span>Đã công bố</span>
            <strong>{managementStats.publishedPaths}</strong>
          </div>
          <div className="pathInsightCard">
            <ShieldAlert size={18} />
            <span>Bản nháp / ẩn</span>
            <strong>{managementStats.draftPaths}</strong>
          </div>
          <div className="pathInsightCard">
            <BarChart3 size={18} />
            <span>Nội dung công bố</span>
            <strong>
              {managementStats.lessonCoverage}% / {managementStats.quizCoverage}%
            </strong>
          </div>
        </section>

        <section className="pathManagementFocus">
          <div className="pathManagementFocusCopy">
            <p className="eyebrow">Lộ trình ưu tiên</p>
            <h3>
              {focusManagementPath
                ? focusManagementPath.name
                : 'Chưa có lộ trình khớp bộ lọc hiện tại'}
            </h3>
            <p>
              {focusManagementPath
                ? focusManagementPath.description
                : 'Thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem ngay lộ trình đang được ưu tiên xử lý.'}
            </p>

            {focusManagementPath ? (
              <>
                <div className="progressJourneyBadges pathManagementMeta">
                  <span>
                    <ShieldCheck size={14} />
                    {statusLabels[focusManagementPath.status] ?? focusManagementPath.status}
                  </span>
                  <span>
                    <LibraryBig size={14} />
                    {focusManagementPath.level}
                  </span>
                  <span>
                    <Target size={14} />
                    {focusManagementPath.targetAudience}
                  </span>
                  <span>
                    <BarChart3 size={14} />
                    {focusManagementPath.stagesCount} chặng
                  </span>
                </div>

                <div className="pathManagementReadiness">
                  <div>
                    <div className="pathManagementReadinessHead">
                      <span>Bài học đã công bố</span>
                      <strong>{focusLessonCoverage}%</strong>
                    </div>
                    <div className="progressRail">
                      <div className="progressFill" style={{ width: `${focusLessonCoverage}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="pathManagementReadinessHead">
                      <span>Quiz đã công bố</span>
                      <strong>{focusQuizCoverage}%</strong>
                    </div>
                    <div className="progressRail">
                      <div className="progressFill" style={{ width: `${focusQuizCoverage}%` }} />
                    </div>
                  </div>
                </div>

                {focusWarnings.length ? (
                  <div className="pathManagementWarnings">
                    {focusWarnings.map((warning) => (
                      <div key={warning}>
                        <ShieldAlert size={14} />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="subtleBox pathManagementReady">
                    Lộ trình này đã sẵn sàng công bố, chỉ cần duy trì chất lượng nội dung.
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="pathManagementSnapshot">
            <article>
              <span>Sẵn sàng tổng thể</span>
              <strong>{focusReadiness}%</strong>
              <small>Kết hợp mức sẵn sàng bài học và quiz</small>
            </article>
            <article>
              <span>Bài học</span>
              <strong>{focusManagementPath?.lessonsCount ?? 0}</strong>
              <small>{focusManagementPath?.publishedLessonsCount ?? 0} bài đã công bố</small>
            </article>
            <article>
              <span>Quiz</span>
              <strong>{focusManagementPath?.quizzesCount ?? 0}</strong>
              <small>{focusManagementPath?.publishedQuizzesCount ?? 0} quiz đã công bố</small>
            </article>
            <article>
              <span>Ngày tạo</span>
              <strong>{formatDateLabel(focusManagementPath?.createdAt ?? null)}</strong>
              <small>Thông tin cấu hình lộ trình</small>
            </article>
          </div>
        </section>

        <section className="panel dashboardMessage">
          <div className="sectionTitle">
            <div>
              <h2>Bộ lọc quản lý</h2>
              <span>Lọc theo trạng thái và tìm lộ trình theo tên, cấp độ hoặc đối tượng học.</span>
            </div>
            <span className="inlineBadge">
              <Sparkles size={14} />
              {visibleManagementPaths.length}/{managementPaths.length}
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
              <span>Tìm lộ trình</span>
              <div className="parentSearchInput">
                <Search size={16} />
                <input
                  value={managementQuery}
                  onChange={(event) => setManagementQuery(event.target.value)}
                  placeholder="Nhập tên, cấp độ hoặc đối tượng học"
                />
              </div>
            </label>

            <div className="parentFilterGroup" role="tablist" aria-label="Lọc trạng thái lộ trình">
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
              <Target size={14} />
              {managementStats.totalLessons} bài học
            </em>
            <em>
              <CheckCircle2 size={14} />
              {managementStats.publishedLessons} bài đã công bố
            </em>
            <em>
              <BookOpen size={14} />
              {managementStats.totalQuizzes} quiz
            </em>
            <em>
              <PlayCircle size={14} />
              {managementStats.publishedQuizzes} quiz công bố
            </em>
          </div>
        </section>

        <section className="panel dashboardMessage">
          <div className="sectionTitle">
            <div>
              <h2>Tạo lộ trình mới</h2>
              <span>Khởi tạo lộ trình rồi đưa về nháp, công bố hoặc lưu trữ khi cần.</span>
            </div>
            <span className="inlineBadge">
              <Compass size={14} />
              CRUD
            </span>
          </div>

          <div className="teacherSupportGrid">
            <label className="field">
              <span>Tên lộ trình</span>
              <input value={newPathName} onChange={(event) => setNewPathName(event.target.value)} />
            </label>
            <label className="field">
              <span>Cấp độ</span>
              <input value={newPathLevel} onChange={(event) => setNewPathLevel(event.target.value)} />
            </label>
            <label className="field teacherSupportTextarea">
              <span>Mô tả</span>
              <textarea
                rows={4}
                value={newPathDescription}
                onChange={(event) => setNewPathDescription(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Đối tượng học</span>
              <input value={newPathAudience} onChange={(event) => setNewPathAudience(event.target.value)} />
            </label>
            <label className="field">
              <span>Trạng thái</span>
              <select
                value={newPathStatus}
                onChange={(event) => setNewPathStatus(event.target.value as 'Nhap' | 'CongBo' | 'LuuTru')}
              >
                <option value="Nhap">Bản nháp</option>
                <option value="CongBo">Công bố</option>
                <option value="LuuTru">Lưu trữ</option>
              </select>
            </label>
          </div>

          <div className="parentStudentActions" style={{ marginTop: 12 }}>
            <button className="primaryButton" type="button" disabled={createBusy} onClick={() => void handleCreatePath()}>
              {createBusy ? 'Đang tạo...' : 'Tạo lộ trình'}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="pathGrid">
          {visibleManagementPaths.map((path) => {
            const publishReadiness = path.lessonsCount
              ? Math.round((Number(path.publishedLessonsCount ?? 0) / Number(path.lessonsCount ?? 0)) * 100)
              : 0;
            const quizReadiness = path.quizzesCount
              ? Math.round((Number(path.publishedQuizzesCount ?? 0) / Number(path.quizzesCount ?? 0)) * 100)
              : 0;
            const isPublished = path.status === 'CongBo';

            return (
              <article className="pathCard" key={path.id}>
                <div className="pathCardTop">
                  <div className="featureIcon">
                    <LibraryBig size={20} />
                  </div>
                  <span className="inlineBadge">
                    <CheckCircle2 size={14} />
                    {statusLabels[path.status] ?? path.status}
                  </span>
                </div>

                <div>
                  <strong>{path.name}</strong>
                  <p>{path.description}</p>
                </div>

                <div className="progressRail" aria-label={`Mức độ hoàn chỉnh ${path.name}`}>
                  <div className="progressFill" style={{ width: `${Math.max(publishReadiness, 6)}%` }} />
                </div>

                <div className="pathCardStats">
                  <span>{path.stagesCount} chặng</span>
                  <span>
                    {path.publishedLessonsCount}/{path.lessonsCount} bài
                  </span>
                  <span>
                    {path.publishedQuizzesCount}/{path.quizzesCount} quiz
                  </span>
                </div>

                <div className="featureMeta">
                  <em>
                    <ShieldCheck size={14} />
                    {path.level}
                  </em>
                  <em>{path.targetAudience}</em>
                  <em>{formatDateLabel(path.createdAt)}</em>
                </div>

                <div className="parentStudentActions">
                  <button
                    type="button"
                    className="secondaryButton"
                    disabled={pathActionBusyId === path.id || path.status === 'CongBo'}
                    onClick={() => void handleUpdatePathStatus(path, 'CongBo')}
                  >
                    Công bố
                  </button>
                  <button
                    type="button"
                    className="secondaryButton"
                    disabled={pathActionBusyId === path.id || path.status === 'Nhap'}
                    onClick={() => void handleUpdatePathStatus(path, 'Nhap')}
                  >
                    Đưa về nháp
                  </button>
                  <button
                    type="button"
                    className="secondaryButton"
                    disabled={pathActionBusyId === path.id || path.status === 'LuuTru'}
                    onClick={() => void handleUpdatePathStatus(path, 'LuuTru')}
                  >
                    Lưu trữ
                  </button>
                </div>

                {!isPublished ? (
                  <div className="subtleBox">
                    Nội dung này chưa công bố hoàn toàn. Kiểm tra lại bài học, quiz và trạng thái
                    trước khi mở cho học viên.
                  </div>
                ) : null}

                <Link className="primaryButton fullWidth" href={`/learning-paths/${path.id}`}>
                  Mở chi tiết quản lý
                  <ArrowRight size={16} />
                </Link>

                <div className="featureMeta">
                  <em>
                    <TrendingUp size={14} />
                    Sẵn sàng bài: {publishReadiness}%
                  </em>
                  <em>
                    <BarChart3 size={14} />
                    Sẵn sàng quiz: {quizReadiness}%
                  </em>
                </div>
              </article>
            );
          })}

          {!visibleManagementPaths.length && !loading ? (
            <div className="subtleBox">Không có lộ trình nào khớp bộ lọc hiện tại.</div>
          ) : null}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      session={session}
      active="paths"
      roleContext={USER_ROLES.STUDENT}
      showSidebar={false}
      eyebrow="Học viên"
      title="Lộ trình học"
    >
      <section className="pageHeroCompact studentPathHero">
        <div>
          <p className="eyebrow">Xem lộ trình học</p>
          <h2>
            {activePath
              ? `Lộ trình đang theo dõi: ${activePath.name}`
              : 'Chọn một lộ trình để đi theo từng chặng học rõ ràng.'}
          </h2>
          <p>
            Học viên xem được cấp độ, số chặng, số bài, tiến độ, bài đang mở và bài còn khóa trước
            khi đi vào chi tiết từng lộ trình.
          </p>
        </div>
        <span className="inlineBadge">
          <Target size={16} />
          {pathViews.length} lộ trình
        </span>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải lộ trình...</div> : null}

      {activePath ? (
        <section className="pathStudentFocus">
          <div className="pathStudentFocusCopy">
            <p className="eyebrow">Nên học tiếp</p>
            <h3>{activePath.currentLessonTitle}</h3>
            <p>
              Lộ trình này đang ở mức {activePath.completionRate}% hoàn thành. Học viên cần học
              bài đang mở, làm quiz đạt yêu cầu rồi hệ thống sẽ mở khóa bài kế tiếp.
            </p>
            <div className="progressJourneyBadges pathLearningMeta">
              <span>
                <Target size={14} />
                {activePath.name}
              </span>
              <span>
                <Layers3 size={14} />
                {activePath.stagesCount} chặng
              </span>
              <span>
                <CheckCircle2 size={14} />
                {activePath.completedCount}/{activePath.lessonsCount} bài
              </span>
              <span>
                <BarChart3 size={14} />
                Điểm tốt nhất {activePath.bestScore}
              </span>
            </div>
            <div className="pathCardActions">
              {activePath.activeLessonId ? (
                <Link className="primaryButton" href={`/lessons/${activePath.activeLessonId}`}>
                  Vào bài đang mở
                  <ArrowRight size={16} />
                </Link>
              ) : null}
              <Link className="secondaryButton" href={`/learning-paths/${activePath.id}`}>
                Xem bản đồ chi tiết
                <Compass size={16} />
              </Link>
            </div>
          </div>

          <div className="pathStudentFocusStats">
            <div
              className="pathProgressDial"
              aria-label={`Tiến độ ${activePath.name}`}
              style={{ '--path-progress': `${activePath.completionRate}%` } as CSSProperties}
            >
              <span>{activePath.completionRate}%</span>
              <small>hoàn thành</small>
            </div>
            <div className="pathStudentStageTrack">
              {activePath.stagePreview.slice(0, 4).map((stage) => (
                <div className="pathStagePreviewItem" key={stage.id}>
                  <div>
                    <strong>
                      Chặng {stage.orderIndex}: {stage.name}
                    </strong>
                    <span>
                      {stage.completedCount}/{stage.lessonsCount} bài, {stage.lockedCount} khóa
                    </span>
                  </div>
                  <em>{stage.completionRate}%</em>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel dashboardMessage pathStudentToolbar">
        <div className="sectionTitle">
          <div>
            <h2>Bộ lọc lộ trình</h2>
            <span>Tìm nhanh theo tên, cấp độ, bài đang mở hoặc trạng thái tiến độ.</span>
          </div>
          <span className="inlineBadge">
            <Search size={14} />
            {visiblePathViews.length}/{pathViews.length}
          </span>
        </div>

        <div className="pathStudentToolbarGrid">
          <label className="field">
            <span>Tìm lộ trình</span>
            <div className="parentSearchInput">
              <Search size={16} />
              <input
                value={studentQuery}
                onChange={(event) => setStudentQuery(event.target.value)}
                placeholder="Nhập tên lộ trình, cấp độ hoặc bài đang học"
              />
            </div>
          </label>

          <div className="parentFilterGroup" role="tablist" aria-label="Lọc lộ trình học">
            {(['all', 'active', 'completed', 'locked'] as LearningPathFilter[]).map((filter) => (
              <button
                className={`studentFilterButton ${studentFilter === filter ? 'active' : ''}`}
                key={filter}
                type="button"
                onClick={() => setStudentFilter(filter)}
                aria-pressed={studentFilter === filter}
              >
                <Filter size={15} />
                {learningPathFilterLabels[filter]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pathInsightGrid" aria-label="Tổng quan lộ trình học">
        <div className="pathInsightCard">
          <Compass size={18} />
          <span>Lộ trình hiển thị</span>
          <strong>{visiblePathViews.length}</strong>
        </div>
        <div className="pathInsightCard">
          <BookOpen size={18} />
          <span>Tổng số bài</span>
          <strong>{totalLessons}</strong>
        </div>
        <div className="pathInsightCard">
          <CheckCircle2 size={18} />
          <span>Bài hoàn thành</span>
          <strong>{totalCompleted}</strong>
        </div>
        <div className="pathInsightCard">
          <TrendingUp size={18} />
          <span>Tiến độ chung</span>
          <strong>{averageCompletion}%</strong>
        </div>
      </section>

      <section className="pathGrid">
        {visiblePathViews.map((path) => (
          <article className="pathCard pathLearningCard" key={path.id}>
            <div className="pathCardTop">
              <div className="featureIcon">
                <BookOpen size={20} />
              </div>
              <span className="inlineBadge">
                <Layers3 size={14} />
                {path.level}
              </span>
            </div>

            <div>
              <strong>{path.name}</strong>
              <p>{path.description}</p>
            </div>

            <div className="progressRail" aria-label={`Tiến độ ${path.name}`}>
              <div
                className="progressFill"
                style={{ width: `${path.completionRate > 0 ? Math.max(path.completionRate, 5) : 0}%` }}
              />
            </div>

            <div className="pathCardStats">
              <span>{path.completionRate}% hoàn thành</span>
              <span>{path.completedCount}/{path.lessonsCount} bài</span>
              <span>{path.lockedCount} khóa</span>
            </div>

            <div className="pathStatusStack">
              <div>
                <PlayCircle size={15} />
                <span>Đang mở: {path.currentLessonTitle}</span>
              </div>
              {path.nextLockedLessonTitle ? (
                <div>
                  <LockKeyhole size={15} />
                  <span>Sắp mở: {path.nextLockedLessonTitle}</span>
                </div>
              ) : null}
            </div>

            <div className="pathStagePreview" aria-label={`Bản đồ chặng ${path.name}`}>
              {path.stagePreview.slice(0, 3).map((stage) => (
                <div className="pathStagePreviewItem" key={stage.id}>
                  <div>
                    <strong>
                      {stage.orderIndex}. {stage.name}
                    </strong>
                    <span>
                      {stage.completedCount}/{stage.lessonsCount} bài hoàn thành
                    </span>
                  </div>
                  <em>{stage.completionRate}%</em>
                </div>
              ))}
            </div>

            <div className="featureMeta">
              <em>
                <CheckCircle2 size={14} />
                {statusLabels[path.status] ?? path.status}
              </em>
              <em>{path.stagesCount} chặng</em>
              <em>{path.targetAudience}</em>
            </div>

            <div className="pathCardActions">
              {path.activeLessonId ? (
                <Link className="primaryButton" href={`/lessons/${path.activeLessonId}`}>
                  Học tiếp
                  <ArrowRight size={16} />
                </Link>
              ) : null}
              <Link className="secondaryButton" href={`/learning-paths/${path.id}`}>
                Chi tiết lộ trình
                <Compass size={16} />
              </Link>
            </div>
          </article>
        ))}

        {!visiblePathViews.length && !loading ? (
          <div className="subtleBox">
            Không có lộ trình khớp bộ lọc hiện tại. Hãy đổi từ khóa hoặc chọn lại trạng thái.
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
