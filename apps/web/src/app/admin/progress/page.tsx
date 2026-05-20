'use client';

import {
  Activity,
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock3,
  Filter,
  Gamepad2,
  Image,
  MessageSquareWarning,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../../components/app-shell';
import { apiGet, apiPost } from '../../../lib/api';
import { getStoredSession, type WebAuthSession } from '../../../lib/session';

type AdminLearningStudent = {
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
  totalLessons: number;
  averageProgress: number;
  attemptsCount: number;
  passedAttemptsCount: number;
  bestQuizScore: number;
  latestAttemptAt: string | null;
  linkedParentsCount: number;
};

type AdminLearningLog = {
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

type AdminLearningAlert = {
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

type AdminLearningResponse = {
  students: AdminLearningStudent[];
  logs: AdminLearningLog[];
  alerts: AdminLearningAlert[];
};

const progressBandFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'needs-support', label: 'Cần hỗ trợ' },
  { key: 'watch', label: 'Theo dõi' },
  { key: 'steady', label: 'Ổn định' },
] as const;

const auditFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'BaiHoc', label: 'Bài học' },
  { key: 'Quiz', label: 'Quiz / thi thử' },
  { key: 'TroChoi', label: 'Game' },
  { key: 'AI', label: 'AI Vision' },
  { key: 'CanhBao', label: 'Cảnh báo' },
  { key: 'ThongBao', label: 'Thông báo' },
] as const;

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatDate(value: string | null) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getProgressBand(student: AdminLearningStudent) {
  if (student.averageProgress < 45 || student.lockedLessons >= 3 || student.bestQuizScore < 80) {
    return 'needs-support';
  }

  if (student.averageProgress < 75 || student.learningStreak < 5) {
    return 'watch';
  }

  return 'steady';
}

function getProgressBandLabel(band: (typeof progressBandFilters)[number]['key']) {
  return progressBandFilters.find((item) => item.key === band)?.label ?? 'Tất cả';
}

function getAuditGroupLabel(group: string) {
  return auditFilters.find((item) => item.key === group)?.label ?? group;
}

function getPriorityLabel(priority: number) {
  if (priority <= 1) return 'Khẩn cấp';
  if (priority === 2) return 'Ưu tiên';
  return 'Theo dõi';
}

function getLogIcon(group: string) {
  if (group === 'Quiz') return CheckCircle2;
  if (group === 'TroChoi') return Gamepad2;
  if (group === 'AI') return Image;
  if (group === 'CanhBao') return ShieldAlert;
  if (group === 'ThongBao') return Bell;
  if (group === 'BaiHoc') return BookOpen;
  return Activity;
}

