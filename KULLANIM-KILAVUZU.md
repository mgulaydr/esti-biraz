# ESTİ BİRAZ İçerik Kullanım Kılavuzu

Bu kılavuz, ESTİ BİRAZ sitesinde yazı ve ders içeriklerini nasıl hazırlayacağımı, zengin içerik bloklarını nasıl kullanacağımı ve ana sayfa/footer alanlarını nasıl değerlendireceğimi açıklar.

---

# 1. İçerik mantığı

ESTİ BİRAZ’da iki ana içerik türü vardır:

1. **Yazılar**

   * Dergi/makale akışı için kullanılır.
   * Sağlık, bilim, eğitim, veri okuryazarlığı ve teknoloji üzerine yazılar eklenebilir.

2. **Kurslar ve dersler**

   * Akademi bölümünde kullanılır.
   * Her kurs birden fazla dersten oluşabilir.
   * Derslerde okuma metni, video, PDF, görsel, test, tablo, kavram kartı ve kazanım blokları kullanılabilir.

Temel ilke şudur:

> Yazılar okuyucuyu bilgilendirir.
> Dersler okuyucuyu adım adım öğretir.

---

# 2. Zengin içerik blokları nedir?

Zengin içerik blokları, yazı veya ders içine farklı türde parçalar eklememi sağlar.

Örneğin:

* Paragraf
* Ara başlık
* Renkli callout / not kutusu
* YouTube video
* PDF gömme
* Görsel
* Liste
* Alıntı
* Mini test
* Doğru / yanlış sorusu
* Eşleştirme sorusu
* Kod bloğu
* Tablo
* İnfografik kart
* Önemli kavram kartı
* Terim sözlüğü kutusu
* Ders hedefleri
* Ders sonunda kazanımlar

Bu yapı sayesinde içerikler düz yazı olmaktan çıkar; okunabilir, öğretici ve etkileşimli hâle gelir.

---

# 3. Yazı hazırlarken önerilen akış

Bir yazı için ideal akış:

1. Kısa ve güçlü başlık
2. 2-3 cümlelik özet
3. Giriş paragrafı
4. Ara başlıklar
5. Açıklayıcı paragraflar
6. Gerekirse görsel, tablo veya PDF
7. Renkli not kutusu
8. Kaynak bağlantıları
9. Kısa sonuç

Örnek yazı yapısı:

```text
## Polio neden unutulmamalı?

Polio yalnızca geçmişte kalmış bir hastalık değildir. Aşılama oranları düştüğünde toplumlar yeniden risk altına girebilir.

[!info] Bir yudum bilgi
Toplum bağışıklığı, yalnızca bireyi değil, aşılanamayan kişileri de korur.

[!warning] Dikkat
Sağlık bilgisi paylaşırken kaynak, tarih ve kurum bilgisi mutlaka kontrol edilmelidir.

image: https://site.com/polio-gorsel.jpg | Polio aşılaması | Aşılama, bulaşıcı hastalıkların kontrolünde temel araçlardan biridir.

Kaynak: Dünya Sağlık Örgütü | https://www.who.int
```

---

# 4. Ders hazırlarken önerilen akış

Bir ders, makaleden daha öğretici ve daha basamaklı olmalıdır.

Bir ders için ideal akış:

1. Ders hedefleri
2. Kısa giriş
3. Ana anlatım
4. Video veya görsel
5. Önemli kavram kartı
6. Renkli not kutusu
7. Örnek / vaka
8. Mini test
9. Ders sonunda kazanımlar
10. Kaynaklar

Örnek ders yapısı:

