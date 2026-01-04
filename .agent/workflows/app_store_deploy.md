---
description: App Store'a Uygulama Yükleme Rehberi
---

Bu rehber, React Native (Expo) projenizi Apple App Store'a yüklemek için gerekli adımları içerir.

## Ön Gereksinimler

1.  **Apple Developer Hesabı**: [Apple Developer Program](https://developer.apple.com/programs/)'a kayıtlı olmanız gerekir (Yıllık ~$99).
2.  **Expo Hesabı**: [expo.dev](https://expo.dev) üzerinde bir hesabınız olmalı.

## Adım 1: EAS CLI Kurulumu ve Giriş

Expo Application Services (EAS), uygulamayı bulutta derlemek için kullanılır.

```bash
# EAS CLI aracını global olarak yükleyin
npm install -g eas-cli

# Expo hesabınıza giriş yapın
eas login
```

## Adım 2: Projeyi Yapılandırma

Projenizi EAS kullanımı için yapılandırın.

```bash
# Proje dizininde çalıştırın
eas build:configure
```
*   Bu komut size platform soracaktır. `All` veya `iOS` seçebilirsiniz.
*   `eas.json` adında bir dosya oluşturulacaktır.

## Adım 3: App Store Bilgilerini Ayarlama

`app.json` dosyasındaki `bundleIdentifier` alanının benzersiz ve Apple Developer hesabınızla uyumlu olduğundan emin olun.
Örneğin: `"bundleIdentifier": "com.sizinadiniz.smartcalorieapp"`

## Adım 4: Üretim (Production) Derlemesi Almak

Uygulamanın App Store sürümünü oluşturmak için:

```bash
eas build --platform ios
```
*   Eğer ilk kez çalıştırıyorsanız, Apple hesabınızla giriş yapmanızı isteyecektir.
*   EAS, sertifikaları ve profilleri sizin için otomatik olarak yönetebilir.
*   Derleme tamamlandığında size bir `.ipa` dosyası indirme linki verecektir.

## Adım 5: App Store Connect'e Yükleme

Derlenen uygulamayı Apple'a göndermek için:

1.  [App Store Connect](https://appstoreconnect.apple.com/)'e gidin ve "My Apps" altında yeni bir uygulama (New App) oluşturun.
2.  Bundle ID'nizin `app.json`'daki ile aynı olduğundan emin olun.
3.  EAS üzerinden otomatik yükleme yapmak için:

```bash
eas submit -p ios
```
*   Bu komut sizden App Store Connect bilgilerinizi isteyecek ve oluşturulan son derlemeyi otomatik olarak yükleyecektir.

## Adım 6: TestFlight ve Yayınlama

1.  Uygulama yüklendikten sonra App Store Connect'te "TestFlight" sekmesine gelir (işlenmesi biraz zaman alabilir).
2.  TestFlight üzerinden uygulamanızı test kullanıcılarına dağıtabilirsiniz.
3.  Her şey hazır olduğunda "App Store" sekmesinden uygulamanızı incelemeye (Review) gönderebilirsiniz.
