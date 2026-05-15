'use client';

import {
  Activity,
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

type LessonManagementSummary = {
  id: string;
  stageId: string | null;
  topicId: string | null;
  pathId: string | null;
  title: string;
  description: string | null;
  content: string | null;
  level: string | null;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  pathName: string | null;
  stageName: string | null;
  topicName: string | null;
  stageOrder: number | null;
  lessonOrder: number;
  passingScore: number;
  tasksCount: number;
  requiredTasksCount: number;
  vocabCount: number;
  grammarCount: number;
  resourcesCount: number;
  quizzesCount: number;
  publishedQuizzesCount: number;
};

type ProgressRow = {
  lessonId: string;
  status: string;
  percentComplete: number;
  bestScore: number;
};

type LessonStatus = 'TatCa' | 'ChuaHoc' | 'DangHoc' | 'HoanThanh' | 'BiKhoa';
type LessonManagementState = 'Nhap' | 'CongBo' | 'An';

const statusLabels: Record<string, string> = {
  TatCa: 'Tất cả',
  ChuaHoc: 'Chưa học',
  DangHoc: 'Đang học',
  HoanThanh: 'Hoàn thành',
  BiKhoa: 'Bị khóa',
  CongBo: 'Đã công bố',
  Nhap: 'Bản nháp',
  LuuTru: 'Lưu trữ',
  An: 'Đang ẩn',
};

const lessonFilters: LessonStatus[] = ['TatCa', 'DangHoc', 'ChuaHoc', 'HoanThanh', 'BiKhoa'];
const managementFilters = ['all', 'published', 'draft'] as const;
const lessonManagementStatusLabels: Record<LessonManagementState, string> = {
  Nhap: 'Bản nháp',
  CongBo: 'Công bố',
  An: 'Đang ẩn',
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

export default function LessonsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [path, setPath] = useState<LearningPathDetail | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [managementLessons, setManagementLessons] = useState<LessonManagementSummary[]>([]);
  const [activeFilter, setActiveFilter] = useState<LessonStatus>('TatCa');
  const [managementFilter, setManagementFilter] = useState<(typeof managementFilters)[number]>('all');
  const [managementQuery, setManagementQuery] = useState('');
  const [selectedManagementLessonId, setSelectedManagementLessonId] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDescription, setNewLessonDescription] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonLevel, setNewLessonLevel] = useState('A1');
  const [newLessonOrderIndex, setNewLessonOrderIndex] = useState(1);
  const [newLessonPassingScore, setNewLessonPassingScore] = useState(80);
  const [newLessonStatus, setNewLessonStatus] = useState<LessonManagementState>('Nhap');
  const [newLessonStageId, setNewLessonStageId] = useState('');
  const [newLessonTopicId, setNewLessonTopicId] = useState('');
  const [createLessonBusy, setCreateLessonBusy] = useState(false);
  const [lessonActionBusyId, setLessonActionBusyId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = session?.user.roles.includes(USER_ROLES.ADMIN) ?? false;
  const isManagementMode = session?.user.roles.some(
    (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
  );

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    if (storedSession.user.roles.includes(USER_ROLES.ADMIN) && pathname === '/lessons') {
      router.replace('/admin/lessons');
      return;
    }

    setSession(storedSession);
  }, [pathname, router]);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;
    async function load() {
      try {
        if (isManagementMode) {
          const lessonsResponse = await apiGet<LessonManagementSummary[]>('/lessons/manage', currentSession.accessToken);

          if (!active) return;
          setManagementLessons(lessonsResponse);
          setPath(null);
          setProgress([]);
        } else {
          const paths = await apiGet<LearningPathSummary[]>('/learning-paths', currentSession.accessToken);
          const firstPath = paths[0]
            ? await apiGet<LearningPathDetail>(`/learning-paths/${paths[0].id}`, currentSession.accessToken)
            : null;
          const progressRows = currentSession.user.roles.includes(USER_ROLES.STUDENT)
            ? await apiGet<ProgressRow[]>(
                `/progress/students/${currentSession.user.id}`,
                currentSession.accessToken,
              )
            : [];

          if (!active) return;
          setPath(firstPath);
          setProgress(progressRows);
          setManagementLessons([]);
        }
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được bài học.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [isManagementMode, router, session]);

  const progressByLesson = useMemo(
    () =>
      new Map(
        progress.map((item) => [
          item.lessonId,
          {
            ...item,
            percentComplete: Number(item.percentComplete ?? 0),
            bestScore: Number(item.bestScore ?? 0),
          },
        ]),
      ),
    [progress],
  );
  const lessonStates = useMemo(
    () =>
      path?.stages.flatMap((stage) =>
        stage.lessons.map((lesson) => {
          const lessonProgress = progressByLesson.get(lesson.id);
          const isFirstLesson = stage.orderIndex === 1 && lesson.orderIndex === 1;
          const status = lessonProgress?.status ?? (isFirstLesson ? 'ChuaHoc' : 'BiKhoa');

          return {
            ...lesson,
            stageName: stage.name,
            stageOrder: stage.orderIndex,
            stageType: stage.type,
            status,
            percentComplete: lessonProgress?.percentComplete ?? 0,
            bestScore: lessonProgress?.bestScore ?? 0,
            canOpen: status !== 'BiKhoa',
          };
        }),
      ) ?? [],
    [path?.stages, progressByLesson],
  );
  const filteredLessons = lessonStates.filter((lesson) =>
    activeFilter === 'TatCa' ? true : lesson.status === activeFilter,
  );
  const stageGroups = (path?.stages ?? []).map((stage) => ({
    ...stage,
    lessons: filteredLessons.filter((lesson) => lesson.stageOrder === stage.orderIndex),
    totalLessons: lessonStates.filter((lesson) => lesson.stageOrder === stage.orderIndex).length,
    completedLessons: lessonStates.filter(
      (lesson) => lesson.stageOrder === stage.orderIndex && lesson.status === 'HoanThanh',
    ).length,
  }));
  const completedCount = lessonStates.filter((lesson) => lesson.status === 'HoanThanh').length;
  const unlockedCount = lessonStates.filter((lesson) => lesson.canOpen && lesson.status !== 'HoanThanh').length;
  const lockedCount = lessonStates.filter((lesson) => lesson.status === 'BiKhoa').length;
  const completionRate = lessonStates.length ? Math.round((completedCount / lessonStates.length) * 100) : 0;
  const activeLesson =
    lessonStates.find((lesson) => lesson.status === 'DangHoc') ??
    lessonStates.find((lesson) => lesson.status === 'ChuaHoc') ??
    lessonStates.find((lesson) => lesson.canOpen && lesson.status !== 'HoanThanh') ??
    null;
  const visibleManagementLessons = useMemo(() => {
    const normalizedQuery = normalizeText(managementQuery.trim());

    return managementLessons
      .filter((lesson) => {
        if (managementFilter === 'published') return lesson.status === 'CongBo';
        if (managementFilter === 'draft') return lesson.status !== 'CongBo';
        return true;
      })
      .filter((lesson) => {
        if (!normalizedQuery) return true;
        return normalizeText(
          [
            lesson.title,
            lesson.description ?? '',
            lesson.content ?? '',
            lesson.level ?? '',
            lesson.pathName ?? '',
            lesson.stageName ?? '',
            lesson.topicName ?? '',
            lesson.status,
          ].join(' '),
        ).includes(normalizedQuery);
      });
  }, [managementFilter, managementLessons, managementQuery]);
  const stageOptions = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        label: string;
      }
    >();

    managementLessons.forEach((lesson) => {
      if (!lesson.stageId) return;
      if (map.has(lesson.stageId)) return;
      map.set(lesson.stageId, {
        id: lesson.stageId,
        label: `${lesson.pathName ?? 'Lộ trình'} / ${lesson.stageName ?? 'Giai đoạn'}`,
      });
    });

    return [...map.values()];
  }, [managementLessons]);
  const topicOptions = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        label: string;
      }
    >();

    managementLessons.forEach((lesson) => {
      if (!lesson.topicId) return;
      if (map.has(lesson.topicId)) return;
      map.set(lesson.topicId, {
        id: lesson.topicId,
        label: `${lesson.topicName ?? 'Chủ đề'}${lesson.pathName ? ` • ${lesson.pathName}` : ''}`,
      });
    });

    return [...map.values()];
  }, [managementLessons]);
  const managementStats = useMemo(() => {
    const totalLessons = managementLessons.length;
    const publishedLessons = managementLessons.filter((lesson) => lesson.status === 'CongBo').length;
    const draftLessons = totalLessons - publishedLessons;
    const totalTasks = managementLessons.reduce((sum, lesson) => sum + Number(lesson.tasksCount ?? 0), 0);
    const requiredTasks = managementLessons.reduce((sum, lesson) => sum + Number(lesson.requiredTasksCount ?? 0), 0);
    const totalVocab = managementLessons.reduce((sum, lesson) => sum + Number(lesson.vocabCount ?? 0), 0);
    const totalGrammar = managementLessons.reduce((sum, lesson) => sum + Number(lesson.grammarCount ?? 0), 0);
    const totalResources = managementLessons.reduce((sum, lesson) => sum + Number(lesson.resourcesCount ?? 0), 0);
    const totalQuizzes = managementLessons.reduce((sum, lesson) => sum + Number(lesson.quizzesCount ?? 0), 0);
    const publishedQuizzes = managementLessons.reduce(
      (sum, lesson) => sum + Number(lesson.publishedQuizzesCount ?? 0),
      0,
    );

    return {
      totalLessons,
      publishedLessons,
      draftLessons,
      totalTasks,
      requiredTasks,
      totalVocab,
      totalGrammar,
      totalResources,
      totalQuizzes,
      publishedQuizzes,
      lessonCoverage: totalLessons ? Math.round((publishedLessons / totalLessons) * 100) : 0,
      quizCoverage: totalQuizzes ? Math.round((publishedQuizzes / totalQuizzes) * 100) : 0,
    };
  }, [managementLessons]);
  const focusManagementLesson = useMemo(
    () =>
      visibleManagementLessons.find((lesson) => lesson.id === selectedManagementLessonId) ??
      visibleManagementLessons[0] ??
      null,
    [selectedManagementLessonId, visibleManagementLessons],
  );
  const focusContentLoad = focusManagementLesson
    ? Math.min(
        100,
        Math.round(
          (((Number(focusManagementLesson.tasksCount ?? 0) +
            Number(focusManagementLesson.requiredTasksCount ?? 0) +
            Number(focusManagementLesson.vocabCount ?? 0) +
            Number(focusManagementLesson.grammarCount ?? 0) +
            Number(focusManagementLesson.resourcesCount ?? 0) +
            Number(focusManagementLesson.quizzesCount ?? 0)) /
            18) *
            100),
        ),
      )
    : 0;
  const focusQuizReadiness = focusManagementLesson
    ? focusManagementLesson.quizzesCount
      ? Math.round((Number(focusManagementLesson.publishedQuizzesCount ?? 0) / focusManagementLesson.quizzesCount) * 100)
      : 0
    : 0;
  const focusLessonWarnings = focusManagementLesson
    ? [
        focusManagementLesson.status !== 'CongBo' ? 'Bài chưa công bố ra người học.' : null,
        !focusManagementLesson.stageId ? 'Chưa gắn giai đoạn học.' : null,
        !focusManagementLesson.topicId ? 'Chưa gắn chủ đề học.' : null,
        Number(focusManagementLesson.tasksCount ?? 0) === 0 ? 'Chưa có nhiệm vụ học tập.' : null,
        Number(focusManagementLesson.quizzesCount ?? 0) === 0 ? 'Chưa có quiz liên kết.' : null,
      ].filter((warning): warning is string => Boolean(warning))
    : [];

  useEffect(() => {
    if (!visibleManagementLessons.length) {
      if (selectedManagementLessonId) {
        setSelectedManagementLessonId('');
      }
      return;
    }

    if (!selectedManagementLessonId || !visibleManagementLessons.some((lesson) => lesson.id === selectedManagementLessonId)) {
      setSelectedManagementLessonId(visibleManagementLessons[0].id);
    }
  }, [selectedManagementLessonId, visibleManagementLessons]);

  useEffect(() => {
    if (!newLessonStageId && stageOptions[0]) {
      setNewLessonStageId(stageOptions[0].id);
    }
    if (!newLessonTopicId && !stageOptions.length && topicOptions[0]) {
      setNewLessonTopicId(topicOptions[0].id);
    }
  }, [newLessonStageId, newLessonTopicId, stageOptions, topicOptions]);

  async function handleCreateLesson() {
    if (!session) return;
    setError('');
    setSuccessMessage('');

    if (newLessonTitle.trim().length < 5 || newLessonDescription.trim().length < 10) {
      setError('Tên bài học cần ít nhất 5 ký tự và mô tả cần ít nhất 10 ký tự.');
      return;
    }

    if (!newLessonStageId && !newLessonTopicId) {
      setError('Cần chọn ít nhất một giai đoạn hoặc chủ đề cho bài học mới.');
      return;
    }

    setCreateLessonBusy(true);
    try {
      const created = await apiPost<LessonManagementSummary>(
        '/lessons',
        {
          stageId: newLessonStageId || undefined,
          topicId: newLessonTopicId || undefined,
          title: newLessonTitle,
          description: newLessonDescription,
          content: newLessonContent,
          level: newLessonLevel,
          orderIndex: newLessonOrderIndex,
          passingScore: newLessonPassingScore,
          status: newLessonStatus,
        },
        session.accessToken,
      );
      setManagementLessons((current) => [created, ...current.filter((lesson) => lesson.id !== created.id)]);
      setNewLessonTitle('');
      setNewLessonDescription('');
      setNewLessonContent('');
      setNewLessonLevel('A1');
      setNewLessonOrderIndex(1);
      setNewLessonPassingScore(80);
      setNewLessonStatus('Nhap');
      setSuccessMessage(`Đã tạo bài học "${created.title}".`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không tạo được bài học.');
    } finally {
      setCreateLessonBusy(false);
    }
  }

  async function handleUpdateLessonStatus(lesson: LessonManagementSummary, status: LessonManagementState) {
    if (!session || lesson.status === status) return;
    setError('');
    setSuccessMessage('');
    setLessonActionBusyId(lesson.id);

    try {
      const updated = await apiPatch<LessonManagementSummary>(`/lessons/${lesson.id}/status`, { status }, session.accessToken);
      setManagementLessons((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSuccessMessage(
        `Đã chuyển "${updated.title}" sang trạng thái ${
          lessonManagementStatusLabels[updated.status as LessonManagementState] ?? updated.status
        }.`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái bài học.');
    } finally {
      setLessonActionBusyId('');
    }
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang tải bài học...</p>
      </main>
    );
  }

  if (isManagementMode) {
    return (
      <AppShell
        session={session}
        active="lessons"
        roleContext={USER_ROLES.ADMIN}
        showSidebar={false}
        eyebrow="Quản lý bài học"
        title="Điều phối bài học"
      >
        <section className="pageHeroCompact">
          <div>
            <p className="eyebrow">{isAdmin ? 'Điều phối nội dung học tập' : 'Quản lý nội dung học tập'}</p>
            <h2>
              {isAdmin
                ? 'Quản trị viên kiểm soát toàn bộ bài học, độ đầy đủ nội dung và trạng thái công bố.'
                : 'Giáo viên quản lý toàn bộ bài học, theo dõi trạng thái công bố và rà soát nội dung đi kèm.'}
            </h2>
            <p>
              Màn hình này hiển thị bài học theo lộ trình, giai đoạn, chủ đề, trạng thái và số lượng
              nhiệm vụ, từ vựng, ngữ pháp, tài nguyên và quiz liên kết.
            </p>
          </div>
          <span className="inlineBadge">
            <LibraryBig size={16} />
            {visibleManagementLessons.length}/{managementStats.totalLessons} bài
          </span>
        </section>

        {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
        {successMessage ? <div className="subtleBox dashboardMessage">{successMessage}</div> : null}
        {loading ? <div className="subtleBox dashboardMessage">Đang tải dữ liệu bài học...</div> : null}

        <section className="lessonManagementFocus">
          <div className="lessonManagementFocusCopy">
            <p className="eyebrow">Bài học ưu tiên</p>
            <h3>{focusManagementLesson ? focusManagementLesson.title : 'Chưa có bài học phù hợp bộ lọc'}</h3>
            <p>
              {focusManagementLesson
                ? focusManagementLesson.description ?? 'Bài học này chưa có mô tả chi tiết.'
                : 'Hãy đổi bộ lọc hoặc từ khóa tìm kiếm để xem bài học đang được ưu tiên xử lý.'}
            </p>

            {focusManagementLesson ? (
              <>
                <div className="progressJourneyBadges lessonManagementMeta">
                  <span>
                    <CheckCircle2 size={14} />
                    {statusLabels[focusManagementLesson.status] ?? focusManagementLesson.status}
                  </span>
                  <span>
                    <LibraryBig size={14} />
                    {focusManagementLesson.pathName ?? 'Chưa gắn lộ trình'}
                  </span>
                  <span>
                    <Layers3 size={14} />
                    {focusManagementLesson.stageName ?? 'Chưa gắn giai đoạn'}
                  </span>
                  <span>
                    <BookOpen size={14} />
                    {focusManagementLesson.topicName ?? 'Chưa gắn chủ đề'}
                  </span>
                </div>

                <div className="lessonManagementReadiness">
                  <div>
                    <div className="lessonManagementReadinessHead">
                      <span>Khối lượng nội dung</span>
                      <strong>{focusContentLoad}%</strong>
                    </div>
                    <div className="progressRail">
                      <div className="progressFill" style={{ width: `${focusContentLoad}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="lessonManagementReadinessHead">
                      <span>Quiz công bố</span>
                      <strong>{focusQuizReadiness}%</strong>
                    </div>
                    <div className="progressRail">
                      <div className="progressFill" style={{ width: `${focusQuizReadiness}%` }} />
                    </div>
                  </div>
                </div>

                {focusLessonWarnings.length ? (
                  <div className="lessonManagementWarnings">
                    {focusLessonWarnings.map((warning) => (
                      <div key={warning}>
                        <ShieldAlert size={14} />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="subtleBox lessonManagementReady">
                    Bài học đang ở trạng thái khá ổn: đủ cấu trúc và đã sẵn sàng tiếp tục chỉnh sửa nhỏ.
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="lessonManagementSnapshot">
            <article className="accent">
              <span>Tổng bài</span>
              <strong>{managementStats.totalLessons}</strong>
              <small>Tổng lượng bài đang quản lý</small>
            </article>
            <article>
              <span>Đã công bố</span>
              <strong>{managementStats.publishedLessons}</strong>
              <small>Bài sẵn sàng cho học viên</small>
            </article>
            <article>
              <span>Bản nháp / ẩn</span>
              <strong>{managementStats.draftLessons}</strong>
              <small>Bài còn đang biên soạn</small>
            </article>
            <article>
              <span>Nội dung công bố</span>
              <strong>
                {managementStats.lessonCoverage}% / {managementStats.quizCoverage}%
              </strong>
              <small>Tỉ lệ công bố bài học và quiz</small>
            </article>
          </div>
        </section>

        <section className="lessonInsightGrid" aria-label="Tổng quan quản lý bài học">
          <div className="lessonInsightCard">
            <LibraryBig size={18} />
            <span>Tổng bài</span>
            <strong>{managementStats.totalLessons}</strong>
          </div>
          <div className="lessonInsightCard">
            <CheckCircle2 size={18} />
            <span>Đã công bố</span>
            <strong>{managementStats.publishedLessons}</strong>
          </div>
          <div className="lessonInsightCard">
            <ShieldAlert size={18} />
            <span>Bản nháp / ẩn</span>
            <strong>{managementStats.draftLessons}</strong>
          </div>
          <div className="lessonInsightCard">
            <BarChart3 size={18} />
            <span>Nội dung công bố</span>
            <strong>
              {managementStats.lessonCoverage}% / {managementStats.quizCoverage}%
            </strong>
          </div>
        </section>

        <section className="lessonManagementToolbar panel dashboardMessage">
          <div className="sectionTitle">
            <div>
              <h2>Bộ lọc quản lý</h2>
              <span>Tìm theo tên, lộ trình, giai đoạn, chủ đề hoặc trạng thái nội dung.</span>
            </div>
            <span className="inlineBadge">
              <Sparkles size={14} />
              {visibleManagementLessons.length}/{managementLessons.length}
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
              <span>Tìm bài học</span>
              <div className="parentSearchInput">
                <Search size={16} />
                <input
                  value={managementQuery}
                  onChange={(event) => setManagementQuery(event.target.value)}
                  placeholder="Nhập tên bài, lộ trình, giai đoạn hoặc chủ đề"
                />
              </div>
            </label>

            <div className="parentFilterGroup" role="tablist" aria-label="Lọc trạng thái bài học">
              {managementFilters.map((filter) => (
                <button
                  className={`lessonFilterButton ${managementFilter === filter ? 'active' : ''}`}
                  key={filter}
                  type="button"
                  onClick={() => setManagementFilter(filter)}
                  aria-pressed={managementFilter === filter}
                >
                  <Filter size={15} />
                  {filter === 'all' ? 'Tất cả' : filter === 'published' ? 'Đã công bố' : 'Bản nháp / ẩn'}
                </button>
              ))}
            </div>
          </div>

          <div className="featureMeta" style={{ marginTop: 14 }}>
            <em>
              <BookOpen size={14} />
              {managementStats.totalTasks} nhiệm vụ
            </em>
            <em>
              <Target size={14} />
              {managementStats.requiredTasks} nhiệm vụ bắt buộc
            </em>
            <em>
              <Layers3 size={14} />
              {managementStats.totalVocab} từ vựng
            </em>
            <em>
              <Compass size={14} />
              {managementStats.totalGrammar} ngữ pháp
            </em>
            <em>
              <PlayCircle size={14} />
              {managementStats.totalResources} tài nguyên
            </em>
            <em>
              <CheckCircle2 size={14} />
              {managementStats.totalQuizzes} quiz
            </em>
          </div>
        </section>

        <section className="lessonManagementToolbar panel dashboardMessage">
          <div className="sectionTitle">
            <div>
              <h2>Tạo bài học mới</h2>
              <span>Khởi tạo bài học theo đúng lộ trình, giai đoạn và chủ đề cần biên soạn.</span>
            </div>
            <span className="inlineBadge">
              <LibraryBig size={14} />
              CRUD
            </span>
          </div>

          <div className="teacherSupportGrid">
            <label className="field">
              <span>Tiêu đề bài học</span>
              <input value={newLessonTitle} onChange={(event) => setNewLessonTitle(event.target.value)} />
            </label>
            <label className="field">
              <span>Cấp độ</span>
              <input value={newLessonLevel} onChange={(event) => setNewLessonLevel(event.target.value)} />
            </label>
            <label className="field teacherSupportTextarea">
              <span>Mô tả</span>
              <textarea
                rows={3}
                value={newLessonDescription}
                onChange={(event) => setNewLessonDescription(event.target.value)}
              />
            </label>
            <label className="field teacherSupportTextarea">
              <span>Nội dung bài học</span>
              <textarea
                rows={4}
                value={newLessonContent}
                onChange={(event) => setNewLessonContent(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Giai đoạn</span>
              <select value={newLessonStageId} onChange={(event) => setNewLessonStageId(event.target.value)}>
                <option value="">Chọn giai đoạn</option>
                {stageOptions.map((stage) => (
                  <option value={stage.id} key={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Chủ đề</span>
              <select value={newLessonTopicId} onChange={(event) => setNewLessonTopicId(event.target.value)}>
                <option value="">Chọn chủ đề</option>
                {topicOptions.map((topic) => (
                  <option value={topic.id} key={topic.id}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Thứ tự</span>
              <input
                type="number"
                min={1}
                value={newLessonOrderIndex}
                onChange={(event) => setNewLessonOrderIndex(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Điểm đạt yêu cầu (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={newLessonPassingScore}
                onChange={(event) => setNewLessonPassingScore(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Trạng thái</span>
              <select
                value={newLessonStatus}
                onChange={(event) => setNewLessonStatus(event.target.value as LessonManagementState)}
              >
                <option value="Nhap">Bản nháp</option>
                <option value="CongBo">Công bố</option>
                <option value="An">Đang ẩn</option>
              </select>
            </label>
          </div>

          <div className="parentStudentActions" style={{ marginTop: 12 }}>
            <button
              className="primaryButton"
              type="button"
              disabled={createLessonBusy}
              onClick={() => void handleCreateLesson()}
            >
              {createLessonBusy ? 'Đang tạo...' : 'Tạo bài học'}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="lessonManagementWorkspace">
          <aside className="lessonManagementRoster">
            <div className="sectionTitle">
              <div>
                <h2>Danh sách bài học</h2>
                <span>
                  {visibleManagementLessons.length} / {managementLessons.length} bài học phù hợp bộ lọc
                </span>
              </div>
              <span className="inlineBadge">
                <Sparkles size={14} />
                {managementFilter === 'all'
                  ? 'Tất cả'
                  : managementFilter === 'published'
                    ? 'Đã công bố'
                    : 'Bản nháp / ẩn'}
              </span>
            </div>

            <div className="lessonManagementGrid">
              {visibleManagementLessons.map((lesson) => {
                const contentLoad = Math.min(
                  100,
                  Math.max(
                    8,
                    Math.round(
                      ((Number(lesson.tasksCount ?? 0) +
                        Number(lesson.requiredTasksCount ?? 0) +
                        Number(lesson.vocabCount ?? 0) +
                        Number(lesson.grammarCount ?? 0) +
                        Number(lesson.resourcesCount ?? 0) +
                        Number(lesson.quizzesCount ?? 0)) /
                        18) *
                        100,
                    ),
                  ),
                );
                const activeLessonCard = focusManagementLesson?.id === lesson.id;

                return (
                  <article
                    className={`lessonListCard lessonManagementCard ${activeLessonCard ? 'active' : ''}`}
                    key={lesson.id}
                  >
                    <div className="pathCardTop">
                      <div className="featureIcon">
                        <LibraryBig size={20} />
                      </div>
                      <span className="inlineBadge">
                        <CheckCircle2 size={14} />
                        {statusLabels[lesson.status] ?? lesson.status}
                      </span>
                    </div>

                    <div>
                      <strong>{lesson.title}</strong>
                      <p>{lesson.description}</p>
                    </div>

                    <div className="featureMeta">
                      <em>{lesson.pathName ?? 'Chưa gắn lộ trình'}</em>
                      <em>{lesson.stageName ?? 'Chưa gắn giai đoạn'}</em>
                      <em>{lesson.topicName ?? 'Chưa gắn chủ đề'}</em>
                      <em>{lesson.level ?? '--'}</em>
                    </div>

                    <div className="progressRail" aria-label={`Mức độ nội dung của ${lesson.title}`}>
                      <div className="progressFill" style={{ width: `${contentLoad}%` }} />
                    </div>

                    <div className="pathCardStats">
                      <span>{lesson.tasksCount} nhiệm vụ</span>
                      <span>{lesson.vocabCount} từ</span>
                      <span>{lesson.quizzesCount} quiz</span>
                    </div>

                    <div className="featureMeta">
                      <em>
                        <Target size={14} />
                        Đạt {lesson.passingScore}%
                      </em>
                      <em>{formatDateLabel(lesson.createdAt)}</em>
                      <em>{formatDateLabel(lesson.updatedAt)}</em>
                    </div>

                    <div className="parentStudentActions">
                      <button
                        type="button"
                        className="secondaryButton"
                        onClick={() => setSelectedManagementLessonId(lesson.id)}
                      >
                        Xem nhanh
                      </button>
                      <button
                        type="button"
                        className="secondaryButton"
                        disabled={lessonActionBusyId === lesson.id || lesson.status === 'CongBo'}
                        onClick={() => void handleUpdateLessonStatus(lesson, 'CongBo')}
                      >
                        Công bố
                      </button>
                      <button
                        type="button"
                        className="secondaryButton"
                        disabled={lessonActionBusyId === lesson.id || lesson.status === 'Nhap'}
                        onClick={() => void handleUpdateLessonStatus(lesson, 'Nhap')}
                      >
                        Đưa về nháp
                      </button>
                      <button
                        type="button"
                        className="secondaryButton"
                        disabled={lessonActionBusyId === lesson.id || lesson.status === 'An'}
                        onClick={() => void handleUpdateLessonStatus(lesson, 'An')}
                      >
                        Ẩn
                      </button>
                    </div>

                    <Link
                      className="primaryButton fullWidth"
                      href={`/lessons/${lesson.id}`}
                      onClick={() => setSelectedManagementLessonId(lesson.id)}
                    >
                      Mở chi tiết quản lý
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                );
              })}

              {!visibleManagementLessons.length && !loading ? (
                <div className="subtleBox">Không có bài học nào khớp bộ lọc hiện tại.</div>
              ) : null}
            </div>
          </aside>

          <aside className="lessonManagementDetail">
            {focusManagementLesson ? (
              <section className="lessonManagementDetailHero">
                <div className="lessonManagementDetailCopy">
                  <p className="eyebrow">Chi tiết nhanh</p>
                  <h3>{focusManagementLesson.title}</h3>
                  <p>{focusManagementLesson.description ?? 'Bài học chưa có mô tả chi tiết.'}</p>
                  <div className="progressJourneyBadges lessonManagementMeta">
                    <span>
                      <Compass size={14} />
                      {focusManagementLesson.pathName ?? 'Chưa gắn lộ trình'}
                    </span>
                    <span>
                      <Layers3 size={14} />
                      {focusManagementLesson.stageName ?? 'Chưa gắn giai đoạn'}
                    </span>
                    <span>
                      <BookOpen size={14} />
                      {focusManagementLesson.topicName ?? 'Chưa gắn chủ đề'}
                    </span>
                    <span>
                      <TrendingUp size={14} />
                      Đạt {focusManagementLesson.passingScore}%
                    </span>
                  </div>
                </div>

                <div
                  className="lessonManagementScore"
                  style={{ '--score-fill': `${focusContentLoad}%` } as CSSProperties}
                >
                  <strong>{focusContentLoad}%</strong>
                  <small>khối lượng nội dung</small>
                </div>
              </section>
            ) : null}

            <div className="lessonManagementSnapshot">
              <article>
                <span>Nhiệm vụ</span>
                <strong>{focusManagementLesson?.tasksCount ?? 0}</strong>
                <small>{focusManagementLesson?.requiredTasksCount ?? 0} bắt buộc</small>
              </article>
              <article>
                <span>Từ vựng</span>
                <strong>{focusManagementLesson?.vocabCount ?? 0}</strong>
                <small>Danh mục từ học kèm theo</small>
              </article>
              <article>
                <span>Ngữ pháp</span>
                <strong>{focusManagementLesson?.grammarCount ?? 0}</strong>
                <small>Khối kiến thức ngữ pháp</small>
              </article>
              <article>
                <span>Tài nguyên</span>
                <strong>{focusManagementLesson?.resourcesCount ?? 0}</strong>
                <small>File nghe, hình ảnh, tài liệu</small>
              </article>
              <article>
                <span>Quiz</span>
                <strong>{focusManagementLesson?.quizzesCount ?? 0}</strong>
                <small>{focusManagementLesson?.publishedQuizzesCount ?? 0} quiz công bố</small>
              </article>
              <article>
                <span>Thứ tự</span>
                <strong>{focusManagementLesson?.lessonOrder ?? 0}</strong>
                <small>Vị trí hiển thị trong chặng</small>
              </article>
            </div>

            {focusLessonWarnings.length ? (
              <div className="lessonManagementWarnings">
                {focusLessonWarnings.map((warning) => (
                  <div key={warning}>
                    <ShieldAlert size={14} />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="subtleBox lessonManagementReady">
                Bài học này đã đủ cấu trúc cơ bản và có thể tiếp tục tinh chỉnh nội dung chi tiết.
              </div>
            )}
          </aside>
        </section>

      </AppShell>
    );
  }

  return (
    <AppShell session={session} active="lessons" eyebrow={path?.name ?? 'Lessons'} title="Bài học">
      <section className="pageHeroCompact">
        <div>
          <p className="eyebrow">Danh sách bài học</p>
          <h2>
            {activeLesson
              ? `Bài nên học tiếp: ${activeLesson.title}`
              : 'Danh sách bài học được tách riêng để học từng phần thật tập trung.'}
          </h2>
          <p>
            Học viên xem được toàn bộ bài trong lộ trình, lọc theo trạng thái, biết bài nào mở, bài
            nào khóa, tiến độ từng bài và điểm cao nhất trước khi vào học chi tiết.
          </p>
        </div>
        <span className="inlineBadge">
          <BookOpen size={16} />
          {lessonStates.length} bài
        </span>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải bài học...</div> : null}

      <section className="lessonInsightGrid" aria-label="Tổng quan danh sách bài học">
        <div className="lessonInsightCard">
          <BookOpen size={18} />
          <span>Tổng bài</span>
          <strong>{lessonStates.length}</strong>
        </div>
        <div className="lessonInsightCard">
          <CheckCircle2 size={18} />
          <span>Hoàn thành</span>
          <strong>{completedCount}</strong>
        </div>
        <div className="lessonInsightCard">
          <PlayCircle size={18} />
          <span>Đang mở</span>
          <strong>{unlockedCount}</strong>
        </div>
        <div className="lessonInsightCard">
          <LockKeyhole size={18} />
          <span>Bị khóa</span>
          <strong>{lockedCount}</strong>
        </div>
      </section>

      <section className="lessonControlPanel panel" aria-label="Bộ lọc bài học">
        <div className="sectionTitle">
          <div>
            <h2>Bộ lọc bài học</h2>
            <span>Lọc theo trạng thái để học viên tập trung đúng nhóm bài cần xử lý</span>
          </div>
          <span className="inlineBadge">
            <TrendingUp size={14} />
            {completionRate}% path
          </span>
        </div>

        <div className="lessonFilterBar" role="tablist" aria-label="Lọc trạng thái bài học">
          {lessonFilters.map((filter) => (
            <button
              className={`lessonFilterButton ${activeFilter === filter ? 'active' : ''}`}
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
            >
              <Filter size={15} />
              {statusLabels[filter]}
            </button>
          ))}
        </div>
      </section>

      {activeLesson ? (
        <section className="lessonNextPanel">
          <div>
            <p className="eyebrow">Bài nên học tiếp</p>
            <h2>{activeLesson.title}</h2>
            <p>{activeLesson.description}</p>
            <div className="featureMeta">
              <em>
                <Compass size={14} />
                Chặng {activeLesson.stageOrder}: {activeLesson.stageName}
              </em>
              <em>
                <Target size={14} />
                Đạt {activeLesson.passingScore}%
              </em>
              <em>
                <Activity size={14} />
                {activeLesson.percentComplete}% hoàn thành
              </em>
            </div>
          </div>
          <Link className="primaryButton" href={`/lessons/${activeLesson.id}`}>
            Vào học ngay
            <ArrowRight size={16} />
          </Link>
        </section>
      ) : null}

      <section className="lessonStageList">
        {stageGroups.map((stage) => (
          <article className="lessonStagePanel" key={stage.id}>
            <div className="sectionTitle">
              <div>
                <h2>
                  {stage.orderIndex}. {stage.name}
                </h2>
                <span>{stage.description}</span>
              </div>
              <span className="inlineBadge">
                <Layers3 size={14} />
                {stage.completedLessons}/{stage.totalLessons} hoàn thành
              </span>
            </div>

            <div className="lessonCards">
              {stage.lessons.map((lesson) => {
                const Icon =
                  lesson.status === 'HoanThanh'
                    ? CheckCircle2
                    : lesson.status === 'DangHoc' || lesson.status === 'ChuaHoc'
                      ? PlayCircle
                      : LockKeyhole;

                return (
                  <article className={`lessonListCard ${lesson.status}`} key={lesson.id}>
                    <div className="featureIcon">
                      <Icon size={20} />
                    </div>
                    <div>
                      <strong>
                        {lesson.orderIndex}. {lesson.title}
                      </strong>
                      <span>{lesson.description}</span>
                      <div className="progressRail">
                        <div className="progressFill" style={{ width: `${lesson.percentComplete}%` }} />
                      </div>
                      <div className="featureMeta">
                        <em>{lesson.stageType}</em>
                        <em>{statusLabels[lesson.status] ?? 'Bị khóa'}</em>
                        <em>{lesson.percentComplete}%</em>
                        <em>Điểm cao nhất {lesson.bestScore}</em>
                        <em>Đạt {lesson.passingScore}%</em>
                      </div>
                    </div>
                    {lesson.canOpen ? (
                      <Link className="primaryButton" href={`/lessons/${lesson.id}`}>
                        Mở bài học
                        <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <span className="primaryButton disabledAction" aria-disabled="true">
                        Bị khóa
                        <LockKeyhole size={16} />
                      </span>
                    )}
                  </article>
                );
              })}

              {!stage.lessons.length ? (
                <div className="subtleBox">Không có bài học nào trong bộ lọc này.</div>
              ) : null}
            </div>
          </article>
        ))}

        {!lessonStates.length && !loading ? <div className="subtleBox">Chưa có bài học công bố.</div> : null}
      </section>
    </AppShell>
  );
}
