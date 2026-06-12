export const demoArticles = [
  {
    id: 'bilgi-platformu-yeni-donem',
    title: 'ESTİ BİRAZ için yeni dönem: sade bilgi, güçlü gezinme',
    category: 'Gündem',
    summary: 'Eski projenin içeriğini koruyan ama kod ve arayüz borcunu sıfırlayan yeni yayın mimarisi.',
    body: [
      'Bu tasarım, yama üstüne yama eklenmiş bir arayüz yerine temiz bir dergi ana sayfası mantığıyla kuruldu. Ana amaç; okuyucunun yazı, ders ve veri notu arasında kaybolmadan dolaşabilmesi.',
      'Sayfa; masthead, yatay bölüm navigasyonu, editör seçimi, yazı kartları, akademi ve veri notları şeklinde okunabilir bloklara ayrıldı. Firebase bağlantısı eklenmediğinde bile demo içerikle çalışır.',
      'Firebase bağlandığında articles ve courses koleksiyonları Firestore üzerinden okunur. Ders ilerlemesi giriş yapan kullanıcıda users/{uid}/courseProgress altında, girişsiz kullanıcıda localStorage üzerinde tutulur.'
    ],
    tags: ['tasarım', 'firebase', 'erişilebilirlik'],
    readingMinutes: 4,
    publishedAt: '2026-06-12'
  },
  {
    id: 'saglik-okuryazarligi',
    title: 'Sağlık okuryazarlığı: bilgiyi anlaşılır kılmak',
    category: 'Sağlık',
    summary: 'Bir sağlık metnini daha etkili yapan şey yalnızca doğruluk değil; anlaşılabilirlik ve güvenilirliktir.',
    body: [
      'Sağlık okuryazarlığı, kişinin sağlık bilgisini bulma, anlama, değerlendirme ve uygulama becerisidir. ESTİ BİRAZ bu alanda kısa, yalın ve kaynak bilinci yüksek içerikler üretmeyi hedefler.',
      'Yeni tasarımda uzun metinler küçük bölümlere ayrılır. Kart başlıkları güçlü, özetler kısa, ana metinler ise okunabilir satır uzunluklarıyla gösterilir.'
    ],
    tags: ['sağlık', 'okuryazarlık'],
    readingMinutes: 3,
    publishedAt: '2026-06-10'
  },
  {
    id: 'veriyle-dusunmek',
    title: 'Veriyle düşünmek: sayıların hikâyesini bozmayalım',
    category: 'Veri',
    summary: 'Grafik, oran ve hızları anlatırken bağlamı korumak kullanıcı güvenini artırır.',
    body: [
      'Veri notları bölümü, küçük ama güvenilir analiz kartları için hazırlandı. Nüfus, hız, oran ve yüzdelere dayalı kısa açıklamalar burada yayınlanabilir.',
      'Amaç, sayıların yalnızca görsel olarak çekici değil, yöntemsel olarak da temiz sunulmasıdır.'
    ],
    tags: ['istatistik', 'veri', 'epidemiyoloji'],
    readingMinutes: 5,
    publishedAt: '2026-06-08'
  },
  {
    id: 'egitimde-kisa-dersler',
    title: 'Eğitimde kısa ders mantığı: önce kavra, sonra uygula',
    category: 'Eğitim',
    summary: 'Akademi alanı uzun dersleri küçük, tamamlanabilir parçalara bölmek için tasarlandı.',
    body: [
      'Öğrenme deneyimi küçük ders parçalarıyla daha sürdürülebilir hale gelir. Her ders için açıklama, örnek ve ilerleme takibi birlikte düşünüldü.',
      'Giriş yapan kullanıcıların ilerlemesi kalıcı saklanır. Böylece farklı cihazlarda aynı öğrenme yolu sürdürülebilir.'
    ],
    tags: ['akademi', 'öğrenme'],
    readingMinutes: 3,
    publishedAt: '2026-06-06'
  },
  {
    id: 'bilimsel-dusunme-notlari',
    title: 'Bilimsel düşünme notları: şüphe, kanıt ve açıklık',
    category: 'Bilim',
    summary: 'Bilim yazılarında iddia, kanıt ve sınırları ayrı göstermek iyi editoryal hijyendir.',
    body: [
      'Bilimsel içerik üretiminde kesinlik kadar belirsizliği açıkça göstermek de önemlidir. Okura neyi bildiğimizi, neyi tahmin ettiğimizi ve neyin henüz tartışmalı olduğunu söylemek güven yaratır.',
      'Yeni kart sistemi, bilim içeriklerinde kategori, etiket ve okuma süresi gibi küçük ama yönlendirici işaretleri öne çıkarır.'
    ],
    tags: ['bilim', 'kanıt'],
    readingMinutes: 4,
    publishedAt: '2026-06-04'
  },
  {
    id: 'uygulama-mimarisi',
    title: 'Uygulama mimarisi: az dosya, açık sorumluluk',
    category: 'Teknoloji',
    summary: 'Yeni proje; içerik, Firebase servisi ve arayüz davranışlarını ayrı modüllerde tutar.',
    body: [
      'Kod tabanı basit ama genişletilebilir tutuldu. İçerik demo veriden başlar, Firebase bağlanınca aynı arayüz Firestore koleksiyonlarını okuyabilir.',
      'Bu yaklaşım, eski projenin şişmesine neden olan yamalı UI eklemelerini azaltır ve yeni özelliklerin nereye yazılacağını belirginleştirir.'
    ],
    tags: ['frontend', 'mimari'],
    readingMinutes: 4,
    publishedAt: '2026-06-02'
  }
];

