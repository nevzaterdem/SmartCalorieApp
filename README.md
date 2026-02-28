# 🍎 SmartCalorie AI

<div align="center">

**Yapay Zeka Destekli Akıllı Kalori ve Sağlık Asistanı**

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo)](https://expo.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js)](https://nodejs.org)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini_AI-4285F4?logo=google)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://neon.tech)

[Özellikler](#-özellikler) • [Teknolojiler](#-teknoloji-stack) • [Kurulum](#-kurulum) • [API Dökümantasyonu](#-api-endpoints) • [Ekran Görüntüleri](#-uygulama-akışı)

</div>

---

## 📖 Proje Hakkında

SmartCalorie AI, kullanıcıların sağlıklı yaşam hedeflerine ulaşmasını sağlayan, uçtan uca entegre bir mobil uygulamadır. **Google Gemini AI** sayesinde yemek fotoğraflarını analiz ederek kalori ve makro besin değerlerini otomatik hesaplar, kişiselleştirilmiş diyet planları oluşturur and 7 günlük beslenme programları sunar.

### Neden SmartCalorie AI?

- 📸 **Fotoğraf çek, kaloriyi öğren** — AI ile anında besin analizi
- 🥗 **Kişisel diyet planı** — Kilo, boy, hedef bazlı 7 günlük plan
- 💧 **Su takibi** — Günlük su tüketim hedefi ve izleme
- 🏆 **Başarım sistemi** — Motivasyon için rozetler ve seri takibi
- 👥 **Sosyal özellikler** — Arkadaş ekleme ve liderlik tablosu
- 🌍 **Çoklu dil** — Türkçe ve İngilizce tam destek

---

## ✨ Özellikler

### 🧠 Yapay Zeka
| Özellik | Açıklama |
|---------|----------|
| **Fotoğraf Analizi** | Yemek fotoğrafından kalori, protein, karbonhidrat, yağ tespiti |
| **Akıllı Diyet Planı** | Kullanıcının fiziksel özelliklerine göre 7 günlük plan |
| **Çoklu Dil Desteği** | AI yanıtları seçilen dilde (TR/EN) |
| **Porsiyon Düzenleme** | Analiz sonrası miktar ayarlaması ile kalori güncelleme |

### 📱 Mobil Uygulama
| Özellik | Açıklama |
|---------|----------|
| **Kalori Takibi** | Günlük kalori hedefi, tüketim ve kalan hesaplama |
| **Su Takibi** | Günlük su tüketimi izleme (ml bazlı) |
| **Diyet Planı** | Öğün bazlı plan takibi ve tamamlama |
| **Başarımlar** | Otomatik rozet sistemi (seri, hedef, analiz) |
| **Sosyal** | Arkadaş ekleme, takip etme, liderlik tablosu |
| **Bildirimler** | Su hatırlatma ve günlük motivasyon |
| **Profil** | Kilo, boy, yaş, hedef yönetimi |
| **Şifremi Unuttum** | 6 haneli kod ile şifre sıfırlama |
| **Tema** | Otomatik koyu/açık tema desteği |
| **i18n** | Türkçe / İngilizce tam çeviri |

### 🔒 Güvenlik
| Özellik | Açıklama |
|---------|----------|
| **JWT Auth** | Token tabanlı güvenli oturum yönetimi |
| **Rate Limiting** | API istekleri sınırlama (genel: 100/15dk, auth: 5/15dk) |
| **Input Validation** | Tüm girdilere sunucu taraflı doğrulama |
| **Helmet** | HTTP güvenlik başlıkları |
| **CORS** | Yapılandırılabilir cross-origin politikası |
| **Bcrypt** | Şifre hashleme |

---

## 🛠 Teknoloji Stack

### Backend
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Node.js** | 20+ | Runtime environment |
| **Express.js** | 5.x | RESTful API framework |
| **TypeScript** | 5.9 | Tip güvenliği |
| **Prisma ORM** | 5.10 | Veritabanı erişimi ve migration |
| **PostgreSQL (Neon)** | - | Bulut veritabanı (serverless) |
| **Google Gemini AI** | 0.24 | Fotoğraf analizi ve diyet planı |
| **JWT** | 9.x | Kimlik doğrulama token |
| **Bcrypt** | 3.x | Şifre hashleme |
| **Helmet** | 8.x | HTTP güvenlik başlıkları |
| **express-rate-limit** | 8.x | API istekleri sınırlama |
| **Multer** | 2.x | Dosya yükleme (fotoğraf) |
| **Jest + Supertest** | - | Test altyapısı (38 test) |

### Mobile
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **React Native** | 0.81 | Cross-platform mobil framework |
| **Expo SDK** | 54 | Geliştirme araçları ve servisleri |
| **Expo Router** | 6.x | Dosya tabanlı navigasyon |
| **TypeScript** | 5.9 | Tip güvenliği |
| **expo-camera** | 17.x | Kamera erişimi |
| **expo-image-picker** | 17.x | Galeri erişimi |
| **expo-linear-gradient** | 15.x | Gradient UI bileşenleri |
| **expo-notifications** | 0.32 | Bildirim sistemi |
| **Lucide React Native** | 0.562 | İkon kütüphanesi |
| **AsyncStorage** | 2.x | Yerel veri depolama |
| **i18n-js** | 4.x | Çoklu dil desteği |
| **EAS Build** | - | Bulut derleme ve dağıtım |

### Altyapı & DevOps
| Servis | Kullanım Amacı |
|--------|----------------|
| **Render.com** | Backend hosting (Node.js) |
| **Neon** | PostgreSQL veritabanı (serverless) |
| **EAS (Expo)** | Mobil uygulama derleme ve dağıtım |
| **GitHub** | Kaynak kod yönetimi |

---

## 📂 Proje Yapısı

```
SmartCalorieApp/
├── backend/                    # Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma       # Veritabanı şeması (User, MealLog, WaterLog, DietPlan, vb.)
│   ├── src/
│   │   ├── index.ts            # Ana sunucu dosyası (Express setup, middleware)
│   │   ├── geminiService.ts    # Google Gemini AI entegrasyonu
│   │   ├── routes/
│   │   │   ├── auth.ts         # Kayıt, giriş, profil, şifre sıfırlama
│   │   │   ├── diet.ts         # Diyet planı oluşturma, aktif plan, öğün tamamlama
│   │   │   ├── meals.ts        # Öğün loglama (CRUD)
│   │   │   ├── water.ts        # Su takibi
│   │   │   ├── exercise.ts     # Egzersiz takibi
│   │   │   ├── social.ts       # Arkadaş, takip, liderlik tablosu
│   │   │   ├── achievements.ts # Başarım sistemi
│   │   │   └── dashboard.ts    # Günlük özet ve seri
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT doğrulama middleware
│   │   │   ├── security.ts     # Rate limiting konfigürasyonu
│   │   │   └── validate.ts     # Input validation middleware
│   │   └── __tests__/          # Jest test dosyaları
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                     # React Native + Expo Uygulaması
│   ├── app/
│   │   ├── _layout.tsx         # Root layout (ThemeProvider, LanguageProvider)
│   │   ├── auth.tsx            # Giriş / Kayıt / Şifremi Unuttum ekranı
│   │   └── (tabs)/
│   │       ├── _layout.tsx     # Tab navigasyon yapısı
│   │       ├── index.tsx       # Ana ekran (kalori, su, fotoğraf analizi)
│   │       ├── diet.tsx        # Diyet planı ekranı
│   │       ├── exercise.tsx    # Egzersiz takip ekranı
│   │       └── profile.tsx     # Profil ve ayarlar
│   ├── services/
│   │   └── api.ts              # Backend API servis katmanı
│   ├── context/
│   │   ├── ThemeContext.tsx     # Koyu/Açık tema yönetimi
│   │   └── LanguageContext.tsx  # Çoklu dil yönetimi (TR/EN)
│   ├── locales/
│   │   ├── tr.ts               # Türkçe çeviriler
│   │   └── en.ts               # İngilizce çeviriler
│   ├── assets/                 # İkon, splash screen görselleri
│   ├── app.json                # Expo yapılandırması
│   ├── eas.json                # EAS Build profilleri
│   └── package.json
│
└── frontend/                   # Web arayüzü (React + Vite)
```

---

## 🚀 Kurulum

### Gereksinimler

- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **npm** v9+
- **Expo Go** uygulaması (mobil test için) — [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 1. Projeyi Klonlama

```bash
git clone https://github.com/nevzaterdem/SmartCalorieApp.git
cd SmartCalorieApp
```

### 2. Backend Kurulumu

```bash
cd backend
npm install
```

`.env` dosyası oluşturun:
```env
# Veritabanı (Neon PostgreSQL veya local)
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

# JWT Secret - güvenli bir anahtar
JWT_SECRET="your_strong_secret_key_here"

# Google Gemini API Key
# https://makersuite.google.com/app/apikey adresinden alın
GEMINI_API_KEY="your_google_gemini_api_key"

# Sunucu portu (varsayılan: 3000)
PORT=3000

# CORS izinleri (virgülle ayırın)
CORS_ORIGINS="http://localhost:8081,http://localhost:3000"
```

Veritabanını oluşturun ve sunucuyu başlatın:
```bash
npx prisma db push        # Şemayı veritabanına uygula
npx prisma generate       # Prisma Client oluştur
npm run dev               # Geliştirme sunucusu (nodemon)
```

### 3. Mobil Uygulama Kurulumu

```bash
cd mobile
npm install
npx expo start            # Expo Dev Server başlat
```

- **Fiziksel Cihaz**: Expo Go uygulamasını açıp terminaldeki QR kodu okutun
- **iOS Simülatör**: `i` tuşuna basın (macOS gerekli)
- **Android Emülatör**: `a` tuşuna basın

### 4. Testleri Çalıştırma

```bash
cd backend
npm test                  # 38 test çalışır (Jest + Supertest)
```

---

## 🔌 API Endpoints

Backend `https://smartcalorieapp.onrender.com` adresinde canlıdır.

### Kimlik Doğrulama
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| `POST` | `/auth/register` | Yeni kullanıcı kaydı |
| `POST` | `/auth/login` | Giriş yapma (JWT token döner) |
| `GET` | `/auth/profile` | Profil bilgileri getir |
| `PUT` | `/auth/profile` | Profil güncelle |
| `POST` | `/auth/forgot-password` | Şifre sıfırlama kodu gönder |
| `POST` | `/auth/reset-password` | Yeni şifre ile sıfırla |

### AI Servisleri
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| `POST` | `/analyze` | Yemek fotoğrafı analizi (multipart/form-data) |
| `POST` | `/create-diet` | AI ile diyet planı oluştur |

### Beslenme Takibi
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| `POST` | `/meals` | Öğün kaydet |
| `GET` | `/meals/today` | Bugünkü öğünleri getir |
| `DELETE` | `/meals/:id` | Öğün sil |
| `POST` | `/water` | Su kaydı ekle |
| `GET` | `/water/today` | Bugünkü su verisi |

### Diyet Planı
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| `POST` | `/diet/create` | Yeni diyet planı oluştur ve kaydet |
| `GET` | `/diet/active?language=tr` | Aktif diyet planını getir |
| `POST` | `/diet/complete-meal` | Öğünü tamamla/geri al |
| `GET` | `/diet/history` | Diyet geçmişi |

### Sosyal & Başarımlar
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| `GET` | `/social/search?q=email` | Kullanıcı ara |
| `POST` | `/social/follow` | Kullanıcı takip et |
| `GET` | `/social/friends` | Arkadaş listesi |
| `GET` | `/social/leaderboard` | Liderlik tablosu |
| `GET` | `/achievements` | Başarımları getir |
| `POST` | `/achievements/check` | Yeni başarım kontrolü |

### Dashboard
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| `GET` | `/dashboard/daily` | Günlük özet |
| `GET` | `/dashboard/streak` | Gün serisi |

---

## 🗄 Veritabanı Şeması

```
User ─────────── MealLog (öğün kayıtları)
  │              WaterLog (su kayıtları)
  │              ExerciseLog (egzersiz kayıtları)
  │              DietPlan ──── DietMealCompletion (öğün tamamlama)
  │              Achievement (başarımlar)
  │              PasswordResetToken (şifre sıfırlama)
  └── Follow ─── followerId / followingId (sosyal bağlantılar)
```

---

## 🏗 Derleme ve Dağıtım

### EAS Build (Mobil)

```bash
# EAS CLI kur
npm install -g eas-cli

# Giriş yap
eas login

# iOS Production Build
eas build --platform ios --profile production

# Android Production Build  
eas build --platform android --profile production

# App Store'a gönder
eas submit -p ios
```

### Backend Deploy (Render.com)

Backend otomatik olarak `main` branch'ine push edildiğinde Render.com üzerinde deploy edilir.

---

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: yeni özellik eklendi'`)
4. Branch'e push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request açın

---

## 👨‍💻 Geliştirici

**Nevzat Erdem**
- GitHub: [@nevzaterdem](https://github.com/nevzaterdem)

---

## 📄 Lisans

MIT License
