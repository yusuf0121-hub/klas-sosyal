export type ThemeColor = {
  name: string;
  hex: string;
};

export type Theme = {
  id: string;
  name: string;
  category: string;
  type: 'solid' | 'gradient';
  colors: string[];
  price: number;
  vip: boolean;
  isDark: boolean;
};

export const THEME_CATEGORIES = [
  'Nötr Tonlar',
  'Pastel',
  'Karanlık',
  'Canlı & Enerjik',
  'Doğa & Toprak',
  'Asil & Derin',
  'Degrade',
  'Retro & Vintage',
  'Neon',
] as const;

const neutral: Theme[] = [
  { id: 'saf_beyaz', name: 'Saf Beyaz', category: 'Nötr Tonlar', type: 'solid', colors: ['#FFFFFF'], price: 0, vip: false, isDark: false },
  { id: 'kar_beyazi', name: 'Kar Beyazı', category: 'Nötr Tonlar', type: 'solid', colors: ['#FFFAFA'], price: 0, vip: false, isDark: false },
  { id: 'fildisi', name: 'Fildişi', category: 'Nötr Tonlar', type: 'solid', colors: ['#FFFFF0'], price: 0, vip: false, isDark: false },
  { id: 'krem', name: 'Krem', category: 'Nötr Tonlar', type: 'solid', colors: ['#FFFDD0'], price: 0, vip: false, isDark: false },
  { id: 'sampanya', name: 'Şampanya', category: 'Nötr Tonlar', type: 'solid', colors: ['#F7E7CE'], price: 0, vip: false, isDark: false },
  { id: 'acik_bej', name: 'Açık Bej', category: 'Nötr Tonlar', type: 'solid', colors: ['#F5F5DC'], price: 0, vip: false, isDark: false },
  { id: 'kum_beyazi', name: 'Kum Beyazı', category: 'Nötr Tonlar', type: 'solid', colors: ['#F4F0EA'], price: 0, vip: false, isDark: false },
  { id: 'pamuk_gri', name: 'Pamuk Gri', category: 'Nötr Tonlar', type: 'solid', colors: ['#F2F2F2'], price: 0, vip: false, isDark: false },
  { id: 'duman_gri', name: 'Duman Gri', category: 'Nötr Tonlar', type: 'solid', colors: ['#E5E5E5'], price: 0, vip: false, isDark: false },
  { id: 'ipek_gri', name: 'İpek Gri', category: 'Nötr Tonlar', type: 'solid', colors: ['#DCDCDC'], price: 0, vip: false, isDark: false },
  { id: 'beton_gri', name: 'Beton Gri', category: 'Nötr Tonlar', type: 'solid', colors: ['#D3D3D3'], price: 0, vip: false, isDark: false },
  { id: 'gumus', name: 'Gümüş', category: 'Nötr Tonlar', type: 'solid', colors: ['#C0C0C0'], price: 0, vip: false, isDark: false },
  { id: 'tas_gri', name: 'Taş Gri', category: 'Nötr Tonlar', type: 'solid', colors: ['#999999'], price: 0, vip: false, isDark: false },
  { id: 'komur_gri', name: 'Kömür Gri', category: 'Nötr Tonlar', type: 'solid', colors: ['#363636'], price: 50, vip: false, isDark: true },
  { id: 'antrasit', name: 'Antrasit', category: 'Nötr Tonlar', type: 'solid', colors: ['#2F4F4F'], price: 50, vip: false, isDark: true },
  { id: 'mat_siyah', name: 'Mat Siyah', category: 'Nötr Tonlar', type: 'solid', colors: ['#121212'], price: 50, vip: false, isDark: true },
  { id: 'gece_siyahi', name: 'Gece Siyahı', category: 'Nötr Tonlar', type: 'solid', colors: ['#0A0A0A'], price: 50, vip: false, isDark: true },
  { id: 'saf_siyah', name: 'Saf Siyah', category: 'Nötr Tonlar', type: 'solid', colors: ['#000000'], price: 50, vip: false, isDark: true },
];

