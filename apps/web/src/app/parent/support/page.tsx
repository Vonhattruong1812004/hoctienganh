'use client';

import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  ShieldAlert,
  Target,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../../components/app-shell';
import { ApiError, apiGet } from '../../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../lib/session';

type ParentReviewSuggestion = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lessonId: string | null;
  lessonTitle: string | null;
  topicName: string | null;
  pathName: string | null;
  stageName: string | null;
  reason: string;
  priority: number;
  status: string;
  createdAt: string;
  lessonStatus: string;
  lessonProgress: number;
  bestScore: number;
  latestQuizTitle: string | null;
  latestQuizPercentage: number | null;
  latestQuizStatus: string | null;
  latestQuizSubmittedAt: string | null;
};

const supportFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'urgent', label: 'Khẩn cấp' },
  { key: 'unread', label: 'Chưa xem' },
  { key: 'active', label: 'Đang theo dõi' },
  { key: 'done', label: 'Hoàn tất' },
] as const;

type SupportFilter = (typeof supportFilters)[number]['key'];

export default function ParentSupportPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [suggestions, setSuggestions] = useState<ParentReviewSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState<SupportFilter>('all');

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
    async function load() {
      try {
        const response = await apiGet<ParentReviewSuggestion[]>(
          '/parents/me/review-suggestions',
          currentSession.accessToken,
        );
        if (!active) return;
        setSuggestions(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được cảnh báo ôn tập.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router, session]);

  const students = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    suggestions.forEach((item) => {
      map.set(item.studentId, { id: item.studentId, name: item.studentName });
    });
    return Array.from(map.values());
  }, [suggestions]);

  const summary = useMemo(() => {
    const activeItems = suggestions.filter((item) => item.status !== 'HoanThanh');
    const urgent = activeItems.filter((item) => item.priority <= 1).length;
    const unread = suggestions.filter((item) => item.status === 'ChuaXem').length;
    const weakQuiz = activeItems.filter((item) => Number(item.latestQuizPercentage ?? 100) < 80).length;
    const done = suggestions.filter((item) => item.status === 'HoanThanh').length;

    return { urgent, unread, weakQuiz, done };
  }, [suggestions]);

  const visibleSuggestions = useMemo(() => {
    return suggestions
      .filter((item) => selectedStudentId === 'all' || item.studentId === selectedStudentId)
      .filter((item) => {
        if (selectedFilter === 'urgent') return item.priority <= 1 && item.status !== 'HoanThanh';
        if (selectedFilter === 'unread') return item.status === 'ChuaXem';
        if (selectedFilter === 'active') return item.status !== 'HoanThanh';
        if (selectedFilter === 'done') return item.status === 'HoanThanh';
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'HoanThanh' && b.status !== 'HoanThanh') return 1;
        if (a.status !== 'HoanThanh' && b.status === 'HoanThanh') return -1;
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [selectedFilter, selectedStudentId, suggestions]);

  const todayActions = visibleSuggestions.filter((item) => item.status !== 'HoanThanh').slice(0, 4);

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở cảnh báo ôn tập...</p>
      </main>
    );
  }

  return (
    <AppShell
      session={session}
      active="parentSupport"
      roleContext={USER_ROLES.PARENT}
      showSidebar={false}
      eyebrow="Cổng phụ huynh"
      title="Nhận cảnh báo và gợi ý ôn tập"
    >
      <section className="parentSupportHero panel" aria-label="Tổng quan cảnh báo ôn tập">
        <div>
          <p className="eyebrow">Cảnh báo học tập</p>
          <h2>Bài nào cần ôn, vì sao cần ôn, phụ huynh nên làm gì.</h2>
        </div>
        <div className="parentSupportStats">
          <span>
            <ShieldAlert size={16} />
            {summary.urgent} khẩn cấp
          </span>
          <span>
            <Bell size={16} />
            {summary.unread} chưa xem
          </span>
          <span>
            <Target size={16} />
            {summary.weakQuiz} dưới 80%
          </span>
          <span>
            <CheckCircle2 size={16} />
            {summary.done} hoàn tất
          </span>
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải cảnh báo ôn tập...</div> : null}

      <section className="parentSupportToolbar panel" aria-label="Bộ lọc cảnh báo">
        <div className="parentSupportStudentFilter">
          <Filter size={16} />
          <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
            <option value="all">Tất cả học viên</option>
            {students.map((student) => (
              <option value={student.id} key={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
        <div className="parentSupportFilterGroup" role="tablist" aria-label="Lọc trạng thái cảnh báo">
          {supportFilters.map((filter) => (
            <button
              className={selectedFilter === filter.key ? 'active' : ''}
              type="button"
              onClick={() => setSelectedFilter(filter.key)}
              key={filter.key}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="parentSupportLayout" aria-label="Danh sách cảnh báo và việc cần làm">
        <div className="parentSupportPanel panel">
          <div className="sectionTitle">
            <div>
              <h2>Cảnh báo ôn tập</h2>
              <span>{visibleSuggestions.length}/{suggestions.length} cảnh báo đang hiển thị</span>
            </div>
            <Link className="secondaryButton" href="/dashboard">
              Về dashboard
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="parentSupportList">
            {visibleSuggestions.map((suggestion) => (
              <article className={`parentSupportCard ${getPriorityClass(suggestion)}`} key={suggestion.id}>
                <div className="parentSupportCardTop">
                  <div>
                    <p className="eyebrow">{suggestion.studentName}</p>
                    <h3>{suggestion.lessonTitle ?? suggestion.topicName ?? 'Nội dung cần ôn'}</h3>
                    <span>{suggestion.reason}</span>
                  </div>
                  <strong>{getPriorityLabel(suggestion)}</strong>
                </div>

                <div className="parentSupportMeta">
                  <span>
                    <BookOpen size={14} />
                    {suggestion.pathName ?? suggestion.topicName ?? 'Chủ đề học'}
                  </span>
                  <span>
                    <ClipboardCheck size={14} />
                    {formatReviewStatus(suggestion.status)}
                  </span>
                  <span>
                    <TrendingUp size={14} />
                    {Math.round(Number(suggestion.lessonProgress ?? 0))}% tiến độ
                  </span>
                  <span>
                    <Award size={14} />
                    {Math.round(Number(suggestion.bestScore ?? 0))}% cao nhất
                  </span>
                </div>

                {suggestion.latestQuizTitle ? (
                  <div className="parentSupportQuizLine">
                    <span>Quiz gần nhất</span>
                    <strong>{suggestion.latestQuizTitle}</strong>
                    <em>
                      {Math.round(Number(suggestion.latestQuizPercentage ?? 0))}% ·{' '}
                      {formatDate(suggestion.latestQuizSubmittedAt)}
                    </em>
                  </div>
                ) : null}

                <div className="parentSupportActionBox">
                  <span>Gợi ý ôn tập</span>
                  <p>{buildParentAction(suggestion)}</p>
                </div>

                <div className="parentSupportActions">
                  <Link className="secondaryButton" href="/parent/audit">
                    Xem hồ sơ
                    <ArrowRight size={14} />
                  </Link>
                  <Link className="primaryButton" href={suggestion.lessonId ? `/lessons/${suggestion.lessonId}` : '/lessons'}>
                    Mở nội dung ôn
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}

            {!visibleSuggestions.length && !loading ? (
              <div className="subtleBox">
                Chưa có cảnh báo phù hợp với bộ lọc này. Khi học viên có điểm thấp, tiến độ chậm hoặc bài cần ôn,
                hệ thống sẽ đưa vào đây.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="parentSupportAside panel" aria-label="Việc nên làm hôm nay">
          <div className="sectionTitle compact">
            <div>
              <h2>Hôm nay</h2>
              <span>Ưu tiên xử lý trước</span>
            </div>
          </div>

          <div className="parentSupportTodayList">
            {todayActions.map((item, index) => (
              <Link
                className="parentSupportTodayItem"
                href={item.lessonId ? `/lessons/${item.lessonId}` : '/lessons'}
                key={`today:${item.id}`}
              >
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <span>{item.lessonTitle ?? item.topicName ?? 'Nội dung cần ôn'}</span>
                <small>{buildParentAction(item)}</small>
              </Link>
            ))}

            {!todayActions.length ? (
              <div className="subtleBox">Không có cảnh báo đang mở. Có thể xem kết quả học tập hoặc thông báo mới.</div>
            ) : null}
          </div>

          <Link className="secondaryButton fullWidthButton" href="/parent/results">
            Xem kết quả học tập
            <ArrowRight size={14} />
          </Link>
        </aside>
      </section>
    </AppShell>
  );
}

function formatReviewStatus(status: string) {
  const labels: Record<string, string> = {
    ChuaXem: 'Chưa xem',
    DaXem: 'Đang theo dõi',
    HoanThanh: 'Hoàn tất',
  };

  return labels[status] ?? status;
}

function getPriorityLabel(suggestion: ParentReviewSuggestion) {
  if (suggestion.status === 'HoanThanh') return 'Đã xử lý';
  if (suggestion.priority <= 1) return 'Khẩn cấp';
  if (suggestion.priority <= 2) return 'Ưu tiên';
  return 'Theo dõi';
}

function getPriorityClass(suggestion: ParentReviewSuggestion) {
  if (suggestion.status === 'HoanThanh') return 'done';
  if (suggestion.priority <= 1) return 'urgent';
  if (suggestion.priority <= 2) return 'priority';
  return 'normal';
}

function buildParentAction(suggestion: ParentReviewSuggestion) {
  const title = suggestion.lessonTitle ?? suggestion.topicName ?? 'nội dung này';
  const quizScore = Number(suggestion.latestQuizPercentage ?? 100);
  const progress = Number(suggestion.lessonProgress ?? 0);

  if (quizScore < 80) {
    return `Cho con ôn lại ${title}, đọc lại câu sai và làm lại quiz đến khi đạt ít nhất 80%.`;
  }

  if (progress < 50) {
    return `Nhắc con hoàn thành nhiệm vụ chính của ${title}, ưu tiên nghe phát âm và đặt câu mẫu.`;
  }

  if (!suggestion.latestQuizTitle) {
    return `Cho con học lại từ vựng trong ${title}, sau đó làm bài kiểm tra ngắn để chốt kiến thức.`;
  }

  return `Duy trì ôn ${title} trong 10 phút, kiểm tra lại từ vựng yếu và theo dõi điểm lần sau.`;
}

function formatDate(value: string | null) {
  if (!value) return 'chưa có ngày';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
