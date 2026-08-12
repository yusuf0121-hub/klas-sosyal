import { useEffect, useState } from 'react';
import { Check, Lock, Crown, Coins, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/ThemeProvider';
import { ALL_THEMES, THEME_CATEGORIES, themeToCss, getThemeById, type Theme } from '@/lib/themes';
import { Coin } from '@/lib/customIcons';

export default function ThemesScreen() {
  const { profile, refreshProfile } = useAuth();
  const { textColor, subtextColor, cardBg, cardBorder, reduceMotion, setReduceMotion } = useTheme();
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('Nötr Tonlar');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVipModal, setShowVipModal] = useState(false);

  useEffect(() => {
    loadPurchased();
  }, []);

  async function loadPurchased() {
    const { data } = await supabase.from('purchased_themes').select('theme_id');
    setPurchasedIds(new Set((data ?? []).map((d) => d.theme_id)));
    setLoading(false);
  }

  async function applyTheme(theme: Theme) {
    await supabase.from('profiles').update({ theme_id: theme.id }).eq('id', profile!.id);
    await refreshProfile();
  }

  async function buyTheme(theme: Theme) {
    if (theme.vip && !profile?.is_vip) {
      setShowVipModal(true);
      return;
    }
    setBuying(theme.id);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('buy_theme', {
      p_theme_id: theme.id,
      p_price: theme.price,
    });
    if (rpcError) {
      setError('Bir hata oluştu.');
    } else if (data && !data.success) {
      setError(data.error || 'Satın alma başarısız.');
    } else if (data && data.success) {
      setPurchasedIds((prev) => new Set(prev).add(theme.id));
      await applyTheme(theme);
    }
    setBuying(null);
  }

  function handleThemeClick(theme: Theme) {
    const owned = purchasedIds.has(theme.id) || (theme.vip && profile?.is_vip) || theme.price === 0;
    if (owned) {
      applyTheme(theme);
    } else {
      buyTheme(theme);
    }
  }

  const filteredThemes = ALL_THEMES.filter((t) => {
    if (search) {
      return t.name.toLowerCase().includes(search.toLowerCase());
    }
    return t.category === activeCategory;
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-bold" style={{ color: textColor }}>Temalar</h1>
        {profile?.is_vip && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            <Crown className="w-3 h-3" /> VIP
          </span>
        )}
      </div>

      {/* Coins + VIP bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <Coin className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-semibold" style={{ color: textColor }}>{profile?.coins ?? 0}</span>
        </div>
        {!profile?.is_vip && (
          <button
            onClick={() => setShowVipModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all"
          >
            <Crown className="w-4 h-4" /> VIP'e Yüksel
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: subtextColor }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tema ara..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            color: textColor,
          }}
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {THEME_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-amber-400 text-white'
                  : ''
              }`}
              style={
                activeCategory !== cat
                  ? { background: cardBg, border: `1px solid ${cardBorder}`, color: subtextColor }
                  : undefined
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Theme grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredThemes.map((theme) => {
            const owned = purchasedIds.has(theme.id) || (theme.vip && profile?.is_vip) || theme.price === 0;
            const isCurrent = profile?.theme_id === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeClick(theme)}
                disabled={buying === theme.id}
                className="relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ border: isCurrent ? `2px solid #f59e0b` : `1px solid ${cardBorder}` }}
              >
                {/* Preview */}
                <div
                  className="h-20 w-full relative"
                  style={{ background: themeToCss(theme) }}
                >
                  {isCurrent && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {theme.vip && !profile?.is_vip && !owned && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                      <Lock className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {theme.type === 'gradient' && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/30 text-white text-[9px] rounded">Degrade</span>
                  )}
                </div>
                {/* Info */}
                <div className="p-2.5 text-left" style={{ background: cardBg }}>
                  <p className="text-xs font-medium truncate" style={{ color: textColor }}>{theme.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    {owned ? (
                      <span className="text-[10px] font-medium" style={{ color: isCurrent ? '#f59e0b' : subtextColor }}>
                        {isCurrent ? 'Aktif' : 'Sahipsin'}
                      </span>
                    ) : theme.vip && !profile?.is_vip ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                        <Crown className="w-3 h-3" /> VIP
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: subtextColor }}>
                        <Coin className="w-3 h-3 text-amber-500" /> {theme.price}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Reduce Motion Toggle */}
      <div className="mt-6 flex items-center justify-between p-4 rounded-2xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <div>
          <p className="text-sm font-medium" style={{ color: textColor }}>Hareketli Efektleri Azalt</p>
          <p className="text-xs mt-0.5" style={{ color: subtextColor }}>Neon animasyonlarını devre dışı bırak</p>
        </div>
        <button
          onClick={() => setReduceMotion(!reduceMotion)}
          className="relative w-12 h-7 rounded-full transition-colors"
          style={{ background: reduceMotion ? '#10b981' : '#cbd5e1' }}
        >
          <div
            className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform"
            style={{ transform: reduceMotion ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
      </div>

      {/* VIP Info Modal */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowVipModal(false)}>
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6"
            style={{ background: cardBg }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-500" />
                <h2 className="text-lg font-bold" style={{ color: textColor }}>VIP Üyelik</h2>
              </div>
              <button onClick={() => setShowVipModal(false)} className="p-1.5 hover:bg-black/10 rounded-lg">
                <X className="w-5 h-5" style={{ color: subtextColor }} />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {[
                'Tüm 150+ temaya ücretsiz erişim',
                'Tüm Neon, Degrade ve Asil renkler',
                'Özel VIP rozeti profilde',
                'Reklamsız deneyim',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm" style={{ color: textColor }}>{feat}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-amber-50 rounded-xl mb-4">
              <p className="text-sm text-amber-700 font-medium">Aylık 9,99 ₺</p>
              <p className="text-xs text-amber-600 mt-1">Tüm premium temaları sınırsız kullanın.</p>
            </div>
            <button
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              VIP Satın Al
            </button>
            <p className="text-xs text-center mt-3" style={{ color: subtextColor }}>
              Ödeme altyapısı yakında aktif olacak.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
