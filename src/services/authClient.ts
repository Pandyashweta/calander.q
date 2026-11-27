import { CalendarEvent, UserAccount } from '../types/calendar';
import { isDownloadedAppRuntime } from '../hooks/usePWAInstall';

/**
 * Authentication & Account Storage:
 * - On the main website (browser tab): uses server-backed accounts (/api/auth/*) and
 *   server-synced events/preferences (/api/sync/*). No on-device local accounts.
 * - Inside a downloaded/installed app (PWA standalone, Desktop, iOS/Android app):
 *   supports full on-device local accounts & offline storage.
 */

const ACCOUNTS_DB_KEY = 'calendar_q_local_accounts_v3';
const SESSION_TOKEN_KEY = 'calendar_q_session_token_v3';
const SESSION_USER_KEY = 'calendar_q_session_user_v3';

interface StoredLocalAccount extends UserAccount {
  passwordHash?: string;
  passwordSalt?: string;
}

export interface AuthResponse {
  user: UserAccount;
  token: string;
}

export function isLocalModeAllowed(): boolean {
  return isDownloadedAppRuntime();
}

function readLocalAccounts(): StoredLocalAccount[] {
  if (!isLocalModeAllowed()) return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_DB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalAccounts(accounts: StoredLocalAccount[]): void {
  if (!isLocalModeAllowed()) return;
  try {
    localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(accounts));
  } catch {
    // storage quota fallback
  }
}

function stripSecrets(acc: StoredLocalAccount): UserAccount {
  const { passwordHash: _h, passwordSalt: _s, ...publicUser } = acc;
  return publicUser;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `${salt}::${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return `fb-${(h >>> 0).toString(16)}`;
}

function generateSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  // On the main website, store session only in sessionStorage; in downloaded app, persist in localStorage
  return isLocalModeAllowed() ? window.localStorage : window.sessionStorage;
}

export function getStoredToken(): string | null {
  try {
    return getSessionStorage()?.getItem(SESSION_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export function getStoredUser(): UserAccount | null {
  try {
    const raw = getSessionStorage()?.getItem(SESSION_USER_KEY);
    return raw ? (JSON.parse(raw) as UserAccount) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(user: UserAccount | null, token: string | null): void {
  try {
    const store = getSessionStorage();
    if (!store) return;
    if (token && user) {
      store.setItem(SESSION_TOKEN_KEY, token);
      store.setItem(SESSION_USER_KEY, JSON.stringify(user));
    } else {
      store.removeItem(SESSION_TOKEN_KEY);
      store.removeItem(SESSION_USER_KEY);
    }
  } catch {
    // ignore
  }
}

export function listLocalAccounts(): UserAccount[] {
  if (!isLocalModeAllowed()) return [];
  return readLocalAccounts().map(stripSecrets);
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  const resp = await fetch(url, { ...init, headers });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error?.message || `Request failed (${resp.status})`);
  }
  return data as T;
}

export async function signUpApi(
  name: string,
  email: string,
  pass: string
): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!pass || pass.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  // Main website: server-backed sign-up only
  if (!isLocalModeAllowed()) {
    const res = await apiJson<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), email: cleanEmail, password: pass }),
    });
    setStoredSession(res.user, res.token);
    return res;
  }

  // Downloaded app: on-device local account
  const accounts = readLocalAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
    throw new Error('An account with this email already exists on this device. Please sign in instead.');
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(pass, salt);
  const newAccount: StoredLocalAccount = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || cleanEmail.split('@')[0],
    email: cleanEmail,
    provider: 'email',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    passwordSalt: salt,
    passwordHash,
  };

  accounts.push(newAccount);
  writeLocalAccounts(accounts);

  const user = stripSecrets(newAccount);
  const token = `local-session-${generateSalt()}`;
  setStoredSession(user, token);
  return { user, token };
}

export async function loginApi(email: string, pass: string): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();

  // Main website: server-backed login only
  if (!isLocalModeAllowed()) {
    const res = await apiJson<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, password: pass }),
    });
    setStoredSession(res.user, res.token);
    return res;
  }

  const accounts = readLocalAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!found) {
    throw new Error('No account found for this email on this device. Create a new account first.');
  }

  if (found.provider === 'google' && !found.passwordHash) {
    throw new Error('This account uses Google Sign-In. Please click "Continue with Google".');
  }

  const candidateHash = await hashPassword(pass, found.passwordSalt || '');
  if (candidateHash !== found.passwordHash) {
    throw new Error('Incorrect password. Please try again.');
  }

  const user = stripSecrets(found);
  const token = `local-session-${generateSalt()}`;
  setStoredSession(user, token);
  return { user, token };
}

export async function oauthApi(
  email: string,
  name: string,
  provider: 'google' | 'apple',
  avatar?: string
): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isLocalModeAllowed()) {
    const res = await apiJson<AuthResponse>('/api/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, name: name.trim(), provider, avatar }),
    });
    setStoredSession(res.user, res.token);
    return res;
  }

  const accounts = readLocalAccounts();
  let found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!found) {
    found = {
      id: `${provider}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      avatar,
      provider,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };
    accounts.push(found);
  } else {
    found.name = name.trim() || found.name;
    if (avatar) found.avatar = avatar;
    found.emailVerified = true;
  }

  writeLocalAccounts(accounts);
  const user = stripSecrets(found);
  const token = `local-oauth-${generateSalt()}`;
  setStoredSession(user, token);
  return { user, token };
}

