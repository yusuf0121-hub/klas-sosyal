# Klas Sosyal

Modern sosyal medya platformu - Bağlantı Kur, Paylaş, Etkileş

Klas Sosyal, kullanıcıların bağlantı kurabileceği, fotoğraf ve video paylaşabileceği, canlı sohbet edebileceği ve topluluklar oluşturabileceği gerçek zamanlı sosyal ağ uygulamasıdır.

## 🌐 Genel Bakış

Klas Sosyal, Instagram ve Facebook benzeri özellikleriyle modern bir sosyal medya deneyimi sunan açık kaynak platformudur. Kullanıcı profilleri, arkadaş ağları, paylaşım akışı, beğeniler, yorumlar, mesajlaşma ve trend konuları gibi sosyal medya platformlarının temel özelliklerini içerir.

## ✨ Ana Özellikler

- 📸 Fotoğraf ve video paylaşımı
- 👥 Kullanıcı profilleri ve arkadaş bağlantıları
- ❤️ Beğen, yorum ve paylaş sistemi
- 💬 Gerçek zamanlı mesajlaşma
- 🔔 Bildirim sistemi
- 🌍 Keşfet ve trend konuları
- 🔍 Arama ve hashtag desteği
- 🎯 Takip ve takipçi sistemi
- 🛡️ Gizlilik ve güvenlik ayarları
- 📱 Mobil uyumlu tasarım

## 🛠️ Teknoloji Yığını

| Kategori | Teknoloji |
|----------|-----------|
| Frontend | TypeScript, React, Next.js, Tailwind CSS |
| Backend | Node.js, PostgreSQL |
| Database | PostgreSQL, Prisma ORM |
| Hosting | Vercel |
| Real-time | WebSockets |
| Deployment | Docker (opsiyonel) |

## 📁 Proje Yapısı

```
src/
├── app/              # Next.js app router
├── components/       # React UI bileşenleri
├── lib/              # Shared utilities & helpers
├── pages/            # API endpoints
├── services/         # Business logic
├── hooks/            # Custom React hooks
├── styles/           # Global styles
└── utils/            # Helper functions
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18 veya üzeri
- PostgreSQL 13+
- npm/yarn/pnpm

### Yükleme

```bash
# Repoyu klonla
git clone https://github.com/yusuf0121-hub/klas-sosyal.git
cd klas-sosyal

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env.local

# Veritabanını ayarla
npm run db:push

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcını `http://localhost:3000` adresine aç ve başla!

## ⚙️ Ortam Yapılandırması

`.env.local` dosyasında aşağıdaki değişkenleri ayarla:

```bash
# Veritabanı
DATABASE_URL=postgresql://user:password@localhost:5432/klas_sosyal

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Kimlik Doğrulama
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRY=7d

# Dosya Yükleme
NEXT_PUBLIC_UPLOAD_URL=http://localhost:3000/api/upload
MAX_FILE_SIZE=5242880

# Node Ortamı
NODE_ENV=development
```

## 📝 Temel Kullanım

### Kayıt ve Giriş
```bash
POST /api/auth/register
POST /api/auth/login
```

### Profil
```bash
GET /api/user/profile
PUT /api/user/profile
GET /api/user/:userId
```

### Paylaşımlar
```bash
POST /api/posts
GET /api/posts/feed
GET /api/posts/:postId
POST /api/posts/:postId/like
POST /api/posts/:postId/comment
```

### Mesajlaşma
```bash
POST /api/messages
GET /api/messages/:conversationId
```

## 🤝 Katkı Sağlama

Katkılarınız hoşgeldiniz! Projeyi geliştirmeye yardımcı olmak için:

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/YeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add: YeniOzellik'`)
4. Branch'e push edin (`git push origin feature/YeniOzellik`)
5. Pull Request açın

## 📄 Lisans

MIT License - Tüm detaylar için [LICENSE](LICENSE) dosyasına bakın

## 📞 İletişim & Destek

- **Geliştirici**: [@yusuf0121-hub](https://github.com/yusuf0121-hub)
- **GitHub Repository**: [klas-sosyal](https://github.com/yusuf0121-hub/klas-sosyal)
- **İssue Tracker**: [Hata bildir veya özellik iste](https://github.com/yusuf0121-hub/klas-sosyal/issues)

---

**Klas Sosyal** - Açık kaynak, modern, güvenilir sosyal medya platformu 🚀