```text
## Halk sağlığı nedir?

Halk sağlığı, toplumun sağlığını korumayı ve geliştirmeyi hedefleyen bir alandır.

[!info] Bir yudum bilgi
Halk sağlığı yalnızca hastalık tedavisi değil; koruma, geliştirme ve eşitsizlikleri azaltma yaklaşımıdır.

youtube: https://www.youtube.com/watch?v=VIDEO_ID | Halk Sağlığına Giriş

[!data] Veriyle bak
Bir ilçede bebek ölüm hızının izlenmesi, halk sağlığı değerlendirmesinin temel örneklerinden biridir.

Soru: Halk sağlığı hangi düzeyde düşünür?
A) Yalnızca bireysel düzeyde
B) Toplum düzeyinde
C) Yalnızca hastane düzeyinde
D) Yalnızca ilaç düzeyinde
Doğru: B
Açıklama: Halk sağlığı toplumun sağlığını koruma ve geliştirme yaklaşımıyla çalışır.
```

---

# 5. Callout / renkli not kutuları

Callout, metin içinde dikkat çekmek istediğim kısa notlar için kullanılır.

Kullanılabilecek türler:

```text
[!info]      Bilgi kutusu
[!warning]   Uyarı / dikkat kutusu
[!success]   Olumlu sonuç / başarı kutusu
[!data]      Veriyle bak kutusu
[!source]    Kaynak kontrolü kutusu
[!exam]      Sınav notu / kritik bilgi kutusu
```

## 5.1. Bilgi kutusu

```text
[!info] Bir yudum bilgi
Halk sağlığı yalnızca hastalık tedavisiyle ilgilenmez; hastalıkları önleme ve sağlığı geliştirme yaklaşımını da içerir.
```

Ne zaman kullanılır?

* Kısa açıklama
* Tanım
* Okuyucunun aklında kalması gereken sade bilgi

---

## 5.2. Uyarı kutusu

```text
[!warning] Dikkat
Bir sağlık bilgisini paylaşmadan önce kaynak, tarih ve kurum bilgisi mutlaka kontrol edilmelidir.
```

Ne zaman kullanılır?

* Yanlış anlaşılabilecek yerler
* Sağlık okuryazarlığı uyarıları
* Riskli bilgi kullanımı
* Sınavlarda karıştırılan noktalar

---

## 5.3. Başarı / sonuç kutusu

```text
[!success] Akılda kalsın
Aşılama, bireyi korurken toplum bağışıklığına da katkı sağlar.
```

Ne zaman kullanılır?

* Konunun özeti
* Ders sonunda ana fikir
* Olumlu sonuç
* Kazanım vurgusu

---

## 5.4. Veri kutusu

```text
[!data] Veriyle bak
Bir göstergenin yüksek ya da düşük olduğunu söylemeden önce payda, zaman aralığı ve veri kaynağı kontrol edilmelidir.
```

Ne zaman kullanılır?

* İstatistik
* Epidemiyolojik gösterge
* Grafik açıklaması
* Veri okuryazarlığı notu

---

## 5.5. Kaynak kutusu

```text
[!source] Kaynak kontrolü
Güvenilir bir sağlık bilgisinde yazar, kurum, tarih ve kaynak bağlantısı açık olmalıdır.
```

Ne zaman kullanılır?

* Kaynak değerlendirme
* Bilimsel güvenilirlik
* Okuyucuya kontrol alışkanlığı kazandırma

---

## 5.6. Sınav notu kutusu

```text
[!exam] Sınav notu
İnsidans yeni vakaları, prevalans ise mevcut tüm vakaları ifade eder.
```

Ne zaman kullanılır?

* Öğrenciler için kritik bilgi
* Karıştırılan kavramlar
* Kısa sınav ipuçları

---

# 6. YouTube videosu ekleme

Bir yazıya veya derse YouTube videosu eklemek için:

```text
youtube: https://www.youtube.com/watch?v=VIDEO_ID | Video başlığı
```

Örnek:

```text
youtube: https://www.youtube.com/watch?v=abc123 | Halk Sağlığına Giriş
```

Kullanım önerisi:

* Derslerde ana anlatımdan sonra kullanılabilir.
* Yazılarda konuyu destekleyen kısa video olarak kullanılabilir.
* Her derse çok fazla video koymak yerine 1 ana video yeterlidir.

---

# 7. PDF ekleme

PDF eklemek için:

