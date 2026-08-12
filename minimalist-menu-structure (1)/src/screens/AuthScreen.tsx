import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sparkles, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 shadow-lg shadow-sky-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Klas Sosyal</h1>
          <p className="text-slate-400 mt-2 text-sm">
            {mode === 'signup' ? 'Aramıza katıl, sohbete başla.' : 'Tekrar hoş geldin.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white text-slate-700 font-medium rounded-xl shadow-sm hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile {mode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">veya</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">İsim</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Adınızı girin"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                />
              </div>
            )}

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

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Şifre</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
              />
            </div>

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setError(null); }}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Şifremi unuttum
                </button>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Bio <span className="text-slate-600">(isteğe bağlı)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Kendinizden kısaca bahsedin..."
                  rows={3}
                  maxLength={160}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all resize-none"
                />
                <p className="text-right text-xs text-slate-600 mt-1">{bio.length}/160</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 bg-gradient-to-r from-sky-400 to-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {busy ? 'Lütfen bekleyin...' : mode === 'signup' ? 'Hesap Oluştur' : 'Giriş Yap'}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="text-xs text-slate-500 mt-4 text-center">
              Kayıt olduğunuzda e-postanıza 6 haneli doğrulama kodu gönderilecektir.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
