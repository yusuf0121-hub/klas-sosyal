# Klas Sosyal Uygulaması

Class Social App - Sınıf İçi Sosyal Platform

Klas Sosyal, sınıf öğrencileri ve öğretmenleri için duyuru, mesajlaşma, paylaşım ve işbirliği sunan modern bir eğitim sosyal ağıdır.

## Genel Bakış

Klas Sosyal, okullardaki sınıf içi iletişimi ve işbirliğini kolaylaştıran, öğrenciler ile öğretmenler arasında etkin bir paylaşım ortamı oluşturan bir platformdur. Sınıf duyuruları, ödevler, tartışmalar ve anında mesajlaşma özellikleriyle eğitim ortamını güçlendiriyoruz.

## Anahtar Kelimeler

- Sınıf sosyal platformu
- Eğitim sosyal ağı
- Okul iletişim uygulaması
- Öğrenci işbirliği platformu
- Sınıf yönetimi sistemi
- Eğitim teknolojisi
- EdTech platform
- Sınıf topluluğu uygulaması

## Özellikler

- 📢 Sınıf duyuruları ve haber akışı
- 👥 Öğrenci ve öğretmen profilleri
- 💬 Mesajlaşma ve grup sohbeti
- 📝 Paylaşım ve yorum sistemi
- ✅ Ödev ve görev takibi
- 🔔 Gerçek zamanlı bildirim sistemi
- 🛡️ Rol bazlı kullanıcı yönetimi
- 📱 Mobil uyumlu arayüz
- 🔐 Veri güvenliği

## Teknoloji Yığını

- **Frontend**: TypeScript, React, Next.js, Tailwind CSS
- **Backend**: Node.js, PostgreSQL
- **ORM**: Prisma
- **Hosting**: Vercel
- **Tasarım**: Modern ve responsive UI/UX

## Proje Yapısı

```
src/
  app/              # Next.js app router
  components/       # React bileşenleri
  lib/              # Yardımcı kütüphaneler
  pages/            # API ve sayfa rotaları
  services/         # Business logic
  utils/            # Utility fonksiyonları
```

## Başlangıç

### Gereksinimler
- Node.js 18+
- PostgreSQL
- npm veya yarn

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini ayarla
cp .env.example .env.local

# Veritabanını migrate et
npm run db:migrate

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılacaktır.

## Ortam Değişkenleri

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/klas-sosyal
NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

## Katkıda Bulunma

Projeye katkı sağlamak için:

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'e push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## Lisans

MIT Lisansı - Ayrıntılar için [LICENSE](LICENSE) dosyasını görün

## İletişim

**Yazar**: yusuf0121-hub  
**GitHub**: [@yusuf0121-hub](https://github.com/yusuf0121-hub)  
**Proje**: [klas-sosyal](https://github.com/yusuf0121-hub/klas-sosyal)

---

**Not**: Bu proje eğitim amaçlı bir sosyal medya platformudur. Tüm kişisel veriler gizli tutulmalı ve GDPR/yerel veri koruma yasalarına uyulmalıdır.
