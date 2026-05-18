'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

function resolveFallback(pathname: string) {
  if (/^\/lessons\/[^/]+\/(learn|game)/.test(pathname)) {
    return pathname.replace(/\/(learn|game)$/, '');
  }

  if (/^\/lessons\/[^/]+/.test(pathname)) return '/lessons';
  if (/^\/quizzes\/[^/]+/.test(pathname)) return '/quizzes';
  if (/^\/learning-paths\/[^/]+/.test(pathname)) return '/learning-paths';
  if (pathname.startsWith('/admin/') && pathname !== '/admin') return '/admin';
  if (pathname.startsWith('/parent/')) return '/dashboard';
  if (pathname === '/admin') return '/dashboard';

  return '/dashboard';
}

export function BackNavigationButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/dashboard') {
    return null;
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(resolveFallback(pathname));
  }

  return (
    <button className="globalBackButton" type="button" onClick={handleBack} aria-label="Quay lại trang trước">
      <ArrowLeft size={18} />
      Quay lại
    </button>
  );
}
