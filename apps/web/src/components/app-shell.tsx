'use client';

import {
  Activity,
  BookOpen,
  ChartNoAxesCombined,
  CheckCircle2,
  Gamepad2,
  GraduationCap,
  LogOut,
  PlayCircle,
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
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

const commonNavItems = [
  { key: 'dashboard', href: '/dashboard', label: 'Tổng quan', icon: Activity },
  { key: 'admin', href: '/admin', label: 'Quản trị', icon: ShieldCheck, roles: [USER_ROLES.ADMIN] },
] as const;

const actorNavItems = [
  {
    key: 'paths',
    href: '/learning-paths',
    label: 'Lộ trình học',
    icon: BookOpen,
    roles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN],
  },
  {
    key: 'lessons',
    href: '/lessons',
    label: 'Bài học',
    icon: PlayCircle,
    roles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN],
  },
  {
    key: 'quizzes',
    href: '/quizzes',
    label: 'Kiểm tra',
    icon: CheckCircle2,
    roles: [USER_ROLES.STUDENT, USER_ROLES.PARENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN],
  },
  {
    key: 'progress',
    href: '/progress',
    label: 'Tiến trình',
    icon: ChartNoAxesCombined,
    roles: [USER_ROLES.STUDENT, USER_ROLES.PARENT, USER_ROLES.TEACHER],
  },
  {
    key: 'students',
    href: '/students',
    label: 'Học viên',
    icon: Users,
    roles: [USER_ROLES.PARENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN],
  },
  {
    key: 'playground',
    href: '/playground',
    label: 'Sân chơi',
    icon: Gamepad2,
    roles: [USER_ROLES.STUDENT],
  },
] as const;

function canSeeNavItem(userRoles: string[], itemRoles: readonly UserRole[]) {
  return itemRoles.some((role) => userRoles.includes(role));
}

export function AppShell({ session, active, eyebrow, title, children }: AppShellProps) {
  const router = useRouter();
  const actorItems = actorNavItems.filter((item) => canSeeNavItem(session.user.roles, item.roles));

  function handleLogout() {
    clearStoredSession();
    router.replace('/login');
  }

  return (
    <main className="shell">
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
          <span className="navGroupLabel">UC chung</span>
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

          <span className="navGroupLabel">UC riêng theo vai trò</span>
          {actorItems.map((item) => {
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
        </nav>
      </aside>

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
