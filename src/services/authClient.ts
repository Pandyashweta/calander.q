import { UserAccount } from '../types/calendar';

/**
 * 100% Local-First Account & Session Storage.
 * Accounts created or signed into via email/password are stored privately on
 * the user's own computer or phone (localStorage) using salted SHA-256 hashes —
 * never uploaded to any remote server.
 */

const ACCOUNTS_DB_KEY = 'calendar_q_local_accounts_v3';
const SESSION_TOKEN_KEY = 'calendar_q_local_session_token_v3';
const SESSION_USER_KEY = 'calendar_q_local_session_user_v3';

interface StoredLocalAccount extends UserAccount {
  passwordHash?: string;
  passwordSalt?: string;
}

export interface AuthResponse {
  user: UserAccount;
  token: string;
}

function readLocalAccounts(): StoredLocalAccount[] {
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
  // Deterministic fallback for non-secure contexts
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

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    return raw ? (JSON.parse(raw) as UserAccount) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(user: UserAccount | null, token: string | null): void {
  try {
    if (token && user) {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
    }
  } catch {
    // ignore
  }
}

export function listLocalAccounts(): UserAccount[] {
  return readLocalAccounts().map(stripSecrets);
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
  const accounts = readLocalAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!found) {
    throw new Error('No local account found for this email on this device. Create a new account first.');
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
  return getStoredUser();
}

export async function logoutApi(): Promise<void> {
  setStoredSession(null, null);
}

export async function resetLocalPasswordApi(
  email: string,
  newPass: string
): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (!newPass || newPass.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }
  const accounts = readLocalAccounts();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
  if (idx === -1) {
    throw new Error('No local account found for that email on this device.');
  }
  const salt = generateSalt();
  accounts[idx].passwordSalt = salt;
  accounts[idx].passwordHash = await hashPassword(newPass, salt);
  writeLocalAccounts(accounts);
  return true;
}

export async function updateProfileApi(updates: Partial<UserAccount>): Promise<UserAccount> {
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