const pastel: Theme[] = [
  { id: 'pastel_pembe', name: 'Pastel Pembe', category: 'Pastel', type: 'solid', colors: ['#FFB6C1'], price: 30, vip: false, isDark: false },
  { id: 'bebek_pembe', name: 'Bebek Pembe', category: 'Pastel', type: 'solid', colors: ['#FFC0CB'], price: 30, vip: false, isDark: false },
  { id: 'pudra_pembe', name: 'Pudra Pembe', category: 'Pastel', type: 'solid', colors: ['#FFE4E1'], price: 30, vip: false, isDark: false },
  { id: 'seftali_pastel', name: 'Şeftali Pastel', category: 'Pastel', type: 'solid', colors: ['#FFDAB9'], price: 30, vip: false, isDark: false },
  { id: 'somon_pastel', name: 'Somon Pastel', category: 'Pastel', type: 'solid', colors: ['#FFD8B1'], price: 30, vip: false, isDark: false },
  { id: 'bebek_mavi', name: 'Bebek Mavi', category: 'Pastel', type: 'solid', colors: ['#AEC6CF'], price: 30, vip: false, isDark: false },
  { id: 'gokyuzu_pastel', name: 'Gökyüzü Pastel', category: 'Pastel', type: 'solid', colors: ['#B0E0E6'], price: 30, vip: false, isDark: false },
  { id: 'buz_mavi', name: 'Buz Mavi', category: 'Pastel', type: 'solid', colors: ['#E0FFFF'], price: 30, vip: false, isDark: false },
  { id: 'deniz_kopugu', name: 'Deniz Köpüğü', category: 'Pastel', type: 'solid', colors: ['#E0EEE0'], price: 30, vip: false, isDark: false },
  { id: 'fistik_pastel', name: 'Fıstık Pastel', category: 'Pastel', type: 'solid', colors: ['#D3F8E2'], price: 30, vip: false, isDark: false },
  { id: 'adacayi_pastel', name: 'Adaçayı Pastel', category: 'Pastel', type: 'solid', colors: ['#C1E1C1'], price: 30, vip: false, isDark: false },
  { id: 'lavanta', name: 'Lavanta', category: 'Pastel', type: 'solid', colors: ['#E6E6FA'], price: 30, vip: false, isDark: false },
  { id: 'leylak', name: 'Leylak', category: 'Pastel', type: 'solid', colors: ['#DCD0FF'], price: 30, vip: false, isDark: false },
  { id: 'krem_sari', name: 'Krem Sarı', category: 'Pastel', type: 'solid', colors: ['#FFFACD'], price: 30, vip: false, isDark: false },
  { id: 'vanilya', name: 'Vanilya', category: 'Pastel', type: 'solid', colors: ['#F3E5AB'], price: 30, vip: false, isDark: false },
  { id: 'tatli_kavun', name: 'Tatlı Kavun', category: 'Pastel', type: 'solid', colors: ['#FEF3E2'], price: 30, vip: false, isDark: false },
];