export const demoCourses = [
  {
    id: 'saglik-okuryazarligi-101',
    title: 'Sağlık Okuryazarlığı 101',
    category: 'Sağlık',
    summary: 'Sağlık bilgisini bulma, anlama, değerlendirme ve sade anlatma becerileri.',
    lessons: [
      { id: 'temel-kavram', title: 'Temel kavramlar' },
      { id: 'guvenilir-kaynak', title: 'Güvenilir kaynak nasıl seçilir?' },
      { id: 'sade-anlatim', title: 'Sade sağlık metni yazımı' }
    ]
  },
  {
    id: 'veri-okuryazarligi',
    title: 'Veri Okuryazarlığı',
    category: 'Veri',
    summary: 'Oran, hız, grafik, tablo ve epidemiyolojik göstergeleri doğru okuma.',
    lessons: [
      { id: 'oran-hiz', title: 'Oran ve hız farkı' },
      { id: 'grafik-okuma', title: 'Grafik okuma ilkeleri' },
      { id: 'yaniltici-grafikler', title: 'Yanıltıcı grafiklerden kaçınma' }
    ]
  },
  {
    id: 'egiticiler-icin-mikro-ders',
    title: 'Eğiticiler için Mikro Ders',
    category: 'Eğitim',
    summary: 'Karmaşık konuları kısa, kalıcı ve sınav dostu parçalara ayırma.',
    lessons: [
      { id: 'hedef-yazma', title: 'Öğrenme hedefi yazma' },
      { id: 'mini-ornek', title: 'Mini örnek ve analogi kullanma' },
      { id: 'geri-bildirim', title: 'Kısa geri bildirim döngüsü' }
    ]
  },
  {
    id: 'firebase-ile-icerik',
    title: 'Firebase ile İçerik Yönetimi',
    category: 'Teknoloji',
    summary: 'Firestore koleksiyonları, kullanıcı ilerlemesi ve admin yazı ekleme akışı.',
    lessons: [
      { id: 'auth', title: 'Firebase Auth mantığı' },
      { id: 'firestore', title: 'Firestore koleksiyon yapısı' },
      { id: 'rules', title: 'Güvenlik kuralları' }
    ]
  }
];

export const demoMetrics = [
  { value: '4', label: 'Ana yayın omurgası' },
  { value: '2', label: 'Kayıt modu: Firestore + yerel' },
  { value: '100%', label: 'Responsive statik arayüz' }
];
