# 🍎 SmartCalorieApp

**Yapay Zeka Destekli Akıllı Yaşam ve Sağlık Asistanı**

SmartCalorieApp, modern teknolojileri kullanarak kullanıcıların sağlıklı yaşam hedeflerine ulaşmalarını sağlayan, uçtan uca entegre bir ekosistemdir. Mobil uygulama (iOS/Android) ve masaüstü/web arayüzleri sayesinde verilerinize her yerden erişebilir, **Google Gemini AI** desteğiyle kişiselleştirilmiş diyet önerileri alabilirsiniz.

---

## ✨ Temel Özellikler

### 🧠 Yapay Zeka Desteği
*   **Akıllı Diyet Planlama**: Kullanıcının fiziksel özelliklerine ve hedeflerine göre otomatik diyet listesi oluşturma.
*   **Görsel Analiz (Planlanan)**: Yemek fotoğraflarından kalori tahmini yapabilme potansiyeli.

### 📱 Mobil Deneyim (React Native)
*   **Hızlı ve Akıcı Arayüz**: NativeWind ile tasarlanmış modern, responsive tasarım.
*   **Kolay Takip**: Günlük kalori, su tüketimi ve makro besin (Protein, Karbonhidrat, Yağ) takibi.
*   **Mobil Entegrasyonlar**: Kamera ve bildirim servisleri ile tam uyumluluk.

### 💻 Web ve Masaüstü (React & Electron)
*   **Geniş Ekran Yönetimi**: Detaylı grafikler ve raporlar ile uzun vadeli gelişim takibi.
*   **Masaüstü Uygulaması**: Electron sayesinde yerel bir uygulama gibi çalışma performansı.

### 🔄 Güçlü Altyapı
*   **Gerçek Zamanlı Veri**: Tüm platformlar arasında anlık veri senkronizasyonu.
*   **Güvenli Kimlik Doğrulama**: JWT tabanlı güvenli oturum yönetimi.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

Bu proje, ölçeklenebilirlik ve performans gözetilerek en güncel teknolojilerle geliştirilmiştir.

| Alan | Teknolojiler |
|------|--------------|
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL (Önerilen) |
| **Frontend** | React, Vite, TailwindCSS, Electron, Recharts, Lucide Icons |
| **Mobile** | React Native, Expo SDK 54, Expo Router, NativeWind |
| **Yapay Zeka** | Google Gemini AI |
| **Güvenlik** | Bcrypt, JWT (JSON Web Tokens) |

---

## 📂 Proje Mimarisi

```bash
SmartCalorieApp/
├── backend/        # RESTful API servisleri ve iş mantığı
│   ├── src/
│   │   ├── controllers/ # İstek işleyicileri
│   │   ├── routes/      # API uç noktaları
│   │   └── services/    # Yapay zeka ve veritabanı servisleri
│   └── prisma/          # Veritabanı şemaları
├── frontend/       # Web ve Masaüstü kullanıcı arayüzü
│   ├── src/
│   │   ├── components/  # Yeniden kullanılabilir bileşenler
│   │   └── pages/       # Uygulama sayfaları
└── mobile/         # Çapraz platform mobil uygulama
    ├── app/             # Expo Router tabanlı sayfa yapısı
    └── components/      # Mobil uyumlu arayüz bileşenleri
```

---

## 🏁 Kurulum ve Geliştirme Rehberi

Projeyi yerel ortamınızda ayağa kaldırmak için aşağıdaki adımları sırasıyla uygulayın.

### 1. Backend Hazırlığı
Backend servisini başlatmadan önce gerekli çevresel değişkenleri ayarlamalısınız.

```bash
cd backend
npm install
```
`.env` dosyasını oluşturun:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/smartcalorie"
JWT_SECRET="guclu_bir_sifre"
GEMINI_API_KEY="google_gemini_api_key"
PORT=3000
```
Ardından servisi başlatın:
```bash
npm run dev
```

### 2. Frontend (Web/Desktop)
Web arayüzünü geliştirmek veya Electron ile masaüstü uygulaması olarak çalıştırmak için:

```bash
cd frontend
npm install
npm run dev
```

### 3. Mobil Uygulama
iOS veya Android simülatöründe ya da fiziksel cihazınızda test etmek için:

```bash
cd mobile
npm install
npm start
```
*   **Fiziksel Cihaz**: Telefonunuza **Expo Go** uygulamasını indirin ve terminaldeki QR kodu taratın.

---

## 📄 Lisans ve Telif Hakları

MIT License
