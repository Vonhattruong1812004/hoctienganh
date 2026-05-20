'use client';

import {
  ArrowRight,
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Filter,
  Gamepad2,
  GraduationCap,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../../components/app-shell';
import { ApiError, apiGet } from '../../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../lib/session';

type ParentAuditStudent = {
  id: string;
  fullName: string;
  email: string;
  currentLevel: string | null;
  learningGoal: string | null;
  totalPoints: number | null;
  learningStreak: number | null;
  completedLessons: number;
  activeLessons: number;
  averageProgress: number;
};

type ParentAuditLog = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  eventType: string;
  eventGroup: string;
  title: string;
  description: string;
  targetType: string | null;
  targetId: string | null;
  status: string;
  progress: number | null;
  score: number | null;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
};

type ParentAuditResponse = {
  students: ParentAuditStudent[];
  logs: ParentAuditLog[];
};

const groupFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'BaiHoc', label: 'Bài học' },
  { key: 'NhiemVu', label: 'Nhiệm vụ' },
  { key: 'Quiz', label: 'Quiz' },
  { key: 'TroChoi', label: 'Game' },
  { key: 'AI', label: 'AI Vision' },
  { key: 'CanhBao', label: 'Cảnh báo' },
  { key: 'ThongBao', label: 'Thông báo' },
] as const;

