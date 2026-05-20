'use client';

import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Filter,
  Sparkles,
  ShieldAlert,
  Target,
  TrendingUp,
  Search,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../components/app-shell';
import { ApiError, apiGet, apiPost } from '../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';

type ProgressRow = {
  id: string;
  status: string;
  percentComplete: number;
  bestScore: number;
  startedAt: string | null;
  completedAt: string | null;
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
  passingScore: number;
  stageId: string | null;
  stageName: string | null;
  stageType: string | null;
  stageOrder: number | null;
  pathName: string | null;
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
  totalLessons: number;
  attemptsCount: number;
  passedAttemptsCount: number;
  bestQuizScore: number;
  latestAttemptAt: string | null;
  linkedParentsCount: number;
};

type TeacherAuditLog = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  eventGroup: string;
  eventType: string;
  title: string;
  description: string;
  targetType: string;
  targetId: string | null;
  status: string;
  progress: number | null;
  score: number | null;
  occurredAt: string;
};

type TeacherAlert = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  reason: string;
  priority: number;
  status: string;
  createdAt: string;
  lessonId: string | null;
  lessonTitle: string | null;
  lessonProgress: number;
  bestScore: number;
};

type TeacherLearningControlResponse = {
  students: LinkedStudent[];
  logs: TeacherAuditLog[];
  alerts: TeacherAlert[];
};

const statusLabels: Record<string, string> = {
  ChuaHoc: 'Chưa học',
  DangHoc: 'Đang học',
  HoanThanh: 'Hoàn thành',
  BiKhoa: 'Bị khóa',
};

const progressBandFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'needs-support', label: 'Cần hỗ trợ' },
  { key: 'watch', label: 'Theo dõi' },
  { key: 'steady', label: 'Ổn định' },
] as const;

const teacherAuditFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'BaiHoc', label: 'Bài học' },
  { key: 'Quiz', label: 'Quiz' },
  { key: 'TroChoi', label: 'Game' },
  { key: 'AI', label: 'AI' },
  { key: 'CanhBao', label: 'Cảnh báo' },
  { key: 'ThongBao', label: 'Thông báo' },
] as const;

function formatDate(value: string | null) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getProgressBand(student: LinkedStudent) {
  if (student.averageProgress < 45 || student.lockedLessons >= 3 || student.activeLessons >= 4) {
    return 'needs-support';
  }

  if (student.averageProgress < 75 || student.learningStreak < 5) {
    return 'watch';
  }

  return 'steady';
}

function getProgressBandLabel(band: (typeof progressBandFilters)[number]['key']) {
  const option = progressBandFilters.find((item) => item.key === band);
  return option?.label ?? 'Tất cả';
}

function getAuditGroupLabel(group: string) {
  return teacherAuditFilters.find((item) => item.key === group)?.label ?? group;
}

function getPriorityLabel(priority: number) {
  if (priority <= 1) return 'Khẩn cấp';
  if (priority === 2) return 'Ưu tiên';
  return 'Theo dõi';
}

