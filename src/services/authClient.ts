import { UserAccount } from '../types/calendar';

const TOKEN_KEY = 'calendar_q_auth_token_v2';
const USER_KEY = 'calendar_q_user_profile_v2';

export interface AuthResponse {
  user: UserAccount;
  token: string;
}

export function getStoredToken(): string | null {
  try {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem('calander_q_auth_token_v2') ||
      localStorage.getItem('samay_auth_token_v2')
    );
  } catch {
    return null;
  }
}

export function getStoredUser(): UserAccount | null {
  try {
    const raw =
      localStorage.getItem(USER_KEY) ||
      localStorage.getItem('calander_q_user_profile_v2') ||
      localStorage.getItem('samay_user_profile_v2');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(user: UserAccount | null, token: string | null): void {
  try {
    if (token && user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // ignore
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export async function signUpApi(name: string, email: string, pass: string): Promise<AuthResponse> {
  try {
    const data = await request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: pass }),
    });
    setStoredSession(data.user, data.token);
    return data;
  } catch (err) {
    // Fallback offline support
    const mockUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      provider: 'email',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    const mockToken = `mock-token-${Date.now()}`;
    setStoredSession(mockUser, mockToken);
    return { user: mockUser, token: mockToken };
  }
}

export async function loginApi(email: string, pass: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass }),
  });
  setStoredSession(data.user, data.token);
  return data;
}

export async function oauthApi(
  email: string,
  name: string,
  provider: 'google' | 'apple',
  avatar?: string
): Promise<AuthResponse> {
  try {
    const data = await request<AuthResponse>('/api/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({ email, name, provider, avatar }),
    });
    setStoredSession(data.user, data.token);
    return data;
  } catch {
    const mockUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      avatar,
      provider,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };
    const mockToken = `oauth-token-${Date.now()}`;
    setStoredSession(mockUser, mockToken);
    return { user: mockUser, token: mockToken };
  }
}

export async function fetchCurrentAccount(): Promise<UserAccount | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const data = await request<{ user: UserAccount }>('/api/auth/me');
    setStoredSession(data.user, token);
    return data.user;
  } catch {
    // Return stored cached user if server uncontactable
    return getStoredUser();
  }
}

export async function logoutApi(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  } finally {
    setStoredSession(null, null);
  }
}

export async function verifyEmailApi(email: string, code: string): Promise<boolean> {
  try {
    await request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    const cur = getStoredUser();
    if (cur && cur.email.toLowerCase() === email.toLowerCase()) {
      cur.emailVerified = true;
      setStoredSession(cur, getStoredToken());
    }
    return true;
  } catch (err: any) {
    throw new Error(err.message || 'Verification failed');
  }
}

export async function forgotPasswordApi(email: string): Promise<string> {
  const data = await request<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return data.message;
}

export async function resetPasswordApi(token: string, newPass: string): Promise<boolean> {
  await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword: newPass }),
  });
  return true;
}

export async function updateProfileApi(updates: Partial<UserAccount>): Promise<UserAccount> {
  const data = await request<{ user: UserAccount }>('/api/auth/profile', {
    method: 'POST',
    body: JSON.stringify(updates),
  });
  setStoredSession(data.user, getStoredToken());
  return data.user;
}

export async function deleteAccountApi(): Promise<boolean> {
  await request('/api/auth/account', { method: 'DELETE' });
  setStoredSession(null, null);
  return true;
}

export async function fetchUserOutbox(): Promise<unknown[]> {
  try {
    const data = await request<{ emails: unknown[] }>('/api/email/outbox');
    return data.emails || [];
  } catch {
    return [];
  }
}

export async function dispatchTransactionalEmail(payload: {
  to: string;
  subject: string;
  body: string;
  type?: string;
}): Promise<boolean> {
  try {
    await request('/api/email/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}