export default function ParentAuditPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [data, setData] = useState<ParentAuditResponse>({ students: [], logs: [] });
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
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
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;
    async function loadAudit() {
      try {
        const response = await apiGet<ParentAuditResponse>('/parents/me/learning-audit', currentSession.accessToken);
        if (!active) return;
        setData(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được hồ sơ học tập của con.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAudit();
    return () => {
      active = false;
    };
  }, [router, session]);

  const mainLogs = useMemo(() => data.logs.filter(isMeaningfulParentAuditLog), [data.logs]);

  const filteredLogs = useMemo(() => {
    return mainLogs.filter((log) => {
      const matchesStudent = selectedStudent === 'all' || log.studentId === selectedStudent;
      const matchesGroup = selectedGroup === 'all' || log.eventGroup === selectedGroup;
      return matchesStudent && matchesGroup;
    });
  }, [mainLogs, selectedGroup, selectedStudent]);

  const summary = useMemo(() => {
    const todayKey = new Date().toDateString();
    const todayLogs = mainLogs.filter((log) => new Date(log.occurredAt).toDateString() === todayKey).length;
    const quizLogs = mainLogs.filter((log) => log.eventGroup === 'Quiz').length;
    const warningLogs = mainLogs.filter((log) => log.eventGroup === 'CanhBao' || log.status === 'KhongDat').length;
    const gameAndAiLogs = mainLogs.filter((log) => ['TroChoi', 'AI'].includes(log.eventGroup)).length;

    return {
      students: data.students.length,
      totalLogs: mainLogs.length,
      todayLogs,
      quizLogs,
      warningLogs,
      gameAndAiLogs,
    };
  }, [mainLogs, data.students.length]);

  const groupedLogs = useMemo(() => {
    return filteredLogs.reduce<Array<{ day: string; logs: ParentAuditLog[] }>>((groups, log) => {
      const day = formatAuditDay(log.occurredAt);
      const current = groups.find((group) => group.day === day);
      if (current) {
        current.logs.push(log);
      } else {
        groups.push({ day, logs: [log] });
      }
      return groups;
    }, []);
  }, [filteredLogs]);

  const attentionItems = useMemo(() => {
    const lowQuiz = mainLogs
      .filter((log) => log.eventGroup === 'Quiz' && Number(log.progress ?? 100) < 80)
      .slice(0, 3);
    const warnings = mainLogs.filter((log) => log.eventGroup === 'CanhBao').slice(0, 3);
    const inactiveStudents = data.students.filter(
      (student) => !mainLogs.some((log) => log.studentId === student.id),
    );

    return { lowQuiz, warnings, inactiveStudents };
  }, [mainLogs, data.students]);

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở hồ sơ học tập...</p>
      </main>
    );
  }

  return (
    <AppShell
      session={session}
      active="parentAudit"
      roleContext={USER_ROLES.PARENT}
      showSidebar={false}
      eyebrow="Phụ huynh"
      title="Hồ sơ học tập"
    >
      <section className="parentAuditHero">
        <div>
          <p className="eyebrow">Nhật ký học tập</p>
          <h2>Theo dõi toàn bộ hoạt động quan trọng của con.</h2>
          <p>Bài học, nhiệm vụ, quiz, game, AI Vision, cảnh báo và thông báo được sắp theo thời gian.</p>
        </div>
        <Link className="secondaryButton" href="/dashboard">
          Về dashboard
          <ArrowRight size={16} />
        </Link>
      </section>

      <section className="parentAuditStats" aria-label="Tóm tắt hồ sơ học tập">
        <div>
          <Users size={18} />
          <span>Học viên liên kết</span>
          <strong>{summary.students}</strong>
        </div>
        <div>
          <ClipboardList size={18} />
          <span>Hoạt động</span>
          <strong>{summary.totalLogs}</strong>
        </div>
        <div>
          <CalendarClock size={18} />
          <span>Hôm nay</span>
          <strong>{summary.todayLogs}</strong>
        </div>
        <div>
          <CheckCircle2 size={18} />
          <span>Quiz</span>
          <strong>{summary.quizLogs}</strong>
        </div>
        <div>
          <Sparkles size={18} />
          <span>Game / AI</span>
          <strong>{summary.gameAndAiLogs}</strong>
        </div>
        <div>
          <ShieldAlert size={18} />
          <span>Cần chú ý</span>
          <strong>{summary.warningLogs}</strong>
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải audit log học tập...</div> : null}

      <section className="parentAuditFilters panel" aria-label="Bộ lọc hồ sơ học tập">
        <div className="sectionTitle">
          <div>
            <h2>Bộ lọc</h2>
            <span>Chọn học viên và nhóm hoạt động.</span>
          </div>
          <Filter size={20} />
        </div>

        <div className="parentAuditFilterRows">
          <div className="parentAuditFilterRow" aria-label="Lọc theo học viên">
            <button
              className={selectedStudent === 'all' ? 'active' : ''}
              type="button"
              onClick={() => setSelectedStudent('all')}
            >
              Tất cả học viên
            </button>
            {data.students.map((student) => (
              <button
                className={selectedStudent === student.id ? 'active' : ''}
                key={student.id}
                type="button"
                onClick={() => setSelectedStudent(student.id)}
              >
                {student.fullName}
              </button>
            ))}
          </div>

          <div className="parentAuditFilterRow" aria-label="Lọc theo nhóm hành động">
            {groupFilters.map((filter) => (
              <button
                className={selectedGroup === filter.key ? 'active' : ''}
                key={filter.key}
                type="button"
                onClick={() => setSelectedGroup(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="parentAuditLayout">
        <section className="parentAuditTimeline panel" aria-label="Timeline hoạt động học tập">
          <div className="sectionTitle">
            <div>
              <h2>Lịch sử học tập</h2>
              <span>
                {filteredLogs.length}/{mainLogs.length} hoạt động
              </span>
            </div>
          </div>

          {groupedLogs.map((group) => (
            <div className="parentAuditDayGroup" key={group.day}>
              <div className="parentAuditDay">{group.day}</div>
              {group.logs.map((log) => (
                <article className={`parentAuditLog tone-${log.eventGroup}`} key={`${log.eventGroup}:${log.id}`}>
                  <div className="parentAuditIcon">{renderAuditIcon(log.eventGroup)}</div>
                  <div className="parentAuditLogBody">
                    <div className="parentAuditLogHead">
                      <div>
                        <span>{data.students.length > 1 ? log.studentName : formatAuditGroup(log.eventGroup)}</span>
                        <strong>{formatAuditTitle(log)}</strong>
                      </div>
                      <time dateTime={log.occurredAt}>{formatAuditDate(log.occurredAt)}</time>
                    </div>
                    <p>{formatAuditDescription(log)}</p>
                    <div className="parentAuditLogMeta">
                      {data.students.length > 1 ? <span>{formatAuditGroup(log.eventGroup)}</span> : null}
                      <span>{formatAuditStatus(log.status)}</span>
                      {renderAuditMetric(log)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ))}

          {!filteredLogs.length && !loading ? (
            <div className="subtleBox">
              Chưa có hoạt động phù hợp với bộ lọc hiện tại.
            </div>
          ) : null}
        </section>

        <aside className="parentAuditAside" aria-label="Điểm cần phụ huynh chú ý">
          <section className="panel">
            <div className="sectionTitle">
              <div>
                <h2>Cần chú ý</h2>
                <span>Quiz thấp, cảnh báo và tài khoản chưa phát sinh học tập.</span>
              </div>
              <Target size={20} />
            </div>

            <div className="parentAuditAttentionList">
              {attentionItems.lowQuiz.map((log) => (
                <article key={`low:${log.id}`}>
                  <strong>{formatAuditTitle(log)}</strong>
                  {data.students.length > 1 ? <span>{log.studentName}</span> : null}
                  <em>Quiz dưới 80%: {Math.round(Number(log.progress ?? 0))}%</em>
                </article>
              ))}

              {attentionItems.warnings.map((log) => (
                <article key={`warning:${log.id}`}>
                  <strong>{formatAuditTitle(log)}</strong>
                  {data.students.length > 1 ? <span>{log.studentName}</span> : null}
                  <em>{formatAuditDescription(log)}</em>
                </article>
              ))}

              {attentionItems.inactiveStudents.map((student) => (
                <article key={`inactive:${student.id}`}>
                  <strong>{student.fullName}</strong>
                  <span>Chưa có log học tập</span>
                  <em>Cần kiểm tra tài khoản hoặc nhắc con bắt đầu học.</em>
                </article>
              ))}

              {!attentionItems.lowQuiz.length &&
              !attentionItems.warnings.length &&
              !attentionItems.inactiveStudents.length ? (
                <div className="subtleBox">Không có cảnh báo nổi bật. Hồ sơ học tập đang ổn định.</div>
              ) : null}
            </div>
          </section>

          <section className="panel">
            <div className="sectionTitle">
              <div>
                <h2>Hồ sơ con</h2>
                <span>Tóm tắt nhanh.</span>
              </div>
              <GraduationCap size={20} />
            </div>

            <div className="parentAuditStudentCards">
              {data.students.map((student) => (
                <article key={student.id}>
                  <strong>{student.fullName}</strong>
                  <div>
                    <em>{student.currentLevel ?? 'A1'}</em>
                    <em>{student.averageProgress}% tiến độ</em>
                    <em>{student.learningStreak ?? 0} ngày</em>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function renderAuditIcon(group: string) {
  switch (group) {
    case 'BaiHoc':
      return <BookOpen size={20} />;
    case 'NhiemVu':
    case 'NhiemVuNgay':
      return <ClipboardList size={20} />;
    case 'Quiz':
      return <CheckCircle2 size={20} />;
    case 'TroChoi':
      return <Gamepad2 size={20} />;
    case 'AI':
      return <BrainCircuit size={20} />;
    case 'CanhBao':
      return <ShieldAlert size={20} />;
    case 'ThongBao':
      return <Bell size={20} />;
    default:
      return <ScanSearch size={20} />;
  }
}

function isMeaningfulParentAuditLog(log: ParentAuditLog) {
  if (log.eventGroup === 'HeThong') return false;
  if (log.eventGroup === 'BaiHoc' && ['BiKhoa', 'ChuaHoc'].includes(log.status)) return false;
  if (log.eventGroup === 'NhiemVuNgay' && log.status === 'DangLam' && Number(log.progress ?? 0) < 100) return false;
  return true;
}

function renderAuditMetric(log: ParentAuditLog) {
  if (log.eventGroup === 'AI' && typeof log.progress === 'number') {
    return <span>{Math.round(log.progress)}% tin cậy</span>;
  }

  if (['BaiHoc', 'NhiemVu', 'NhiemVuNgay'].includes(log.eventGroup) && typeof log.progress === 'number') {
    return <span>{Math.round(log.progress)}% hoàn thành</span>;
  }

  if (['Quiz', 'TroChoi'].includes(log.eventGroup) && typeof log.score === 'number') {
    return <span>Điểm {Math.round(log.score)}</span>;
  }

  return null;
}

function formatAuditTitle(log: ParentAuditLog) {
  return log.title
    .replace(/^Cập nhật bài học:\s*/i, '')
    .replace(/^Hoàn thành nhiệm vụ:\s*/i, '')
    .replace(/^Làm quiz:\s*/i, '')
    .replace(/^Chơi mini game:\s*/i, '')
    .replace(/^AI nhận diện ảnh:\s*/i, 'Nhận diện ảnh: ')
    .replace(/^Gợi ý ôn tập:\s*/i, 'Cần ôn: ');
}

function formatAuditDescription(log: ParentAuditLog) {
  if (log.eventGroup === 'BaiHoc') {
    const progress = typeof log.progress === 'number' ? `${Math.round(log.progress)}%` : '--';
    return `${formatAuditStatus(log.status)} · ${progress}`;
  }

  if (log.eventGroup === 'Quiz') {
    return log.description
      .replace(/^Lần\s+/i, 'Lần làm ')
      .replace(/, đạt\s+/i, ' · ')
      .replace(/\.$/, '');
  }

  if (log.eventGroup === 'TroChoi') {
    return log.description
      .replace(/trạng thái\s+\w+/i, formatAuditStatus(log.status).toLowerCase())
      .replace(/\.$/, '');
  }

  if (log.eventGroup === 'AI') {
    return log.description
      .replace(/^Từ vựng\s+/i, '')
      .replace(/, độ tin cậy\s+/i, ' · ')
      .replace(/\.$/, '');
  }

  return log.description;
}

function formatAuditGroup(group: string) {
  const labels: Record<string, string> = {
    BaiHoc: 'Bài học',
    NhiemVu: 'Nhiệm vụ học tập',
    NhiemVuNgay: 'Nhiệm vụ ngày',
    Quiz: 'Quiz',
    TroChoi: 'Mini game',
    AI: 'AI Vision',
    CanhBao: 'Cảnh báo',
    ThongBao: 'Thông báo',
    HeThong: 'Hệ thống',
  };

  return labels[group] ?? group;
}

function formatAuditStatus(status: string) {
  const labels: Record<string, string> = {
    ChuaHoc: 'Chưa học',
    DangHoc: 'Đang học',
    HoanThanh: 'Hoàn thành',
    DangLam: 'Đang làm',
    DaNop: 'Đã nộp',
    Dat: 'Đạt',
    KhongDat: 'Chưa đạt',
    DatKyLuc: 'Đạt kỷ lục',
    DaGhiNhan: 'Đã ghi nhận',
    ChuaXem: 'Chưa xem',
    DaXem: 'Đã xem',
    ChuaDoc: 'Chưa đọc',
    DaDoc: 'Đã đọc',
    BiKhoa: 'Bị khóa',
    NeedsHint: 'Cần gợi ý',
    DemoVision: 'Demo Vision',
  };

  return labels[status] ?? status;
}

function formatAuditDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function formatAuditDay(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}
