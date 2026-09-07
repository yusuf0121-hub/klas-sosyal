import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Mail, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, verifyOtp, resetPassword, pendingVerificationEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
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
    <main className="min-h-screen bg-[#050505] text-white flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="text-xl font-black tracking-[-0.12em]">klas<span className="text-sky-400">.</span></div>
        <button type="button" onClick={() => { setMode('signup'); setError(null); }} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium transition hover:bg-white/10">
          Kayıt Ol
        </button>
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-3xl font-black tracking-[-0.12em] shadow-2xl shadow-sky-500/10">
              kl<span className="text-sky-400">.</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{mode === 'signup' ? 'Klas&apos;a katıl' : 'Tekrar hoş geldin'}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{mode === 'signup' ? 'Topluluğa katıl, paylaşmaya başla.' : 'Klas Sosyal hesabınla devam et.'}</p>
          </div>

          <div className="space-y-3">
            <button type="button" onClick={handleGoogle} disabled={busy} className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/[0.03] py-3 text-sm font-medium transition hover:bg-white/[0.08] disabled:opacity-50">
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google ile devam et
            </button>
            <div className="flex items-center gap-3 py-2"><div className="h-px flex-1 bg-white/10"/><span className="text-xs text-white/35">veya e-posta ile</span><div className="h-px flex-1 bg-white/10"/></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="İsim" className="w-full rounded-lg border border-white/15 bg-white/[0.03] px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-sky-400" />}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta adresi" className="w-full rounded-lg border border-white/15 bg-white/[0.03] px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-sky-400" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" className="w-full rounded-lg border border-white/15 bg-white/[0.03] px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-sky-400" />
            {mode === 'login' && <div className="text-right"><button type="button" onClick={() => { setForgotMode(true); setError(null); }} className="text-xs text-sky-400 hover:text-sky-300">Şifremi unuttum</button></div>}
            {mode === 'signup' && <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Kısa bio (isteğe bağlı)" rows={3} maxLength={160} className="w-full resize-none rounded-lg border border-white/15 bg-white/[0.03] px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-sky-400" />}
            {error && <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/85 disabled:opacity-50">{busy ? 'Lütfen bekleyin...' : mode === 'signup' ? 'Hesap Oluştur' : 'E-posta ile devam et'}</button>
          </form>

          <p className="mt-6 text-center text-sm text-white/45">{mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }} className="font-medium text-white hover:underline">{mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}</button></p>
          <p className="mt-10 text-center text-xs leading-relaxed text-white/30">Devam ederek Kullanım Koşulları ve Gizlilik Politikası&apos;nı kabul etmiş olursun.</p>
        </div>
      </section>
    </main>
  );
}
