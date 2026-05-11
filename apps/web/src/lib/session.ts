export type WebAuthUser = {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
};

export type WebAuthSession = {
  accessToken: string;
  user: WebAuthUser;
};

const SESSION_KEY = 'englishpro.session';

export function getStoredSession(): WebAuthSession | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WebAuthSession;
  } catch {
    return null;
  }
}

export function setStoredSession(session: WebAuthSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_KEY);
}
