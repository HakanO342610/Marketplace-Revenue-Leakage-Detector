# MRLD — First 10 Customer Outbound Playbook

> Senin müşterin "marketplace gelirini denetlemiyor". Sen ona kayıp para gösteriyorsun. Pitch bunun üstüne kurulu.

---

## 🎯 ICP (Ideal Customer Profile)

Sıralı filtreler — hepsi aynı anda doğru olmalı:

| Filtre | Eşik |
|---|---|
| Aylık GMV | 10M ₺+ |
| Aktif marketplace | Trendyol veya Hepsiburada veya Amazon (en az 2'si daha iyi) |
| Yıl | en az 2 yıl satıcı |
| Karar verici | CFO / Finans Müdürü / E-Commerce Direktörü |
| Pain sinyali | "hakedişler tutmuyor", "iade kontrolü manuel", "Excel ile mutabakat" |

**ICP dışı (red flag):**
- < 5M ₺ GMV (ROI yok, audit fee'yi kurtarmaz)
- tek marketplace + tek seller_id (pain yok)
- "biz sistemimizden eminiz" diyenler (alıcı değil, kanıtlamadan vazgeçer)

**Hedef liste kaynakları:**
- Trendyol satıcı listesi (Trendyol satıcı puan sıralamaları, kategori liderleri)
- E-ticaret yıllığı (TÜSİAD, ETİD raporları — top sellers)
- LinkedIn Sales Navigator: "E-Commerce Director" / "Marketplace Manager" / "CFO" + Türkiye + büyük marka
- Hepsiburada Premium Satıcı listesi
- Webrazzi top e-ticaret listeleri

---

## 🔥 4 Aşamalı Akış

### Step 1 — LinkedIn Hook (Connection Request)

**Variant A (en güçlü, sayısal vaat):**
> Selam {Ad}, marketplace payout'larında ortalama %2-7 sessiz gelir kaybı tespit ediyoruz (komisyon farkı, eksik iade, eksik ödeme). 30 dakikada bir hakediş dosyanı analiz edip kaç ₺ kaybettiğinizi göstereyim mi?

**Variant B (daha soft, sektör spesifik):**
> Selam {Ad}, {Şirket} için marketplace finansal denetim üzerine bir araç geliştiriyorum. Trendyol/Hepsiburada hakediş dosyalarında çoğu satıcının fark etmediği komisyon ve iade hatalarını tespit ediyor. Ücretsiz audit yapayım mı?

**Variant C (referans + sosyal kanıt — pilot sonrası):**
> {Ad} merhaba, {benzer rakip / tanıdık şirket} için yaptığımız audit'te X ₺ aylık kayıp bulduk. Aynı süreci sizin için 24 saat içinde çalıştırabilirim — hakediş CSV'si yeterli.

**Tone notes:**
- Türkçe, samimi ama profesyonel ("size" değil, ilk mesajda "merhaba {ad}")
- Soruyla bitir — cevaplama davranışı tetikler
- 50 kelimeyi geçme

### Step 2 — Offer Mesajı (Bağlantı kabul ettikten sonra)

> Teşekkürler {Ad}! İhtiyacım olan tek şey: son 30 günün **payout dosyası** (CSV / Excel — Trendyol satıcı paneli > Finans > Hakediş Detayı). Dosyayı paylaşır paylaşmaz 24 saat içinde size leakage raporunu çıkarıyoruz:
>
> - ❌ Komisyon farkı (commission mismatch)
> - ❌ Eksik ödeme (underpayment)
> - ❌ Eksik iade (missing refund)
> - ✓ Satır bazında, kanıtla
>
> Hiçbir entegrasyon, API, kullanıcı yok. Tek dosya yeterli.

**KVKK / veri güveni cümlesi (gerekirse ek):**
> Dosya kişisel veri içermiyor (sipariş no + tutar). Audit sonrası tek tıkla siliyoruz, NDA imzalayabiliriz.

### Step 3 — Output (Raporu sunarken)

Demo gösterimi 5 dakika. Çıktıda mutlaka olması gerekenler:

1. **Tek cümle headline:**
> "Son 30 günde **₺X** kaybetmişsiniz, kaybın **%Y'si** {top_driver} kaynaklı."

2. **3 KPI:**
- Toplam kayıp tutarı (₺ — büyük, kırmızı)
- Kayıp oranı (% — yıllık etki ile)
- Yıllık projeksiyon (= aylık × 12)

3. **Root cause kırılımı:**
- Komisyon farkı: ₺..., ..%, 3 örnek satır
- Eksik ödeme: ₺..., ..%, 3 örnek satır
- Eksik iade: ₺..., ..%, 3 örnek satır

4. **Confidence skoru** (örn. %98) — "kuralların ne kadar güvenilir tetiklendiği"

5. **Risk level pill** — DÜŞÜK / ORTA / YÜKSEK (sadece görsel anlama yardımı)

**Demo kuralları:**
- Müşterinin **kendi verisi** üzerinden konuş, sample.csv kullanma
- Top 3 örnek satırı aç → "şu siparişte komisyon X olmalıydı, Y kesilmiş, fark Z" — somutlaştır
- "Bunlar tahmini değil, satır bazında math" — güven inşa et
- Sayıyı abartma. Düşük tutarlı kayıp da kayıp — "%2 küçük gibi ama yıllık X ₺"

### Step 4 — Closing Message

Demo sonu, sessizliği bekle. Sonra:

> Görüyorsun — yıllık etkin yaklaşık **₺{annual}**. Bu tek seferlik bir denetim değil, **her ay yaşanıyor**. Sürekli izleme isterseniz aylık bir abonelik var: yeni hakediş geldikçe otomatik tarıyoruz, leakage var mı yok mu Slack'inize / mailinize düşüyor.
>
> Sizin için hangi anlamlı:
>
> 1. **Kurtarılan tutarın %20'si** (sadece bulduğumuz kaybı geri kazandığımızda)
> 2. **Sabit aylık ücret** ₺50K-₺250K (GMV'nize göre değişir)
>
> İkinci ay ücretsiz, sözleşme yok, istediğin zaman kapatırsın.

**Kapanış kuralları:**
- "İndirim isterseniz" deme — ucuzlatma. Değer üzerinden konuş.
- ROI'yi karşı tarafa hesaplattır: "%20 fee = aylık ₺13.000 = audit yatırımının 5x ROI'si"
- Sözleşme baskısı yapma — "istersen başlayalım" yumuşak kapatma

---

## 💸 Pricing (Early Stage — ilk 10 müşteri için)

| Model | Açıklama | Kim için? |
|---|---|---|
| **Ücretsiz Audit** | İlk denetim ücretsiz | Herkes — pipeline'a giriş |
| **Performance Fee** | Kurtarılan tutarın **%15-25'i**, ay sonu fatura | Risk almak istemeyen müşteri (ROI net) |
| **Sabit SaaS** | Aylık ₺50K-₺250K (≈ $1.500-$7.500), GMV'ye göre | Volüm yüksek, sürekli izleme isteyen |
| **Hybrid** | Düşük base + recovered share | Enterprise tier |

**Örnek senaryolar (sample data ile):**
- ~₺65K aylık leakage tespit edilen müşteri → performance fee = ₺13K/ay → yıllık ARR = ₺156K
- Aylık ₺250K leakage olan büyük müşteri → SaaS fee = ₺250K/ay → yıllık ARR = ₺3M

**İlk 10 müşteri stratejisi:** %15 performance fee + ücretsiz dashboard erişimi. Kontrat yok, "ne zaman istersen kes". Düşük friction, dataset toplamak ana hedef.

---

## 📅 30 Günlük Outbound Sprint

| Gün | Aksiyon | Hedef |
|---|---|---|
| 1-3 | ICP listesi (50 şirket × CFO/E-Comm Dir = 100 lead) | Liste hazır |
| 4-7 | LinkedIn connect + Variant A (50 mesaj/gün) | 350 connect istek |
| 8-14 | Bağlantı kabul edenlere Step 2 offer | 15-25 kabul, 5-10 cevap |
| 15-21 | Pilot dosya alanlarla audit demo | 3-5 demo |
| 22-30 | Pricing diyalog, pilot kapanış | 1-2 ödeyen müşteri |

**Conversion benchmark (sektör):**
- Connect kabul: %30
- Mesajdan demo'ya: %15
- Demo'dan satışa: %30
- Net: 100 cold lead → ~1.4 müşteri (ilk siklus)

---

## 🧠 Strategic Reality

Bu ürün:
- ❌ "Dashboard satıyor" değil
- ❌ "Reporting tool" değil
- ✔ **"Para bulup geri kazandıran finansal denetim motoru"**

Pitch konuşmanda her zaman bu cümleyi tutarlı kullan. Müşteri "pano güzel" dediğinde "panoyu ben de yaparım, biz parayı buluyoruz" diye düzelt.

---

## 📞 Hazır Mesaj Şablonları (kopyala-yapıştır)

### Email Cold Outreach (LinkedIn yedek)

**Subject:** Marketplace hakedişlerinizde {ortalama} ₺ aylık kayıp olabilir

> {Ad} merhaba,
>
> {Şirket}'in Trendyol/Hepsiburada satıcısı olduğunu gördüm. Marketplace payout'larında ortalama %2-7 sessiz gelir kaybı oluyor — komisyon farkı, eksik iade, eksik ödeme. Çoğu satıcı bu kaybı fark etmiyor çünkü kontrol manuel ve dosyalar büyük.
>
> 30 dakikada bir hakediş CSV'nizi analiz edip kaç ₺ kaybettiğinizi gösteriyoruz, ücretsiz. Geçen hafta benzer bir satıcıda **₺{örnek_tutar}** kayıp tespit ettik.
>
> Audit yapalım mı? Tek dosya yeterli, hiçbir entegrasyon yok.
>
> {Ad}
> mrld.app

### Demo sonrası takip (24 saat içinde)

**Subject:** Audit sonucu — {Şirket}

> {Ad}, dün konuştuğumuz audit raporu hazır:
>
> - Toplam kayıp (son 30 gün): **₺{leakage}**
> - Yıllık projeksiyon: **₺{annual}**
> - Top kayıp kaynağı: **{top_driver}** (%{share})
> - Risk seviyesi: **{risk_level}**
>
> Dashboard linki: {dashboard_url}
>
> Devam etmek istersen iki seçenek var:
> 1. Performance fee — kurtarılan tutarın %15'i
> 2. Sabit aylık ₺{fixed} (GMV'ne göre)
>
> Pazartesi 30 dk koymalı mıyız?

### Soğuk LinkedIn DM (Sales Navigator açıkken)

> {Ad}, {Şirket}'te {Pozisyon} olarak çalıştığını gördüm. Marketplace satışı yapan firmaların aylık gelirinin %2-7'si komisyon ve iade hatalarından kayıp gidiyor. Sizin için ücretsiz bir audit yapabilir miyim? Tek bir hakediş dosyası yeterli.

---

## 🚫 Yapma Listesi

- "Bizim ürünümüz çok güçlü" — DEMO yap, konuşma
- 2 paragraftan uzun mesaj — kimse okumaz
- Pricing'i ilk mesajda söyleme — değer yaratmadan fiyat = ret
- "Toplantı koyalım" diye bitirme — "audit yapayım mı" diye bitir, audit organik toplantı yaratır
- Bot içeriği gibi durma — şirket adını, kategorisini özelleştir
- "Promosyonumuz var" → asla. Bu lüks ürün, lüks duyacak.

---

## 📊 İlerleme Takibi (Notion / Airtable)

| Kolon | Değer |
|---|---|
| Şirket | string |
| Lead | string |
| LinkedIn URL | string |
| Status | `cold / connected / messaged / demo_scheduled / demo_done / customer / lost` |
| Audit yapıldı mı | bool |
| Tespit edilen kayıp (₺) | number |
| Risk level | LOW/MED/HIGH |
| Kontrat tipi | performance / saas / hybrid |
| Aylık ARR (₺) | number |
| Notlar | text |

10 müşteriye ulaşmadan KPI burada hangi metrik nereden tıkanıyor görebilmek için.

---

## ✨ Sonuç

İlk 10 müşteri = sosyal kanıt + dataset + iterasyon.
Her audit'i sayısal kanıtla bitir, müşteriye **"ne kadar kayıp ettiğini öğrenmiş olma"** hediyesini ver — anlaşma olsun olmasın.