```text
pdf: PDF başlığı | PDF bağlantısı
```

Örnek:

```text
pdf: Halk Sağlığı Ders Notu | https://site.com/halk-sagligi-ders-notu.pdf
```

Kullanım önerisi:

* Ders notu
* Kaynak dosya
* Okuma metni
* Resmî rapor
* Makale PDF’i

Not: Firebase Storage ücretsiz planda kullanılamadığı için şimdilik PDF’ler URL ile eklenmelidir. PDF dosyaları GitHub Pages, herkese açık bir dosya bağlantısı veya güvenilir bir dış bağlantı üzerinden verilebilir.

---

# 8. Görsel ekleme

Görsel eklemek için:

```text
image: Görsel URL | Alt metin | Görsel açıklaması
```

Örnek:

```text
image: https://site.com/asi-semasi.jpg | Aşılama zinciri şeması | Koruyucu sağlık hizmetlerinde aşılama zinciri
```

Alt metin önemlidir. Görme engelli kullanıcılar ve erişilebilirlik için her görselde açıklayıcı `alt` metni olmalıdır.

İyi alt metin örneği:

```text
Aşı, toplum bağışıklığı ve hastalık yayılımı arasındaki ilişkiyi gösteren basit şema
```

Zayıf alt metin örneği:

```text
resim
```

---

# 9. Liste ekleme

Liste için satır başına tire kullanılabilir:

```text
- Aşılama
- Temiz su
- Tarama programları
- Sağlık eğitimi
```

Kullanım önerisi:

* Madde madde özet
* Ders hedefleri
* Kazanımlar
* Kontrol listeleri

---

# 10. Mini test ekleme

Çoktan seçmeli mini test için:

```text
Soru: Halk sağlığı hangi düzeyde düşünür?
A) Yalnızca bireysel düzeyde
B) Toplum düzeyinde
C) Yalnızca hastane düzeyinde
D) Yalnızca ilaç düzeyinde
Doğru: B
Açıklama: Halk sağlığı toplumun sağlığını koruma ve geliştirme yaklaşımıyla çalışır.
```

Kullanım önerisi:

* Her dersin sonunda 1-3 kısa soru
* Yazılarda okuyucunun dikkatini ölçmek için 1 soru
* Sınava hazırlık içeriklerinde daha sık kullanım

İyi soru kısa, net ve tek doğru cevaba sahip olmalıdır.

---

# 11. Doğru / yanlış sorusu

Doğru / yanlış sorusu özellikle kavram kontrolü için uygundur.

Örnek:

```text
Doğru/Yanlış: Prevalans, bir toplumdaki mevcut tüm vakaları ifade eder.
Doğru: Doğru
Açıklama: Prevalans belirli bir anda veya dönemde mevcut tüm vakaları gösterir.
```

Kullanım önerisi:

* Tanım kontrolü
* Kavram yanılgısı düzeltme
* Ders arası hızlı pekiştirme

---

# 12. Eşleştirme sorusu

Eşleştirme sorusu kavramları karşılaştırmak için kullanılır.

Örnek:

```text
Eşleştirme:
İnsidans = Yeni vaka görülme hızı
Prevalans = Mevcut tüm vakalar
Mortalite = Ölüm hızı
Fertilite = Doğurganlık
```

Kullanım önerisi:

* Epidemiyoloji kavramları
* Flutter/Dart terimleri
* Sağlık göstergeleri
* Tanım-kavram eşleştirmeleri

---

# 13. Kod bloğu

Kod bloğu özellikle teknoloji ve eğitim içeriklerinde kullanılır.

Örnek:

```text
Kod:
const course = {
  title: "Halk Sağlığına Giriş",
  status: "published"
};
```

Kullanım önerisi:

* Flutter / Dart örnekleri
* Firebase kod örnekleri
* JSON örnekleri
* Komut satırı örnekleri

Kod bloğunu kısa tutmak daha okunabilir olur.

---

# 14. Tablo

Tablo, karşılaştırma yapmak için uygundur.

Örnek:

