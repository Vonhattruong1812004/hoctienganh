'use client';

import {
  ArrowRight,
  Award,
  BookOpen,
  ClipboardCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
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

export default function ParentSupportPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [suggestions, setSuggestions] = useState<ParentReviewSuggestion[]>([]);
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
        setError(err instanceof Error ? err.message : 'Không tải được gợi ý hỗ trợ.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router, session]);

  const summary = useMemo(() => {
    const urgent = suggestions.filter((item) => item.priority <= 1 && item.status !== 'HoanThanh').length;
    const unread = suggestions.filter((item) => item.status === 'ChuaXem').length;
    const done = suggestions.filter((item) => item.status === 'HoanThanh').length;
    const averageProgress = suggestions.length
      ? Math.round(
          suggestions.reduce((total, item) => total + Number(item.lessonProgress ?? 0), 0) / suggestions.length,
        )
      : 0;

    return { urgent, unread, done, averageProgress };
  }, [suggestions]);

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở gợi ý hỗ trợ...</p>
      </main>
    );
  }

  return (
    <AppShell
      session={session}
      active="dashboard"
      roleContext={USER_ROLES.PARENT}
      showSidebar={false}
      eyebrow="Cổng phụ huynh"
      title="Gợi ý hỗ trợ học viên"
    >
      <section className="parentUcHero">
        <div>
          <p className="eyebrow">Theo dõi tại nhà</p>
          <h2>Các bài học cần phụ huynh hỗ trợ ôn tập.</h2>
          <p>
            Hệ thống tổng hợp tiến trình, điểm quiz và trạng thái bài học để phụ huynh biết nên hỗ trợ học viên ở đâu,
            ưu tiên bài nào trước.
          </p>
        </div>
        <div className="parentUcStats">
          <span>
            <ShieldCheck size={16} />
            {summary.urgent} ưu tiên
          </span>
          <span>
            <Sparkles size={16} />
            {summary.unread} chưa xem
          </span>
          <span>
            <TrendingUp size={16} />
            {summary.averageProgress}% TB
          </span>
          <span>
            <Award size={16} />
            {summary.done} hoàn tất
          </span>
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải gợi ý hỗ trợ...</div> : null}

      <section className="parentReviewPanel panel" aria-label="Danh sách gợi ý hỗ trợ">
        <div className="sectionTitle">
          <div>
            <h2>Danh sách bài cần hỗ trợ</h2>
            <span>Mỗi gợi ý có học viên, bài học, lý do, tiến độ và đường dẫn mở bài cần ôn.</span>
          </div>
          <Link className="secondaryButton" href="/dashboard">
            Về dashboard
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="parentReviewList">
          {suggestions.map((suggestion) => (
            <article className={`parentReviewCard priority-${suggestion.priority}`} key={suggestion.id}>
              <div className="parentReviewCardHead">
                <div>
                  <p className="eyebrow">{suggestion.studentName}</p>
                  <strong>{suggestion.lessonTitle ?? suggestion.topicName ?? 'Nội dung cần ôn tập'}</strong>
                  <span>{suggestion.reason}</span>
                </div>
                <span className={`parentReviewStatus ${suggestion.status}`}>
                  {formatReviewStatus(suggestion.status)}
                </span>
              </div>

              <div className="parentReviewMeta">
                <span>
                  <BookOpen size={14} />
                  {suggestion.pathName ?? 'Lộ trình hiện tại'}
                </span>
                <span>
                  <ClipboardCheck size={14} />
                  {suggestion.stageName ?? suggestion.topicName ?? 'Chặng học'}
                </span>
                <span>
                  <TrendingUp size={14} />
                  {Math.round(Number(suggestion.lessonProgress ?? 0))}% bài học
                </span>
                <span>
                  <Award size={14} />
                  {Math.round(Number(suggestion.bestScore ?? 0))}% cao nhất
                </span>
              </div>

              <div className="parentReviewActions">
                <div className="progressRail">
                  <div
                    className="progressFill"
                    style={{ width: `${Math.min(100, Math.max(0, Number(suggestion.lessonProgress ?? 0)))}%` }}
                  />
                </div>
                <Link className="secondaryButton" href={suggestion.lessonId ? `/lessons/${suggestion.lessonId}` : '/progress'}>
                  Mở bài cần ôn
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}

          {!suggestions.length && !loading ? (
            <div className="subtleBox">
              Chưa có gợi ý hỗ trợ. Khi học viên có bài chưa đạt hoặc tiến độ chậm, hệ thống sẽ hiển thị tại đây.
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

function formatReviewStatus(status: string) {
  const labels: Record<string, string> = {
    ChuaXem: 'Chưa xem',
    DaXem: 'Đã xem',
    HoanThanh: 'Hoàn tất',
  };

  return labels[status] ?? status;
}