const dark: Theme[] = [
  { id: 'derin_uzay', name: 'Derin Uzay Siyahı', category: 'Karanlık', type: 'solid', colors: ['#050505'], price: 50, vip: false, isDark: true },
  { id: 'gece_mavisi', name: 'Gece Mavisi', category: 'Karanlık', type: 'solid', colors: ['#000022'], price: 50, vip: false, isDark: true },
  { id: 'derin_lacivert', name: 'Derin Lacivert', category: 'Karanlık', type: 'solid', colors: ['#0A192F'], price: 50, vip: false, isDark: true },
  { id: 'gece_yarisi', name: 'Gece Yarısı Mavisi', category: 'Karanlık', type: 'solid', colors: ['#191970'], price: 50, vip: false, isDark: true },
  { id: 'safir_siyaği', name: 'Safir Siyah', category: 'Karanlık', type: 'solid', colors: ['#0F172A'], price: 50, vip: false, isDark: true },
  { id: 'karanlik_antrasit', name: 'Karanlık Antrasit', category: 'Karanlık', type: 'solid', colors: ['#18181B'], price: 50, vip: false, isDark: true },
  { id: 'komur_siyahi', name: 'Kömür Siyahı', category: 'Karanlık', type: 'solid', colors: ['#1C1C1C'], price: 50, vip: false, isDark: true },
  { id: 'karanlik_bordo', name: 'Karanlık Bordo', category: 'Karanlık', type: 'solid', colors: ['#2A0800'], price: 50, vip: false, isDark: true },
  { id: 'mor_siyah', name: 'Mor Siyah', category: 'Karanlık', type: 'solid', colors: ['#1A0022'], price: 50, vip: false, isDark: true },
  { id: 'erguvan_siyah', name: 'Erguvan Siyah', category: 'Karanlık', type: 'solid', colors: ['#2B0B3A'], price: 50, vip: false, isDark: true },
  { id: 'karanlik_yesil', name: 'Karanlık Yeşil', category: 'Karanlık', type: 'solid', colors: ['#012406'], price: 50, vip: false, isDark: true },
  { id: 'orman_siyahi', name: 'Orman Siyahı', category: 'Karanlık', type: 'solid', colors: ['#0B1D12'], price: 50, vip: false, isDark: true },
  { id: 'volkanik_gri', name: 'Volkanik Gri', category: 'Karanlık', type: 'solid', colors: ['#22252A'], price: 50, vip: false, isDark: true },
  { id: 'grafit', name: 'Grafit', category: 'Karanlık', type: 'solid', colors: ['#262626'], price: 50, vip: false, isDark: true },
  { id: 'evren_siyahi', name: 'Evren Siyahı', category: 'Karanlık', type: 'solid', colors: ['#010103'], price: 50, vip: false, isDark: true },
];

const vibrant: Theme[] = [
  { id: 'neon_pembe', name: 'Neon Pembe', category: 'Canlı & Enerjik', type: 'solid', colors: ['#FF1493'], price: 80, vip: true, isDark: false },
  { id: 'fusya', name: 'Fuşya', category: 'Canlı & Enerjik', type: 'solid', colors: ['#FF00FF'], price: 80, vip: true, isDark: false },
  { id: 'macenta', name: 'Macenta', category: 'Canlı & Enerjik', type: 'solid', colors: ['#C71585'], price: 80, vip: true, isDark: true },
  { id: 'elektrik_mavi', name: 'Elektrik Mavi', category: 'Canlı & Enerjik', type: 'solid', colors: ['#00D2FF'], price: 80, vip: true, isDark: false },
  { id: 'parlak_siyan', name: 'Parlak Siyan', category: 'Canlı & Enerjik', type: 'solid', colors: ['#00FFFF'], price: 80, vip: true, isDark: false },
  { id: 'neon_yesil', name: 'Neon Yeşil', category: 'Canlı & Enerjik', type: 'solid', colors: ['#00FF00'], price: 80, vip: true, isDark: false },
  { id: 'limon_yesili', name: 'Limon Yeşili', category: 'Canlı & Enerjik', type: 'solid', colors: ['#7FFF00'], price: 80, vip: true, isDark: false },
  { id: 'parlak_sari', name: 'Parlak Sarı', category: 'Canlı & Enerjik', type: 'solid', colors: ['#FFFF00'], price: 80, vip: true, isDark: false },
  { id: 'gunes_sari', name: 'Güneş Sarı', category: 'Canlı & Enerjik', type: 'solid', colors: ['#FFD700'], price: 80, vip: true, isDark: false },
  { id: 'mandalina', name: 'Mandalina Turuncusu', category: 'Canlı & Enerjik', type: 'solid', colors: ['#FFA500'], price: 80, vip: true, isDark: false },
  { id: 'elektrik_turuncu', name: 'Elektrik Turuncu', category: 'Canlı & Enerjik', type: 'solid', colors: ['#FF5722'], price: 80, vip: true, isDark: false },
  { id: 'parlak_kirmizi', name: 'Parlak Kırmızı', category: 'Canlı & Enerjik', type: 'solid', colors: ['#FF0000'], price: 80, vip: true, isDark: true },
  { id: 'ates_kirmizi', name: 'Ateş Kırmızı', category: 'Canlı & Enerjik', type: 'solid', colors: ['#FF2400'], price: 80, vip: true, isDark: true },
  { id: 'sicak_mercan', name: 'Sıcak Mercan', category: 'Canlı & Enerjik', type: 'solid', colors: ['#FF6B6B'], price: 80, vip: true, isDark: false },
];

