export type BadgeCategory = 'etkilesim' | 'iletisim' | 'icerik' | 'topluluk' | 'sadakat';

export type Badge = {
  id: number;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: string;
};

export const BADGE_CATEGORIES: { id: BadgeCategory; label: string; icon: string }[] = [
  { id: 'etkilesim', label: 'Etkileşim', icon: 'Heart' },
  { id: 'iletisim', label: 'İletişim', icon: 'MessageCircle' },
  { id: 'icerik', label: 'İçerik', icon: 'Camera' },
  { id: 'topluluk', label: 'Topluluk', icon: 'Users' },
  { id: 'sadakat', label: 'Sadakat', icon: 'Shield' },
];

const TIERS = [
  'Çaylak', 'Bronz', 'Gümüş', 'Altın', 'Platin', 'Elmas',
  'Usta', 'Büyük Usta', 'Destansı', 'Efsanevi',
];

function tierFor(index: number, base: number): string {
  return TIERS[index - base];
}

// Category 1: Etkileşim (1-50)
const etkilesim: Badge[] = [
  // 1-10: Beğenici
  ...[10, 50, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map((n, i) => ({
    id: i + 1, name: `${tierFor(i + 1, 1)} Beğenici`, description: `Başkalarına ait ${n.toLocaleString('tr-TR')} gönderiyi beğen.`, category: 'etkilesim' as const, tier: tierFor(i + 1, 1),
  })),
  // 11-20: Fenomen
  ...[10, 50, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map((n, i) => ({
    id: i + 11, name: `${tierFor(i + 1, 1)} Fenomen`, description: `Gönderilerine toplam ${n.toLocaleString('tr-TR')} beğeni al.`, category: 'etkilesim' as const, tier: tierFor(i + 1, 1),
  })),
  // 21-30: Arşivci
  ...[5, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000].map((n, i) => ({
    id: i + 21, name: `${tierFor(i + 1, 1)} Arşivci`, description: `İlgini çeken ${n.toLocaleString('tr-TR')} gönderiyi kaydet.`, category: 'etkilesim' as const, tier: tierFor(i + 1, 1),
  })),
  // 31-40: Ulak
  ...[5, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000].map((n, i) => ({
    id: i + 31, name: `${tierFor(i + 1, 1)} Ulak`, description: `Başkalarının gönderilerini ${n.toLocaleString('tr-TR')} kez paylaş.`, category: 'etkilesim' as const, tier: tierFor(i + 1, 1),
  })),
  // 41-50: Gezgin
  ...[10, 50, 100, 500, 1000, 2500, 5000, 10000, 25000, 50000].map((n, i) => ({
    id: i + 41, name: `${tierFor(i + 1, 1)} Gezgin`, description: `${n.toLocaleString('tr-TR')} farklı kullanıcı profilini ziyaret et.`, category: 'etkilesim' as const, tier: tierFor(i + 1, 1),
  })),
];

// Category 2: İletişim (51-100)
const iletisim: Badge[] = [
  // 51-60: Yorumcu
  ...[5, 25, 100, 250, 500, 1000, 2500, 5000, 10000, 25000].map((n, i) => ({
    id: i + 51, name: `${tierFor(i + 1, 1)} Yorumcu`, description: `Gönderilere ${n.toLocaleString('tr-TR')} adet yorum yap.`, category: 'iletisim' as const, tier: tierFor(i + 1, 1),
  })),
  // 61-70: Hatip
  ...[10, 50, 100, 500, 1000, 2500, 5000, 10000, 25000, 50000].map((n, i) => ({
    id: i + 61, name: `${tierFor(i + 1, 1)} Hatip`, description: `Yaptığın gönderilere toplam ${n.toLocaleString('tr-TR')} yorum al.`, category: 'iletisim' as const, tier: tierFor(i + 1, 1),
  })),
  // 71-80: Filozof
  ...[5, 25, 100, 250, 500, 1000, 2500, 5000, 10000, 25000].map((n, i) => ({
    id: i + 71, name: `${tierFor(i + 1, 1)} Filozof`, description: `Yaptığın yorumlara toplam ${n.toLocaleString('tr-TR')} beğeni al.`, category: 'iletisim' as const, tier: tierFor(i + 1, 1),
  })),
  // 81-90: Postacı
  ...[10, 50, 250, 1000, 2500, 5000, 10000, 25000, 50000, 100000].map((n, i) => ({
    id: i + 81, name: `${tierFor(i + 1, 1)} Postacı`, description: `Diğer kullanıcılara toplam ${n.toLocaleString('tr-TR')} Direkt Mesaj gönder.`, category: 'iletisim' as const, tier: tierFor(i + 1, 1),
  })),
  // 91-100: İşaretçi
  ...[5, 25, 100, 250, 500, 1000, 2500, 5000, 10000, 25000].map((n, i) => ({
    id: i + 91, name: `${tierFor(i + 1, 1)} İşaretçi`, description: `Gönderilerinde/yorumlarında ${n.toLocaleString('tr-TR')} kişiyi etiketle (@).`, category: 'iletisim' as const, tier: tierFor(i + 1, 1),
  })),
];

// Category 3: İçerik (101-150)
const icerik: Badge[] = [
  // 101-110: Fotoğrafçı
  ...[1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000].map((n, i) => ({
    id: i + 101, name: `${tierFor(i + 1, 1)} Fotoğrafçı`, description: `Profilinde ${n.toLocaleString('tr-TR')} adet fotoğraf gönderisi paylaş.`, category: 'icerik' as const, tier: tierFor(i + 1, 1),
  })),
  // 111-120: Yönetmen
  ...[1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000].map((n, i) => ({
    id: i + 111, name: `${tierFor(i + 1, 1)} Yönetmen`, description: `Platforma ${n.toLocaleString('tr-TR')} adet video/reels yükle.`, category: 'icerik' as const, tier: tierFor(i + 1, 1),
  })),
  // 121-130: Anlatıcı
  ...[5, 25, 100, 250, 500, 1000, 2500, 5000, 10000, 25000].map((n, i) => ({
    id: i + 121, name: `${tierFor(i + 1, 1)} Anlatıcı`, description: `${n.toLocaleString('tr-TR')} adet 24 saatlik hikaye (story) paylaş.`, category: 'icerik' as const, tier: tierFor(i + 1, 1),
  })),
  // 131-140: Sunucu
  ...[1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500].map((n, i) => ({
    id: i + 131, name: `${tierFor(i + 1, 1)} Sunucu`, description: `${n.toLocaleString('tr-TR')} kez canlı yayın başlat.`, category: 'icerik' as const, tier: tierFor(i + 1, 1),
  })),
  // 141-150: Araştırmacı
  ...[1, 10, 25, 50, 100, 250, 1000, 5000, 25000, 100000].map((n, i) => ({
    id: i + 141, name: `${tierFor(i + 1, 1)} Araştırmacı`, description: i < 6 ? `${n.toLocaleString('tr-TR')} adet anket oluştur.` : `Anketlerine toplam ${n.toLocaleString('tr-TR')} oy al.`, category: 'icerik' as const, tier: tierFor(i + 1, 1),
  })),
];

// Category 4: Topluluk (151-200)
const topluluk: Badge[] = [
  // 151-160: Lider
  ...[10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 1000000].map((n, i) => ({
    id: i + 151, name: `${tierFor(i + 1, 1)} Lider`, description: `${n.toLocaleString('tr-TR')} takipçiye ulaş.`, category: 'topluluk' as const, tier: tierFor(i + 1, 1),
  })),
  // 161-170: İzleyici
  ...[10, 50, 100, 250, 500, 1000, 2500, 5000, 7500, 999999].map((n, i) => ({
    id: i + 161, name: `${tierFor(i + 1, 1)} İzleyici`, description: i === 9 ? `Platformun belirlediği maksimum takip sınırına ulaş.` : `${n.toLocaleString('tr-TR')} farklı hesabı takip et.`, category: 'topluluk' as const, tier: tierFor(i + 1, 1),
  })),
  // 171-180: Elçi
  ...[1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000].map((n, i) => ({
    id: i + 171, name: `${tierFor(i + 1, 1)} Elçi`, description: `Davet bağlantınla ${n.toLocaleString('tr-TR')} kişiyi platforma üye yap.`, category: 'topluluk' as const, tier: tierFor(i + 1, 1),
  })),
  // 181-190: Toplulukçu
  ...[1, 5, 10, 1, 100, 500, 1000, 5000, 10000, 50000].map((n, i) => ({
    id: i + 181, name: `${tierFor(i + 1, 1)} Toplulukçu`, description: i === 3 ? `Kendine ait 1 grup kur.` : i > 3 ? `Kurduğun grup ${n.toLocaleString('tr-TR')} üyeye ulaşsın.` : `${n.toLocaleString('tr-TR')} farklı gruba katıl.`, category: 'topluluk' as const, tier: tierFor(i + 1, 1),
  })),
  // 191-200: Profil rozetleri
  { id: 191, name: 'İsimsiz Kahraman', description: 'Profilinde Ad ve Soyad bilgilerini doldur.', category: 'topluluk', tier: 'Özel' },
  { id: 192, name: 'Yüzünü Göster', description: 'Profil fotoğrafı (Avatar) yükle.', category: 'topluluk', tier: 'Özel' },
  { id: 193, name: 'Arka Plan', description: 'Profil kapağı (Banner) fotoğrafı yükle.', category: 'topluluk', tier: 'Özel' },
  { id: 194, name: 'Kendini Tanıt', description: 'Biyografi (Hakkımda) kısmını doldur.', category: 'topluluk', tier: 'Özel' },
  { id: 195, name: 'Zevk Sahibi', description: 'Profil ayarlarına en az 3 ilgi alanı ekle.', category: 'topluluk', tier: 'Özel' },
  { id: 196, name: 'Şehrin Sesi', description: 'Konum/Şehir bilgisini profiline ekle.', category: 'topluluk', tier: 'Özel' },
  { id: 197, name: 'İletişim Ağacı', description: 'Güvenlik için telefon numaranı doğrula.', category: 'topluluk', tier: 'Özel' },
  { id: 198, name: 'Güvenli Liman', description: 'Hesabının e-posta adresini doğrula.', category: 'topluluk', tier: 'Özel' },
  { id: 199, name: 'Sosyal Ağ', description: 'Profiline farklı bir sosyal medya linki bağla.', category: 'topluluk', tier: 'Özel' },
  { id: 200, name: 'Onaylı Hesap', description: 'Resmi doğrulama sürecini geçerek Mavi Tik al.', category: 'topluluk', tier: 'Özel' },
];

// Category 5: Sadakat (201-250)
const sadakat: Badge[] = [
  // 201-210: İstikrar
  ...[3, 7, 14, 30, 60, 90, 180, 365, 500, 1000].map((n, i) => ({
    id: i + 201, name: `${tierFor(i + 1, 1)} İstikrar`, description: `Peş peşe ${n} gün platforma giriş yap.`, category: 'sadakat' as const, tier: tierFor(i + 1, 1),
  })),
  // 211-220: Kıdem
  ...['1 ay', '6 ay', '1 yıl', '2 yıl', '3 yıl', '4 yıl', '5 yıl', '7 yıl', '10 yıl', '15 yıl'].map((n, i) => ({
    id: i + 211, name: `${tierFor(i + 1, 1)} Kıdem`, description: `Hesabın açılalı ${n} olsun.`, category: 'sadakat' as const, tier: tierFor(i + 1, 1),
  })),
  // 221-230: Keşif
  ...[1, 5, 10, 25, 50, 100, 100, 10, 1, 10].map((n, i) => ({
    id: i + 221, name: `${tierFor(i + 1, 1)} Keşif`, description: i < 6 ? `${n} gönderin Keşfet/Trend sekmesine düşsün.` : i === 6 ? `Bir gönderin platformun en çok izlenen ilk 100'üne girsin.` : i === 7 ? `Bir gönderin platformun en çok izlenen ilk 10'una girsin.` : i === 8 ? `Bir gönderin gün boyunca platformda 1. sırada (Trend 1) kalsın.` : `Toplam 10 farklı gönderin platform genelinde Trend 1 olsun.`, category: 'sadakat' as const, tier: tierFor(i + 1, 1),
  })),
  // 231-240: Bekçi
  ...[1, 5, 10, 25, 50, 100, 250, 500, 1000, 999999].map((n, i) => ({
    id: i + 231, name: `${tierFor(i + 1, 1)} Bekçi`, description: i === 9 ? `Topluluk güvenliğine yüksek katkidan dolayı sistem onayı al.` : `Kurallara aykırı ${n} içeriği doğru şekilde raporla.`, category: 'sadakat' as const, tier: tierFor(i + 1, 1),
  })),
  // 241-250: Özel görevler
  { id: 241, name: 'Gece Kuşu', description: 'Gece saat 02:00 ile 05:00 arasında 10 adet içerik paylaş (Gizli Görev).', category: 'sadakat', tier: 'Gizli' },
  { id: 242, name: 'Erkenci Kuş', description: 'Sabah saat 05:00 ile 08:00 arasında 1 hafta boyunca giriş yap.', category: 'sadakat', tier: 'Gizli' },
  { id: 243, name: 'Hafta Sonu Savaşçısı', description: 'Bir ay boyunca her Cumartesi ve Pazar günü etkileşimde bulun.', category: 'sadakat', tier: 'Gizli' },
  { id: 244, name: 'Yeni Yıl Ruhu', description: '31 Aralık gecesi saat 00:00da uygulamada aktif ol.', category: 'sadakat', tier: 'Gizli' },
  { id: 245, name: 'İyi Ki Doğdun', description: 'Belirttiğin doğum gününde uygulamaya giriş yap.', category: 'sadakat', tier: 'Gizli' },
  { id: 246, name: 'Hızlı Parmaklar', description: 'Yeni düşen bir gönderiye ilk 1 dakika içinde yorum yap.', category: 'sadakat', tier: 'Gizli' },
  { id: 247, name: 'Yıldırım Yanıt', description: 'Sana gelen bir Direkt Mesaja 30 saniye içerisinde cevap ver.', category: 'sadakat', tier: 'Gizli' },
  { id: 248, name: 'Sadık Okuyucu', description: 'Tek bir kullanıcının paylaştığı peş peşe 50 gönderiyi görüntüle.', category: 'sadakat', tier: 'Gizli' },
  { id: 249, name: 'Bug Avcısı', description: 'Uygulama içinde bir teknik hata (bug) bulup geliştiriciye bildir.', category: 'sadakat', tier: 'Gizli' },
  { id: 250, name: 'Klas Efsanesi', description: 'Tüm rozetleri topla ve platformun efsanesi ol.', category: 'sadakat', tier: 'Efsane' },
];

export const ALL_BADGES: Badge[] = [...etkilesim, ...iletisim, ...icerik, ...topluluk, ...sadakat];

export const TIER_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  'Çaylak': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: 'text-slate-400' },
  'Bronz': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-500' },
  'Gümüş': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: 'text-slate-500' },
  'Altın': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'text-yellow-500' },
  'Platin': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'text-cyan-500' },
  'Elmas': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: 'text-sky-500' },
  'Usta': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-500' },
  'Büyük Usta': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: 'text-teal-500' },
  'Destansı': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-500' },
  'Efsanevi': { bg: 'bg-gradient-to-br from-amber-100 to-rose-100', text: 'text-rose-800', border: 'border-rose-300', icon: 'text-rose-600' },
  'Özel': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'text-indigo-500' },
  'Gizli': { bg: 'bg-slate-800', text: 'text-slate-200', border: 'border-slate-700', icon: 'text-slate-400' },
  'Efsane': { bg: 'bg-gradient-to-br from-amber-400 to-rose-500', text: 'text-white', border: 'border-rose-400', icon: 'text-white' },
};

export const TIER_ICONS: Record<string, string> = {
  'Çaylak': '🌱',
  'Bronz': '🥉',
  'Gümüş': '🥈',
  'Altın': '🥇',
  'Platin': '💎',
  'Elmas': '💠',
  'Usta': '⚔️',
  'Büyük Usta': '🗡️',
  'Destansı': '🌋',
  'Efsanevi': '👑',
  'Özel': '⭐',
  'Gizli': '🔒',
  'Efsane': '🏆',
};
