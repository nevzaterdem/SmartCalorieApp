# SmartCalorieApp

SmartCalorieApp, kullanıcıların günlük kalori alımlarını, su tüketimlerini ve diyet programlarını takip etmelerini sağlayan kapsamlı bir sağlık ve yaşam tarzı uygulamasıdır. Hem mobil hem de web (masaüstü) platformlarında çalışacak şekilde tasarlanmıştır.

## 🚀 Proje Hakkında

Bu proje üç ana bileşenden oluşmaktadır:
1.  **Backend**: Uygulamanın sunucu tarafı, veritabanı yönetimi ve API servisleri.
2.  **Frontend**: Web ve masaüstü (Electron) tabanlı kullanıcı arayüzü.
3.  **Mobile**: iOS ve Android cihazlar için React Native (Expo) tabanlı mobil uygulama.

## 🛠️ Teknolojiler

### Backend
*   **Platform**: Node.js
*   **Framework**: Express.js
*   **Dil**: TypeScript
*   **Veritabanı ORM**: Prisma
*   **Yapay Zeka**: Google Generative AI (@google/generative-ai)
*   **Kimlik Doğrulama**: JWT (JSON Web Tokens), Bcryptjs

### Frontend (Web/Desktop)
*   **Build Tool**: Vite
*   **Framework**: React
*   **Dil**: TypeScript
*   **Stil**: TailwindCSS
*   **Masaüstü Entegrasyonu**: Electron
*   **İkonlar**: Lucide React
*   **Grafikler**: Recharts

### Mobile
*   **Framework**: React Native (Expo SDK 54)
*   **Yönlendirme**: Expo Router
*   **Stil**: NativeWind (TailwindCSS for React Native)
*   **Dil**: TypeScript
*   **Özellikler**: Kamera erişimi, bildirimler, jest yönetimi (Gesture Handler)

## 📂 Proje Yapısı

```
SmartCalorieApp/
├── backend/       # Sunucu ve API kodları
├── frontend/      # Web ve Electron arayüz kodları
├── mobile/        # React Native mobil uygulama kodları
└── .gitignore     # Git tarafından yok sayılacak dosyalar
```

## 🏁 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

### 1. Backend Kurulumu

```bash
cd backend
npm install
# .env dosyasını oluşturun ve veritabanı bağlantı bilgilerinizi girin
npm run dev
```

### 2. Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev
```

### 3. Mobil Uygulama Kurulumu

```bash
cd mobile
npm install
npm start
```
Mobil uygulamayı çalıştırmak için telefonunuzda **Expo Go** uygulamasının yüklü olması gerekmektedir. `npm start` komutundan sonra çıkan QR kodu Expo Go ile okutarak uygulamayı test edebilirsiniz.

## 🤝 Katkıda Bulunma

1.  Bu repository'yi fork edin.
2.  Yeni bir özellik dalı (branch) oluşturun (`git checkout -b ozellik/YeniOzellik`).
3.  Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`).
4.  Dalınızı push edin (`git push origin ozellik/YeniOzellik`).
5.  Bir Pull Request oluşturun.

## 📄 Lisans

Bu proje kişisel kullanım ve geliştirmeler için oluşturulmuştur.