const nature: Theme[] = [
  { id: 'toprak_kahve', name: 'Toprak Kahve', category: 'Doğa & Toprak', type: 'solid', colors: ['#8B4513'], price: 40, vip: false, isDark: true },
  { id: 'taba', name: 'Taba', category: 'Doğa & Toprak', type: 'solid', colors: ['#D2691E'], price: 40, vip: false, isDark: false },
  { id: 'tarcin', name: 'Tarçın', category: 'Doğa & Toprak', type: 'solid', colors: ['#C2452D'], price: 40, vip: false, isDark: false },
  { id: 'kiremit', name: 'Kiremit', category: 'Doğa & Toprak', type: 'solid', colors: ['#B22222'], price: 40, vip: false, isDark: true },
  { id: 'hardal', name: 'Hardal', category: 'Doğa & Toprak', type: 'solid', colors: ['#FFDB58'], price: 40, vip: false, isDark: false },
  { id: 'zeytin_yesili', name: 'Zeytin Yeşili', category: 'Doğa & Toprak', type: 'solid', colors: ['#808000'], price: 40, vip: false, isDark: true },
  { id: 'haki', name: 'Haki', category: 'Doğa & Toprak', type: 'solid', colors: ['#6B8E23'], price: 40, vip: false, isDark: true },
  { id: 'orman_yesili', name: 'Orman Yeşili', category: 'Doğa & Toprak', type: 'solid', colors: ['#228B22'], price: 40, vip: false, isDark: true },
  { id: 'cam_yesili', name: 'Çam Yeşili', category: 'Doğa & Toprak', type: 'solid', colors: ['#01796F'], price: 40, vip: false, isDark: true },
  { id: 'yosun_yesili', name: 'Yosun Yeşili', category: 'Doğa & Toprak', type: 'solid', colors: ['#ADDFAD'], price: 40, vip: false, isDark: false },
  { id: 'sutlu_kahve', name: 'Sütlü Kahve', category: 'Doğa & Toprak', type: 'solid', colors: ['#C4A484'], price: 40, vip: false, isDark: false },
  { id: 'kestane', name: 'Kestane', category: 'Doğa & Toprak', type: 'solid', colors: ['#954535'], price: 40, vip: false, isDark: true },
  { id: 'terakota', name: 'Terakota', category: 'Doğa & Toprak', type: 'solid', colors: ['#E2725B'], price: 40, vip: false, isDark: false },
  { id: 'sonbahar_yapragi', name: 'Sonbahar Yaprağı', category: 'Doğa & Toprak', type: 'solid', colors: ['#D97706'], price: 40, vip: false, isDark: false },
];

