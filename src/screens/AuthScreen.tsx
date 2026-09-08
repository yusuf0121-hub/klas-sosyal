import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Mail, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, verifyOtp, resetPassword, updatePassword, pendingVerificationEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [forgotMode, setForgotMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (err) setError(err); else setResetSent(true);
    setBusy(false);
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    if (newPassword !== confirmPassword) { setError('Şifreler eşleşmiyor.'); return; }
    setBusy(true);
    const { error: err } = await updatePassword(newPassword);
    if (err) setError(err); else { setRecoveryMode(false); setForgotMode(false); setNewPassword(''); setConfirmPassword(''); setError(null); }
    setBusy(false);
  }

  if (recoveryMode) {
    return (
      <main className="min-h-screen bg-white text-black flex items-center justify-center px-8 py-10">
        <section className="w-full max-w-[319px]">
          <div className="mb-7 text-center"><h1 className="text-[24px] font-bold leading-tight">Yeni şifre oluştur</h1><p className="mt-1 text-[16px] text-[#64748b]">Klas Sosyal hesabın için güvenli bir şifre belirle</p></div>
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div><label htmlFor="new-password" className="mb-2 block text-sm font-medium">Yeni şifre</label><input id="new-password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-10 w-full rounded-md border border-[#dfe1e5] px-3 text-sm outline-none focus:border-[#18181b]" /></div>
            <div><label htmlFor="confirm-password" className="mb-2 block text-sm font-medium">Yeni şifreyi tekrar yaz</label><input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-10 w-full rounded-md border border-[#dfe1e5] px-3 text-sm outline-none focus:border-[#18181b]" /></div>
            {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}
            <button type="submit" disabled={busy} className="h-10 w-full rounded-md bg-[#29292b] text-sm font-semibold text-white hover:bg-[#18181b] disabled:opacity-50">{busy ? 'Kaydediliyor...' : 'Şifremi güncelle'}</button>
          </form>
        </section>
      </main>
    );
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
      <main className="min-h-screen bg-white text-black flex items-center justify-center px-8 py-10">
        <section className="w-full max-w-[319px]">
          <div className="mb-7 text-center">
            <h1 className="text-[24px] font-bold leading-tight">Şifreni sıfırla</h1>
            <p className="mt-1 text-[16px] text-[#64748b]">Klas Sosyal hesabın için yeni bir şifre oluştur</p>
          </div>
          {resetSent ? (
            <div className="text-center">
              <div className="rounded-md border border-[#dfe1e5] bg-white px-5 py-6">
                <Mail className="mx-auto mb-4 h-7 w-7 text-[#64748b]" aria-hidden="true" />
                <p className="text-sm font-medium">E-posta gönderildi</p>
                <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{email} adresine bir şifre sıfırlama bağlantısı gönderdik. E-postadaki bağlantıya dokunarak Klas Sosyal&apos;de yeni şifreni belirleyebilirsin.</p>
              </div>
              <button type="button" onClick={() => { setForgotMode(false); setResetSent(false); setEmail(''); }} className="mt-6 text-sm underline underline-offset-2">Giriş ekranına dön</button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div><label htmlFor="reset-email" className="mb-2 block text-sm font-medium">E-posta</label><input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" className="h-10 w-full rounded-md border border-[#dfe1e5] px-3 text-sm outline-none transition placeholder:text-[#64748b] focus:border-[#18181b]" /></div>
              {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}
              <button type="submit" disabled={busy} className="h-10 w-full rounded-md bg-[#29292b] text-sm font-semibold text-white transition hover:bg-[#18181b] disabled:opacity-50">{busy ? 'Gönderiliyor...' : 'Şifre sıfırlama kodu gönder'}</button>
              <button type="button" onClick={() => { setForgotMode(false); setError(null); setEmail(''); }} className="w-full text-sm underline underline-offset-2">Giriş ekranına dön</button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black flex items-center justify-center px-8 py-10">
      <section className="w-full max-w-[319px]">
        <div className="mb-7 text-center">
          <h1 className="text-[24px] font-bold leading-tight">Tekrar hoş geldin</h1>
          <p className="mt-1 text-[16px] text-[#64748b]">Klas Sosyal hesabına giriş yap</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && <div><label className="mb-2 block text-sm font-medium">İsim</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Adın" className="h-10 w-full rounded-md border border-[#dfe1e5] px-3 text-sm outline-none transition placeholder:text-[#64748b] focus:border-[#18181b]" /></div>}
          <div><label htmlFor="email" className="mb-2 block text-sm font-medium">E-posta</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" className="h-10 w-full rounded-md border border-[#dfe1e5] px-3 text-sm outline-none transition placeholder:text-[#64748b] focus:border-[#18181b]" /></div>
          <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium">Şifre</label>{mode === 'login' && <button type="button" onClick={() => { setForgotMode(true); setError(null); }} className="text-sm text-black hover:underline">Şifreni mi unuttun?</button>}</div><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 w-full rounded-md border border-[#dfe1e5] px-3 text-sm outline-none transition focus:border-[#18181b]" /></div>
          {mode === 'signup' && <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio (optional)" rows={3} maxLength={160} className="w-full resize-none rounded-md border border-[#dfe1e5] px-3 py-2 text-sm outline-none placeholder:text-[#64748b] focus:border-[#18181b]" />}
          {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}
          <button type="submit" disabled={busy} className="h-10 w-full rounded-md bg-[#29292b] text-sm font-semibold text-white transition hover:bg-[#18181b] disabled:opacity-50">{busy ? 'Lütfen bekleyin...' : mode === 'signup' ? 'Hesap oluştur' : 'Giriş yap'}</button>
        </form>

        <div className="my-7 flex items-center gap-3"><div className="h-px flex-1 bg-[#dfe1e5]"/><span className="text-sm text-[#64748b]">Şununla devam et</span><div className="h-px flex-1 bg-[#dfe1e5]"/></div>
        <div className="grid grid-cols-3 gap-4">
          <button type="button" aria-label="Apple ile devam et" title="Apple ile devam et" className="flex h-10 items-center justify-center rounded-md border border-[#dfe1e5] transition hover:bg-slate-50"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-black" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.63-2.2.45-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.97-2.53 4.08ZM12.03 7.25C11.88 5.02 13.69 3.18 15.82 3c.3 2.58-2.34 4.5-3.79 4.25Z"/></svg><span className="sr-only">Apple</span></button>
          <button type="button" onClick={handleGoogle} disabled={busy} aria-label="Google ile devam et" title="Google ile devam et" className="flex h-10 items-center justify-center rounded-md border border-[#dfe1e5] transition hover:bg-slate-50 disabled:opacity-50"><svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.74-.07-1.45-.21-2.13H12v4.03h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.92-4.18 2.92-7.29Z"/><path fill="#34A853" d="M12 21.8c2.64 0 4.86-.87 6.48-2.36l-3.14-2.45c-.87.58-1.98.93-3.34.93-2.56 0-4.73-1.73-5.51-4.06H3.25v2.53A9.8 9.8 0 0 0 12 21.8Z"/><path fill="#FBBC05" d="M6.49 13.86a5.9 5.9 0 0 1 0-3.72V7.61H3.25a9.8 9.8 0 0 0 0 8.78l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.08c1.44 0 2.73.5 3.75 1.48l2.81-2.81C16.86 3.13 14.64 2.2 12 2.2a9.8 9.8 0 0 0-8.75 5.41l3.24 2.53C7.27 7.81 9.44 6.08 12 6.08Z"/></svg><span className="sr-only">Google</span></button>
          <button type="button" aria-label="Meta ile devam et" title="Meta ile devam et" className="flex h-10 items-center justify-center rounded-md border border-[#dfe1e5] transition hover:bg-slate-50"><svg viewBox="0 0 32 18" className="h-5 w-7 fill-black" aria-hidden="true"><path d="M4.3 13.2C2.2 13.2 1 11.9 1 9.9c0-3.2 2.6-5.8 5.8-5.8 2 0 3.6.9 5.2 2.7l.8.9.8-.9c1.6-1.8 3.2-2.7 5.2-2.7 3.2 0 5.8 2.6 5.8 5.8 0 2-1.2 3.3-3.3 3.3-1.8 0-3.4-1.1-4.8-3.2l-3.7-5.2-3.7 5.2c-1.4 2.1-3 3.2-4.8 3.2Zm2.5-6.3c-1.8 0-3.2 1.4-3.2 3 0 .8.3 1.5.8 1.5.7 0 1.7-.8 2.8-2.4l1.5-2.1H6.8Zm12.2 0h-1.9l1.5 2.1c1.1 1.6 2.1 2.4 2.8 2.4.5 0 .8-.7.8-1.5 0-1.6-1.4-3-3.2-3Z"/></svg><span className="sr-only">Meta</span></button>
        </div>
        <p className="mt-7 text-center text-sm">{mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }} className="underline underline-offset-2">{mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}</button></p>
      </section>
    </main>
  );
}
