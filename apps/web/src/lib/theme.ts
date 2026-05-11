export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'englishpro.theme';

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;

  const value = window.localStorage.getItem(THEME_KEY);
  if (value === 'light' || value === 'dark') {
    return value;
  }

  return null;
}

export function getPreferredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  const stored = getStoredTheme();
  if (stored) return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function setStoredTheme(theme: ThemeMode) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(THEME_KEY, theme);
}
