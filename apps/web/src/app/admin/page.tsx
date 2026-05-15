'use client';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  FileText,
  Gauge,
  RefreshCcw,
  ScrollText,
  ServerCog,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  ToggleRight,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../components/app-shell';
import { ApiError, apiGet, apiPost } from '../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../lib/session';

type SystemSummary = {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  totalPaths: number;
  publishedPaths: number;
  totalLessons: number;
  publishedLessons: number;
  totalQuizzes: number;
  publishedQuizzes: number;
  operationalScore: number;
};

type SystemConfig = {
  key: string;
  label: string;
  value: string;
  status: string;
  owner: string;
  description: string;
};

type ServiceCheck = {
  key: string;
  label: string;
  status: string;
  detail: string;
  severity: 'success' | 'warning' | 'info';
};

type SystemRisk = {
  key: string;
  title: string;
  value: number;
  level: 'success' | 'warning' | 'info';
  recommendation: string;
};

type AuditLog = {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  description: string | null;
  createdAt: string;
};

type SystemOverview = {
  generatedAt: string;
  summary: SystemSummary;
  configs: SystemConfig[];
  checks: ServiceCheck[];
  risks: SystemRisk[];
  logs: AuditLog[];
};

type MetricCard = {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: number | string;
  note: string;
};

const fallbackOverview: SystemOverview = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalUsers: 142,
    activeUsers: 136,
    lockedUsers: 6,
    totalPaths: 18,
    publishedPaths: 14,
    totalLessons: 126,
    publishedLessons: 102,
    totalQuizzes: 42,
    publishedQuizzes: 31,
    operationalScore: 81,
  },
  configs: [
    {
      key: 'learning-gate',
      label: 'Điều kiện mở khóa bài học',
      value: '80%',
      status: 'Đang áp dụng',
      owner: 'Học thuật',
      description: 'Học viên cần đạt ngưỡng điểm yêu cầu để mở bài tiếp theo.',
    },
    {
      key: 'content-publishing',
      label: 'Công bố nội dung học tập',
      value: '81%',
      status: 'Ổn định',
      owner: 'Nội dung',
      description: 'Bài học, lộ trình và quiz được kiểm soát trước khi mở cho học viên.',
    },
    {
      key: 'ai-vision',
      label: 'AI nhận diện hình ảnh',
      value: 'Mô phỏng nội bộ',
      status: 'Chế độ demo',
      owner: 'AI Learning',
      description: 'Sẵn sàng mở rộng sang AI thật khi cấu hình khóa API.',
    },
  ],
  checks: [
    {
      key: 'api',
      label: 'API backend',
      status: 'OK',
      detail: 'NestJS API phản hồi và kết nối được cơ sở dữ liệu.',
      severity: 'success',
    },
    {
      key: 'database',
      label: 'PostgreSQL',
      status: 'OK',
      detail: 'Dữ liệu lõi đã sẵn sàng cho kiểm thử.',
      severity: 'success',
    },
    {
      key: 'content',
      label: 'Độ sẵn sàng nội dung',
      status: '81%',
      detail: 'Một số bài học và quiz nháp cần được rà soát.',
      severity: 'warning',
    },
  ],
  risks: [
    {
      key: 'support-students',
      title: 'Học viên cần hỗ trợ',
      value: 5,
      level: 'warning',
      recommendation: 'Ưu tiên giáo viên gửi gợi ý hỗ trợ.',
    },
    {
      key: 'draft-content',
      title: 'Nội dung chưa công bố',
      value: 24,
      level: 'info',
      recommendation: 'Kiểm tra bài nháp trước khi mở cho học viên.',
    },
  ],
  logs: [
    {
      id: 'demo-log-1',
      actorName: 'Quản trị viên demo',
      actorEmail: 'admin@englishpro.local',
      action: 'KIEM_TRA_HE_THONG',
      targetType: 'HeThong',
      description: 'Kiểm tra sức khỏe hệ thống và dữ liệu cấu hình.',
      createdAt: new Date().toISOString(),
    },
  ],
};

