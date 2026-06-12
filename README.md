# ESTİ BİRAZ Fresh

Sıfırdan kurulmuş, statik çalışabilen ve Firebase bağlanınca Firestore/Auth ile genişleyen modern ESTİ BİRAZ dergi sitesi.

## Tasarım yaklaşımı

- Modern dergi/masthead hissi: koyu üst başlık, yatay bölüm navigasyonu, güçlü serif başlıklar, kartlı yayın akışı.
- ESTİ BİRAZ kimliği: koyu teal, mavi düğüm, yeşil yaprak/alev ve kırmızı EKG vurguları korunur.
- Erişilebilirlik: `skip-link`, semantik başlıklar, `dialog`, klavye odaklanabilir butonlar, azaltılmış hareket desteği.
- Eski projenin şişen düzeltmeleri taşınmadı; içerik mantığı ve ana ihtiyaçlar yeni mimariyle sıfırdan kuruldu.

## Dosya yapısı

```text
.
├── index.html
├── src/
│   ├── app.js
│   ├── content.js
│   ├── firebase-config.js
│   ├── firebase-service.js
│   └── styles.css
├── public/assets/
│   └── esti-biraz-logo.svg
├── firestore.rules
├── firebase.json
├── .firebaserc.example
└── .github/workflows/firebase-hosting.yml
```

## Lokal çalıştırma

Bu proje derleme gerektirmez. ES module kullandığı için dosyayı doğrudan çift tıklamak yerine küçük bir statik sunucu ile açın.

```bash
cd esti-biraz-fresh
python3 -m http.server 5173
```

Sonra tarayıcıda:

```text
http://localhost:5173
```

Alternatif:

```bash
npm run dev
```

> Not: `npm run dev`, `npx serve` çağırır; internet ya da önceden kurulu `serve` gerektirebilir. En temiz yöntem `python3 -m http.server`dır.

## Firebase kurulumu

1. Firebase Console'da bir proje oluşturun.
2. Web uygulaması ekleyin.
3. Firebase Config bilgilerini `src/firebase-config.js` içine yapıştırın.
4. Authentication > Sign-in method bölümünden Email/Password sağlayıcısını açın.
5. Firestore Database oluşturun.
6. `firestore.rules` dosyasındaki admin e-postasını gerekirse değiştirin.
7. Kuralları yayınlayın:

```bash
firebase deploy --only firestore:rules
```

## Firestore koleksiyonları

### `articles/{articleId}`

```js
{
  title: 'Yazı başlığı',
  category: 'Sağlık',
  summary: 'Kısa özet',
  body: ['Paragraf 1', 'Paragraf 2'],
  tags: ['sağlık', 'veri'],
  readingMinutes: 4,
  publishedAt: '2026-06-12'
}
```

### `courses/{courseId}`

```js
{
  title: 'Ders başlığı',
  category: 'Eğitim',
  summary: 'Ders özeti',
  lessons: [
    { id: 'temel-kavram', title: 'Temel kavramlar' },
    { id: 'uygulama', title: 'Uygulama' }
  ]
}
```

### `users/{uid}/courseProgress/{courseId}/lessons/{lessonId}`

```js
{
  completed: true,
  updatedAt: serverTimestamp()
}
```

Giriş yapan kullanıcıların ders ilerlemesi burada kalıcı tutulur. Giriş yapmayan kullanıcı için aynı mantık `localStorage` üzerinde geçici tutulur.

## GitHub üzerinde çalıştırma

### GitHub Pages

1. Bu klasörü repoya ekleyin.
2. GitHub > Settings > Pages bölümünde branch olarak `main`, klasör olarak `/root` seçin.
3. Firebase config doğruysa sayfa GitHub Pages üzerinde de Firebase'e bağlanır.

### Firebase Hosting + GitHub Actions

Workflow dosyası `.github/workflows/firebase-hosting.yml` içinde hazırdır. GitHub Secrets bölümüne şunları ekleyin:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`

Firebase CLI ile servis hesabı üretip secret olarak ekleyin. Sonra `main` branch'e her push canlıya deploy eder.

## Eski projeden taşınan işlev ilkeleri

- Dergi/yazı akışı
- ESTİ BİRAZ Akademi bölümü
- Ders tamamlama/ilerleme mantığı
- Admin olan kullanıcı için yönetim paneli fikri
- Normal kullanıcı için okuma/çalışma deneyimi
- Firebase Auth + Firestore tabanına geçişe hazır mimari

## Bilinçli olarak taşınmayanlar

- Eski projedeki dağınık UI yamaları
- `ui-enhancements.js` benzeri sonradan bindirilmiş düzeltme katmanları
- Kart hiza bozan görsel/placeholder kalabalığı
- Kurs detay hero alanındaki gereksiz “ESTİ BİRAZ AKADEMİ” kartı

## Logo notu

Bu pakette geliştirilebilirlik için SVG sembol yer alır. Önceki marka kararında final PNG dosyası onaylandıysa, canlı sitede `public/assets/esti-biraz-logo.svg` yerine onaylı `esti-biraz-logo-final-transparent-2048.png` veya 512 px sürümünü koyup `index.html` içindeki `src` yollarını değiştirebilirsiniz.
