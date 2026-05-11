'use client';

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  GraduationCap,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../components/app-shell';
import { ApiError, apiGet, apiPatch, apiPost } from '../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';

type LinkedStudent = {
  id: string;
  fullName: string;
  email: string;
  linkStatus?: string;
  currentLevel: string | null;
  learningGoal: string | null;
  totalPoints: number;
  learningStreak: number;
  completedLessons: number;
  activeLessons: number;
  lockedLessons: number;
  averageProgress: number;
  totalLessons?: number;
  attemptsCount?: number;
  passedAttemptsCount?: number;
  bestQuizScore?: number;
  latestAttemptAt?: string | null;
  linkedParentsCount?: number;
};

type StudentSupportBand = 'needs-support' | 'watch' | 'steady';

type TeacherSupportSuggestion = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lessonId: string;
  lessonTitle: string;
  pathName: string | null;
  stageName: string | null;
  feedback: string;
  priority: number;
  status: string;
  createdAt: string;
  progressStatus: string;
  progressPercent: number;
  bestScore: number;
};

const filterOptions = [
  { key: 'all', label: 'Tất cả', description: 'Hiển thị toàn bộ học viên đã liên kết' },
  { key: 'needs-support', label: 'Cần hỗ trợ', description: 'Nhóm có tiến độ thấp hoặc bài bị khóa nhiều' },
  { key: 'steady', label: 'Ổn định', description: 'Nhóm đang học đều và tiến độ tốt' },
] as const;

const sortOptions = [
  { key: 'progress-desc', label: 'Tiến độ giảm dần' },
  { key: 'streak-desc', label: 'Chuỗi ngày giảm dần' },
  { key: 'points-desc', label: 'Điểm giảm dần' },
] as const;

const supportStatusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ChuaXem', label: 'Chưa xem' },
  { key: 'DaXem', label: 'Đã xem' },
  { key: 'HoanThanh', label: 'Hoàn tất' },
] as const;