```text
Tablo:
Kavram | Anlamı | Örnek
İnsidans | Yeni vaka hızı | Bir yıldaki yeni tüberküloz vakaları
Prevalans | Mevcut vaka sıklığı | Belirli bir anda diyabetli kişi sayısı
Mortalite | Ölüm hızı | Bir yıldaki ölüm sayısı
```

Kullanım önerisi:

* Kavram karşılaştırmaları
* Veri özetleri
* Avantaj/dezavantaj tabloları
* Ders notu özetleri

---

# 15. İnfografik kart

İnfografik kart, tek bir güçlü bilgiyi görsel kart gibi vurgulamak için kullanılabilir.

Örnek kullanım alanları:

* “3 temel nokta”
* “Bir göstergenin yorumu”
* “Sınavda dikkat”
* “Veri okuma kuralı”

Örnek içerik:

```text
İnfografik:
Başlık: Veri okurken 3 soru
1. Payda nedir?
2. Zaman aralığı nedir?
3. Kaynak güvenilir mi?
```

---

# 16. Önemli kavram kartı

Kavram kartı, öğrencinin öğrenmesi gereken temel terimler için uygundur.

Örnek:

```text
Kavram:
Başlık: Prevalans
Tanım: Belirli bir toplumda belirli bir anda veya dönemde mevcut tüm vakaların sıklığıdır.
Akılda kalsın: Prevalans = mevcut yük.
```

Kullanım önerisi:

* Halk sağlığı kavramları
* İstatistik terimleri
* Teknoloji kavramları
* Eğitim bilimleri terimleri

---

# 17. Terim sözlüğü kutusu

Terim sözlüğü, bir yazı veya dersin sonunda kısa sözlük olarak kullanılabilir.

Örnek:

```text
Sözlük:
İnsidans: Yeni vaka görülme hızı.
Prevalans: Mevcut vaka sıklığı.
Mortalite: Ölüm hızı.
```

Kullanım önerisi:

* Öğrenciler için tekrar alanı
* Zor kavramları sadeleştirme
* Yazı sonu özet sözlük

---

# 18. Ders hedefleri

Ders hedefleri, dersin başında yer almalıdır.

Örnek:

```text
Ders hedefleri:
- Halk sağlığı kavramını tanımlar.
- Koruyucu sağlık hizmetlerini örneklerle açıklar.
- Toplum sağlığı yaklaşımının bireysel tedaviden farkını ayırt eder.
```

Kullanım önerisi:

Her dersin başında 2-4 hedef yeterlidir.

---

# 19. Ders sonunda kazanımlar

Kazanımlar, dersin sonunda yer almalıdır.

Örnek:

```text
Kazanımlar:
- Halk sağlığının toplum düzeyinde düşündüğünü açıklar.
- Koruyucu sağlık hizmetlerine örnek verir.
- Güvenilir sağlık bilgisini değerlendirirken kaynak kontrolü yapar.
```

Kullanım önerisi:

Kazanımlar, “Bu dersi bitiren kişi ne yapabilir?” sorusuna cevap vermelidir.

---

# 20. Ana sayfa başındaki hero alanı nasıl değerlendirilmeli?

Sayfanın başındaki şu bölüm ana mesaj alanıdır:

```text
Bilginin işe yaradığı, öğrenmenin sadeleştiği yeni ESTİ BİRAZ.

Sağlık, bilim, eğitim ve veri okuryazarlığını aynı çatı altında toplayan temiz, hızlı ve geliştirilebilir bir yayın deneyimi.
```

Bu bölüm sitenin marka vaadini anlatır. Burada teknik ayrıntı değil, okuyucuya dönük güçlü bir cümle olmalıdır.

## Kullanım seçenekleri

### Seçenek 1: Marka vaadi olarak bırakmak

Bu mevcut kullanım uygundur.

Önerilen biçim:

```text
Bilginin işe yaradığı, öğrenmenin sadeleştiği ESTİ BİRAZ.

Sağlık, bilim, eğitim ve veri okuryazarlığını aynı çatı altında buluşturan sade, güvenilir ve erişilebilir bir yayın deneyimi.
```

