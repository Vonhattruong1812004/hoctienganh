export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/api';

export function resolveApiAssetUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const base = API_URL.replace(/\/api\/?$/, '');
  if (path.startsWith('/')) {
    return `${base}${path}`;
  }

  return `${base}/${path}`;
}

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(body || `API request failed: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type ApiOptions = RequestInit & {
  token?: string | null;
};

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!headers.has('Content-Type') && options.body && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(0, 'Không kết nối được tới API. Hãy kiểm tra backend/local server đang chạy.');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string, token?: string | null): Promise<T> {
  return apiFetch<T>(path, { method: 'GET', token });
}

export function apiPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    token,
    body: JSON.stringify(body),
  });
}

export function apiPostForm<T>(path: string, body: FormData, token?: string | null): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    token,
    body,
  });
}
