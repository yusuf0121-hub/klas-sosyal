import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Mail, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, verifyOtp, resetPassword, pendingVerificationEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [forgotMode, setForgotMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setError('Lütfen bir isim girin.');
        setBusy(false);
        return;
      }
      if (password.length < 6) {
        setError('Şifre en az 6 karakter olmalı.');
        setBusy(false);
        return;
      }
      const { error: err, needsVerification } = await signUp(email, password, displayName.trim(), bio.trim() || undefined);
      if (err) setError(err);
      else if (needsVerification) setOtpEmail(email);
    } else {
      const { error: err, needsVerification } = await signIn(email, password);
      if (err) setError(err);
      else if (needsVerification) setOtpEmail(email);
    }
    setBusy(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await verifyOtp(otpEmail!, otpCode.trim());
    if (err) setError(err);
    setBusy(false);
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
    setBusy(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await resetPassword(email);
    if (err) {
      setError(err);
    } else {
      setResetSent(true);
    }
    setBusy(false);
  }

  if (otpEmail || pendingVerificationEmail) {
    const verifyEmail = otpEmail ?? pendingVerificationEmail!;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 shadow-lg shadow-emerald-500/20 mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Doğrulama Kodu</h1>
            <p className="text-slate-400 mt-2 text-sm">
              <span className="text-emerald-400">{verifyEmail}</span> adresine 6 haneli kod gönderdik.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Doğrulama Kodu</label>
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-2xl text-center tracking-[0.5em] focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || otpCode.length !== 6}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {busy ? 'Doğrulanıyor...' : 'Doğrula ve Giriş Yap'}
              </button>
            </form>

            <button
              onClick={() => { setOtpEmail(null); setOtpCode(''); setError(null); }}
              className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Geri dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (forgotMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 shadow-lg shadow-sky-500/20 mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Şifremi Unuttum</h1>
            <p className="text-slate-400 mt-2 text-sm">E-posta adresine sıfırlama bağlantısı gönderelim.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
            {resetSent ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white font-medium text-sm mb-2">Bağlantı gönderildi!</p>
                <p className="text-slate-400 text-xs mb-6">E-postanı kontrol et ve şifreni sıfırla.</p>
                <button
                  onClick={() => { setForgotMode(false); setResetSent(false); setEmail(''); }}
                  className="w-full py-3 bg-gradient-to-r from-sky-400 to-emerald-400 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  Girişe Dön
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">E-posta</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@email.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                    />
                  </div>

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-300">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3.5 bg-gradient-to-r from-sky-400 to-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {busy ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                  </button>
                </form>

                <button
                  onClick={() => { setForgotMode(false); setError(null); setEmail(''); }}
                  className="w-full mt-4 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Giriş ekranına dön
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black flex items-center justify-center px-8 py-10">
      <section className="w-full max-w-[319px]">
        <div className="mb-7 text-center">
          <h1 className="text-[24px] font-bold leading-tight">Welcome back</h1>
          <p className="mt-1 text-[16px] text-[#64748b]">Login to your Klas Sosyal account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && <div><label className="mb-2 block text-sm font-medium">Name</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="h-10 w-full rounded-md border border-[#dfe1e5] px-3 text-sm outline-none transition placeholder:text-[#64748b] focus:border-[#18181b]" /></div>}
          <div><label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="m@example.com" className="h-10 w-full rounded-md border border-[#dfe1e5] px-3 text-sm outline-none transition placeholder:text-[#64748b] focus:border-[#18181b]" /></div>
          <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium">Password</label>{mode === 'login' && <button type="button" onClick={() => { setForgotMode(true); setError(null); }} className="text-sm text-black hover:underline">Forgot your password?</button>}</div><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 w-full rounded-md border border-[#dfe1e5] px-3 text-sm outline-none transition focus:border-[#18181b]" /></div>
          {mode === 'signup' && <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio (optional)" rows={3} maxLength={160} className="w-full resize-none rounded-md border border-[#dfe1e5] px-3 py-2 text-sm outline-none placeholder:text-[#64748b] focus:border-[#18181b]" />}
          {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}
          <button type="submit" disabled={busy} className="h-10 w-full rounded-md bg-[#29292b] text-sm font-semibold text-white transition hover:bg-[#18181b] disabled:opacity-50">{busy ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Login'}</button>
        </form>

        <div className="my-7 flex items-center gap-3"><div className="h-px flex-1 bg-[#dfe1e5]"/><span className="text-sm text-[#64748b]">Or continue with</span><div className="h-px flex-1 bg-[#dfe1e5]"/></div>
        <div className="grid grid-cols-3 gap-4">
          <button type="button" aria-label="Apple ile devam et" className="flex h-10 items-center justify-center rounded-md border border-[#dfe1e5] text-xl transition hover:bg-slate-50"></button>
          <button type="button" onClick={handleGoogle} disabled={busy} aria-label="Google ile devam et" className="flex h-10 items-center justify-center rounded-md border border-[#dfe1e5] text-xl font-semibold transition hover:bg-slate-50 disabled:opacity-50">G</button>
          <button type="button" aria-label="Meta ile devam et" className="flex h-10 items-center justify-center rounded-md border border-[#dfe1e5] text-lg font-semibold transition hover:bg-slate-50">∞</button>
        </div>
        <p className="mt-7 text-center text-sm">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }} className="underline underline-offset-2">{mode === 'login' ? 'Sign up' : 'Log in'}</button></p>
      </section>
    </main>
  );
}