export default function ProgressPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [requestedStudentId, setRequestedStudentId] = useState('');
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [teacherAuditLogs, setTeacherAuditLogs] = useState<TeacherAuditLog[]>([]);
  const [teacherAlerts, setTeacherAlerts] = useState<TeacherAlert[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [progressSearch, setProgressSearch] = useState('');
  const [teacherAuditFilter, setTeacherAuditFilter] =
    useState<(typeof teacherAuditFilters)[number]['key']>('all');
  const [progressBandFilter, setProgressBandFilter] =
    useState<(typeof progressBandFilters)[number]['key']>('all');
  const [supportFeedback, setSupportFeedback] = useState('');
  const [supportPriority, setSupportPriority] = useState(1);
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [loadingLinkedStudents, setLoadingLinkedStudents] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setRequestedStudentId(new URLSearchParams(window.location.search).get('studentId') ?? '');
  }, []);

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    if (storedSession.user.roles.includes(USER_ROLES.ADMIN) && pathname === '/progress') {
      router.replace('/admin/progress');
      return;
    }

    setSession(storedSession);
  }, [pathname, router]);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;
    const isManagementMode = currentSession.user.roles.some(
      (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
    );
    const canSelectStudent = currentSession.user.roles.includes(USER_ROLES.PARENT) || isManagementMode;

    async function load() {
      try {
        if (canSelectStudent) {
          const isTeacherControlMode =
            currentSession.user.roles.includes(USER_ROLES.TEACHER) &&
            !currentSession.user.roles.includes(USER_ROLES.ADMIN);

          if (isTeacherControlMode) {
            const response = await apiGet<TeacherLearningControlResponse>(
              '/progress/teacher/learning-control',
              currentSession.accessToken,
            );
            if (!active) return;
            setError('');
            setLinkedStudents(response.students);
            setTeacherAuditLogs(response.logs);
            setTeacherAlerts(response.alerts);
            setSelectedStudentId((currentSelected) =>
              response.students.some((student) => student.id === requestedStudentId)
                ? requestedStudentId
                : response.students.some((student) => student.id === currentSelected)
                  ? currentSelected
                  : response.students[0]?.id ?? '',
            );
            return;
          }

          const endpoint = currentSession.user.roles.includes(USER_ROLES.PARENT)
            ? '/parents/me/students'
            : '/users/students';
          const response = await apiGet<LinkedStudent[]>(endpoint, currentSession.accessToken);
          if (!active) return;
          setError('');
          setLinkedStudents(response);
          setSelectedStudentId((currentSelected) =>
            response.some((student) => student.id === requestedStudentId)
              ? requestedStudentId
              : response.some((student) => student.id === currentSelected)
              ? currentSelected
              : response[0]?.id ?? '',
          );
          return;
        }

        if (!currentSession.user.roles.includes(USER_ROLES.STUDENT)) {
          setProgress([]);
          setLoadingProgress(false);
          return;
        }

        const response = await apiGet<ProgressRow[]>(
          `/progress/students/${currentSession.user.id}`,
          currentSession.accessToken,
        );
        if (!active) return;
        setError('');
        setProgress(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          setError('Vai trò hiện tại chưa có quyền xem tiến trình cá nhân tại trang này.');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được tiến trình.');
      } finally {
        if (active) setLoadingLinkedStudents(false);
      }
    }

    if (canSelectStudent) {
      setLoadingLinkedStudents(true);
      setLoadingProgress(true);
    }

    void load();
    return () => {
      active = false;
    };
  }, [requestedStudentId, router, session]);

  useEffect(() => {
    if (!session) return;
    const isManagementMode = session.user.roles.some(
      (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
    );
    const canSelectStudent = session.user.roles.includes(USER_ROLES.PARENT) || isManagementMode;
    if (!canSelectStudent) return;
    if (!selectedStudentId) {
      setProgress([]);
      setLoadingProgress(false);
      return;
    }

    const currentSession = session;
    let active = true;

    async function loadSelectedProgress() {
      setLoadingProgress(true);
      try {
        const response = await apiGet<ProgressRow[]>(
          `/progress/students/${selectedStudentId}`,
          currentSession.accessToken,
        );
        if (!active) return;
        setError('');
        setProgress(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          setError(
            currentSession.user.roles.includes(USER_ROLES.PARENT)
              ? 'Bạn chỉ có thể xem tiến trình của học viên đã liên kết.'
              : 'Vai trò hiện tại không có quyền xem tiến trình học viên này.',
          );
          setProgress([]);
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được tiến trình.');
      } finally {
        if (active) setLoadingProgress(false);
      }
    }

    void loadSelectedProgress();
    return () => {
      active = false;
    };
  }, [router, selectedStudentId, session]);

  const completed = progress.filter((item) => item.status === 'HoanThanh').length;
  const studying = progress.filter((item) => item.status === 'DangHoc').length;
  const locked = progress.filter((item) => item.status === 'BiKhoa').length;
  const notStarted = progress.filter((item) => item.status === 'ChuaHoc').length;
  const bestScore = progress.reduce((max, item) => Math.max(max, item.bestScore ?? 0), 0);
  const isParent = session?.user.roles.includes(USER_ROLES.PARENT) ?? false;
  const isAdmin = session?.user.roles.includes(USER_ROLES.ADMIN) ?? false;
  const isManagementMode =
    session?.user.roles.some((role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN) ?? false;
  const isStudentSelectorMode = isParent || isManagementMode;
  const selectedStudent = useMemo(
    () => linkedStudents.find((student) => student.id === selectedStudentId) ?? linkedStudents[0] ?? null,
    [linkedStudents, selectedStudentId],
  );
  const average = useMemo(
    () =>
      progress.length
        ? Math.round(progress.reduce((total, item) => total + item.percentComplete, 0) / progress.length)
        : 0,
    [progress],
  );
  const stageGroups = useMemo(() => {
    const grouped = new Map<
      string,
      {
        pathName: string;
        stageName: string;
        stageType: string | null;
        stageOrder: number;
        items: ProgressRow[];
        completed: number;
        studying: number;
        averageProgress: number;
        bestScore: number;
      }
    >();

    [...progress]
      .sort((left, right) => {
        const leftStage = left.stageOrder ?? 0;
        const rightStage = right.stageOrder ?? 0;
        return leftStage === rightStage ? left.lessonOrder - right.lessonOrder : leftStage - rightStage;
      })
      .forEach((item) => {
        const key = `${item.pathName ?? 'Lộ trình'}:${item.stageName ?? 'Bài tự do'}:${item.stageOrder ?? 0}`;
        const current = grouped.get(key);
        const nextItems = current ? [...current.items, item] : [item];
        const totalProgress = nextItems.reduce((sum, row) => sum + row.percentComplete, 0);
        grouped.set(key, {
          pathName: item.pathName ?? 'Lộ trình hiện tại',
          stageName: item.stageName ?? 'Bài học tự do',
          stageType: item.stageType ?? null,
          stageOrder: item.stageOrder ?? 0,
          items: nextItems,
          completed: nextItems.filter((row) => row.status === 'HoanThanh').length,
          studying: nextItems.filter((row) => row.status === 'DangHoc').length,
          averageProgress: nextItems.length ? Math.round(totalProgress / nextItems.length) : 0,
          bestScore: nextItems.reduce((max, row) => Math.max(max, row.bestScore ?? 0), 0),
        });
      });

    return [...grouped.values()];
  }, [progress]);
  const nextFocus =
    progress.find((item) => item.status === 'DangHoc') ??
    progress.find((item) => item.status === 'ChuaHoc') ??
    progress.find((item) => item.status === 'BiKhoa') ??
    progress[0] ??
    null;
  const loading = loadingLinkedStudents || loadingProgress;
  const visibleLinkedStudents = useMemo(
    () =>
      linkedStudents.filter((student) => {
        const matchesQuery =
          !progressSearch.trim() ||
          normalizeText(student.fullName).includes(normalizeText(progressSearch)) ||
          normalizeText(student.email).includes(normalizeText(progressSearch)) ||
          normalizeText(student.currentLevel ?? '').includes(normalizeText(progressSearch)) ||
          normalizeText(student.learningGoal ?? '').includes(normalizeText(progressSearch));
        const matchesBand =
          progressBandFilter === 'all' || getProgressBand(student) === progressBandFilter;
        return matchesQuery && matchesBand;
      }),
    [linkedStudents, progressBandFilter, progressSearch],
  );
  const adminSummary = useMemo(() => {
    const totalStudents = linkedStudents.length;
    const needsSupport = linkedStudents.filter((student) => getProgressBand(student) === 'needs-support').length;
    const watching = linkedStudents.filter((student) => getProgressBand(student) === 'watch').length;
    const steady = linkedStudents.filter((student) => getProgressBand(student) === 'steady').length;
    const averageProgress = totalStudents
      ? Math.round(linkedStudents.reduce((total, student) => total + student.averageProgress, 0) / totalStudents)
      : 0;
    const totalPoints = linkedStudents.reduce((total, student) => total + student.totalPoints, 0);
    const totalAttempts = linkedStudents.reduce((total, student) => total + (student.attemptsCount ?? 0), 0);
    return {
      totalStudents,
      needsSupport,
      watching,
      steady,
      averageProgress,
      totalPoints,
      totalAttempts,
    };
  }, [linkedStudents]);
  const selectedStudentBand = selectedStudent ? getProgressBand(selectedStudent) : null;
  const teacherControlSummary = useMemo(() => {
    const warningLogs = teacherAuditLogs.filter((log) => log.eventGroup === 'CanhBao').length;
    const quizLogs = teacherAuditLogs.filter((log) => log.eventGroup === 'Quiz').length;
    const gameAiLogs = teacherAuditLogs.filter((log) => log.eventGroup === 'TroChoi' || log.eventGroup === 'AI').length;
    const openAlerts = teacherAlerts.filter((alert) => alert.status !== 'HoanThanh').length;
    const lowQuizLogs = teacherAuditLogs.filter(
      (log) => log.eventGroup === 'Quiz' && typeof log.progress === 'number' && log.progress < 80,
    ).length;
    return { warningLogs, quizLogs, gameAiLogs, openAlerts, lowQuizLogs };
  }, [teacherAlerts, teacherAuditLogs]);
  const visibleTeacherAuditLogs = useMemo(
    () =>
      teacherAuditLogs.filter((log) => {
        const matchesStudent = !selectedStudentId || log.studentId === selectedStudentId;
        const matchesType = teacherAuditFilter === 'all' || log.eventGroup === teacherAuditFilter;
        return matchesStudent && matchesType;
      }),
    [selectedStudentId, teacherAuditFilter, teacherAuditLogs],
  );
  const selectedStudentAlerts = useMemo(
    () =>
      teacherAlerts
        .filter((alert) => !selectedStudentId || alert.studentId === selectedStudentId)
        .sort((left, right) => left.priority - right.priority || Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [selectedStudentId, teacherAlerts],
  );

  async function handleCreateTeacherSupport() {
    if (!session || !selectedStudent || !supportFeedback.trim()) return;
    setSupportBusy(true);
    setSupportMessage('');
    try {
      await apiPost(
        `/users/students/${selectedStudent.id}/support`,
        {
          title: 'Nhắc nhở ôn tập từ giáo viên',
          feedback: supportFeedback.trim(),
          priority: supportPriority,
        },
        session.accessToken,
      );
      const refreshed = await apiGet<TeacherLearningControlResponse>(
        '/progress/teacher/learning-control',
        session.accessToken,
      );
      setLinkedStudents(refreshed.students);
      setTeacherAuditLogs(refreshed.logs);
      setTeacherAlerts(refreshed.alerts);
      setSupportFeedback('');
      setSupportMessage('Đã ghi cảnh báo vào audit log và gửi nhắc nhở cho học viên.');
    } catch (err) {
      setSupportMessage(err instanceof Error ? err.message : 'Không gửi được cảnh báo hỗ trợ.');
    } finally {
      setSupportBusy(false);
    }
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang tải tiến trình...</p>
      </main>
    );
  }

  return (
    <AppShell
      session={session}
      active="progress"
      roleContext={isAdmin ? USER_ROLES.ADMIN : isParent ? USER_ROLES.PARENT : isManagementMode ? USER_ROLES.TEACHER : USER_ROLES.STUDENT}
      showSidebar={isAdmin || (isManagementMode && !isAdmin) ? false : undefined}
      eyebrow={isManagementMode && !isAdmin ? 'Giáo viên' : 'Learning Analytics'}
      title={isManagementMode && !isAdmin ? 'Kiểm soát học tập và cảnh báo' : 'Tiến trình'}
    >
      {isManagementMode && !isAdmin ? null : (
        <section className="pageHeroCompact">
          <div>
            <p className="eyebrow">Theo dõi học tập</p>
            <h2>
              {isAdmin
                ? 'Quản trị viên theo dõi tổng quan tiến trình học tập toàn hệ thống.'
                : isParent
                  ? 'Phụ huynh theo dõi tiến trình học tập chi tiết của từng học viên đã liên kết.'
                  : 'Tiến trình được tách thành trang riêng để xem trạng thái từng bài rõ hơn.'}
            </h2>
            <p>
              Hệ thống lưu phần trăm hoàn thành, trạng thái học và điểm cao nhất để phục vụ mở khóa bài
              mới và báo cáo học tập.
            </p>
          </div>
          <span className="inlineBadge">
            <TrendingUp size={16} />
            {isStudentSelectorMode ? `${linkedStudents.length} học viên` : `${average}% trung bình`}
          </span>
        </section>
      )}

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loadingLinkedStudents ? <div className="subtleBox dashboardMessage">Đang tải danh sách học viên...</div> : null}
      {!loadingLinkedStudents && loadingProgress ? (
        <div className="subtleBox dashboardMessage">Đang tải tiến trình học tập chi tiết...</div>
      ) : null}

      {isManagementMode && !isAdmin ? (
        <>
          <section className="teacherAuditHero">
            <div>
              <p className="eyebrow">Audit học tập và cảnh báo</p>
              <h2>Kiểm soát quá trình học TOEIC của học viên bằng audit log.</h2>
              <p>
                Giáo viên chọn học viên, xem toàn bộ log học tập theo thời gian, phát hiện điểm yếu,
                cảnh báo rủi ro và gửi nhắc nhở ôn tập ngay trong cùng một nghiệp vụ.
              </p>
            </div>
            <span className="inlineBadge">
              <ShieldAlert size={16} />
              {teacherControlSummary.openAlerts} cảnh báo mở
            </span>
          </section>

          <section className="teacherAuditMetrics" aria-label="Tổng quan audit giáo viên">
            <div>
              <Users size={18} />
              <span>Học viên</span>
              <strong>{linkedStudents.length}</strong>
            </div>
            <div>
              <Activity size={18} />
              <span>Audit log</span>
              <strong>{teacherAuditLogs.length}</strong>
            </div>
            <div>
              <ShieldAlert size={18} />
              <span>Cảnh báo</span>
              <strong>{teacherControlSummary.warningLogs}</strong>
            </div>
            <div>
              <Award size={18} />
              <span>Quiz</span>
              <strong>{teacherControlSummary.quizLogs}</strong>
            </div>
            <div>
              <Sparkles size={18} />
              <span>Game / AI</span>
              <strong>{teacherControlSummary.gameAiLogs}</strong>
            </div>
            <div>
              <Target size={18} />
              <span>Quiz dưới 80%</span>
              <strong>{teacherControlSummary.lowQuizLogs}</strong>
            </div>
          </section>

          <section className="teacherAuditCommand">
            <div className="field">
              <label htmlFor="teacher-control-search">Tìm học viên</label>
              <div className="teacherAuditSearch">
                <Search size={16} />
                <input
                  id="teacher-control-search"
                  value={progressSearch}
                  onChange={(event) => setProgressSearch(event.target.value)}
                  placeholder="Tên, email, cấp độ hoặc mục tiêu TOEIC"
                />
              </div>
            </div>
            <div className="teacherAuditFilterRows">
              <div className="teacherAuditFilterRow" aria-label="Lọc nhóm học viên">
                {progressBandFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={progressBandFilter === filter.key ? 'active' : ''}
                    onClick={() => setProgressBandFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="teacherAuditFilterRow" aria-label="Lọc loại audit">
                {teacherAuditFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={teacherAuditFilter === filter.key ? 'active' : ''}
                    onClick={() => setTeacherAuditFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="teacherAuditRoster">
            <div className="sectionTitle">
              <div>
                <h2>Chọn học viên cần kiểm soát</h2>
                <span>
                  {visibleLinkedStudents.length}/{linkedStudents.length} học viên đang hiển thị
                </span>
              </div>
            </div>
            <div className="teacherAuditStudentGrid">
              {visibleLinkedStudents.map((student) => {
                const active = selectedStudentId === student.id;
                const band = getProgressBand(student);
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
                    className={`teacherAuditStudentCard ${active ? 'active' : ''}`}
                    onClick={() => setSelectedStudentId(student.id)}
                    aria-pressed={active}
                  >
                    <div className="teacherAuditStudentHead">
                      <div className="teacherAuditAvatar">{initials || 'HV'}</div>
                      <div>
                        <strong>{student.fullName}</strong>
                        <span>{student.email}</span>
                      </div>
                      <span className={`studentCareTag ${band}`}>{getProgressBandLabel(band)}</span>
                    </div>
                    <div className="progressRail">
                      <div
                        className="progressFill"
                        style={{ width: `${Math.min(100, Math.max(0, student.averageProgress))}%` }}
                      />
                    </div>
                    <div className="teacherAuditFacts">
                      <span>{student.averageProgress}% tiến độ</span>
                      <span>{student.bestQuizScore}% quiz tốt nhất</span>
                      <span>{student.learningStreak} ngày liên tiếp</span>
                      <span>{student.lockedLessons} khóa</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="teacherAuditWorkspace">
            <div className="teacherAuditTimeline">
              <div className="sectionTitle">
                <div>
                  <h2>Timeline audit</h2>
                  <span>
                    {visibleTeacherAuditLogs.length} log đang hiển thị
                    {selectedStudent ? ` cho ${selectedStudent.fullName}` : ''}
                  </span>
                </div>
              </div>

              {visibleTeacherAuditLogs.map((log) => (
                <article className={`teacherAuditLog tone-${log.eventGroup}`} key={`${log.eventGroup}:${log.id}`}>
                  <div className="teacherAuditLogIcon">
                    {log.eventGroup === 'Quiz' ? <Award size={18} /> : null}
                    {log.eventGroup === 'CanhBao' ? <ShieldAlert size={18} /> : null}
                    {log.eventGroup === 'TroChoi' || log.eventGroup === 'AI' ? <Sparkles size={18} /> : null}
                    {log.eventGroup === 'BaiHoc' || log.eventGroup === 'ThongBao' ? <Activity size={18} /> : null}
                  </div>
                  <div className="teacherAuditLogBody">
                    <div className="teacherAuditLogHead">
                      <div>
                        <span>{log.studentName}</span>
                        <strong>{log.title}</strong>
                      </div>
                      <time>{formatDate(log.occurredAt)}</time>
                    </div>
                    <p>{log.description}</p>
                    <div className="teacherAuditLogMeta">
                      <span>{getAuditGroupLabel(log.eventGroup)}</span>
                      <span>{log.status}</span>
                      {typeof log.progress === 'number' ? <span>{Math.round(log.progress)}% hoàn thành</span> : null}
                      {typeof log.score === 'number' ? <span>Điểm {Math.round(log.score)}</span> : null}
                    </div>
                  </div>
                </article>
              ))}

              {!visibleTeacherAuditLogs.length && !loading ? (
                <div className="subtleBox">
                  Chưa có log phù hợp với bộ lọc. Đổi học viên hoặc loại audit để kiểm tra thêm.
                </div>
              ) : null}
            </div>

            <aside className="teacherAuditSide">
              <section className="panel">
                <div className="sectionTitle">
                  <div>
                    <h2>Cảnh báo ưu tiên</h2>
                    <span>Quiz thấp, tiến độ yếu hoặc gợi ý ôn tập đang mở</span>
                  </div>
                </div>
                <div className="teacherAuditAlertList">
                  {selectedStudentAlerts.slice(0, 6).map((alert) => (
                    <article key={alert.id}>
                      <strong>{alert.studentName}</strong>
                      <span>{alert.reason}</span>
                      <em>
                        {getPriorityLabel(alert.priority)} • {alert.lessonTitle ?? 'Không gắn bài'} •{' '}
                        {Math.round(alert.lessonProgress)}%
                      </em>
                    </article>
                  ))}
                  {!selectedStudentAlerts.length ? (
                    <div className="subtleBox">Không có cảnh báo đang mở cho bộ lọc này.</div>
                  ) : null}
                </div>
              </section>

              <section className="panel teacherAuditActionBox">
                <div className="sectionTitle">
                  <div>
                    <h2>Tạo nhắc nhở / gợi ý ôn</h2>
                    <span>Gửi cảnh báo cho học viên và ghi lại trong audit</span>
                  </div>
                </div>
                <label className="field">
                  <span>Học viên</span>
                  <input value={selectedStudent?.fullName ?? 'Chưa chọn'} readOnly />
                </label>
                <label className="field">
                  <span>Mức ưu tiên</span>
                  <select value={supportPriority} onChange={(event) => setSupportPriority(Number(event.target.value))}>
                    <option value={1}>Khẩn cấp</option>
                    <option value={2}>Ưu tiên</option>
                    <option value={3}>Theo dõi</option>
                  </select>
                </label>
                <label className="field">
                  <span>Nội dung nhắc nhở</span>
                  <textarea
                    value={supportFeedback}
                    onChange={(event) => setSupportFeedback(event.target.value)}
                    placeholder="Ví dụ: Ôn lại Part 5 về thì hiện tại hoàn thành và làm lại 20 câu trước thứ Sáu."
                    rows={5}
                  />
                </label>
                <button
                  className="primaryButton"
                  type="button"
                  onClick={handleCreateTeacherSupport}
                  disabled={!selectedStudent || !supportFeedback.trim() || supportBusy}
                >
                  {supportBusy ? 'Đang gửi...' : 'Ghi cảnh báo'}
                </button>
                {supportMessage ? <div className="subtleBox">{supportMessage}</div> : null}
              </section>
            </aside>
          </section>
        </>
      ) : isAdmin ? (
        <>
          <section className="progressAdminHero">
            <div className="progressAdminHeroCopy">
              <p className="eyebrow">Giám sát tiến trình</p>
              <h2>
                Điều phối học tập của toàn bộ học viên bằng một bảng điều khiển gọn, rõ và có thể
                lọc ngay.
              </h2>
              <p>
                Quản trị viên theo dõi tiến độ trung bình, nhóm học viên cần hỗ trợ, nhóm cần theo
                dõi và nhóm đang ổn định. Mỗi học viên có hồ sơ riêng với danh sách bài, chặng học
                và trạng thái thực tế để xử lý nhanh mà không bị trùng khối dữ liệu.
              </p>
              <div className="progressJourneyBadges progressAdminMeta">
                <span>
                  <Users size={14} />
                  {adminSummary.totalStudents} học viên
                </span>
                <span>
                  <ShieldAlert size={14} />
                  {adminSummary.needsSupport} cần hỗ trợ
                </span>
                <span>
                  <TrendingUp size={14} />
                  {adminSummary.averageProgress}% trung bình
                </span>
                <span>
                  <Award size={14} />
                  {adminSummary.totalPoints} điểm tích lũy
                </span>
              </div>
            </div>

            <div className="progressAdminStats">
              <article className="accent">
                <span>Nhóm cần hỗ trợ</span>
                <strong>{adminSummary.needsSupport}</strong>
                <small>học viên có tiến độ thấp hoặc bài bị khóa nhiều</small>
              </article>
              <article>
                <span>Nhóm cần theo dõi</span>
                <strong>{adminSummary.watching}</strong>
                <small>học viên đang học nhưng vẫn còn dao động</small>
              </article>
              <article>
                <span>Nhóm ổn định</span>
                <strong>{adminSummary.steady}</strong>
                <small>học viên giữ nhịp học đều và ít điểm nghẽn</small>
              </article>
              <article>
                <span>Lượt làm bài</span>
                <strong>{adminSummary.totalAttempts}</strong>
                <small>tổng lượt quiz của toàn bộ học viên đang theo dõi</small>
              </article>
            </div>
          </section>

          <section className="progressAdminToolbar">
            <div className="field">
              <label htmlFor="progress-admin-search">Tìm học viên</label>
              <div className="parentSearchInput">
                <Search size={16} />
                <input
                  id="progress-admin-search"
                  value={progressSearch}
                  onChange={(event) => setProgressSearch(event.target.value)}
                  placeholder="Nhập tên, email, cấp độ hoặc mục tiêu học tập"
                />
              </div>
            </div>

            <div className="progressBandFilterRow" aria-label="Lọc nhóm tiến trình">
              {progressBandFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`studentFilterButton ${progressBandFilter === filter.key ? 'active' : ''}`}
                  onClick={() => setProgressBandFilter(filter.key)}
                >
                  {filter.key === 'all' ? <Filter size={14} /> : null}
                  {filter.key === 'needs-support' ? <UserX size={14} /> : null}
                  {filter.key === 'watch' ? <Clock3 size={14} /> : null}
                  {filter.key === 'steady' ? <UserCheck size={14} /> : null}
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          <section className="progressAdminWorkspace">
            <aside className="progressAdminRoster">
              <div className="sectionTitle">
                <div>
                  <h2>Danh sách học viên</h2>
                  <span>
                    {visibleLinkedStudents.length} / {linkedStudents.length} học viên phù hợp bộ lọc
                  </span>
                </div>
                <span className="inlineBadge">
                  <Users size={16} />
                  {getProgressBandLabel(progressBandFilter)}
                </span>
              </div>

              <div className="progressAdminStudentList">
                {visibleLinkedStudents.map((student) => {
                  const active = selectedStudentId === student.id;
                  const initials = student.fullName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('');
                  const band = getProgressBand(student);

                  return (
                    <button
                      key={student.id}
                      type="button"
                      className={`progressAdminStudentCard ${active ? 'active' : ''}`}
                      onClick={() => setSelectedStudentId(student.id)}
                      aria-pressed={active}
                    >
                      <div className="progressAdminStudentHead">
                        <div className="progressAdminAvatar">{initials || 'HV'}</div>
                        <div>
                          <strong>{student.fullName}</strong>
                          <span>{student.email}</span>
                        </div>
                        <span className={`studentCareTag ${band}`}>{getProgressBandLabel(band)}</span>
                      </div>

                      <div className="progressRail">
                        <div
                          className="progressFill"
                          style={{ width: `${Math.min(100, Math.max(0, student.averageProgress))}%` }}
                        />
                      </div>

                      <div className="progressAdminFacts">
                        <span>{student.currentLevel ?? 'Chưa rõ cấp độ'}</span>
                        <span>{student.completedLessons} hoàn thành</span>
                        <span>{student.activeLessons} đang học</span>
                        <span>{student.lockedLessons} bị khóa</span>
                      </div>
                    </button>
                  );
                })}

                {!visibleLinkedStudents.length && !loadingLinkedStudents ? (
                  <div className="emptyState">
                    <ShieldAlert size={28} />
                    <h2>Không có học viên nào khớp bộ lọc hiện tại.</h2>
                    <p>Thử đổi từ khóa hoặc chuyển sang nhóm tiến trình khác để tiếp tục giám sát.</p>
                  </div>
                ) : null}
              </div>
            </aside>

            <section className="progressAdminDetail">
              {selectedStudent ? (
                <>
                  <section className="progressHeroPanel progressAdminDetailHero">
                    <div className="progressHeroCopy">
                      <p className="eyebrow">Hồ sơ chi tiết</p>
                      <h3>
                        {selectedStudent.fullName} -{' '}
                        {selectedStudent.currentLevel ?? 'Chưa rõ cấp độ'}
                      </h3>
                      <p>
                        Mục tiêu {selectedStudent.learningGoal ?? 'chưa cập nhật'}. Hệ thống gom toàn
                        bộ tiến trình, bài đang học, bài đã hoàn thành và các chặng cần hỗ trợ để
                        quản trị viên nắm ngay điểm nghẽn.
                      </p>
                      <div className="progressJourneyBadges progressAdminDetailMeta">
                        <span>
                          <BookOpen size={14} />
                          {selectedStudent.totalLessons || progress.length} bài
                        </span>
                        <span>
                          <TrendingUp size={14} />
                          {selectedStudent.averageProgress}% trung bình
                        </span>
                        <span>
                          <Award size={14} />
                          {selectedStudent.totalPoints} điểm
                        </span>
                        <span>
                          <Clock3 size={14} />
                          {selectedStudent.learningStreak} ngày liên tiếp
                        </span>
                        <span>
                          <UserCheck size={14} />
                          {selectedStudent.linkedParentsCount} phụ huynh liên kết
                        </span>
                      </div>

                      <div className="parentProgressHint">
                        <Sparkles size={14} />
                        {selectedStudentBand
                          ? `Nhóm tiến trình hiện tại: ${getProgressBandLabel(selectedStudentBand)}`
                          : 'Nhóm tiến trình hiện tại: chưa phân loại'}
                      </div>
                    </div>

                    <div
                      className="progressDial"
                      style={{ '--student-progress': `${selectedStudent.averageProgress}%` } as CSSProperties}
                    >
                      <span>{selectedStudent.averageProgress}%</span>
                      <small>tiến độ</small>
                    </div>
                  </section>

                  <section className="metricGrid progressAdminMetricGrid">
                    <div className="metric">
                      <CheckCircle2 size={20} />
                      <span>Hoàn thành</span>
                      <strong>{completed}</strong>
                    </div>
                    <div className="metric">
                      <Activity size={20} />
                      <span>Đang học</span>
                      <strong>{studying}</strong>
                    </div>
                    <div className="metric">
                      <TrendingUp size={20} />
                      <span>Chưa học</span>
                      <strong>{notStarted}</strong>
                    </div>
                    <div className="metric">
                      <ShieldAlert size={20} />
                      <span>Bị khóa</span>
                      <strong>{locked}</strong>
                    </div>
                  </section>

                  <section className="progressStageList">
                    <div className="sectionTitle">
                      <div>
                        <h2>Tiến trình theo chặng</h2>
                        <span>
                          {selectedStudent.fullName} được gom theo từng chặng để phát hiện nhanh bài
                          đang kẹt, bài cần mở và bài đã hoàn thành.
                        </span>
                      </div>
                    </div>

                    <div className="progressStageGrid">
                      {stageGroups.map((stage) => (
                        <article
                          className="progressStageCard"
                          key={`${stage.pathName}-${stage.stageName}-${stage.stageOrder}`}
                        >
                          <div className="progressStageHead">
                            <div>
                              <p className="eyebrow">{stage.pathName}</p>
                              <h3>
                                {stage.stageOrder}. {stage.stageName}
                              </h3>
                              <span>{stage.stageType ?? 'Chặng học'}</span>
                            </div>
                            <div className="progressStageScore">
                              <strong>{stage.averageProgress}%</strong>
                              <small>trung bình</small>
                            </div>
                          </div>

                          <div className="progressRail">
                            <div className="progressFill" style={{ width: `${stage.averageProgress}%` }} />
                          </div>

                          <div className="progressStageMeta">
                            <span>
                              <ShieldAlert size={14} />
                              {stage.completed}/{stage.items.length} hoàn thành
                            </span>
                            <span>
                              <Activity size={14} />
                              Đang học {stage.studying}
                            </span>
                            <span>
                              <Award size={14} />
                              Điểm cao nhất {stage.bestScore}
                            </span>
                          </div>

                          <div className="progressLessonStack">
                            {stage.items.map((item) => (
                              <article className="progressLessonCard" key={item.id}>
                                <div>
                                  <strong>
                                    {item.lessonOrder}. {item.lessonTitle}
                                  </strong>
                                  <span>{statusLabels[item.status] ?? item.status}</span>
                                </div>
                                <div className="progressLessonMeta">
                                  <span>{item.percentComplete}%</span>
                                  <span>{item.bestScore} điểm</span>
                                  <span>Đạt {item.passingScore}%</span>
                                </div>
                                <div className="progressRail">
                                  <div className="progressFill" style={{ width: `${item.percentComplete}%` }} />
                                </div>
                                <small>
                                  Bắt đầu {formatDate(item.startedAt)} • Hoàn thành {formatDate(item.completedAt)}
                                </small>
                                <Link className="secondaryButton progressLessonLink" href={`/lessons/${item.lessonId}`}>
                                  Mở bài học
                                  <ArrowRight size={14} />
                                </Link>
                              </article>
                            ))}
                          </div>
                        </article>
                      ))}

                      {!stageGroups.length && !loading ? (
                        <div className="subtleBox">
                          Chưa có dữ liệu tiến trình của học viên này. Khi học viên làm bài hoặc mở bài,
                          hệ thống sẽ ghi lại từng mốc tiến độ ở đây.
                        </div>
                      ) : null}
                    </div>
                  </section>
                </>
              ) : (
                <div className="emptyState">
                  <ShieldAlert size={28} />
                  <h2>Chưa có học viên nào để hiển thị.</h2>
                  <p>Hệ thống sẽ tự mở hồ sơ chi tiết ngay khi có học viên phù hợp bộ lọc.</p>
                </div>
              )}
            </section>
          </section>
        </>
      ) : isStudentSelectorMode ? (
        <>
          <section className="progressHeroPanel parentProgressHero">
            <div className="progressHeroCopy parentProgressCopy">
              <p className="eyebrow">{isParent ? 'Xem tiến trình học tập' : 'Tiến trình học viên'}</p>
              <h3>
                {selectedStudent
                  ? `Theo dõi tiến trình của ${selectedStudent.fullName} theo từng bài học và từng chặng.`
                  : isParent
                    ? 'Chọn một học viên đã liên kết để xem tiến trình chi tiết.'
                    : 'Chọn một học viên trong lớp để xem tiến trình chi tiết.'}
              </h3>
              <p>
                {isParent
                  ? 'Phụ huynh có thể chuyển nhanh giữa các học viên đã liên kết, xem bài đang học, bài đã hoàn thành, chặng còn khóa và điểm cao nhất để hỗ trợ đúng lúc.'
                  : 'Giáo viên có thể chuyển nhanh giữa học viên, xem bài đang học, bài đã hoàn thành, điểm cao nhất và các chặng đang khóa để hỗ trợ đúng lúc.'}
              </p>

              {selectedStudent ? (
                <div className="progressJourneyBadges parentProgressMeta">
                  <span>
                    <Users size={14} />
                    {selectedStudent.fullName}
                  </span>
                  <span>
                    <BookOpen size={14} />
                    {selectedStudent.currentLevel ?? 'Chưa rõ cấp độ'}
                  </span>
                  <span>
                    <Target size={14} />
                    {selectedStudent.learningGoal ?? 'Chưa cập nhật mục tiêu'}
                  </span>
                  <span>
                    <TrendingUp size={14} />
                    {progress.length ? `${average}% trung bình` : 'Chưa có dữ liệu'}
                  </span>
                  <span>
                    <ShieldAlert size={14} />
                    {locked} bài bị khóa
                  </span>
                </div>
              ) : null}

              <div className="parentProgressHint">
                <Sparkles size={14} />
                {isParent
                  ? 'Chọn học viên ở dải bên dưới để cập nhật toàn bộ thẻ tiến trình và danh sách bài học.'
                  : 'Chọn học viên ở dải bên dưới để cập nhật báo cáo tiến trình, chặng học và danh sách bài cần hỗ trợ.'}
              </div>
            </div>

            <div
              className="progressDial"
              style={{ '--student-progress': `${selectedStudent ? average : 0}%` } as CSSProperties}
            >
              <span>{selectedStudent ? average : 0}%</span>
              <small>tiến độ</small>
            </div>
          </section>

          <section className="parentStudentStrip" aria-label="Chọn học viên đã liên kết">
            {linkedStudents.map((student) => {
              const active = selectedStudentId === student.id;
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
                      style={{ width: `${Math.min(100, Math.max(0, student.averageProgress))}%` }}
                    />
                  </div>
                  <small>
                    {student.averageProgress}% • {student.completedLessons} bài hoàn thành •{' '}
                    {student.learningStreak} ngày liên tiếp
                  </small>
                </button>
              );
            })}

            {!linkedStudents.length && !loadingLinkedStudents ? (
              <div className="emptyState">
                <ShieldAlert size={28} />
                <h2>{isParent ? 'Chưa có học viên nào được liên kết.' : 'Chưa có học viên nào trong hệ thống.'}</h2>
                <p>
                  {isParent
                    ? 'Hệ thống sẽ hiển thị tiến trình ngay khi có liên kết phụ huynh - học viên hợp lệ.'
                    : 'Hệ thống sẽ hiển thị tiến trình ngay khi có học viên và dữ liệu học tập hợp lệ.'}
                </p>
              </div>
            ) : null}
          </section>

          {selectedStudent ? (
            <>
              <section className="metricGrid">
                <div className="metric">
                  <CheckCircle2 size={20} />
                  <span>Hoàn thành</span>
                  <strong>{completed}</strong>
                </div>
                <div className="metric">
                  <Activity size={20} />
                  <span>Đang học</span>
                  <strong>{studying}</strong>
                </div>
                <div className="metric">
                  <Award size={20} />
                  <span>Điểm cao nhất</span>
                  <strong>{bestScore}</strong>
                </div>
                <div className="metric">
                  <TrendingUp size={20} />
                  <span>Chưa học / Khóa</span>
                  <strong>{notStarted + locked}</strong>
                </div>
              </section>

              <section className="progressStageList">
                <div className="sectionTitle">
                  <div>
                    <h2>Tiến trình theo chặng</h2>
                    <span>
                      {isParent
                        ? `${selectedStudent.fullName} đang được gom theo từng chặng học để phụ huynh theo dõi nhanh từng giai đoạn`
                        : `${selectedStudent.fullName} đang được gom theo từng chặng học để giáo viên đánh giá tiến độ và hỗ trợ đúng lúc`}
                    </span>
                  </div>
                </div>

                <div className="progressStageGrid">
                  {stageGroups.map((stage) => (
                    <article
                      className="progressStageCard"
                      key={`${stage.pathName}-${stage.stageName}-${stage.stageOrder}`}
                    >
                      <div className="progressStageHead">
                        <div>
                          <p className="eyebrow">{stage.pathName}</p>
                          <h3>
                            {stage.stageOrder}. {stage.stageName}
                          </h3>
                          <span>{stage.stageType ?? 'Chặng học'}</span>
                        </div>
                        <div className="progressStageScore">
                          <strong>{stage.averageProgress}%</strong>
                          <small>trung bình</small>
                        </div>
                      </div>

                      <div className="progressRail">
                        <div className="progressFill" style={{ width: `${stage.averageProgress}%` }} />
                      </div>

                      <div className="progressStageMeta">
                        <span>
                          <ShieldAlert size={14} />
                          {stage.completed}/{stage.items.length} hoàn thành
                        </span>
                        <span>
                          <Activity size={14} />
                          Đang học {stage.studying}
                        </span>
                        <span>
                          <Award size={14} />
                          Điểm cao nhất {stage.bestScore}
                        </span>
                      </div>

                      <div className="progressLessonStack">
                        {stage.items.map((item) => (
                          <article className="progressLessonCard" key={item.id}>
                            <div>
                              <strong>
                                {item.lessonOrder}. {item.lessonTitle}
                              </strong>
                              <span>{statusLabels[item.status] ?? item.status}</span>
                            </div>
                            <div className="progressLessonMeta">
                              <span>{item.percentComplete}%</span>
                              <span>{item.bestScore} điểm</span>
                              <span>Đạt {item.passingScore}%</span>
                            </div>
                            <div className="progressRail">
                              <div className="progressFill" style={{ width: `${item.percentComplete}%` }} />
                            </div>
                            <small>
                              Bắt đầu {formatDate(item.startedAt)} • Hoàn thành {formatDate(item.completedAt)}
                            </small>
                            <Link className="secondaryButton progressLessonLink" href={`/lessons/${item.lessonId}`}>
                              Mở bài học
                              <ArrowRight size={14} />
                            </Link>
                          </article>
                        ))}
                      </div>
                    </article>
                  ))}

                  {!stageGroups.length && !loading ? (
                    <div className="subtleBox">
                      Chưa có dữ liệu tiến trình của học viên này. Khi học viên làm bài hoặc mở bài, hệ
                      thống sẽ ghi lại từng mốc tiến độ ở đây.
                    </div>
                  ) : null}
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : (
        <>
          <section className="progressHeroPanel">
            <div className="progressHeroCopy">
              <p className="eyebrow">Tổng quan tiến trình</p>
              <h3>
                {nextFocus
                  ? `${nextFocus.lessonOrder}. ${nextFocus.lessonTitle}`
                  : 'Chưa có bài học được ghi nhận'}
              </h3>
              <p>
                Tiến trình được lưu tự động theo từng bài, điểm cao nhất và trạng thái mở khóa để học
                viên biết rõ mình đang ở đâu và bước tiếp theo là gì.
              </p>
              {nextFocus ? (
                <div className="progressJourneyBadges">
                  <span>{statusLabels[nextFocus.status] ?? nextFocus.status}</span>
                  <span>{nextFocus.pathName ?? 'Lộ trình hiện tại'}</span>
                  <span>{nextFocus.stageName ?? 'Bài học cá nhân'}</span>
                  <span>Đạt {nextFocus.passingScore}%</span>
                </div>
              ) : null}
            </div>

            <div
              className="progressDial"
              style={{ '--student-progress': `${average}%` } as CSSProperties}
            >
              <span>{average}%</span>
              <small>trung bình</small>
            </div>
          </section>

          <section className="metricGrid">
            <div className="metric">
              <CheckCircle2 size={20} />
              <span>Hoàn thành</span>
              <strong>{completed}</strong>
            </div>
            <div className="metric">
              <Activity size={20} />
              <span>Đang học</span>
              <strong>{studying}</strong>
            </div>
            <div className="metric">
              <Award size={20} />
              <span>Điểm cao nhất</span>
              <strong>{bestScore}</strong>
            </div>
            <div className="metric">
              <TrendingUp size={20} />
              <span>Chưa học / Khóa</span>
              <strong>{notStarted + locked}</strong>
            </div>
          </section>

          <section className="progressStageList">
            <div className="sectionTitle">
              <div>
                <h2>Tiến trình theo chặng</h2>
                <span>Mỗi chặng gom theo lộ trình, hiển thị trạng thái và tiến độ trung bình</span>
              </div>
            </div>

            <div className="progressStageGrid">
              {stageGroups.map((stage) => (
                <article className="progressStageCard" key={`${stage.pathName}-${stage.stageName}-${stage.stageOrder}`}>
                  <div className="progressStageHead">
                    <div>
                      <p className="eyebrow">{stage.pathName}</p>
                      <h3>
                        {stage.stageOrder}. {stage.stageName}
                      </h3>
                      <span>{stage.stageType ?? 'Chặng học'}</span>
                    </div>
                    <div className="progressStageScore">
                      <strong>{stage.averageProgress}%</strong>
                      <small>trung bình</small>
                    </div>
                  </div>

                  <div className="progressRail">
                    <div className="progressFill" style={{ width: `${stage.averageProgress}%` }} />
                  </div>

                  <div className="progressStageMeta">
                    <span>{stage.completed}/{stage.items.length} hoàn thành</span>
                    <span>Đang học {stage.studying}</span>
                    <span>Điểm cao nhất {stage.bestScore}</span>
                  </div>

                  <div className="progressLessonStack">
                    {stage.items.map((item) => (
                      <article className="progressLessonCard" key={item.id}>
                        <div>
                          <strong>
                            {item.lessonOrder}. {item.lessonTitle}
                          </strong>
                          <span>{statusLabels[item.status] ?? item.status}</span>
                        </div>
                        <div className="progressLessonMeta">
                          <span>{item.percentComplete}%</span>
                          <span>{item.bestScore} điểm</span>
                          <span>Đạt {item.passingScore}%</span>
                        </div>
                        <div className="progressRail">
                          <div className="progressFill" style={{ width: `${item.percentComplete}%` }} />
                        </div>
                        <small>
                          Bắt đầu {formatDate(item.startedAt)} • Hoàn thành {formatDate(item.completedAt)}
                        </small>
                        <a className="secondaryButton progressLessonLink" href={`/lessons/${item.lessonId}`}>
                          Mở bài học
                          <ArrowRight size={14} />
                        </a>
                      </article>
                    ))}
                  </div>
                </article>
              ))}

              {!stageGroups.length && !loading ? (
                <div className="subtleBox">
                  Chưa có dữ liệu tiến trình. Khi học viên làm bài hoặc mở bài, hệ thống sẽ ghi lại từng
                  mốc tiến độ ở đây.
                </div>
              ) : null}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