### Seçenek 2: Daha dergi diliyle kullanmak

```text
Merak edenler, öğrenenler ve anlatmak isteyenler için.

Sağlık, bilim, eğitim, veri ve teknoloji üzerine sade, kaynaklı ve okunabilir içerikler.
```

### Seçenek 3: Akademi vurgusunu artırmak

```text
Okumak, öğrenmek ve uygulamak için sade bir bilgi alanı.

ESTİ BİRAZ; yazılar, dersler, veri notları ve mini testlerle öğrenmeyi daha erişilebilir hâle getirir.
```

## Ne yapılmamalı?

Bu alanda fazla teknik bilgi verilmemelidir.

Örneğin şunlar hero alanı için uygun değildir:

```text
Firebase koleksiyonları hazır.
GitHub Pages uyumlu statik mimari.
```

Bunlar geliştirici notudur; okuyucunun ilk gördüğü alanda yer almamalıdır.

---

# 21. “Bugünün kısa notu” alanı nasıl değerlendirilmeli?

Mevcut alan:

```text
Bugünün kısa notu

Ders ilerlemesi artık kullanıcı hesabına bağlanabilir.
```

Bu alan teknik bir geliştirme notu gibi duruyor. Yayına çıktıktan sonra okuyucuya daha yararlı olacak şekilde kullanılmalıdır.

## Kullanım seçenekleri

### Seçenek 1: Editör notu

```text
Bugünün kısa notu

Güvenilir bilgi, yalnızca doğru olmakla kalmaz; kaynağı, tarihi ve bağlamı da açık olmalıdır.
```

### Seçenek 2: Haftanın öğrenme notu

```text
Haftanın öğrenme notu

Bir sağlık göstergesini yorumlarken önce paydayı, zamanı ve veri kaynağını kontrol et.
```

### Seçenek 3: Akademi duyurusu

```text
Akademiden not

Halk Sağlığına Giriş kursuna yeni dersler ve mini testler eklendi.
```

### Seçenek 4: Kaldığın yerden devam çağrısı

```text
Kısa öğrenme molası

Giriş yaparak ders ilerlemeni kaydedebilir ve kaldığın yerden devam edebilirsin.
```

## Önerim

Teknik cümleyi şu şekilde değiştirmek daha iyi olur:

```text
Kısa öğrenme molası

Giriş yaparak ders ilerlemeni kaydedebilir, yazıları ve dersleri daha düzenli takip edebilirsin.
```

---

# 22. Footer’daki teknik alanlar nasıl değerlendirilmeli?

Footer’da şu teknik açıklamalar yer alıyor:

```text
Firebase koleksiyonları articles courses users/{uid}/courseProgress

GitHub uyumu

Statik dosya mimarisi; GitHub Pages veya Firebase Hosting ile çalışır.
```

Bunlar geliştirme sürecinde yararlıydı; ancak yayındaki okuyucu için fazla teknik görünebilir.

## Seçenek 1: Teknik şeffaflık olarak bırakmak

Site geliştirici günlüğü gibi de kullanılacaksa bu alan kalabilir. Bu durumda başlık daha anlaşılır olmalı:

```text
Teknik yapı

Yazılar, kurslar ve kullanıcı ilerlemesi Firebase Firestore üzerinde tutulur. Site statik mimariyle GitHub Pages üzerinden çalışır.
```

## Seçenek 2: Kullanıcı dostu dile çevirmek

Daha iyi seçenek budur.

Önerilen metin:

```text
İçerik yapısı

Yazılar, kurslar ve ders ilerlemeleri güvenli biçimde saklanır. Site hızlı, sade ve erişilebilir bir mimariyle çalışır.
```

## Seçenek 3: Tamamen kaldırıp klasik footer yapmak

Daha profesyonel dergi sitesi görünümü için footer şöyle olabilir:

