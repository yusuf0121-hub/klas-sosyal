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
    <main className="min-h-screen bg-[#f4f4f5] text-slate-950 flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="text-xl font-black tracking-[-0.12em] text-slate-950">klas<span className="text-sky-500">.</span></div>
        <button type="button" onClick={() => { setMode('signup'); setError(null); }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
          Kayıt Ol
        </button>
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="grid w-full max-w-[768px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-2">
          <div className="px-8 py-10 sm:px-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-2xl font-black tracking-[-0.12em] text-slate-950">
                kl<span className="text-sky-500">.</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{mode === 'signup' ? "Klas'a katıl" : 'Tekrar hoş geldin'}</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{mode === 'signup' ? 'Topluluğa katıl, paylaşmaya başla.' : 'Klas Sosyal hesabınla devam et.'}</p>
            </div>
          <div className="space-y-3">
            <button type="button" onClick={handleGoogle} disabled={busy} className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-50">
              <span className="text-lg font-semibold">G</span>
              Google ile devam et
            </button>
            <div className="flex items-center gap-3 py-2"><div className="h-px flex-1 bg-slate-200"/><span className="text-xs text-slate-400">veya e-posta ile</span><div className="h-px flex-1 bg-slate-200"/></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="İsim" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500" />}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta adresi" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500" />
            <div><div className="mb-1.5 flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium text-slate-800">Şifre</label>{mode === 'login' && <button type="button" onClick={() => { setForgotMode(true); setError(null); }} className="text-xs text-slate-500 hover:text-slate-900">Şifremi unuttum?</button>}</div><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500" /></div>
            {mode === 'signup' && <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Kısa bio (isteğe bağlı)" rows={3} maxLength={160} className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500" />}
            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">{busy ? 'Lütfen bekleyin...' : mode === 'signup' ? 'Hesap Oluştur' : 'Giriş yap'}</button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">{mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }} className="font-medium text-slate-950 underline underline-offset-2">{mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}</button></p>
        </div>
        <div className="hidden min-h-[515px] bg-slate-100 md:flex md:items-center md:justify-center">
          <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-slate-200 text-slate-300"><div className="absolute h-px w-64 rotate-45 bg-slate-200"/><div className="absolute h-px w-64 -rotate-45 bg-slate-200"/><div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-400">✦</div></div>
        </div>
      </div>
      <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">Devam ederek <span className="underline">Kullanım Koşulları</span> ve <span className="underline">Gizlilik Politikası'nı</span> kabul etmiş olursun.</p>
      </section>
    </main>
  );
}
