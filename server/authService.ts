import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), '.data');

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  avatar?: string;
  provider: 'email' | 'google' | 'apple';
  emailVerified: boolean;
  verificationCode?: string;
  resetToken?: string | null;
  resetTokenExpires?: number | null;
  primaryCalendarId?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSession {
  token: string;
  userId: string;
  expiresAt: number;
}

export interface TransactionalEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  type: 'verification' | 'password_reset' | 'security_login' | 'reminder' | 'invitation';
  sentAt: string;
  status: 'delivered';
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sendTransactionalEmail(payload: {
  to: string;
  subject: string;
  body: string;
  type: TransactionalEmail['type'];
}): TransactionalEmail {
  const emails = readJsonFile<TransactionalEmail[]>('emails.json', []);
  const emailItem: TransactionalEmail = {
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    to: payload.to.toLowerCase(),
    from: 'no-reply@calendar.q',
    subject: payload.subject,
    body: payload.body,
    type: payload.type,
    sentAt: new Date().toISOString(),
    status: 'delivered',
  };
  emails.unshift(emailItem);
  writeJsonFile('emails.json', emails.slice(0, 500)); // retain last 500 emails
  console.log(`[Transactional Email] Sent "${payload.subject}" to ${payload.to}`);
  return emailItem;
}

export function getEmailsForUser(email: string): TransactionalEmail[] {
  const emails = readJsonFile<TransactionalEmail[]>('emails.json', []);
  const clean = email.toLowerCase().trim();
  return emails.filter((e) => e.to === clean);
}

