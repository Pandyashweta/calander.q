import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Apple,
  CheckCircle2,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { UserAccount } from '../types/calendar';
import {
  deleteAccountApi,
  fetchUserOutbox,
  forgotPasswordApi,
  loginApi,
  logoutApi,
  oauthApi,
  resetPasswordApi,
  signUpApi,
  updateProfileApi,
  verifyEmailApi,
} from '../services/authClient';

export type AuthModalTab = 'signin' | 'signup' | 'forgot' | 'reset' | 'verify' | 'profile';

interface AuthModalProps {
  open: boolean;
  initialTab?: AuthModalTab;
  currentUser: UserAccount | null;
  onClose: () => void;
  onUserChange: (user: UserAccount | null) => void;
  showToast?: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  initialTab = 'signin',
  currentUser,
  onClose,
  onUserChange,
  showToast,
}) => {
  const [tab, setTab] = useState<AuthModalTab>(currentUser ? 'profile' : initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outbox, setOutbox] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setTab(currentUser ? 'profile' : initialTab);
      if (currentUser) {
        setName(currentUser.name || '');
        setEmail(currentUser.email || '');
        fetchUserOutbox().then(setOutbox).catch(() => {});
      }
    }
  }, [open, currentUser, initialTab]);

  if (!open) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      onUserChange(res.user);
      if (showToast) showToast(`Signed in as ${res.user.name}`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
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
      onUserChange(res.user);
      if (showToast) showToast('Account created! Please check your email for the verification code.');
      setTab('verify');
    } catch (err: any) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      // Simulate/trigger Google sign-in
      const promptEmail = email || 'user@gmail.com';
      const promptName = name || 'Google User';
      const res = await oauthApi(promptEmail, promptName, 'google');
      onUserChange(res.user);
      if (showToast) showToast(`Connected with Google as ${res.user.email}`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const promptEmail = email || 'user@icloud.com';
      const promptName = name || 'Apple User';
      const res = await oauthApi(promptEmail, promptName, 'apple');
      onUserChange(res.user);
      if (showToast) showToast(`Connected with Apple as ${res.user.email}`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Apple sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const targetEmail = currentUser?.email || email;
      await verifyEmailApi(targetEmail, verifyCode);
      if (currentUser) {
        onUserChange({ ...currentUser, emailVerified: true });
      }
      if (showToast) showToast('Email verified successfully!');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const msg = await forgotPasswordApi(email);
      if (showToast) showToast(msg);
      setTab('reset');
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPasswordApi(resetToken, newPassword);
      if (showToast) showToast('Password reset successfully. Please log in.');
      setTab('signin');
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    onUserChange(null);
    if (showToast) showToast('Logged out of calendar.q.');
    onClose();
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccountApi();
      onUserChange(null);
      if (showToast) showToast('Account and all data have been deleted.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      const updated = await updateProfileApi({ name });
      onUserChange(updated);
      if (showToast) showToast('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] bg-white rounded-xl shadow-2xl border border-[#E0E0E0] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EFEFEF] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1A1A1A]" />
            <h2 className="text-[14px] font-semibold text-[#1A1A1A]">
              {tab === 'profile'
                ? 'Account & Security'
                : tab === 'signup'
                ? 'Create calendar.q Account'
                : tab === 'forgot'
                ? 'Forgot Password'
                : tab === 'reset'
                ? 'Reset Password'
                : tab === 'verify'
                ? 'Verify Email Address'
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

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-4 p-2.5 rounded-lg bg-[#FDE2E4] border border-[#F5B7BC] text-[#8A1520] text-[12px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto cal-scroll max-h-[75vh]">
          {/* ================= SIGN IN TAB ================= */}
          {tab === 'signin' && (
            <div className="space-y-4">
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
                      onClick={() => setTab('forgot')}
                      className="text-[11.5px] text-[#185D8F] hover:underline cursor-pointer"
                    >
                      Forgot password?
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
                  disabled={loading}
                  className="w-full py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In with Email'}
                </button>
              </form>

              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-[#EAEAEA] w-full" />
                <span className="bg-white px-2 text-[11px] text-[#888888] absolute">or</span>
              </div>

              {/* OAuth Providers */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-[36px] bg-white hover:bg-[#F8F9FA] border border-[#DADCE0] rounded-lg text-[#3C4043] text-[12.5px] font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className="w-full h-[36px] bg-black hover:bg-[#222222] text-white rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Apple className="w-4 h-4 fill-current" />
                  <span>Continue with Apple</span>
                </button>
              </div>

              <div className="pt-2 text-center text-[12px] text-[#737373]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-[#185D8F] font-medium hover:underline cursor-pointer"
                >
                  Create one now
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
                      placeholder="Jane Doe"
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
                  disabled={loading}
                  className="w-full py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <div className="pt-2 text-center text-[12px] text-[#737373]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="text-[#185D8F] font-medium hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* ================= VERIFY EMAIL TAB ================= */}
          {tab === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-[12px] text-[#666666] leading-relaxed">
                Enter the 6-digit verification code sent to{' '}
                <strong className="text-[#1A1A1A]">{currentUser?.email || email}</strong>:
              </p>
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-[20px] font-mono py-2 bg-white border border-[#DCDCDC] rounded-lg text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                />
              </div>
              <button
                type="submit"
                disabled={loading || verifyCode.length < 6}
                className="w-full py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg text-[13px] font-medium cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          )}

          {/* ================= FORGOT PASSWORD TAB ================= */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-[12px] text-[#666666] leading-relaxed">
                Enter your email address and we will dispatch a password reset token to your inbox.
              </p>
              <div>
                <label className="block text-[12px] font-medium text-[#404040] mb-1">
                  Email address
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
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg text-[13px] font-medium cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="text-[12px] text-[#737373] hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ================= RESET PASSWORD TAB ================= */}
          {tab === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-[12px] text-[#666666] leading-relaxed">
                Enter the reset token from your email and your new password.
              </p>
              <div>
                <label className="block text-[12px] font-medium text-[#404040] mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste token from email"
                  className="w-full bg-white border border-[#DCDCDC] rounded-lg px-3 py-1.5 text-[12.5px] text-[#1A1A1A] font-mono focus:outline-none focus:border-[#3B9AE1]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#404040] mb-1">
                  New Password (min 8 characters)
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
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg text-[13px] font-medium cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Set New Password'}
              </button>
            </form>
          )}

          {/* ================= PROFILE & SECURITY TAB ================= */}
          {tab === 'profile' && currentUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA]">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white font-semibold flex items-center justify-center text-[15px] shrink-0">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-[#1A1A1A] truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[12px] text-[#737373] truncate">{currentUser.email}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {currentUser.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#1E7E34] font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTab('verify')}
                        className="text-[11px] text-[#B02A37] hover:underline font-medium cursor-pointer"
                      >
                        Verify email address
                      </button>
                    )}
                    <span className="text-[10.5px] text-[#9E9E9E] uppercase font-mono">
                      · {currentUser.provider}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Edit Form */}
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
                  className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-md text-[12px] font-medium cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </form>

              {/* Outbox Audit / Sent transactional emails */}
              <div className="pt-3 border-t border-[#EFEFEF] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[12px] font-semibold text-[#1A1A1A]">
                    Recent Notifications Dispatched ({outbox.length})
                  </h4>
                  <span className="text-[10.5px] text-[#888888]">Transactional Log</span>
                </div>
                {outbox.length === 0 ? (
                  <p className="text-[11.5px] text-[#888888]">No notifications logged yet.</p>
                ) : (
                  <div className="border border-[#EFEFEF] rounded-lg divide-y divide-[#F2F2F2] max-h-[140px] overflow-y-auto cal-scroll text-[11px]">
                    {outbox.slice(0, 5).map((m: any) => (
                      <div key={m.id} className="p-2 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#1A1A1A] truncate">{m.subject}</span>
                          <span className="text-[#888888] shrink-0">
                            {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[#666666] line-clamp-1">{m.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Actions */}
              <div className="pt-3 border-t border-[#EFEFEF] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DCDCDC] text-[12px] font-medium text-[#454545] hover:bg-[#F3F3F3] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>

                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-[12px] text-[#C92A2A] hover:underline cursor-pointer"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
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
                      Confirm Delete
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