function formatDate(value: string | Date | null | undefined) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    KIEM_TRA_HE_THONG: 'Kiểm tra hệ thống',
    CAP_NHAT_CAU_HINH: 'Cập nhật cấu hình',
    TAO_CHECKPOINT: 'Tạo checkpoint',
    XEM_NHAT_KY: 'Xem nhật ký',
    TAO_LO_TRINH: 'Tạo lộ trình',
    LAM_BAI_KIEM_TRA: 'Làm bài kiểm tra',
    THEO_DOI_HOC_VIEN: 'Theo dõi học viên',
  };

  return labels[action] ?? action.replaceAll('_', ' ').toLowerCase();
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('ok') || normalized.includes('tốt') || normalized.includes('ổn')) return 'success';
  if (normalized.includes('cần') || normalized.includes('theo') || normalized.includes('demo')) return 'warning';
  return 'info';
}

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dataMode, setDataMode] = useState<'live' | 'demo'>('live');

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

  async function loadOverview(currentSession: WebAuthSession) {
    setLoading(true);
    try {
      const response = await apiGet<SystemOverview>('/admin/system', currentSession.accessToken);
      setOverview(response);
      setDataMode('live');
      setError('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }

      if (err instanceof ApiError && err.status === 0) {
        setOverview(fallbackOverview);
        setDataMode('demo');
        setError('');
        return;
      }

      setError(err instanceof Error ? err.message : 'Không tải được cấu hình hệ thống.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadOverview(session);
  }, [session]);

  async function createAuditAction(action: 'KIEM_TRA_HE_THONG' | 'CAP_NHAT_CAU_HINH' | 'TAO_CHECKPOINT' | 'XEM_NHAT_KY') {
    if (!session) return;
    setActionBusy(action);
    setSuccessMessage('');
    setError('');

    try {
      await apiPost<AuditLog>(
        '/admin/system/audit-log',
        {
          action,
          targetType: 'HeThong',
          description:
            action === 'KIEM_TRA_HE_THONG'
              ? 'Quản trị viên kiểm tra sức khỏe API, dữ liệu và cấu hình vận hành.'
              : action === 'CAP_NHAT_CAU_HINH'
              ? 'Quản trị viên rà soát cấu hình nền tảng học tập.'
              : action === 'TAO_CHECKPOINT'
              ? 'Quản trị viên tạo checkpoint vận hành để theo dõi thay đổi hệ thống.'
              : 'Quản trị viên mở và kiểm tra nhật ký hoạt động.',
        },
        session.accessToken,
      );
      setSuccessMessage('Đã ghi nhận thao tác vào nhật ký hệ thống.');
      await loadOverview(session);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredSession();
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Không ghi được nhật ký hệ thống.');
    } finally {
      setActionBusy('');
    }
  }

  const metrics = useMemo<MetricCard[]>(() => {
    const summary = overview?.summary ?? fallbackOverview.summary;
    return [
      {
        icon: Gauge,
        label: 'Điểm vận hành',
        value: `${summary.operationalScore}%`,
        note: 'Tổng hợp lộ trình, bài học và quiz',
      },
      {
        icon: Users,
        label: 'Tài khoản hoạt động',
        value: summary.activeUsers,
        note: `${summary.totalUsers} tài khoản toàn hệ thống`,
      },
      {
        icon: DatabaseZap,
        label: 'Nội dung công bố',
        value: `${summary.publishedLessons}/${summary.totalLessons}`,
        note: 'Bài học sẵn sàng cho học viên',
      },
      {
        icon: ShieldCheck,
        label: 'Quiz công bố',
        value: `${summary.publishedQuizzes}/${summary.totalQuizzes}`,
        note: 'Bài kiểm tra đang hoạt động',
      },
    ];
  }, [overview]);

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở cấu hình hệ thống...</p>
      </main>
    );
  }

  const currentOverview = overview ?? fallbackOverview;
  const summary = currentOverview.summary;

  return (
    <AppShell
      session={session}
      active="admin"
      roleContext={USER_ROLES.ADMIN}
      showSidebar={false}
      eyebrow="Cấu hình hệ thống"
      title="Trạm điều hành nền tảng"
    >
      <section className="adminSystemHero">
        <div className="adminSystemHeroCopy">
          <p className="eyebrow">UC Quản trị viên • Cấu hình và nhật ký hệ thống</p>
          <h2>Điều khiển cấu hình, sức khỏe dịch vụ và nhật ký vận hành.</h2>
          <p>
            Màn hình này dành riêng cho quản trị viên để kiểm tra cấu hình trọng yếu, theo dõi
            trạng thái hệ thống, phát hiện rủi ro và ghi nhận thao tác audit log.
          </p>
          <div className="adminSystemActionBar">
            <button
              className="primaryButton"
              type="button"
              disabled={Boolean(actionBusy)}
              onClick={() => createAuditAction('KIEM_TRA_HE_THONG')}
            >
              <RefreshCcw size={18} />
              {actionBusy === 'KIEM_TRA_HE_THONG' ? 'Đang kiểm tra...' : 'Kiểm tra hệ thống'}
            </button>
            <button
              className="secondaryButton"
              type="button"
              disabled={Boolean(actionBusy)}
              onClick={() => createAuditAction('TAO_CHECKPOINT')}
            >
              <ShieldCheck size={18} />
              Tạo checkpoint
            </button>
          </div>
        </div>

        <div className="adminSystemScore" aria-label="Điểm vận hành">
          <span>{summary.operationalScore}%</span>
          <strong>{dataMode === 'live' ? 'LIVE' : 'DEMO'}</strong>
          <small>Cập nhật {formatDate(currentOverview.generatedAt)}</small>
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {successMessage ? <div className="successBox dashboardMessage">{successMessage}</div> : null}
      {dataMode === 'demo' ? (
        <div className="subtleBox dashboardMessage">
          Đang hiển thị dữ liệu mẫu vì API chưa phản hồi. Khi backend chạy, trang sẽ tự lấy dữ liệu thật.
        </div>
      ) : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang đồng bộ cấu hình hệ thống...</div> : null}

      <section className="metricGrid adminSystemMetricGrid">
        {metrics.map((metric) => (
          <Metric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} note={metric.note} />
        ))}
      </section>

      <section className="adminSystemLayout">
        <div className="adminSystemMain">
          <section className="panel adminSystemPanel">
            <div className="sectionTitle">
              <div>
                <p className="eyebrow">Cấu hình trọng yếu</p>
                <h2>Luật vận hành đang áp dụng</h2>
                <span>Những cấu hình ảnh hưởng trực tiếp tới luồng học, công bố nội dung, AI và game hóa.</span>
              </div>
              <button
                className="secondaryButton"
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() => createAuditAction('CAP_NHAT_CAU_HINH')}
              >
                <SlidersHorizontal size={18} />
                Rà soát cấu hình
              </button>
            </div>

            <div className="adminConfigGrid">
              {currentOverview.configs.map((config) => (
                <article className="adminConfigCard" key={config.key}>
                  <div className="adminConfigCardHead">
                    <span className={`statusPill ${getStatusClass(config.status)}`}>{config.status}</span>
                    <em>{config.owner}</em>
                  </div>
                  <strong>{config.label}</strong>
                  <b>{config.value}</b>
                  <p>{config.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel adminSystemPanel">
            <div className="sectionTitle">
              <div>
                <p className="eyebrow">Nhật ký hệ thống</p>
                <h2>Audit log gần nhất</h2>
                <span>Theo dõi ai đã thao tác gì, trên đối tượng nào và vào thời điểm nào.</span>
              </div>
              <button
                className="secondaryButton"
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() => createAuditAction('XEM_NHAT_KY')}
              >
                <ScrollText size={18} />
                Ghi nhận lượt xem
              </button>
            </div>

            <div className="adminLogTimeline">
              {currentOverview.logs.map((log) => (
                <article className="adminLogItem" key={log.id}>
                  <span className="adminLogDot" />
                  <div>
                    <div className="adminLogHead">
                      <strong>{formatAction(log.action)}</strong>
                      <em>{formatDate(log.createdAt)}</em>
                    </div>
                    <p>{log.description ?? 'Không có mô tả chi tiết.'}</p>
                    <small>
                      {log.actorName ?? log.actorEmail ?? 'Hệ thống'} • {log.targetType ?? 'Không xác định'}
                    </small>
                  </div>
                </article>
              ))}
              {!currentOverview.logs.length ? <div className="subtleBox">Chưa có nhật ký hệ thống.</div> : null}
            </div>
          </section>
        </div>

        <aside className="adminSystemSide">
          <section className="panel adminSystemPanel">
            <div className="sectionTitle">
              <div>
                <p className="eyebrow">Kiểm tra dịch vụ</p>
                <h2>Service checks</h2>
              </div>
            </div>

            <div className="adminCheckList">
              {currentOverview.checks.map((check) => (
                <article className={`adminCheckItem ${check.severity}`} key={check.key}>
                  {check.severity === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                    <p>{check.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel adminSystemPanel">
            <div className="sectionTitle">
              <div>
                <p className="eyebrow">Rủi ro vận hành</p>
                <h2>Ưu tiên xử lý</h2>
              </div>
            </div>

            <div className="adminRiskList">
              {currentOverview.risks.map((risk) => (
                <article className={`adminRiskItem ${risk.level}`} key={risk.key}>
                  <div>
                    <strong>{risk.title}</strong>
                    <span>{risk.recommendation}</span>
                  </div>
                  <b>{risk.value}</b>
                </article>
              ))}
            </div>
          </section>

          <section className="panel adminSystemPanel">
            <div className="sectionTitle">
              <div>
                <p className="eyebrow">Tóm tắt dữ liệu</p>
                <h2>Hệ thống hiện tại</h2>
              </div>
            </div>

            <div className="adminSystemFacts">
              <span>
                <Users size={16} />
                {summary.activeUsers}/{summary.totalUsers} tài khoản hoạt động
              </span>
              <span>
                <FileText size={16} />
                {summary.publishedPaths}/{summary.totalPaths} lộ trình công bố
              </span>
              <span>
                <ToggleRight size={16} />
                {summary.publishedLessons}/{summary.totalLessons} bài học công bố
              </span>
              <span>
                <Activity size={16} />
                {summary.lockedUsers} tài khoản cần rà soát
              </span>
            </div>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: number | string;
  note: string;
}) {
  return (
    <div className="metric">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