const noble: Theme[] = [
  { id: 'kraliyet_mavisi', name: 'Kraliyet Mavisi', category: 'Asil & Derin', type: 'solid', colors: ['#4169E1'], price: 100, vip: true, isDark: true },
  { id: 'safir_mavi', name: 'Safir Mavi', category: 'Asil & Derin', type: 'solid', colors: ['#0F52BA'], price: 100, vip: true, isDark: true },
  { id: 'gece_laciverti', name: 'Gece Laciverti', category: 'Asil & Derin', type: 'solid', colors: ['#000080'], price: 100, vip: true, isDark: true },
  { id: 'zumrut_yesili', name: 'Zümrüt Yeşili', category: 'Asil & Derin', type: 'solid', colors: ['#50C878'], price: 100, vip: true, isDark: false },
  { id: 'koyu_zumrut', name: 'Koyu Zümrüt', category: 'Asil & Derin', type: 'solid', colors: ['#004B23'], price: 100, vip: true, isDark: true },
  { id: 'yakut_kirmizi', name: 'Yakut Kırmızı', category: 'Asil & Derin', type: 'solid', colors: ['#9B111E'], price: 100, vip: true, isDark: true },
  { id: 'bordo', name: 'Bordo', category: 'Asil & Derin', type: 'solid', colors: ['#800020'], price: 100, vip: true, isDark: true },
  { id: 'sarap_kirmizi', name: 'Şarap Kırmızı', category: 'Asil & Derin', type: 'solid', colors: ['#722F37'], price: 100, vip: true, isDark: true },
  { id: 'patlican_moru', name: 'Patlıcan Moru', category: 'Asil & Derin', type: 'solid', colors: ['#311432'], price: 100, vip: true, isDark: true },
  { id: 'murdum', name: 'Mürdüm', category: 'Asil & Derin', type: 'solid', colors: ['#4A0E4E'], price: 100, vip: true, isDark: true },
  { id: 'kehribar', name: 'Kehribar', category: 'Asil & Derin', type: 'solid', colors: ['#FFBF00'], price: 100, vip: true, isDark: false },
  { id: 'altin_sari', name: 'Altın Sarı', category: 'Asil & Derin', type: 'solid', colors: ['#D4AF37'], price: 100, vip: true, isDark: false },
  { id: 'bronz', name: 'Bronz', category: 'Asil & Derin', type: 'solid', colors: ['#CD7F32'], price: 100, vip: true, isDark: false },
  { id: 'bakir', name: 'Bakır', category: 'Asil & Derin', type: 'solid', colors: ['#B87333'], price: 100, vip: true, isDark: false },
  { id: 'gul_altin', name: 'Gül Altın', category: 'Asil & Derin', type: 'solid', colors: ['#B76E79'], price: 100, vip: true, isDark: false },
  { id: 'platin', name: 'Platin', category: 'Asil & Derin', type: 'solid', colors: ['#E5E4E2'], price: 100, vip: true, isDark: false },
];