export default function AdminLearningDataPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [students, setStudents] = useState<AdminLearningStudent[]>([]);
  const [logs, setLogs] = useState<AdminLearningLog[]>([]);
  const [alerts, setAlerts] = useState<AdminLearningAlert[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [search, setSearch] = useState('');
  const [bandFilter, setBandFilter] = useState<(typeof progressBandFilters)[number]['key']>('all');
  const [auditFilter, setAuditFilter] = useState<(typeof auditFilters)[number]['key']>('all');
  const [supportFeedback, setSupportFeedback] = useState('');
  const [supportPriority, setSupportPriority] = useState(1);
  const [supportBusy, setSupportBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace('/login');
      return;
    }

    if (!storedSession.user.roles.includes(USER_ROLES.ADMIN)) {
      router.replace('/dashboard');
      return;
    }

    setSession(storedSession);
  }, [router]);

  async function loadLearningData(currentSession = session) {
    if (!currentSession) return;

    setLoading(true);
    setError('');
    try {
      const response = await apiGet<AdminLearningResponse>(
        '/progress/teacher/learning-control',
        currentSession.accessToken,
      );
      setStudents(response.students);
      setLogs(response.logs);
      setAlerts(response.alerts);
      setSelectedStudentId((current) => current || response.students[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu học tập.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadLearningData(session);
  }, [session]);

  const summary = useMemo(() => {
    const totalStudents = students.length;
    const needsSupport = students.filter((student) => getProgressBand(student) === 'needs-support').length;
    const watching = students.filter((student) => getProgressBand(student) === 'watch').length;
    const steady = students.filter((student) => getProgressBand(student) === 'steady').length;
    const averageProgress = totalStudents
      ? Math.round(students.reduce((sum, student) => sum + Number(student.averageProgress ?? 0), 0) / totalStudents)
      : 0;
    const quizAttempts = students.reduce((sum, student) => sum + Number(student.attemptsCount ?? 0), 0);
    const passedAttempts = students.reduce((sum, student) => sum + Number(student.passedAttemptsCount ?? 0), 0);
    const passRate = quizAttempts ? Math.round((passedAttempts / quizAttempts) * 100) : 0;
    const totalLockedLessons = students.reduce((sum, student) => sum + Number(student.lockedLessons ?? 0), 0);

    return {
      totalStudents,
      needsSupport,
      watching,
      steady,
      averageProgress,
      quizAttempts,
      passRate,
      totalLockedLessons,
      alerts: alerts.length,
      logs: logs.length,
    };
  }, [alerts.length, logs.length, students]);

  const visibleStudents = useMemo(() => {
    const keyword = normalizeText(search);
    return students.filter((student) => {
      const band = getProgressBand(student);
      const matchesBand = bandFilter === 'all' || band === bandFilter;
      const searchable = normalizeText(
        `${student.fullName} ${student.email} ${student.currentLevel ?? ''} ${student.learningGoal ?? ''}`,
      );
      return matchesBand && (!keyword || searchable.includes(keyword));
    });
  }, [bandFilter, search, students]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? visibleStudents[0] ?? null,
    [selectedStudentId, students, visibleStudents],
  );

  const selectedAlerts = useMemo(
    () =>
      alerts
        .filter((alert) => !selectedStudent?.id || alert.studentId === selectedStudent.id)
        .sort((left, right) => left.priority - right.priority || Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [alerts, selectedStudent?.id],
  );

  const visibleLogs = useMemo(
    () =>
      logs.filter((log) => {
        const matchesStudent = !selectedStudent?.id || log.studentId === selectedStudent.id;
        const matchesType = auditFilter === 'all' || log.eventGroup === auditFilter;
        return matchesStudent && matchesType;
      }),
    [auditFilter, logs, selectedStudent?.id],
  );

  async function handleCreateSupport() {
    if (!session || !selectedStudent || !supportFeedback.trim()) return;

    setSupportBusy(true);
    setMessage('');
    try {
      await apiPost(
        `/users/students/${selectedStudent.id}/support`,
        {
          title: 'Cảnh báo học tập từ quản trị viên',
          feedback: supportFeedback.trim(),
          priority: supportPriority,
        },
        session.accessToken,
      );
      setSupportFeedback('');
      setMessage('Đã ghi cảnh báo vào audit và gửi nhắc nhở cho học viên.');
      await loadLearningData(session);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không ghi được cảnh báo.');
    } finally {
      setSupportBusy(false);
    }
  }

  if (!session) {
    return null;
  }

  return (
    <AppShell
      session={session}
      active="progress"
      roleContext={USER_ROLES.ADMIN}
      showSidebar={false}
      eyebrow="Quản trị viên"
      title="Giám sát dữ liệu học tập"
    >
      <section className="teacherAuditHero">
        <div>
          <p className="eyebrow">UC3 • Giám sát dữ liệu học tập</p>
          <h2>Quan sát tiến độ TOEIC, kết quả quiz, audit và cảnh báo theo từng học viên.</h2>
          <p>
            Admin dùng màn này để nhìn dữ liệu học tập toàn hệ thống: ai đang tiến bộ, ai bị kẹt,
            quiz nào dưới chuẩn, hoạt động nào vừa xảy ra và khi nào cần ghi cảnh báo để giáo viên
            hoặc phụ huynh can thiệp.
          </p>
        </div>
        <Link className="secondaryButton" href="/dashboard">
          Về dashboard
        </Link>
      </section>

      <section className="teacherAuditMetrics" aria-label="Chỉ số dữ liệu học tập">
        <div>
          <Users size={20} />
          <span>Học viên</span>
          <strong>{summary.totalStudents}</strong>
        </div>
        <div>
          <UserX size={20} />
          <span>Cần hỗ trợ</span>
          <strong>{summary.needsSupport}</strong>
        </div>
        <div>
          <TrendingUp size={20} />
          <span>Tiến độ TB</span>
          <strong>{summary.averageProgress}%</strong>
        </div>
        <div>
          <CheckCircle2 size={20} />
          <span>Tỉ lệ đạt quiz</span>
          <strong>{summary.passRate}%</strong>
        </div>
        <div>
          <ShieldAlert size={20} />
          <span>Cảnh báo</span>
          <strong>{summary.alerts}</strong>
        </div>
        <div>
          <Activity size={20} />
          <span>Audit log</span>
          <strong>{summary.logs}</strong>
        </div>
      </section>

      <section className="teacherAuditCommand" aria-label="Bộ lọc giám sát">
        <div>
          <label className="field">
            <span>Tìm học viên</span>
            <span className="teacherAuditSearch">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tên, email, cấp độ hoặc mục tiêu TOEIC"
              />
            </span>
          </label>
        </div>

        <div className="teacherAuditFilterRows">
          <div className="teacherAuditFilterRow" aria-label="Lọc nhóm tiến độ">
            {progressBandFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={bandFilter === filter.key ? 'active' : ''}
                onClick={() => setBandFilter(filter.key)}
              >
                {filter.key === 'all' ? <Filter size={14} /> : null}
                {filter.key === 'needs-support' ? <UserX size={14} /> : null}
                {filter.key === 'watch' ? <Clock3 size={14} /> : null}
                {filter.key === 'steady' ? <UserCheck size={14} /> : null}
                {filter.label}
              </button>
            ))}
          </div>
          <div className="teacherAuditFilterRow" aria-label="Lọc loại audit">
            {auditFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={auditFilter === filter.key ? 'active' : ''}
                onClick={() => setAuditFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
            <button type="button" onClick={() => loadLearningData()} disabled={loading}>
              <RefreshCw size={14} />
              {loading ? 'Đang tải' : 'Làm mới'}
            </button>
          </div>
        </div>
      </section>

      {error ? <div className="subtleBox">{error}</div> : null}

      <section className="teacherAuditRoster" aria-label="Danh sách học viên">
        <div className="sectionTitle">
          <div>
            <h2>Học viên cần giám sát</h2>
            <span>
              {visibleStudents.length}/{students.length} học viên theo bộ lọc hiện tại
            </span>
          </div>
          <span className="inlineBadge">
            <Target size={16} />
            {getProgressBandLabel(bandFilter)}
          </span>
        </div>

        <div className="teacherAuditStudentGrid">
          {visibleStudents.map((student) => {
            const active = selectedStudent?.id === student.id;
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
                  <div className="progressFill" style={{ width: `${Math.max(0, Math.min(100, student.averageProgress))}%` }} />
                </div>
                <div className="teacherAuditFacts">
                  <span>{student.currentLevel ?? 'Chưa rõ cấp độ'}</span>
                  <span>{student.averageProgress}% tiến độ</span>
                  <span>{student.bestQuizScore}% quiz tốt nhất</span>
                  <span>{student.lockedLessons} bài khóa</span>
                  <span>{student.learningStreak} ngày streak</span>
                </div>
              </button>
            );
          })}

          {!visibleStudents.length && !loading ? (
            <div className="emptyState">
              <ShieldAlert size={28} />
              <h2>Không có học viên phù hợp.</h2>
              <p>Đổi bộ lọc hoặc từ khóa để tiếp tục giám sát.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="teacherAuditWorkspace" aria-label="Audit và cảnh báo học tập">
        <div className="teacherAuditTimeline">
          <div className="sectionTitle">
            <div>
              <h2>Audit timeline</h2>
              <span>
                {selectedStudent ? selectedStudent.fullName : 'Chưa chọn học viên'} • {visibleLogs.length} log
              </span>
            </div>
            {selectedStudent ? (
              <span className="inlineBadge">
                <Award size={16} />
                {selectedStudent.totalPoints} XP
              </span>
            ) : null}
          </div>

          {visibleLogs.slice(0, 80).map((log) => {
            const Icon = getLogIcon(log.eventGroup);
            return (
              <article className={`teacherAuditLog tone-${log.eventGroup}`} key={`${log.eventGroup}:${log.id}`}>
                <span className="teacherAuditLogIcon">
                  <Icon size={20} />
                </span>
                <div className="teacherAuditLogBody">
                  <div className="teacherAuditLogHead">
                    <div>
                      <span>{getAuditGroupLabel(log.eventGroup)}</span>
                      <strong>{log.title}</strong>
                    </div>
                    <time>{formatDate(log.occurredAt)}</time>
                  </div>
                  <p>{log.description}</p>
                  <div className="teacherAuditLogMeta">
                    <span>{log.status}</span>
                    {typeof log.progress === 'number' ? <span>{Math.round(log.progress)}% hoàn thành</span> : null}
                    {typeof log.score === 'number' ? <span>Điểm {Math.round(log.score)}</span> : null}
                    <span>{log.studentName}</span>
                  </div>
                </div>
              </article>
            );
          })}

          {!visibleLogs.length && !loading ? (
            <div className="subtleBox">Chưa có log phù hợp với học viên và bộ lọc hiện tại.</div>
          ) : null}
        </div>

        <aside className="teacherAuditSide">
          <section className="panel">
            <div className="sectionTitle">
              <div>
                <h2>Cảnh báo ưu tiên</h2>
                <span>Quiz thấp, bài khóa hoặc tiến độ yếu</span>
              </div>
            </div>
            <div className="teacherAuditAlertList">
              {selectedAlerts.slice(0, 8).map((alert) => (
                <article key={alert.id}>
                  <strong>{alert.studentName}</strong>
                  <span>{alert.reason}</span>
                  <em>
                    {getPriorityLabel(alert.priority)} • {alert.lessonTitle ?? 'Chưa gắn bài'} •{' '}
                    {Math.round(alert.lessonProgress)}%
                  </em>
                </article>
              ))}
              {!selectedAlerts.length ? <div className="subtleBox">Chưa có cảnh báo đang mở.</div> : null}
            </div>
          </section>

          <section className="panel teacherAuditActionBox">
            <div className="sectionTitle">
              <div>
                <h2>Ghi nhắc nhở</h2>
                <span>Gửi cảnh báo học tập và lưu vào audit</span>
              </div>
            </div>
            <label className="field">
              <span>Học viên</span>
              <select
                value={selectedStudent?.id ?? ''}
                onChange={(event) => setSelectedStudentId(event.target.value)}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
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
              <span>Nội dung</span>
              <textarea
                value={supportFeedback}
                onChange={(event) => setSupportFeedback(event.target.value)}
                rows={5}
                placeholder="Ví dụ: Ôn lại Part 5 về thì hiện tại hoàn thành và làm lại 20 câu trước thứ Sáu."
              />
            </label>
            <button
              className="primaryButton"
              type="button"
              onClick={handleCreateSupport}
              disabled={supportBusy || !selectedStudent || supportFeedback.trim().length < 10}
            >
              <MessageSquareWarning size={18} />
              {supportBusy ? 'Đang ghi...' : 'Ghi cảnh báo'}
            </button>
            {message ? (
              <div className="subtleBox">
                <Sparkles size={14} />
                {message}
              </div>
            ) : null}
          </section>
        </aside>
      </section>
    </AppShell>
  );
}
