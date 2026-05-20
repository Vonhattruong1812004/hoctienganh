'use client';

import {
  ArrowRight,
  Bell,
  Clock3,
  MessageSquareText,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { USER_ROLES } from '@english-learning/shared';
import { AppShell } from '../../../components/app-shell';
import { ApiError, apiGet, apiPatch } from '../../../lib/api';
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

const notificationFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
  { key: 'student', label: 'Của học viên' },
  { key: 'parent', label: 'Của phụ huynh' },
  { key: 'warning', label: 'Cần xử lý' },
] as const;

type NotificationFilter = (typeof notificationFilters)[number]['key'];

const reminderTemplates = [
  'Con ôn lại bài cần chú ý trong 10 phút rồi nói cho ba/mẹ 3 từ mới nhé.',
  'Con làm lại quiz sau khi xem lỗi sai, mục tiêu lần này là từ 80% trở lên.',
  'Con nghe phát âm từng từ, đọc lại câu ví dụ và tự đặt 2 câu mới nhé.',
];

export default function ParentNotificationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebAuthSession | null>(null);
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<NotificationFilter>('all');
  const [selectedTemplate, setSelectedTemplate] = useState(reminderTemplates[0]);
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(() => new Set());
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : 'Không tải được nhắc nhở học tập.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router, session]);

  const normalizedNotifications = useMemo(
    () =>
      notifications.map((item) => ({
        ...item,
        isRead: item.isRead || localReadIds.has(item.id),
      })),
    [localReadIds, notifications],
  );

  const summary = useMemo(() => {
    const unread = normalizedNotifications.filter((item) => !item.isRead).length;
    const studentMessages = normalizedNotifications.filter((item) => item.recipientKind === 'HocVien').length;
    const warningMessages = normalizedNotifications.filter((item) => isActionableNotification(item)).length;
    const latest = normalizedNotifications[0]?.sentAt ?? null;

    return { unread, studentMessages, warningMessages, latest };
  }, [normalizedNotifications]);

  const visibleNotifications = useMemo(() => {
    return normalizedNotifications.filter((item) => {
      if (selectedFilter === 'unread') return !item.isRead;
      if (selectedFilter === 'student') return item.recipientKind === 'HocVien';
      if (selectedFilter === 'parent') return item.recipientKind === 'PhuHuynh';
      if (selectedFilter === 'warning') return isActionableNotification(item);
      return true;
    });
  }, [normalizedNotifications, selectedFilter]);

  async function handleMarkAsRead(notificationId: string) {
    if (!session) return;

    setLocalReadIds((current) => {
      const next = new Set(current);
      next.add(notificationId);
      return next;
    });
    setMarkingReadId(notificationId);

    try {
      await apiPatch(`/parents/me/notifications/${notificationId}/read`, {}, session.accessToken);
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái đã xem.');
    } finally {
      setMarkingReadId(null);
    }
  }

  if (!session) {
    return (
      <main className="loadingShell">
        <p>Đang mở nhắc nhở học tập...</p>
      </main>
    );
  }

  return (
    <AppShell
      session={session}
      active="parentNotifications"
      roleContext={USER_ROLES.PARENT}
      showSidebar={false}
      eyebrow="Cổng phụ huynh"
      title="Nhắc nhở và tương tác học tập"
    >
      <section className="parentNotifyHero panel" aria-label="Tổng quan nhắc nhở">
        <div>
          <p className="eyebrow">Nhắc nhở gia đình</p>
          <h2>Không bỏ lỡ bài cần ôn, quiz mới và tín hiệu học tập của con.</h2>
        </div>
        <div className="parentSupportStats">
          <span>
            <Bell size={16} />
            {summary.unread} chưa đọc
          </span>
          <span>
            <Users size={16} />
            {summary.studentMessages} của học viên
          </span>
          <span>
            <Sparkles size={16} />
            {summary.warningMessages} cần xử lý
          </span>
          <span>
            <Clock3 size={16} />
            {summary.latest ? formatNotificationDate(summary.latest) : 'chưa có'}
          </span>
        </div>
      </section>

      {error ? <div className="errorBox dashboardMessage">{error}</div> : null}
      {loading ? <div className="subtleBox dashboardMessage">Đang tải nhắc nhở học tập...</div> : null}

      <section className="parentSupportToolbar panel" aria-label="Bộ lọc nhắc nhở">
        <div className="parentSupportFilterGroup" role="tablist" aria-label="Lọc nhắc nhở">
          {notificationFilters.map((filter) => (
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
        <Link className="secondaryButton" href="/parent/support">
          Xem cảnh báo ôn tập
          <ArrowRight size={14} />
        </Link>
      </section>

      <section className="parentNotifyLayout" aria-label="Nhắc nhở và tương tác">
        <div className="parentNotificationPanel panel">
          <div className="sectionTitle">
            <div>
              <h2>Nhắc nhở</h2>
              <span>{visibleNotifications.length}/{notifications.length} mục đang hiển thị</span>
            </div>
            <Link className="secondaryButton" href="/dashboard">
              Về dashboard
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="parentNotificationList">
            {visibleNotifications.map((notification) => {
              const action = getNotificationAction(notification);
              return (
                <article className={`parentNotificationCard ${notification.isRead ? 'read' : 'unread'}`} key={notification.id}>
                  <div className="parentNotificationHead">
                    <div>
                      <p className="eyebrow">
                        {notification.recipientKind === 'PhuHuynh' ? 'Phụ huynh' : notification.recipientName}
                      </p>
                      <strong>{notification.title}</strong>
                      <span>{notification.content}</span>
                    </div>
                    <span className={`parentNotificationType ${notification.type}`}>{notification.type}</span>
                  </div>

                  <div className="parentNotificationMeta">
                    <span>
                      <MessageSquareText size={14} />
                      {notification.recipientKind === 'PhuHuynh' ? 'Gửi cho phụ huynh' : 'Liên quan học viên'}
                    </span>
                    <span>{formatNotificationDate(notification.sentAt)}</span>
                    <span>{notification.isRead ? 'Đã xem' : 'Chưa đọc'}</span>
                  </div>

                  <div className="parentNotifyActionLine">
                    <span>{action.text}</span>
                    <div>
                      {!notification.isRead ? (
                        <button
                          className="secondaryButton"
                          type="button"
                          onClick={() => void handleMarkAsRead(notification.id)}
                          disabled={markingReadId === notification.id}
                        >
                          {markingReadId === notification.id ? 'Đang lưu...' : 'Đánh dấu đã xem'}
                        </button>
                      ) : null}
                      <Link className="primaryButton" href={action.href}>
                        Mở xử lý
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}

            {!visibleNotifications.length && !loading ? (
              <div className="subtleBox">Chưa có nhắc nhở phù hợp với bộ lọc này.</div>
            ) : null}
          </div>
        </div>

        <aside className="parentNotifyComposer panel" aria-label="Tương tác nhanh">
          <div className="sectionTitle compact">
            <div>
              <h2>Tương tác nhanh</h2>
              <span>Mẫu lời nhắc để phụ huynh dùng ngay</span>
            </div>
          </div>

          <div className="parentReminderTemplates">
            {reminderTemplates.map((template) => (
              <button
                className={selectedTemplate === template ? 'active' : ''}
                type="button"
                onClick={() => setSelectedTemplate(template)}
                key={template}
              >
                {template}
              </button>
            ))}
          </div>

          <div className="parentReminderPreview">
            <span>Lời nhắc đã chọn</span>
            <p>{selectedTemplate}</p>
          </div>

          <Link className="primaryButton fullWidthButton" href="/parent/support">
            <Send size={16} />
            Dùng với cảnh báo ôn tập
          </Link>
        </aside>
      </section>
    </AppShell>
  );
}

function isActionableNotification(notification: ParentNotification) {
  const text = `${notification.title} ${notification.content} ${notification.type}`.toLowerCase();
  return (
    text.includes('cảnh báo') ||
    text.includes('gợi ý') ||
    text.includes('ôn') ||
    text.includes('quiz') ||
    text.includes('kiểm tra') ||
    text.includes('chưa')
  );
}

function getNotificationAction(notification: ParentNotification) {
  const text = `${notification.title} ${notification.content} ${notification.type}`.toLowerCase();

  if (text.includes('quiz') || text.includes('kiểm tra') || text.includes('điểm')) {
    return { href: '/parent/results', text: 'Xem điểm và lỗi sai trước khi nhắc con ôn lại.' };
  }

  if (text.includes('gợi ý') || text.includes('ôn') || text.includes('cảnh báo')) {
    return { href: '/parent/support', text: 'Mở cảnh báo để biết bài cần ôn và việc nên làm.' };
  }

  return { href: '/parent/audit', text: 'Xem hồ sơ học tập để hiểu hoạt động gần đây của con.' };
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