const gradients: Theme[] = [
  { id: 'gece_gun_dogumu', name: 'Gece Gün Doğumu', category: 'Degrade', type: 'gradient', colors: ['#0F2027', '#2C5364'], price: 150, vip: true, isDark: true },
  { id: 'mor_dusler', name: 'Mor Düşler', category: 'Degrade', type: 'gradient', colors: ['#8E2DE2', '#4A00E0'], price: 150, vip: true, isDark: true },
  { id: 'tatli_pembe', name: 'Tatlı Pembe', category: 'Degrade', type: 'gradient', colors: ['#FF416C', '#FF4B2B'], price: 150, vip: true, isDark: false },
  { id: 'neon_gece', name: 'Neon Gece', category: 'Degrade', type: 'gradient', colors: ['#F7797D', '#FBD786'], price: 150, vip: true, isDark: false },
  { id: 'okyanus_derinligi', name: 'Okyanus Derinliği', category: 'Degrade', type: 'gradient', colors: ['#2B5876', '#4E4376'], price: 150, vip: true, isDark: true },
  { id: 'tropik_gun_batimi', name: 'Tropik Gün Batımı', category: 'Degrade', type: 'gradient', colors: ['#FA8BFF', '#2BD2FF'], price: 150, vip: true, isDark: false },
  { id: 'orman_sis', name: 'Orman Sisi', category: 'Degrade', type: 'gradient', colors: ['#134E5E', '#71B280'], price: 150, vip: true, isDark: true },
  { id: 'kuzey_isiklari', name: 'Kuzey Işıkları', category: 'Degrade', type: 'gradient', colors: ['#00C9FF', '#92FE9D'], price: 150, vip: true, isDark: false },
  { id: 'nar_portakal', name: 'Nar & Portakal', category: 'Degrade', type: 'gradient', colors: ['#F857A6', '#FF5858'], price: 150, vip: true, isDark: false },
  { id: 'gece_mavisi_deg', name: 'Gece Mavisi Degrade', category: 'Degrade', type: 'gradient', colors: ['#141E30', '#243B55'], price: 150, vip: true, isDark: true },
  { id: 'limon_iceceği', name: 'Limon İçeceği', category: 'Degrade', type: 'gradient', colors: ['#FFE000', '#799F0C'], price: 150, vip: true, isDark: false },
  { id: 'kosmik_mor', name: 'Kozmik Mor', category: 'Degrade', type: 'gradient', colors: ['#200122', '#6F0000'], price: 150, vip: true, isDark: true },
  { id: 'siberpunk', name: 'Siberpunk', category: 'Degrade', type: 'gradient', colors: ['#FF007F', '#7928CA'], price: 150, vip: true, isDark: true },
  { id: 'mat_gece', name: 'Mat Gece', category: 'Degrade', type: 'gradient', colors: ['#1F1C2C', '#928DAB'], price: 150, vip: true, isDark: true },
  { id: 'kahve_tutkusu', name: 'Kahve Tutkusu', category: 'Degrade', type: 'gradient', colors: ['#3E2723', '#5D4037'], price: 150, vip: true, isDark: true },
  { id: 'sicak_gun_batimi', name: 'Sıcak Gün Batımı', category: 'Degrade', type: 'gradient', colors: ['#FF7E5F', '#FEB47B'], price: 150, vip: true, isDark: false },
  { id: 'tatli_lavanta_deg', name: 'Tatlı Lavanta', category: 'Degrade', type: 'gradient', colors: ['#E0C3FC', '#8EC5FC'], price: 150, vip: true, isDark: false },
  { id: 'derin_okyanus', name: 'Derin Okyanus', category: 'Degrade', type: 'gradient', colors: ['#000046', '#1CB5E0'], price: 150, vip: true, isDark: true },
];

const retro: Theme[] = [
  { id: 'hardal_retro', name: 'Hardal Retro', category: 'Retro & Vintage', type: 'solid', colors: ['#E1AD01'], price: 60, vip: false, isDark: false },
  { id: 'retro_turuncu', name: 'Retro Turuncu', category: 'Retro & Vintage', type: 'solid', colors: ['#D35400'], price: 60, vip: false, isDark: false },
  { id: 'nostaljik_mavi', name: 'Nostaljik Mavi', category: 'Retro & Vintage', type: 'solid', colors: ['#4682B4'], price: 60, vip: false, isDark: true },
  { id: 'mat_kiremit', name: 'Mat Kiremit', category: 'Retro & Vintage', type: 'solid', colors: ['#C0392B'], price: 60, vip: false, isDark: true },
  { id: 'pastel_murdum', name: 'Pastel Mürdüm', category: 'Retro & Vintage', type: 'solid', colors: ['#8E44AD'], price: 60, vip: false, isDark: true },
  { id: 'soluk_yesil', name: 'Soluk Yeşil', category: 'Retro & Vintage', type: 'solid', colors: ['#27AE60'], price: 60, vip: false, isDark: false },
  { id: 'soluk_sari', name: 'Soluk Sarı', category: 'Retro & Vintage', type: 'solid', colors: ['#F1C40F'], price: 60, vip: false, isDark: false },
  { id: 'sepya', name: 'Sepya', category: 'Retro & Vintage', type: 'solid', colors: ['#704214'], price: 60, vip: false, isDark: true },
];

