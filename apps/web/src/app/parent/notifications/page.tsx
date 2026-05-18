'use client';

import { ArrowRight, Bell, CheckCircle2, Mail, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../../components/app-shell';
import { ApiError, apiGet } from '../../../lib/api';
import { clearStoredSession, getStoredSession, type WebAuthSession } from '../../../lib/session';

type ParentNotification = {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientKind: 'PhuHuynh' | 'HocVien';
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  sentAt: string;
};

export default function ParentNotificationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
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
        const response = await apiGet<ParentNotification[]>('/parents/me/notifications', currentSession.accessToken);
        if (!active) return;
        setNotifications(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Không tải được thông báo học tập.');
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
    const unread = notifications.filter((item) => !item.isRead).length;
    const studentMessages = notifications.filter((item) => item.recipientKind === 'HocVien').length;
    const systemMessages = notifications.filter((item) => item.recipientKind === 'PhuHuynh').length;

    return { unread, studentMessages, systemMessages };
  }, [notifications]);

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở thông báo học tập...</p>
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
      title="Thông báo học tập"
    >
      <section className="parentUcHero">
        <div>
          <p className="eyebrow">Nhật ký gia đình</p>
          <h2>Theo dõi thông báo tiến trình, kiểm tra và cảnh báo học tập.</h2>
          <p>
            Trang này gom thông báo gửi cho phụ huynh và học viên đã liên kết, giúp phụ huynh không bỏ lỡ tình trạng
            học tập quan trọng.
          </p>
        </div>
        <div className="parentUcStats">
          <span>
            <Bell size={16} />
            {summary.unread} chưa đọc
          </span>
          <span>
            <Users size={16} />
            {summary.studentMessages} học viên
          </span>
          <span>
            <Mail size={16} />
            {summary.systemMessages} phụ huynh
          </span>
          <span>
            <CheckCircle2 size={16} />
            {notifications.length} tổng
          </span>
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải thông báo học tập...</div> : null}

      <section className="parentNotificationPanel panel" aria-label="Danh sách thông báo học tập">
        <div className="sectionTitle">
          <div>
            <h2>Tập tin thông báo</h2>
            <span>Thông báo mới, cảnh báo học tập và lịch sử hoạt động của học viên liên kết.</span>
          </div>
          <Link className="secondaryButton" href="/dashboard">
            Về dashboard
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="parentNotificationList">
          {notifications.map((notification) => (
            <article className={`parentNotificationCard ${notification.isRead ? 'read' : 'unread'}`} key={notification.id}>
              <div className="parentNotificationHead">
                <div>
                  <p className="eyebrow">
                    {notification.recipientKind === 'PhuHuynh' ? 'Gửi cho phụ huynh' : notification.recipientName}
                  </p>
                  <strong>{notification.title}</strong>
                  <span>{notification.content}</span>
                </div>
                <span className={`parentNotificationType ${notification.type}`}>{notification.type}</span>
              </div>

              <div className="parentNotificationMeta">
                <span>
                  <Sparkles size={14} />
                  {notification.recipientKind === 'PhuHuynh' ? 'Tài khoản phụ huynh' : notification.recipientName}
                </span>
                <span>{formatNotificationDate(notification.sentAt)}</span>
                <span>{notification.isRead ? 'Đã đọc' : 'Chưa đọc'}</span>
              </div>
            </article>
          ))}

          {!notifications.length && !loading ? (
            <div className="subtleBox">
              Chưa có thông báo nào. Khi học viên hoàn thành bài, có cảnh báo hoặc hệ thống gửi tin, phụ huynh sẽ thấy
              tại đây.
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