export async function fetchCurrentAccount(): Promise<UserAccount | null> {
  const token = getStoredToken();
  if (!token) return null;

  if (!isLocalModeAllowed()) {
    try {
      const res = await apiJson<{ user: UserAccount }>('/api/auth/me');
      setStoredSession(res.user, token);
      return res.user;
    } catch {
      setStoredSession(null, null);
      return null;
    }
  }

  return getStoredUser();
}

export async function logoutApi(): Promise<void> {
  const token = getStoredToken();
  if (!isLocalModeAllowed() && token) {
    try {
      await apiJson('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network error during logout
    }
  }
  setStoredSession(null, null);
}

export async function requestPasswordResetApi(email: string): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  const res = await apiJson<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: cleanEmail }),
  });
  return res.message || 'Password reset instructions sent.';
}

export async function resetLocalPasswordApi(
  email: string,
  newPass: string
): Promise<boolean> {
  if (!isLocalModeAllowed()) {
    throw new Error('On-device password reset is only available inside the downloaded app.');
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!newPass || newPass.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }
  const accounts = readLocalAccounts();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
  if (idx === -1) {
    throw new Error('No account found for that email on this device.');
  }
  const salt = generateSalt();
  accounts[idx].passwordSalt = salt;
  accounts[idx].passwordHash = await hashPassword(newPass, salt);
  writeLocalAccounts(accounts);
  return true;
}

export async function updateProfileApi(updates: Partial<UserAccount>): Promise<UserAccount> {
  if (!isLocalModeAllowed()) {
    const res = await apiJson<{ user: UserAccount }>('/api/auth/profile', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
    setStoredSession(res.user, getStoredToken());
    return res.user;
  }

  const current = getStoredUser();
  if (!current) {
    throw new Error('No active session.');
  }
  const accounts = readLocalAccounts();
  const idx = accounts.findIndex((a) => a.id === current.id || a.email === current.email);
  const merged: UserAccount = {
    ...current,
    ...updates,
    id: current.id,
    email: current.email,
  };
  if (idx !== -1) {
    accounts[idx] = { ...accounts[idx], ...merged };
    writeLocalAccounts(accounts);
  }
  setStoredSession(merged, getStoredToken() || `local-session-${generateSalt()}`);
  return merged;
}

export async function deleteAccountApi(): Promise<boolean> {
  if (!isLocalModeAllowed()) {
    await apiJson('/api/auth/account', { method: 'DELETE' });
    setStoredSession(null, null);
    return true;
  }

  const current = getStoredUser();
  if (current) {
    const accounts = readLocalAccounts().filter(
      (a) => a.id !== current.id && a.email.toLowerCase() !== current.email.toLowerCase()
    );
    writeLocalAccounts(accounts);
  }
  setStoredSession(null, null);
  return true;
}

export async function fetchSyncedEventsApi(): Promise<CalendarEvent[]> {
  if (!getStoredToken()) return [];
  try {
    const res = await apiJson<{ events: CalendarEvent[] }>('/api/sync/events');
    return Array.isArray(res.events) ? res.events : [];
  } catch {
    return [];
  }
}

export async function saveSyncedEventsApi(events: CalendarEvent[]): Promise<void> {
  if (!getStoredToken()) return;
  try {
    await apiJson('/api/sync/events', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  } catch {
    // ignore transient sync error
  }
}

export async function fetchSyncedPreferencesApi(): Promise<Record<string, unknown>> {
  if (!getStoredToken()) return {};
  try {
    const res = await apiJson<{ preferences: Record<string, unknown> }>('/api/sync/preferences');
    return res.preferences && typeof res.preferences === 'object' ? res.preferences : {};
  } catch {
    return {};
  }
}

export async function saveSyncedPreferencesApi(preferences: Record<string, unknown>): Promise<void> {
  if (!getStoredToken()) return;
  try {
    await apiJson('/api/sync/preferences', {
      method: 'POST',
      body: JSON.stringify({ preferences }),
    });
  } catch {
    // ignore transient sync error
  }
}