const neon: Theme[] = [
  { id: 'elektrik_siklamen', name: 'Elektrik Siklamen', category: 'Neon', type: 'solid', colors: ['#FF007F'], price: 120, vip: true, isDark: false },
  { id: 'neon_fusya_n', name: 'Neon Fuşya', category: 'Neon', type: 'solid', colors: ['#FF00D4'], price: 120, vip: true, isDark: false },
  { id: 'siber_pembe', name: 'Siber Pembe', category: 'Neon', type: 'solid', colors: ['#FF1493'], price: 120, vip: true, isDark: false },
  { id: 'lazermor', name: 'Lazermor', category: 'Neon', type: 'solid', colors: ['#9D00FF'], price: 120, vip: true, isDark: true },
  { id: 'plazma_moru', name: 'Plazma Moru', category: 'Neon', type: 'solid', colors: ['#A855F7'], price: 120, vip: true, isDark: true },
  { id: 'parlak_erguvan', name: 'Parlak Erguvan', category: 'Neon', type: 'solid', colors: ['#E024D6'], price: 120, vip: true, isDark: false },
  { id: 'hologram_mor', name: 'Hologram Mor', category: 'Neon', type: 'solid', colors: ['#D946EF'], price: 120, vip: true, isDark: false },
  { id: 'siber_menekse', name: 'Siber Menekşe', category: 'Neon', type: 'solid', colors: ['#8B5CF6'], price: 120, vip: true, isDark: true },
  { id: 'elektrik_mavisi_n', name: 'Elektrik Mavisi', category: 'Neon', type: 'solid', colors: ['#00F0FF'], price: 120, vip: true, isDark: false },
  { id: 'kuantum_mavi', name: 'Kuantum Mavi', category: 'Neon', type: 'solid', colors: ['#0066FF'], price: 120, vip: true, isDark: true },
  { id: 'siber_turkuaz', name: 'Siber Turkuaz', category: 'Neon', type: 'solid', colors: ['#00F5D4'], price: 120, vip: true, isDark: false },
  { id: 'lazer_mavi', name: 'Lazer Mavi', category: 'Neon', type: 'solid', colors: ['#04D9FF'], price: 120, vip: true, isDark: false },
  { id: 'tron_mavisi', name: 'Tron Mavisi', category: 'Neon', type: 'solid', colors: ['#00E5FF'], price: 120, vip: true, isDark: false },
  { id: 'neon_gokyuzu', name: 'Neon Gökyüzü', category: 'Neon', type: 'solid', colors: ['#38BDF8'], price: 120, vip: true, isDark: false },
  { id: 'toksik_yesil', name: 'Toksik Yeşil', category: 'Neon', type: 'solid', colors: ['#00FF66'], price: 120, vip: true, isDark: false },
  { id: 'lazer_yesil', name: 'Lazer Yeşil', category: 'Neon', type: 'solid', colors: ['#39FF14'], price: 120, vip: true, isDark: false },
  { id: 'neon_matrix', name: 'Neon Matrix Yeşili', category: 'Neon', type: 'solid', colors: ['#00FF41'], price: 120, vip: true, isDark: false },
  { id: 'elektrik_lime', name: 'Elektrik Lime', category: 'Neon', type: 'solid', colors: ['#CCFF00'], price: 120, vip: true, isDark: false },
  { id: 'radyoaktif_yesil', name: 'Radyoaktif Yeşil', category: 'Neon', type: 'solid', colors: ['#76FF03'], price: 120, vip: true, isDark: false },
  { id: 'asit_yesili', name: 'Asit Yeşili', category: 'Neon', type: 'solid', colors: ['#B5FF00'], price: 120, vip: true, isDark: false },
  { id: 'parlak_klorofil', name: 'Parlak Klorofil', category: 'Neon', type: 'solid', colors: ['#00E676'], price: 120, vip: true, isDark: false },
  { id: 'elektrik_sari', name: 'Elektrik Sarı', category: 'Neon', type: 'solid', colors: ['#FFFF00'], price: 120, vip: true, isDark: false },
  { id: 'siber_gunes', name: 'Siber Güneş', category: 'Neon', type: 'solid', colors: ['#FFEA00'], price: 120, vip: true, isDark: false },
  { id: 'neon_kehribar', name: 'Neon Kehribar', category: 'Neon', type: 'solid', colors: ['#FFBF00'], price: 120, vip: true, isDark: false },
  { id: 'lazer_turuncu', name: 'Lazer Turuncu', category: 'Neon', type: 'solid', colors: ['#FF5500'], price: 120, vip: true, isDark: false },
  { id: 'asit_turuncu', name: 'Asit Turuncu', category: 'Neon', type: 'solid', colors: ['#FF6600'], price: 120, vip: true, isDark: false },
  { id: 'parlak_mandarin', name: 'Parlak Mandalin', category: 'Neon', type: 'solid', colors: ['#FF8800'], price: 120, vip: true, isDark: false },
  { id: 'neon_mesale', name: 'Neon Meşale', category: 'Neon', type: 'solid', colors: ['#FF3300'], price: 120, vip: true, isDark: false },
  { id: 'lazer_kirmizi', name: 'Lazer Kırmızı', category: 'Neon', type: 'solid', colors: ['#FF0000'], price: 120, vip: true, isDark: true },
  { id: 'neon_kirmizi_glow', name: 'Neon Kırmızı Glow', category: 'Neon', type: 'solid', colors: ['#FF1744'], price: 120, vip: true, isDark: true },
  { id: 'siber_mercan', name: 'Siber Mercan', category: 'Neon', type: 'solid', colors: ['#FF4081'], price: 120, vip: true, isDark: false },
  { id: 'elektrik_kor', name: 'Elektrik Kor', category: 'Neon', type: 'solid', colors: ['#FF2A00'], price: 120, vip: true, isDark: false },
  { id: 'neon_yakut', name: 'Neon Yakut', category: 'Neon', type: 'solid', colors: ['#E11D48'], price: 120, vip: true, isDark: true },
  { id: 'parlak_magma', name: 'Parlak Magma', category: 'Neon', type: 'solid', colors: ['#FF3838'], price: 120, vip: true, isDark: false },
  { id: 'siber_kiremit', name: 'Siber Kiremit', category: 'Neon', type: 'solid', colors: ['#F43F5E'], price: 120, vip: true, isDark: false },
  { id: 'plazma_kirmizi', name: 'Plazma Kırmızı', category: 'Neon', type: 'solid', colors: ['#FF0033'], price: 120, vip: true, isDark: true },
  { id: 'neon_kivilcim', name: 'Neon Kıvılcım', category: 'Neon', type: 'solid', colors: ['#FF5252'], price: 120, vip: true, isDark: false },
];

export const ALL_THEMES: Theme[] = [
  ...neutral,
  ...pastel,
  ...dark,
  ...vibrant,
  ...nature,
  ...noble,
  ...gradients,
  ...retro,
  ...neon,
];

export const FREE_THEMES = ALL_THEMES.filter((t) => t.price === 0);
export const VIP_THEMES = ALL_THEMES.filter((t) => t.vip);

export function getThemeById(id: string): Theme | undefined {
  return ALL_THEMES.find((t) => t.id === id);
}

export function themeToCss(theme: Theme | undefined): string {
  if (!theme) return '#f8fafc';
  if (theme.type === 'gradient') {
    return `linear-gradient(135deg, ${theme.colors.join(', ')})`;
  }
  return theme.colors[0];
}

export function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
