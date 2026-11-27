import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Lock,
  LogOut,
  Mail,
  Shield,
  User,
  X,
} from 'lucide-react';
import { UserAccount } from '../types/calendar';
import {
  deleteAccountApi,
  isLocalModeAllowed,
  listLocalAccounts,
  loginApi,
  logoutApi,
  requestPasswordResetApi,
  resetLocalPasswordApi,
  signUpApi,
  updateProfileApi,
} from '../services/authClient';

export type AuthModalTab = 'signin' | 'signup' | 'forgot' | 'profile';

interface AuthModalProps {
  open: boolean;
  initialTab?: AuthModalTab;
  currentUser: UserAccount | null;
  onClose: () => void;
  onUserChange: (user: UserAccount | null, isFreshLogin?: boolean) => void;
  onGoogleSignIn?: () => Promise<void>;
  googleSyncing?: boolean;
  showToast?: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  initialTab = 'signin',
  currentUser,
  onClose,
  onUserChange,
  onGoogleSignIn,
  googleSyncing = false,
  showToast,
}) => {
  const [tab, setTab] = useState<AuthModalTab>(currentUser ? 'profile' : initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<UserAccount[]>([]);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const localAllowed = isLocalModeAllowed();

  useEffect(() => {
    if (open) {
      setError(null);
      setResetMessage(null);
      setConfirmDelete(false);
      setPassword('');
      setNewPassword('');
      setSavedAccounts(localAllowed ? listLocalAccounts() : []);
      setTab(currentUser ? 'profile' : initialTab);
      if (currentUser) {
        setName(currentUser.name || '');
        setEmail(currentUser.email || '');
      }
    }
  }, [open, currentUser, initialTab, localAllowed]);

  if (!open) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      onUserChange(res.user, true);
      showToast?.(`Signed in as ${res.user.name}`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signUpApi(name, email, password);
      onUserChange(res.user, true);
      showToast?.(
        localAllowed
          ? `Account created on this device for ${res.user.name}`
          : `Welcome to calendar.q, ${res.user.name}`
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    if (!onGoogleSignIn) {
      setError('Google sign-in is not available right now.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    setLoading(true);
    try {
      if (localAllowed) {
        await resetLocalPasswordApi(email, newPassword);
        showToast?.('Device password updated. You can now sign in.');
        setPassword('');
        setNewPassword('');
        setTab('signin');
      } else {
        const msg = await requestPasswordResetApi(email);
        setResetMessage(msg);
        showToast?.('Password reset link dispatched.');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    onUserChange(null, false);
    showToast?.('Signed out of calendar.q.');
    onClose();
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccountApi();
      onUserChange(null, false);
      showToast?.('Account deleted.');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateProfileApi({ name: name.trim() || currentUser.name });
      onUserChange(updated, false);
      showToast?.('Profile updated.');
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="w-full max-w-[440px] bg-white rounded-xl shadow-2xl border border-[#E0E0E0] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EFEFEF] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1A1A1A]" />
            <h2 className="text-[14px] font-semibold text-[#1A1A1A]">
              {tab === 'profile'
                ? localAllowed
                  ? 'Device Account & Profile'
                  : 'Account & Profile'
                : tab === 'signup'
                ? localAllowed
                  ? 'Create Local Account'
                  : 'Create Account'
                : tab === 'forgot'
                ? localAllowed
                  ? 'Reset Device Password'
                  : 'Reset Password'
                : 'Sign In to calendar.q'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md hover:bg-[#F2F2F2] text-[#7A7A7A] hover:text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device-Local Privacy Notice (Only shown inside the downloaded app) */}
        {localAllowed && (
          <div className="mx-5 mt-4 px-3 py-2 rounded-lg bg-[#F7F7F7] border border-[#E8E8E8] flex items-start gap-2 text-[11.5px] text-[#525252]">
            <HardDrive className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0 mt-0.5" />
            <span>
              App local mode active: credentials and calendars stay stored privately on your device.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-[#FDE2E4] border border-[#F5B7BC] text-[#8A1520] text-[12px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {resetMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[12px] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-snug">{resetMessage}</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto cal-scroll max-h-[72vh]">
          {/* ================= SIGN IN TAB ================= */}
          {tab === 'signin' && (
            <div className="space-y-4">
              {localAllowed && savedAccounts.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-[#737373]">
                    Accounts on this device
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {savedAccounts.slice(0, 4).map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setEmail(acc.email)}
                        className="px-2.5 py-1 rounded-md bg-[#FAFAFA] hover:bg-[#F0F0F0] border border-[#E4E4E4] text-[11.5px] text-[#1A1A1A] cursor-pointer truncate max-w-full"
                      >
                        {acc.email}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#404040] mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white border border-[#DCDCDC] rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-medium text-[#404040]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setResetMessage(null);
                        setTab('forgot');
                      }}
                      className="text-[11.5px] text-[#185D8F] hover:underline cursor-pointer"
                    >
                      {localAllowed ? 'Reset device password' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-[#DCDCDC] rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleSyncing}
                  className="w-full py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-[#EAEAEA] w-full" />
                <span className="bg-white px-2 text-[11px] text-[#888888] absolute">or</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading || googleSyncing}
                className="w-full h-[38px] bg-white hover:bg-[#F8F9FA] border border-[#DADCE0] rounded-lg text-[#3C4043] text-[12.5px] font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{googleSyncing ? 'Connecting Google...' : 'Continue with Google'}</span>
              </button>

              <div className="pt-1 text-center text-[12px] text-[#737373]">
                {localAllowed ? 'New on this device? ' : 'New to calendar.q? '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTab('signup');
                  }}
                  className="text-[#185D8F] font-medium hover:underline cursor-pointer"
                >
                  {localAllowed ? 'Create a local account' : 'Create an account'}
                </button>
              </div>
            </div>
          )}

          {/* ================= SIGN UP TAB ================= */}
          {tab === 'signup' && (
            <div className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#404040] mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-white border border-[#DCDCDC] rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#404040] mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white border border-[#DCDCDC] rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#404040] mb-1">
                    Password (min 8 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-[#DCDCDC] rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleSyncing}
                  className="w-full py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading
                    ? 'Creating account...'
                    : localAllowed
                    ? 'Create Local Account'
                    : 'Create Account'}
                </button>
              </form>

              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-[#EAEAEA] w-full" />
                <span className="bg-white px-2 text-[11px] text-[#888888] absolute">or</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading || googleSyncing}
                className="w-full h-[38px] bg-white hover:bg-[#F8F9FA] border border-[#DADCE0] rounded-lg text-[#3C4043] text-[12.5px] font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{googleSyncing ? 'Connecting Google...' : 'Continue with Google'}</span>
              </button>

              <div className="pt-1 text-center text-[12px] text-[#737373]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTab('signin');
                  }}
                  className="text-[#185D8F] font-medium hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* ================= RESET PASSWORD TAB ================= */}
          {tab === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-[12px] text-[#666666] leading-relaxed">
                {localAllowed
                  ? 'Update the password for an account stored on this device.'
                  : 'Enter your account email to receive password reset instructions.'}
              </p>
              <div>
                <label className="block text-[12px] font-medium text-[#404040] mb-1">
                  Account email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white border border-[#DCDCDC] rounded-lg px-3 py-1.5 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                />
              </div>
              {localAllowed && (
                <div>
                  <label className="block text-[12px] font-medium text-[#404040] mb-1">
                    New password (min 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#DCDCDC] rounded-lg px-3 py-1.5 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg text-[13px] font-medium cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? 'Processing...'
                  : localAllowed
                  ? 'Update Device Password'
                  : 'Send Reset Link'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTab('signin');
                  }}
                  className="text-[12px] text-[#737373] hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ================= PROFILE TAB ================= */}
          {tab === 'profile' && currentUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA]">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-[#E0E0E0] shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white font-semibold flex items-center justify-center text-[15px] shrink-0">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-[#1A1A1A] truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[12px] text-[#737373] truncate">{currentUser.email}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#1E7E34] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {currentUser.provider === 'google'
                        ? 'Google Connected'
                        : localAllowed
                        ? 'Saved on this device'
                        : 'Account synced'}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#404040] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-[#DCDCDC] rounded-lg px-3 py-1.5 text-[12.5px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-md text-[12px] font-medium cursor-pointer"
                >
                  Save Profile
                </button>
              </form>

              <div className="pt-3 border-t border-[#EFEFEF] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DCDCDC] text-[12px] font-medium text-[#454545] hover:bg-[#F3F3F3] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>

                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-[12px] text-[#C92A2A] hover:underline cursor-pointer"
                  >
                    {localAllowed ? 'Remove Device Account' : 'Delete Account'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-[11.5px] text-[#666666] hover:underline cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="px-2.5 py-1 bg-[#D9383A] hover:bg-[#B02A37] text-white rounded text-[11.5px] font-medium cursor-pointer"
                    >
                      Confirm Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