export default function StudentsPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [supportSuggestions, setSupportSuggestions] = useState<TeacherSupportSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [query, setQuery] = useState('');
  const [filterKey, setFilterKey] = useState<(typeof filterOptions)[number]['key']>('all');
  const [sortKey, setSortKey] = useState<(typeof sortOptions)[number]['key']>('progress-desc');
  const [selectedSupportStudentId, setSelectedSupportStudentId] = useState('');
  const [supportFeedback, setSupportFeedback] = useState('');
  const [supportPriority, setSupportPriority] = useState(1);
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportStatusFilter, setSupportStatusFilter] = useState<(typeof supportStatusFilters)[number]['key']>('all');
  const [busySuggestionId, setBusySuggestionId] = useState('');

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
    async function load() {
      try {
        const isManagementMode = currentSession.user.roles.some(
          (role) => role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN,
        );

        if (isManagementMode) {
          const [studentsResponse, supportResponse] = await Promise.all([
            apiGet<LinkedStudent[]>('/users/students', currentSession.accessToken),
            apiGet<TeacherSupportSuggestion[]>('/users/students/support-suggestions', currentSession.accessToken),
          ]);
          if (!active) return;
          setStudents(studentsResponse);
          setSupportSuggestions(supportResponse);
          return;
        }

        if (!currentSession.user.roles.includes(USER_ROLES.PARENT)) {
          setStudents([]);
          return;
        }

        const response = await apiGet<LinkedStudent[]>('/parents/me/students', currentSession.accessToken);
        if (!active) return;
        setStudents(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được học viên.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router, session]);

  const isParent = !!session?.user.roles.includes(USER_ROLES.PARENT);
  const isTeacher = !!session?.user.roles.includes(USER_ROLES.TEACHER);
  const isAdmin = !!session?.user.roles.includes(USER_ROLES.ADMIN);
  const isManagementMode = isTeacher || isAdmin;

  const summary = useMemo(() => {
    const totalStudents = students.length;
    const totalPoints = students.reduce((sum, student) => sum + Number(student.totalPoints ?? 0), 0);
    const averageProgress = totalStudents
      ? Math.round(
          students.reduce((sum, student) => sum + Number(student.averageProgress ?? 0), 0) / totalStudents,
        )
      : 0;
    const needSupportCount = students.filter((student) => isStudentNeedingSupport(student)).length;
    const steadyCount = students.filter((student) => getSupportBand(student) === 'steady').length;
    const bestStreak = students.reduce((max, student) => Math.max(max, Number(student.learningStreak ?? 0)), 0);
    const totalQuizAttempts = students.reduce((sum, student) => sum + Number(student.attemptsCount ?? 0), 0);
    const passedQuizAttempts = students.reduce((sum, student) => sum + Number(student.passedAttemptsCount ?? 0), 0);
    const totalParentLinks = students.reduce((sum, student) => sum + Number(student.linkedParentsCount ?? 0), 0);
    const bestQuizScore = students.reduce((max, student) => Math.max(max, Number(student.bestQuizScore ?? 0)), 0);

    return {
      totalStudents,
      totalPoints,
      averageProgress,
      needSupportCount,
      steadyCount,
      bestStreak,
      totalQuizAttempts,
      passedQuizAttempts,
      totalParentLinks,
      bestQuizScore,
    };
  }, [students]);

  const visibleStudents = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    return [...students]
      .filter((student) => {
        if (!normalizedQuery) return true;

        return normalizeText(
          [student.fullName, student.email, student.currentLevel ?? '', student.learningGoal ?? ''].join(' '),
        ).includes(normalizedQuery);
      })
      .filter((student) => {
        if (filterKey === 'all') return true;
        return filterKey === getSupportBand(student);
      })
      .sort((left, right) => {
        switch (sortKey) {
          case 'streak-desc':
            return Number(right.learningStreak ?? 0) - Number(left.learningStreak ?? 0);
          case 'points-desc':
            return Number(right.totalPoints ?? 0) - Number(left.totalPoints ?? 0);
          case 'progress-desc':
          default:
            return Number(right.averageProgress ?? 0) - Number(left.averageProgress ?? 0);
        }
      });
  }, [filterKey, query, sortKey, students]);

  const selectedSupportStudent = useMemo(
    () => students.find((student) => student.id === selectedSupportStudentId) ?? null,
    [selectedSupportStudentId, students],
  );
  const supportSummary = useMemo(
    () => ({
      total: supportSuggestions.length,
      unread: supportSuggestions.filter((item) => item.status === 'ChuaXem').length,
      viewing: supportSuggestions.filter((item) => item.status === 'DaXem').length,
      done: supportSuggestions.filter((item) => item.status === 'HoanThanh').length,
    }),
    [supportSuggestions],
  );
  const visibleSupportSuggestions = useMemo(
    () =>
      supportSuggestions.filter((suggestion) =>
        supportStatusFilter === 'all' ? true : suggestion.status === supportStatusFilter,
      ),
    [supportStatusFilter, supportSuggestions],
  );

  async function handleCreateSupport() {
    if (!session || !selectedSupportStudent) return;
    setError('');
    setSuccessMessage('');

    if (supportFeedback.trim().length < 10) {
      setError('Nhận xét/nhiệm vụ cần ít nhất 10 ký tự để học viên hiểu rõ cần làm gì.');
      return;
    }

    setSupportBusy(true);
    try {
      const created = await apiPost<TeacherSupportSuggestion>(
        `/users/students/${selectedSupportStudent.id}/support`,
        {
          feedback: supportFeedback,
          priority: supportPriority,
          title: `Nhiệm vụ hỗ trợ cho ${selectedSupportStudent.fullName}`,
        },
        session.accessToken,
      );
      setSupportSuggestions((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setSupportFeedback('');
      setSuccessMessage(`Đã giao nhiệm vụ hỗ trợ cho ${selectedSupportStudent.fullName}.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không giao được nhiệm vụ hỗ trợ.');
    } finally {
      setSupportBusy(false);
    }
  }

  function startSupportForStudent(student: LinkedStudent) {
    setSelectedSupportStudentId(student.id);
    setSupportPriority(isStudentNeedingSupport(student) ? 1 : 2);
    setSupportFeedback(
      `Em cần ôn lại bài đang học, hoàn thành các nhiệm vụ còn thiếu và làm lại quiz đến khi đạt tối thiểu 80%.`,
    );
    setSuccessMessage('');
  }

  async function handleUpdateSupportStatus(suggestion: TeacherSupportSuggestion, status: TeacherSupportSuggestion['status']) {
    if (!session || suggestion.status === status) return;

    setError('');
    setSuccessMessage('');
    setBusySuggestionId(suggestion.id);
    try {
      const updated = await apiPatch<TeacherSupportSuggestion>(
        `/users/students/support-suggestions/${suggestion.id}/status`,
        { status },
        session.accessToken,
      );
      setSupportSuggestions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSuccessMessage(`Đã cập nhật phiếu hỗ trợ của ${updated.studentName} thành "${formatSupportStatus(updated.status)}".`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái phiếu hỗ trợ.');
    } finally {
      setBusySuggestionId('');
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
      <AppShell session={session} active="students" eyebrow="Class Tracking" title="Theo dõi lớp học">
        <section className="pageHeroCompact">
          <div>
            <p className="eyebrow">UC riêng của giáo viên và quản trị viên</p>
            <h2>Theo dõi danh sách học viên, tiến độ, quiz và mức độ cần hỗ trợ trong một màn hình.</h2>
            <p>
              Dữ liệu được tổng hợp trực tiếp từ tiến trình, hồ sơ học tập và kết quả quiz để giáo
              viên nhìn thấy ngay ai đang ổn, ai cần đẩy nhanh, và ai cần kèm thêm.
            </p>
          </div>
          <span className="inlineBadge">
            <Users size={16} />
            {summary.totalStudents} học viên
          </span>
        </section>

        {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
        {successMessage ? <div className="subtleBox dashboardMessage">{successMessage}</div> : null}
        {loading ? <div className="subtleBox dashboardMessage">Đang tải lớp học...</div> : null}

        <section className="lessonInsightGrid" aria-label="Tổng quan lớp học">
          <div className="lessonInsightCard">
            <Users size={18} />
            <span>Tổng học viên</span>
            <strong>{summary.totalStudents}</strong>
          </div>
          <div className="lessonInsightCard">
            <TrendingUp size={18} />
            <span>Tiến độ trung bình</span>
            <strong>{summary.averageProgress}%</strong>
          </div>
          <div className="lessonInsightCard">
            <ShieldAlert size={18} />
            <span>Cần hỗ trợ</span>
            <strong>{summary.needSupportCount}</strong>
          </div>
          <div className="lessonInsightCard">
            <BarChart3 size={18} />
            <span>Lượt quiz</span>
            <strong>{summary.totalQuizAttempts}</strong>
          </div>
        </section>

        <section className="panel dashboardMessage">
          <div className="sectionTitle">
            <div>
              <h2>Bộ lọc lớp học</h2>
              <span>Tìm theo tên, email, cấp độ, mục tiêu học tập hoặc trạng thái hỗ trợ.</span>
            </div>
            <span className="inlineBadge">
              <Sparkles size={14} />
              {visibleStudents.length}/{summary.totalStudents}
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
              <span>Tìm học viên</span>
              <div className="parentSearchInput">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tên, email, mục tiêu hoặc cấp độ"
                />
              </div>
            </label>

            <div className="parentFilterGroup" role="tablist" aria-label="Lọc học viên">
              {filterOptions.map((option) => {
                const active = filterKey === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`studentFilterButton ${active ? 'active' : ''}`}
                    onClick={() => setFilterKey(option.key)}
                    aria-pressed={active}
                  >
                    <Filter size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="parentToolbarRow" style={{ marginTop: 14 }}>
            <div className="parentSortGroup" role="listbox" aria-label="Sắp xếp học viên">
              {sortOptions.map((option) => {
                const active = sortKey === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`studentSortButton ${active ? 'active' : ''}`}
                    onClick={() => setSortKey(option.key)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="featureMeta">
              <em>
                <CheckCircle2 size={14} />
                {summary.passedQuizAttempts} lượt quiz đạt
              </em>
              <em>
                <BookOpen size={14} />
                {summary.totalPoints} điểm tích lũy
              </em>
              <em>
                <Target size={14} />
                Best quiz {Math.round(summary.bestQuizScore)}%
              </em>
              <em>
                <BarChart3 size={14} />
                {summary.totalParentLinks} liên kết phụ huynh
              </em>
            </div>
          </div>
        </section>

        <section className="panel dashboardMessage" aria-label="Giao nhiệm vụ hỗ trợ học viên">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">UC7 • Gửi nhận xét và giao nhiệm vụ</p>
              <h2>Phiếu hỗ trợ học viên cần kèm thêm</h2>
              <span>
                Giáo viên chọn học viên, viết nhận xét cụ thể, đặt mức ưu tiên và hệ thống sẽ tạo gợi ý ôn tập
                kèm thông báo cho học viên.
              </span>
            </div>
            <span className="inlineBadge">
              <ClipboardCheck size={14} />
              {supportSuggestions.length} phiếu
            </span>
          </div>

          <div className="parentReviewSummary teacherSupportSummary">
            <div>
              <strong>{supportSummary.unread}</strong>
              <span>chưa xem</span>
            </div>
            <div>
              <strong>{supportSummary.viewing}</strong>
              <span>đang theo dõi</span>
            </div>
            <div>
              <strong>{supportSummary.done}</strong>
              <span>hoàn tất</span>
            </div>
            <div>
              <strong>{supportSummary.total}</strong>
              <span>tổng phiếu</span>
            </div>
          </div>

          <div className="teacherSupportGrid">
            <div className="teacherSupportForm">
              <label className="field">
                <span>Học viên cần hỗ trợ</span>
                <select
                  value={selectedSupportStudentId}
                  onChange={(event) => setSelectedSupportStudentId(event.target.value)}
                >
                  <option value="">Chọn học viên</option>
                  {visibleStudents.map((student) => (
                    <option value={student.id} key={student.id}>
                      {student.fullName} - {student.averageProgress}% tiến độ
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Mức ưu tiên</span>
                <select
                  value={supportPriority}
                  onChange={(event) => setSupportPriority(Number(event.target.value))}
                >
                  <option value={1}>Ưu tiên cao</option>
                  <option value={2}>Theo dõi sát</option>
                  <option value={3}>Nhắc nhẹ</option>
                </select>
              </label>

              <label className="field teacherSupportTextarea">
                <span>Nhận xét / nhiệm vụ giao</span>
                <textarea
                  value={supportFeedback}
                  onChange={(event) => setSupportFeedback(event.target.value)}
                  placeholder="Ví dụ: Ôn lại từ vựng chủ đề gia đình, nghe audio 2 lần và làm lại quiz đến khi đạt 80%."
                  rows={4}
                />
              </label>

              <div className="parentStudentActions">
                <button
                  className="primaryButton"
                  type="button"
                  disabled={!selectedSupportStudent || supportBusy}
                  onClick={() => void handleCreateSupport()}
                >
                  {supportBusy ? 'Đang giao...' : 'Giao nhiệm vụ'}
                  <ArrowRight size={16} />
                </button>
                {selectedSupportStudent ? (
                  <Link className="secondaryButton" href={`/progress?studentId=${selectedSupportStudent.id}`}>
                    Xem tiến trình
                    <ArrowRight size={16} />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="teacherSupportHistory">
              <div className="parentFilterGroup" role="tablist" aria-label="Lọc phiếu hỗ trợ">
                {supportStatusFilters.map((option) => {
                  const active = supportStatusFilter === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`studentFilterButton ${active ? 'active' : ''}`}
                      onClick={() => setSupportStatusFilter(option.key)}
                      aria-pressed={active}
                    >
                      <Filter size={14} />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {visibleSupportSuggestions.slice(0, 8).map((suggestion) => (
                <article className="parentReviewCard priority-2" key={suggestion.id}>
                  <div className="parentReviewCardHead">
                    <div>
                      <p className="eyebrow">{suggestion.studentName}</p>
                      <strong>{suggestion.lessonTitle}</strong>
                      <span>{suggestion.feedback}</span>
                    </div>
                    <span className="parentReviewStatus DaXem">{formatSupportStatus(suggestion.status)}</span>
                  </div>
                  <div className="parentReviewMeta">
                    <span>
                      <TrendingUp size={14} />
                      {Math.round(Number(suggestion.progressPercent ?? 0))}% tiến độ
                    </span>
                    <span>
                      <Target size={14} />
                      Ưu tiên {suggestion.priority}
                    </span>
                    <span>{formatRecentDate(suggestion.createdAt)}</span>
                  </div>
                  <div className="parentReviewActions">
                    <button
                      className="secondaryButton"
                      type="button"
                      disabled={busySuggestionId === suggestion.id || suggestion.status === 'DaXem'}
                      onClick={() => void handleUpdateSupportStatus(suggestion, 'DaXem')}
                    >
                      Đang theo dõi
                    </button>
                    <button
                      className="secondaryButton"
                      type="button"
                      disabled={busySuggestionId === suggestion.id || suggestion.status === 'HoanThanh'}
                      onClick={() => void handleUpdateSupportStatus(suggestion, 'HoanThanh')}
                    >
                      Hoàn tất
                      <CheckCircle2 size={14} />
                    </button>
                  </div>
                </article>
              ))}

              {!visibleSupportSuggestions.length && !loading ? (
                <div className="subtleBox">
                  Chưa có phiếu hỗ trợ phù hợp bộ lọc hiện tại. Bấm “Giao nhiệm vụ” trên học viên cần hỗ trợ
                  để tạo phiếu đầu tiên.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="studentWatchList parentStudentList">
          {visibleStudents.map((student) => {
            const supportBand = getSupportBand(student);
            const supportLabel = getSupportLabel(student);
            const supportTone =
              supportBand === 'needs-support' ? 'needs-support' : supportBand === 'steady' ? 'steady' : 'watch';
            const progressValue = Math.min(100, Math.max(0, Number(student.averageProgress ?? 0)));
            const initials = student.fullName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('');

            return (
              <article className={`studentWatchCard parentStudentCard ${supportTone}`} key={student.id}>
                <div className="parentStudentIdentity">
                  <div className="parentAvatar">{initials || 'HV'}</div>
                  <div>
                    <strong>{student.fullName}</strong>
                    <span>{student.email}</span>
                    <em>{student.learningGoal ?? 'Chưa cập nhật mục tiêu học tập'}</em>
                  </div>
                </div>

                <div
                  className="studentProgressMini"
                  style={{ '--student-progress': `${progressValue}%` } as CSSProperties}
                  aria-label={`Tiến độ của ${student.fullName}`}
                >
                  <span>{progressValue}%</span>
                  <small>tiến độ</small>
                </div>

                <div className="studentWatchStats parentStudentStats">
                  <span>{student.currentLevel ?? 'Chưa rõ cấp độ'}</span>
                  <span>{student.completedLessons} bài hoàn thành</span>
                  <span>{student.activeLessons} bài đang học</span>
                  <span>{student.lockedLessons} bài bị khóa</span>
                  <span>{student.attemptsCount ?? 0} lượt quiz</span>
                  <span>{student.passedAttemptsCount ?? 0} lượt đạt</span>
                  <span>{student.linkedParentsCount ?? 0} liên kết phụ huynh</span>
                </div>

                <div className="parentStudentActions">
                  <span className={`studentCareTag ${supportTone}`}>
                    {supportBand === 'needs-support' ? <ShieldAlert size={14} /> : <Sparkles size={14} />}
                    {supportLabel}
                  </span>
                  <span className="studentPointTag">
                    <Target size={14} />
                    {student.totalPoints} điểm
                  </span>
                  <Link className="secondaryButton" href={`/progress?studentId=${student.id}`}>
                    Xem tiến trình
                    <ArrowRight size={16} />
                  </Link>
                  <button className="secondaryButton" type="button" onClick={() => startSupportForStudent(student)}>
                    Giao nhiệm vụ
                    <ClipboardCheck size={16} />
                  </button>
                </div>

                <small style={{ color: 'var(--muted)' }}>
                  Quiz gần nhất {formatRecentDate(student.latestAttemptAt)} • Điểm cao nhất{' '}
                  {Math.round(Number(student.bestQuizScore ?? 0))}%
                </small>
              </article>
            );
          })}

          {!visibleStudents.length && !loading ? (
            <div className="emptyState">
              <GraduationCap size={28} />
              <h2>Không tìm thấy học viên phù hợp.</h2>
              <p>Thử đổi từ khóa tìm kiếm hoặc mở lại bộ lọc để xem toàn bộ lớp học.</p>
            </div>
          ) : null}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell session={session} active="students" eyebrow="Student Care" title="Học viên">
      <section className="pageHeroCompact">
        <div>
          <p className="eyebrow">Theo dõi người học</p>
          <h2>Trang học viên dành riêng cho phụ huynh, giáo viên và quản trị mở rộng về sau.</h2>
          <p>
            Bản hiện tại ưu tiên luồng phụ huynh theo dõi học viên đã liên kết, gồm tiến độ trung bình,
            bài hoàn thành và chuỗi học.
          </p>
        </div>
        <span className="inlineBadge">
          <Users size={16} />
          {students.length} học viên
        </span>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải học viên...</div> : null}

      {!isParent ? (
        <section className="panel">
          {isTeacher ? (
            <div className="actorManagementGrid">
              <div className="roleOverviewIntro">
                <p className="eyebrow">UC riêng của giáo viên</p>
                <h3>Quản lý lớp và chất lượng học tập</h3>
                <p>
                  Giáo viên không học bài như học viên. Vai trò này cần xem danh sách lớp, quản lý
                  nội dung, theo dõi điểm quiz và điều chỉnh lộ trình.
                </p>
              </div>
              <div className="roleOverviewStack">
                <div className="roleOverviewItem">
                  <Users size={16} />
                  <span>Quản lý danh sách học viên theo lớp hoặc nhóm học.</span>
                </div>
                <div className="roleOverviewItem">
                  <BookOpen size={16} />
                  <span>Quản lý bài học, tài nguyên, câu hỏi và bài kiểm tra.</span>
                </div>
                <div className="roleOverviewItem">
                  <ShieldCheck size={16} />
                  <span>Theo dõi kết quả để phát hiện bài cần ôn tập.</span>
                </div>
              </div>
            </div>
          ) : isAdmin ? (
            <div className="actorManagementGrid">
              <div className="roleOverviewIntro">
                <p className="eyebrow">UC riêng của quản trị viên</p>
                <h3>Quản lý actor, phân quyền và vận hành</h3>
                <p>
                  Quản trị viên không đi theo luồng học tập. Vai trò này tập trung quản lý người
                  dùng, phân quyền, trạng thái nội dung và giám sát dữ liệu toàn hệ thống.
                </p>
              </div>
              <div className="roleOverviewStack">
                <div className="roleOverviewItem">
                  <Users size={16} />
                  <span>Quản lý tài khoản học viên, phụ huynh, giáo viên và quản trị.</span>
                </div>
                <div className="roleOverviewItem">
                  <ShieldCheck size={16} />
                  <span>Phân quyền actor và kiểm soát quyền truy cập chức năng.</span>
                </div>
                <div className="roleOverviewItem">
                  <BookOpen size={16} />
                  <span>Giám sát nội dung công bố, nhật ký hoạt động và dữ liệu mẫu.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="emptyState">
              <ShieldCheck size={28} />
              <h2>Trang này không thuộc UC riêng của học viên.</h2>
              <p>Học viên nên dùng lộ trình, bài học, kiểm tra, tiến trình và sân chơi học tập.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="parentHero panel">
            <div className="parentHeroCopy">
              <p className="eyebrow">UC1 • Xem danh sách học viên đã liên kết</p>
              <h2>Theo dõi toàn bộ học viên đang được liên kết trong một màn hình rõ ràng và đẹp mắt.</h2>
              <p>
                Phụ huynh có thể xem nhanh tiến độ, số bài đã hoàn thành, chuỗi ngày học, cấp độ
                hiện tại và mức độ cần hỗ trợ của từng học viên. Màn hình này được thiết kế để
                lọc, quét và ưu tiên hỗ trợ trong vài giây.
              </p>
              <div className="parentHeroMeta">
                <span>
                  <Users size={14} />
                  {summary.totalStudents} học viên đã liên kết
                </span>
                <span>
                  <TrendingUp size={14} />
                  {summary.averageProgress}% tiến độ trung bình
                </span>
                <span>
                  <ShieldAlert size={14} />
                  {summary.needSupportCount} học viên cần hỗ trợ
                </span>
              </div>
            </div>

            <div className="parentHeroStats">
              <article className="parentHeroStat">
                <span>Tổng điểm</span>
                <strong>{summary.totalPoints}</strong>
                <em>đã tích lũy trên toàn bộ học viên</em>
              </article>
              <article className="parentHeroStat">
                <span>Tiến bộ tốt</span>
                <strong>{summary.steadyCount}</strong>
                <em>học viên đang theo nhịp ổn định</em>
              </article>
              <article className="parentHeroStat">
                <span>Chuỗi ngày cao nhất</span>
                <strong>{summary.bestStreak}</strong>
                <em>ngày liên tiếp ở nhóm đang theo dõi</em>
              </article>
              <article className="parentHeroStat accent">
                <span>Cần ưu tiên</span>
                <strong>{summary.needSupportCount}</strong>
                <em>học viên cần được kèm sát hơn</em>
              </article>
            </div>
          </section>

          <section className="parentToolbar panel">
            <label className="field parentSearchField">
              <span>Tìm học viên</span>
              <div className="parentSearchInput">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tên, email, mục tiêu hoặc cấp độ"
                />
              </div>
            </label>

            <div className="parentToolbarRow">
              <div className="parentFilterGroup" role="tablist" aria-label="Lọc học viên">
                {filterOptions.map((option) => {
                  const active = filterKey === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`studentFilterButton ${active ? 'active' : ''}`}
                      onClick={() => setFilterKey(option.key)}
                      aria-pressed={active}
                    >
                      <Filter size={14} />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="parentSortGroup" role="listbox" aria-label="Sắp xếp học viên">
                {sortOptions.map((option) => {
                  const active = sortKey === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`studentSortButton ${active ? 'active' : ''}`}
                      onClick={() => setSortKey(option.key)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <span className="inlineBadge">
                <BarChart3 size={14} />
                {visibleStudents.length}/{summary.totalStudents} học viên hiển thị
              </span>
            </div>
          </section>

          <section className="studentWatchList parentStudentList">
            {visibleStudents.map((student) => {
              const supportBand = getSupportBand(student);
              const supportLabel = getSupportLabel(student);
              const supportTone = supportBand === 'needs-support' ? 'needs-support' : supportBand === 'steady' ? 'steady' : 'watch';
              const progressValue = Math.min(100, Math.max(0, Number(student.averageProgress ?? 0)));
              const initials = student.fullName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('');

              return (
                <article className={`studentWatchCard parentStudentCard ${supportTone}`} key={student.id}>
                  <div className="parentStudentIdentity">
                    <div className="parentAvatar">{initials || 'HV'}</div>
                    <div>
                      <strong>{student.fullName}</strong>
                      <span>{student.email}</span>
                      <em>{student.learningGoal ?? 'Chưa cập nhật mục tiêu học tập'}</em>
                    </div>
                  </div>

                  <div
                    className="studentProgressMini"
                    style={{ '--student-progress': `${progressValue}%` } as CSSProperties}
                    aria-label={`Tiến độ của ${student.fullName}`}
                  >
                    <span>{progressValue}%</span>
                    <small>tiến độ</small>
                  </div>

                  <div className="studentWatchStats parentStudentStats">
                    <span>{student.currentLevel ?? 'Chưa rõ cấp độ'}</span>
                    <span>{student.completedLessons} bài hoàn thành</span>
                    <span>{student.activeLessons} bài đang học</span>
                    <span>{student.lockedLessons} bài bị khóa</span>
                  </div>

                  <div className="parentStudentActions">
                    <span className={`studentCareTag ${supportTone}`}>
                      {supportBand === 'needs-support' ? <ShieldAlert size={14} /> : <Sparkles size={14} />}
                      {supportLabel}
                    </span>
                    <span className="studentPointTag">
                      <Target size={14} />
                      {student.totalPoints} điểm
                    </span>
                    <Link className="secondaryButton" href={`/progress?studentId=${student.id}`}>
                      Xem tiến trình
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}

            {!visibleStudents.length && !loading ? (
              <div className="emptyState">
                <GraduationCap size={28} />
                <h2>Không tìm thấy học viên phù hợp.</h2>
                <p>Thử đổi từ khóa tìm kiếm hoặc mở lại bộ lọc để xem toàn bộ học viên đã liên kết.</p>
              </div>
            ) : null}
          </section>
        </>
      )}
    </AppShell>
  );
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatRecentDate(value: string | null | undefined) {
  if (!value) return 'chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'chưa có';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatSupportStatus(status: string) {
  const labels: Record<string, string> = {
    ChuaXem: 'Chưa xem',
    DaXem: 'Đã xem',
    HoanThanh: 'Hoàn tất',
  };

  return labels[status] ?? status;
}

function isStudentNeedingSupport(student: LinkedStudent) {
  return student.averageProgress < 55 || student.lockedLessons > Math.max(1, student.activeLessons);
}

function getSupportBand(student: LinkedStudent): StudentSupportBand {
  if (isStudentNeedingSupport(student)) {
    return 'needs-support';
  }

  if (student.averageProgress >= 80 || student.learningStreak >= 7) {
    return 'steady';
  }

  return 'watch';
}

function getSupportLabel(student: LinkedStudent) {
  const band = getSupportBand(student);

  switch (band) {
    case 'needs-support':
      return 'Cần hỗ trợ';
    case 'steady':
      return 'Ổn định';
    default:
      return 'Nên theo dõi';
  }
}
