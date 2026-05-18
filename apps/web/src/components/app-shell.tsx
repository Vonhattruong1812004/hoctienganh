'use client';

import {
  Activity,
  BookOpen,
  ChartNoAxesCombined,
  CheckCircle2,
  GraduationCap,
  LibraryBig,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { USER_ROLES, type UserRole } from '@english-learning/shared';
import { clearStoredSession, type WebAuthSession } from '../lib/session';
import { ThemeToggleButton } from './theme-toggle';

type AppShellProps = {
  session: WebAuthSession;
  active: 'dashboard' | 'admin' | 'paths' | 'lessons' | 'quizzes' | 'progress' | 'students' | 'playground';
  roleContext?: UserRole;
  showSidebar?: boolean;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

type NavItem = {
  key: AppShellProps['active'];
  href: string;
  label: string;
  icon: typeof Activity;
};

const commonNavItems = [
  { key: 'dashboard', href: '/dashboard', label: 'Tổng quan vai trò', icon: Activity },
] satisfies NavItem[];

const roleLabels: Record<UserRole, string> = {
  [USER_ROLES.STUDENT]: 'Học viên',
  [USER_ROLES.PARENT]: 'Phụ huynh',
  [USER_ROLES.TEACHER]: 'Giáo viên',
  [USER_ROLES.ADMIN]: 'Quản trị viên',
};

const actorNavItems: Record<UserRole, NavItem[]> = {
  [USER_ROLES.STUDENT]: [
    { key: 'lessons', href: '/lessons', label: 'UC1 Học từ vựng theo chủ đề', icon: BookOpen },
    { key: 'progress', href: '/progress', label: 'UC2 Theo dõi tiến trình học tập', icon: ChartNoAxesCombined },
  ],
  [USER_ROLES.PARENT]: [
    { key: 'students', href: '/students', label: 'UC1 Xem học viên liên kết', icon: Users },
    { key: 'progress', href: '/progress', label: 'UC2 Theo dõi tiến trình con', icon: ChartNoAxesCombined },
    { key: 'quizzes', href: '/quizzes', label: 'UC3 Xem kết quả kiểm tra', icon: CheckCircle2 },
    { key: 'dashboard', href: '/parent/support', label: 'UC4 Cảnh báo và gợi ý ôn tập', icon: ShieldCheck },
    { key: 'dashboard', href: '/parent/notifications', label: 'UC5 Thông báo học tập', icon: Activity },
  ],
  [USER_ROLES.TEACHER]: [
    { key: 'paths', href: '/learning-paths', label: 'UC1 Quản lý lộ trình', icon: BookOpen },
    { key: 'lessons', href: '/lessons', label: 'UC2 Quản lý bài học', icon: LibraryBig },
    { key: 'quizzes', href: '/quizzes', label: 'UC3 Quản lý quiz', icon: CheckCircle2 },
    { key: 'students', href: '/students', label: 'UC4 Theo dõi học viên', icon: Users },
    { key: 'progress', href: '/progress', label: 'UC5 Xem tiến trình chi tiết', icon: ChartNoAxesCombined },
  ],
  [USER_ROLES.ADMIN]: [
    { key: 'students', href: '/admin/users', label: 'Quản lý người dùng', icon: Users },
    { key: 'progress', href: '/admin/progress', label: 'Giám sát dữ liệu học tập', icon: ChartNoAxesCombined },
    { key: 'paths', href: '/admin/learning-paths', label: 'Quản lý lộ trình công bố', icon: BookOpen },
    { key: 'lessons', href: '/admin/lessons', label: 'Quản lý bài học công bố', icon: LibraryBig },
    { key: 'quizzes', href: '/admin/quizzes', label: 'Quản lý quiz công bố', icon: CheckCircle2 },
    { key: 'admin', href: '/admin', label: 'Cấu hình và nhật ký hệ thống', icon: Settings },
  ],
};

function resolveRoleContext(userRoles: string[], roleContext?: UserRole) {
  if (roleContext && userRoles.includes(roleContext)) {
    return roleContext;
  }

  if (userRoles.includes(USER_ROLES.ADMIN)) return USER_ROLES.ADMIN;
  if (userRoles.includes(USER_ROLES.TEACHER)) return USER_ROLES.TEACHER;
  if (userRoles.includes(USER_ROLES.PARENT)) return USER_ROLES.PARENT;
  return USER_ROLES.STUDENT;
}

export function AppShell({ session, active, roleContext, showSidebar, eyebrow, title, children }: AppShellProps) {
  const router = useRouter();
  const currentRoleContext = resolveRoleContext(session.user.roles, roleContext);
  const actorItems = actorNavItems[currentRoleContext];
  const shouldShowSidebar = showSidebar ?? currentRoleContext !== USER_ROLES.ADMIN;
  const shellClassName = [
    shouldShowSidebar ? 'shell' : 'shell shellNoSidebar',
    !shouldShowSidebar && currentRoleContext === USER_ROLES.ADMIN ? 'adminShell' : '',
  ]
    .filter(Boolean)
    .join(' ');

  function handleLogout() {
    clearStoredSession();
    router.replace('/login');
  }

  return (
    <main className={shellClassName}>
      {shouldShowSidebar ? (
        <aside className="sidebar">
          <div className="brand">
            <div className="brandMark">
              <GraduationCap size={22} />
            </div>
            <div>
              <strong>EnglishPro</strong>
              <span>{session.user.fullName}</span>
            </div>
          </div>

          <nav className="nav" aria-label="Điều hướng chức năng">
            <span className="navGroupLabel">Điều hướng chung</span>
            {commonNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  className={active === item.key ? 'active' : ''}
                  href={item.href}
                  aria-current={active === item.key ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}

            <span className="navGroupLabel">Chức năng của {roleLabels[currentRoleContext]}</span>
            {actorItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={`${currentRoleContext}:${item.href}:${item.label}`}
                  className={active === item.key ? 'active' : ''}
                  href={item.href}
                  aria-current={active === item.key ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      ) : null}

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <div className="topbarActions">
            <ThemeToggleButton />
            <button className="secondaryButton" type="button" onClick={handleLogout}>
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