export function signUp(name: string, email: string, password: string): { user: StoredUser; token: string } {
  const users = readJsonFile<StoredUser[]>('users.json', []);
  const cleanEmail = email.toLowerCase().trim();

  if (users.some((u) => u.email === cleanEmail)) {
    throw new Error('An account with this email address already exists.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const verificationCode = generateCode();
  const now = new Date().toISOString();

  const user: StoredUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || cleanEmail.split('@')[0],
    email: cleanEmail,
    passwordHash,
    salt,
    avatar: '',
    provider: 'email',
    emailVerified: false,
    verificationCode,
    primaryCalendarId: 'gregorian',
    timezone: 'UTC',
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  writeJsonFile('users.json', users);

  // Send verification email
  sendTransactionalEmail({
    to: cleanEmail,
    subject: 'Verify your calendar.q account',
    body: `Hello ${user.name},\n\nThank you for signing up for calendar.q. Your verification code is:\n\n${verificationCode}\n\nEnter this code in the application to verify your email address.\n\nBest regards,\nThe calendar.q Team`,
    type: 'verification',
  });

  const sessionToken = generateRandomToken();
  const sessions = readJsonFile<StoredSession[]>('sessions.json', []);
  sessions.push({
    token: sessionToken,
    userId: user.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  writeJsonFile('sessions.json', sessions);

  return { user: sanitizeUser(user), token: sessionToken };
}

export function signIn(email: string, password: string): { user: StoredUser; token: string } {
  const users = readJsonFile<StoredUser[]>('users.json', []);
  const cleanEmail = email.toLowerCase().trim();
  const user = users.find((u) => u.email === cleanEmail);

  if (!user || !user.passwordHash || !user.salt) {
    throw new Error('Invalid email or password.');
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    throw new Error('Invalid email or password.');
  }

  // Send security login notification
  sendTransactionalEmail({
    to: cleanEmail,
    subject: 'Security Notification: New login to calendar.q',
    body: `Hello ${user.name},\n\nA new login was detected for your calendar.q account on ${new Date().toLocaleString()}.\nIf this was you, no action is needed.\nIf you did not log in, please reset your password immediately.\n\nBest regards,\nThe calendar.q Security Team`,
    type: 'security_login',
  });

  const sessionToken = generateRandomToken();
  const sessions = readJsonFile<StoredSession[]>('sessions.json', []);
  sessions.push({
    token: sessionToken,
    userId: user.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  writeJsonFile('sessions.json', sessions);

  return { user: sanitizeUser(user), token: sessionToken };
}

export function oauthSignIn(
  email: string,
  name: string,
  provider: 'google' | 'apple',
  avatar?: string
): { user: StoredUser; token: string } {
  const users = readJsonFile<StoredUser[]>('users.json', []);
  const cleanEmail = email.toLowerCase().trim();
  let user = users.find((u) => u.email === cleanEmail);

  const now = new Date().toISOString();
  if (!user) {
    user = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      avatar: avatar || '',
      provider,
      emailVerified: true,
      primaryCalendarId: 'gregorian',
      timezone: 'UTC',
      createdAt: now,
      updatedAt: now,
    };
    users.push(user);
    writeJsonFile('users.json', users);

    sendTransactionalEmail({
      to: cleanEmail,
      subject: `Welcome to calendar.q via ${provider === 'google' ? 'Google' : 'Apple'}`,
      body: `Hello ${user.name},\n\nYour account has been connected with ${provider}. You can now view and manage your calendars across all devices.\n\nBest regards,\nThe calendar.q Team`,
      type: 'verification',
    });
  } else {
    // Update existing user provider/avatar if not present
    let changed = false;
    if (avatar && !user.avatar) {
      user.avatar = avatar;
      changed = true;
    }
    if (!user.emailVerified) {
      user.emailVerified = true;
      changed = true;
    }
    if (changed) {
      user.updatedAt = now;
      writeJsonFile('users.json', users);
    }
  }

  const sessionToken = generateRandomToken();
  const sessions = readJsonFile<StoredSession[]>('sessions.json', []);
  sessions.push({
    token: sessionToken,
    userId: user.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  writeJsonFile('sessions.json', sessions);

  return { user: sanitizeUser(user), token: sessionToken };
}

export function getUserByToken(token: string): StoredUser | null {
  const sessions = readJsonFile<StoredSession[]>('sessions.json', []);
  const session = sessions.find((s) => s.token === token && s.expiresAt > Date.now());
  if (!session) return null;

  const users = readJsonFile<StoredUser[]>('users.json', []);
  const user = users.find((u) => u.id === session.userId);
  return user ? sanitizeUser(user) : null;
}

export function logout(token: string): boolean {
  const sessions = readJsonFile<StoredSession[]>('sessions.json', []);
  const next = sessions.filter((s) => s.token !== token);
  writeJsonFile('sessions.json', next);
  return true;
}

export function verifyEmail(email: string, code: string): boolean {
  const users = readJsonFile<StoredUser[]>('users.json', []);
  const cleanEmail = email.toLowerCase().trim();
  const user = users.find((u) => u.email === cleanEmail);

  if (!user) throw new Error('User not found.');
  if (user.verificationCode !== code.trim()) {
    throw new Error('Invalid verification code.');
  }

  user.emailVerified = true;
  user.verificationCode = undefined;
  user.updatedAt = new Date().toISOString();
  writeJsonFile('users.json', users);
  return true;
}

export function forgotPassword(email: string): string {
  const users = readJsonFile<StoredUser[]>('users.json', []);
  const cleanEmail = email.toLowerCase().trim();
  const user = users.find((u) => u.email === cleanEmail);

  if (!user) {
    // Return mock success to prevent email enumeration
    return 'If the email exists, a reset link has been dispatched.';
  }

  const resetToken = generateRandomToken().slice(0, 16);
  user.resetToken = resetToken;
  user.resetTokenExpires = Date.now() + 3600 * 1000; // 1 hour
  user.updatedAt = new Date().toISOString();
  writeJsonFile('users.json', users);

  sendTransactionalEmail({
    to: cleanEmail,
    subject: 'Reset your calendar.q password',
    body: `Hello ${user.name},\n\nWe received a request to reset your password. Use the reset token below in the app:\n\n${resetToken}\n\nThis token will expire in 1 hour.\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nThe calendar.q Team`,
    type: 'password_reset',
  });

  return resetToken;
}

export function resetPassword(token: string, newPass: string): boolean {
  const users = readJsonFile<StoredUser[]>('users.json', []);
  const user = users.find(
    (u) => u.resetToken === token.trim() && (u.resetTokenExpires || 0) > Date.now()
  );

  if (!user) {
    throw new Error('Invalid or expired reset token.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  user.passwordHash = hashPassword(newPass, salt);
  user.salt = salt;
  user.resetToken = null;
  user.resetTokenExpires = null;
  user.updatedAt = new Date().toISOString();
  writeJsonFile('users.json', users);

  sendTransactionalEmail({
    to: user.email,
    subject: 'Your calendar.q password was changed',
    body: `Hello ${user.name},\n\nYour account password has been successfully updated. If you did not make this change, please contact support immediately.\n\nBest regards,\nThe calendar.q Team`,
    type: 'security_login',
  });

  return true;
}

export function updateProfile(
  userId: string,
  updates: { name?: string; timezone?: string; primaryCalendarId?: string; avatar?: string }
): StoredUser {
  const users = readJsonFile<StoredUser[]>('users.json', []);
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found.');

  if (typeof updates.name === 'string' && updates.name.trim()) user.name = updates.name.trim();
  if (typeof updates.timezone === 'string') user.timezone = updates.timezone;
  if (typeof updates.primaryCalendarId === 'string') user.primaryCalendarId = updates.primaryCalendarId;
  if (typeof updates.avatar === 'string') user.avatar = updates.avatar;

  user.updatedAt = new Date().toISOString();
  writeJsonFile('users.json', users);
  return sanitizeUser(user);
}

export function deleteAccount(userId: string): boolean {
  let users = readJsonFile<StoredUser[]>('users.json', []);
  const target = users.find((u) => u.id === userId);
  if (!target) return false;

  users = users.filter((u) => u.id !== userId);
  writeJsonFile('users.json', users);

  // Clear sessions
  let sessions = readJsonFile<StoredSession[]>('sessions.json', []);
  sessions = sessions.filter((s) => s.userId !== userId);
  writeJsonFile('sessions.json', sessions);

  // Clear user data files if any
  const eventsFile = path.join(DATA_DIR, `events_${userId}.json`);
  if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);

  const prefsFile = path.join(DATA_DIR, `prefs_${userId}.json`);
  if (fs.existsSync(prefsFile)) fs.unlinkSync(prefsFile);

  sendTransactionalEmail({
    to: target.email,
    subject: 'calendar.q Account Deleted',
    body: `Hello ${target.name},\n\nAs requested, your calendar.q account and all associated personal data have been permanently deleted from our servers.\n\nThank you for using calendar.q.\n\nBest regards,\nThe calendar.q Privacy Team`,
    type: 'verification',
  });

  return true;
}

export function getUserEvents(userId: string): unknown[] {
  return readJsonFile<unknown[]>(`events_${userId}.json`, []);
}

export function saveUserEvents(userId: string, events: unknown[]): void {
  writeJsonFile(`events_${userId}.json`, events);
}

export function getUserPreferences(userId: string): Record<string, unknown> {
  return readJsonFile<Record<string, unknown>>(`prefs_${userId}.json`, {});
}

export function saveUserPreferences(userId: string, prefs: Record<string, unknown>): void {
  writeJsonFile(`prefs_${userId}.json`, prefs);
}

function sanitizeUser(user: StoredUser): StoredUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider,
    emailVerified: user.emailVerified,
    primaryCalendarId: user.primaryCalendarId,
    timezone: user.timezone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
