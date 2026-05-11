'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useEffect, useState } from 'react';
import { applyTheme, getPreferredTheme, setStoredTheme, type ThemeMode } from '../lib/theme';

export function ThemeToggleButton() {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function handleToggle() {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const isDark = theme === 'dark';

  return (
    <button className="secondaryButton themeToggle" type="button" onClick={handleToggle}>
      {isDark ? <SunMedium size={18} /> : <MoonStar size={18} />}
      <span>{isDark ? 'Ngày' : 'Đêm'}</span>
    </button>
  );
}