```text
ESTİ BİRAZ

Sağlık, bilim, eğitim ve veri okuryazarlığı üzerine sade ve kaynaklı içerikler.

Bağlantılar:
- Yazılar
- Akademi
- Veri Notları
- Hakkında
- İletişim
```

## Önerim

Yayındaki ana footer’da teknik koleksiyon adları görünmemeli.

Şu metin daha uygun olur:

```text
ESTİ BİRAZ

Sağlık, bilim, eğitim ve veri okuryazarlığı üzerine sade, erişilebilir ve kaynaklı içerikler.

İçerikler ve ders ilerlemeleri güvenli biçimde saklanır; site hızlı ve hafif bir mimariyle çalışır.
```

Teknik ayrıntılar gerekiyorsa ayrı bir sayfaya taşınabilir:

```text
/teknik-notlar
```

veya repoda:

```text
TECHNOTES.md
```

---

# 23. Bu metinler nereden değiştirilir?

Bu alanlar yönetim panelinden değil, şu dosyadan değiştirilir:

```text
index.html
```

GitHub’da `index.html` dosyasını açıp şu ifadeleri aratarak bulabilirim:

```text
Bilginin işe yaradığı
Bugünün kısa notu
Firebase koleksiyonları
GitHub uyumu
```

Değişiklik yaptıktan sonra:

1. Dosyayı kaydet.
2. Commit et.
3. GitHub Pages güncellenince siteyi `Ctrl + F5` ile yenile.

---

# 24. İçerik üretirken temel stil kuralları

ESTİ BİRAZ içeriklerinde şu dil korunmalıdır:

* Sade
* Kaynaklı
* Öğretici
* Gereksiz teknik terimden kaçınan
* Gerektiğinde kavramı açıklayan
* Okuyucuyu küçümsemeyen
* Sağlık bilgisinde dikkatli ve güvenilir

Her yazı veya ders için şu kontrol listesi kullanılabilir:

```text
Başlık anlaşılır mı?
Özet kısa mı?
Kaynaklar açık mı?
Görsellerin alt metni var mı?
Callout kutuları gerçekten gerekli mi?
Ders sonunda kazanım var mı?
Mini test sorusu tek doğru cevaplı mı?
PDF veya video bağlantısı çalışıyor mu?
```

---

# 25. Önerilen standart ders şablonu

Yeni ders eklerken şu sıra kullanılabilir:

```text
Ders hedefleri:
- ...
- ...
- ...

## Giriş

Kısa giriş paragrafı.

[!info] Bir yudum bilgi
Ana kavramı sade biçimde açıkla.

## Ana anlatım

Dersin temel açıklaması.

youtube: https://www.youtube.com/watch?v=VIDEO_ID | Video ders

[!data] Veriyle bak
Konu veriyle ilişkiliyse kısa bir veri okuma notu ekle.

Kavram:
Başlık: ...
Tanım: ...
Akılda kalsın: ...

Soru: ...
A) ...
B) ...
C) ...
D) ...
Doğru: ...
Açıklama: ...

Kazanımlar:
- ...
- ...
- ...

Kaynak: ... | https://...
```

---

# 26. Önerilen standart yazı şablonu

Yeni yazı eklerken şu sıra kullanılabilir:

```text
## Giriş

Konuyu sade biçimde aç.

[!info] Bir yudum bilgi
Okuyucunun hemen kavrayacağı kısa not.

## Neden önemli?

Konunun önemini açıkla.

image: https://... | Alt metin | Görsel açıklaması

[!warning] Dikkat
Yanlış anlaşılabilecek noktayı belirt.

## Sonuç

Ana fikri toparla.

Kaynak: ... | https://...
```

---

# 27. Kapanış ilkesi

ESTİ BİRAZ’da zengin bloklar içeriği süslemek için değil, öğrenmeyi kolaylaştırmak için kullanılmalıdır.

İyi içerik şu üç soruya cevap verir:

```text
Bu bilgi ne işe yarar?
Okuyucu bunu nasıl anlayacak?
Güvenilir kaynak nerede?
```
