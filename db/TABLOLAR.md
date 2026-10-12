# Tablolar

> Bu dosya `db/araclar/tablo_belgesi.py` ile veritabanından üretildi; elle düzenlemeyin.
> Genel kurallar, diyagramlar ve açık sorular için: [VERI_MODELI.md](VERI_MODELI.md).

**Zorunlu** sütunu: ✓ = boş bırakılamaz · *otomatik* / *şimdi* / değer = boş bırakılırsa veritabanı doldurur.

## Çekirdek şema (`db/schema.sql`)

[`dil`](#dil) · [`calisma_alani`](#calisma_alani) · [`calisma_alani_ceviri`](#calisma_alani_ceviri) · [`unvan`](#unvan) · [`unvan_ceviri`](#unvan_ceviri) · [`kisi`](#kisi) · [`kisi_ceviri`](#kisi_ceviri) · [`kisi_telefon`](#kisi_telefon) · [`kisi_yabanci_dil`](#kisi_yabanci_dil) · [`kisi_calisma_alani`](#kisi_calisma_alani) · [`egitim`](#egitim) · [`egitim_ceviri`](#egitim_ceviri) · [`deneyim`](#deneyim) · [`deneyim_ceviri`](#deneyim_ceviri) · [`etiket`](#etiket) · [`etiket_ceviri`](#etiket_ceviri) · [`yayin`](#yayin) · [`yayin_ceviri`](#yayin_ceviri) · [`yayin_yazar`](#yayin_yazar) · [`yayin_calisma_alani`](#yayin_calisma_alani) · [`yayin_etiket`](#yayin_etiket) · [`yayin_dosya`](#yayin_dosya) · [`mahkeme`](#mahkeme) · [`mevzuat`](#mevzuat) · [`karar`](#karar) · [`karar_mevzuat`](#karar_mevzuat) · [`karar_etiket`](#karar_etiket) · [`karar_calisma_alani`](#karar_calisma_alani) · [`yayin_karar`](#yayin_karar) · [`sayfa`](#sayfa) · [`sayfa_ceviri`](#sayfa_ceviri) · [`site_ayar`](#site_ayar) · [`site_ayar_ceviri`](#site_ayar_ceviri) · [`iletisim_mesaji`](#iletisim_mesaji) · [`yonlendirme`](#yonlendirme) · [`derleme_isi`](#derleme_isi)

### `dil`

Sitenin dilleri; Directus çeviri arayüzü bu tabloyu dil listesi olarak kullanır.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `kod` | metin | ✓ | biçim `^[a-z]{2}(-[a-z]{2})?$` |
| `ad` | metin | ✓ |  |
| `varsayilan` | evet/hayır | *false* |  |
| `aktif` | evet/hayır | *true* |  |
| `siralama` | küçük sayı | *0* |  |

**Tablo kuralları**

- kural: `CHECK (((NOT varsayilan) OR aktif))`
- çakışma yasağı (COMMIT anında): `EXCLUDE USING btree (varsayilan WITH =) WHERE (varsayilan) DEFERRABLE INITIALLY DEFERRED`

### `calisma_alani`

Çalışma alanları; iki seviyeli ağaç (Kamu Hukuku > İmar Hukuku). Silinmez, gizlenir.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `ust_alan_id` | sayı |  | NULL = üst alan · → `calisma_alani` (bağlıyken o kayıt silinemez) |
| `siralama` | küçük sayı | *0* |  |
| `gorsel` | uuid |  | → `directus_files` (o kayıt silinirse boş kalır) |
| `gorunur` | evet/hayır | *true* | silmek yerine gizlenir |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- kural: `CHECK ((ust_alan_id <> id))`

### `calisma_alani_ceviri`

Çalışma alanının dile bağlı metinleri: ad, slug, kart özeti, sayfa içeriği.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `calisma_alani_id` | sayı | ✓ | → `calisma_alani` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `slug` | metin | ✓ | slug biçimi (a-z, 0-9, -) |
| `ad` | metin (Türkçe sıralı) | ✓ | en çok 120 karakter |
| `ozet` | metin |  | kartta görünen tek cümle · en çok 300 karakter |
| `icerik` | metin |  | alanın kendi sayfası (HTML) |
| `seo_baslik` | metin |  | en çok 70 karakter |
| `seo_aciklama` | metin |  | en çok 170 karakter |

**Tablo kuralları**

- tekil: `UNIQUE (calisma_alani_id, dil)`
- tekil: `UNIQUE (dil, slug)`

### `unvan`

Unvanlar ve ekip sayfasındaki sırası (Kurucu Ortak, Ortak, Avukat ...).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `kod` | metin | ✓ | 'kurucu-ortak', 'avukat' · tekil · slug biçimi (a-z, 0-9, -) |
| `sira` | küçük sayı | ✓ | ekip sayfasındaki sıra · tekil |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

### `unvan_ceviri`

Unvan adının dillere göre karşılığı.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `unvan_id` | sayı | ✓ | → `unvan` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `ad` | metin (Türkçe sıralı) | ✓ | "Kurucu Ortak" / "Founding Partner" · en çok 80 karakter |

**Tablo kuralları**

- tekil: `UNIQUE (unvan_id, dil)`

### `kisi`

Ekip üyesi: avukat, arabulucu ya da stajyer. Ayrılanlar silinmez, aktif=false olur.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `slug` | metin | ✓ | /ekip/{slug}; ad dile göre değişmez · tekil · slug biçimi (a-z, 0-9, -) |
| `ad` | metin (Türkçe sıralı) | ✓ |  |
| `soyad` | metin (Türkçe sıralı) | ✓ |  |
| `unvan_id` | sayı |  | → `unvan` (bağlıyken o kayıt silinemez) |
| `foto` | uuid |  | → `directus_files` (o kayıt silinirse boş kalır) |
| `eposta` | metin |  | tekil · küçük harfli ASCII e-posta |
| `avukat_mi` | evet/hayır | *false* | aynı kişi hem avukat hem arabulucu olabilir |
| `arabulucu_mu` | evet/hayır | *false* |  |
| `baro_adi` | metin (Türkçe sıralı) |  |  |
| `baro_sicil_no` | metin |  | biçim `^[0-9]{1,8}$` |
| `arabulucu_sicil_no` | metin |  | biçim `^[0-9]{1,8}$` |
| `meslege_baslama_yili` | küçük sayı |  | yalnızca yıl yazılır; "X yıllık tecrübe" diye öne çıkarılmaz · 1950–2100 |
| `linkedin_url` | metin |  | https:// bağlantı |
| `kullanici` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) · tekil |
| `aktif` | evet/hayır | *true* | ayrılanlar silinmez, aktif=false |
| `siralama` | küçük sayı | *0* | aynı unvan içinde sıra |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- kural: `CHECK (((arabulucu_sicil_no IS NULL) OR arabulucu_mu))`
- kural: `CHECK (((baro_sicil_no IS NULL) OR (avukat_mi AND (baro_adi IS NOT NULL))))`

### `kisi_ceviri`

Kişinin dile bağlı metinleri: biyografi ve SEO alanları (isteğe bağlı).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `kisi_id` | sayı | ✓ | → `kisi` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `kisa_biyografi` | metin |  | en çok 300 karakter |
| `biyografi` | metin |  | HTML |
| `seo_baslik` | metin |  | en çok 70 karakter |
| `seo_aciklama` | metin |  | en çok 170 karakter |

**Tablo kuralları**

- tekil: `UNIQUE (kisi_id, dil)`

### `kisi_telefon`

Kişinin dahili, sabit ve cep numaraları; cep varsayılan olarak sitede gizli.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `kisi_id` | sayı | ✓ | → `kisi` (o kayıt silinirse bu da silinir) |
| `tur` | metin | ✓ | değerler: dahili, cep, sabit |
| `numara` | metin | ✓ |  |
| `sitede_goster` | evet/hayır | *false* | KVKK: kişisel cep varsayılan gizli |
| `sira` | küçük sayı | *0* |  |

**Tablo kuralları**

- kural: `CHECK ( CASE WHEN (tur = 'dahili'::text) THEN (numara ~ '^[0-9]{2,6}$'::text) ELSE ic.telefon_gecerli(numara) END)`
- tekil: `UNIQUE (kisi_id, tur, numara)`

### `kisi_yabanci_dil`

Kişinin bilinen yabancı dilleri (ISO 639-1 kodu; ad sitede otomatik üretilir).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `kisi_id` | sayı | ✓ | → `kisi` (o kayıt silinirse bu da silinir) |
| `dil_kodu` | metin | ✓ | ISO 639-1: en, de, fr, ar ... · biçim `^[a-z]{2}$` |
| `sira` | küçük sayı | *0* |  |

**Tablo kuralları**

- tekil: `UNIQUE (kisi_id, dil_kodu)`

### `kisi_calisma_alani`

Kişi ile çalışma alanı arasındaki bağ (çoka çok).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `kisi_id` | sayı | ✓ | → `kisi` (o kayıt silinirse bu da silinir) |
| `calisma_alani_id` | sayı | ✓ | → `calisma_alani` (bağlıyken o kayıt silinemez) |

**Tablo kuralları**

- tekil: `UNIQUE (kisi_id, calisma_alani_id)`

### `egitim`

Özgeçmişteki eğitim kaydı; yıllar dil bağımsız.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `kisi_id` | sayı | ✓ | → `kisi` (o kayıt silinirse bu da silinir) |
| `baslangic_yili` | küçük sayı |  | 1900–2100 |
| `bitis_yili` | küçük sayı |  | 1900–2100 |
| `sira` | küçük sayı | *0* |  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- kural: `CHECK (((bitis_yili IS NULL) OR (baslangic_yili IS NULL) OR (bitis_yili >= baslangic_yili)))`

### `egitim_ceviri`

Eğitimin okul, bölüm ve derece metinleri.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `egitim_id` | sayı | ✓ | → `egitim` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `okul_adi` | metin (Türkçe sıralı) | ✓ | serbest metin (okul listesi istenmedi) |
| `bolum_adi` | metin (Türkçe sıralı) |  |  |
| `derece` | metin |  | "Lisans", "Yüksek Lisans", "LL.M." |

**Tablo kuralları**

- tekil: `UNIQUE (egitim_id, dil)`

### `deneyim`

Önceki iş deneyimi: kurum adı ve yıllar.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `kisi_id` | sayı | ✓ | → `kisi` (o kayıt silinirse bu da silinir) |
| `firma_adi` | metin (Türkçe sıralı) | ✓ | düz metin; logo yok (reklam yasağı, bkz. VERI_MODELI.md) |
| `baslangic_yili` | küçük sayı |  | 1900–2100 |
| `bitis_yili` | küçük sayı |  | NULL = halen · 1900–2100 |
| `sira` | küçük sayı | *0* |  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- kural: `CHECK (((bitis_yili IS NULL) OR (baslangic_yili IS NULL) OR (bitis_yili >= baslangic_yili)))`

### `deneyim_ceviri`

Deneyimin pozisyon ve açıklama metinleri.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `deneyim_id` | sayı | ✓ | → `deneyim` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `pozisyon` | metin (Türkçe sıralı) | ✓ |  |
| `aciklama` | metin |  |  |

**Tablo kuralları**

- tekil: `UNIQUE (deneyim_id, dil)`

### `etiket`

Yayın ve kararlarda kullanılan serbest etiketler.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

### `etiket_ceviri`

Etiketin dillere göre adı ve slug'ı.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `etiket_id` | sayı | ✓ | → `etiket` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `slug` | metin | ✓ | slug biçimi (a-z, 0-9, -) |
| `ad` | metin (Türkçe sıralı) | ✓ | en çok 60 karakter |

**Tablo kuralları**

- tekil: `UNIQUE (dil, slug)`
- tekil: `UNIQUE (etiket_id, dil)`

### `yayin`

Makale, kitap, video, haber ve duyuru için tek tablo; türe özgü alanlar yalnızca o türde dolu olabilir.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `tur` | metin | ✓ | değerler: makale, kitap, video, haber, duyuru |
| `durum` | metin | *taslak* | değerler: taslak, incelemede, yayinda, arsiv |
| `yayin_tarihi` | tarih-saat |  | ileri tarih = zamanlanmış yayın |
| `kapak` | uuid |  | → `directus_files` (o kayıt silinirse boş kalır) |
| `yayinevi` | metin (Türkçe sıralı) |  |  |
| `isbn` | metin |  | tiresiz: 9786051234567 · geçerli ISBN-10/13 |
| `basim_yili` | küçük sayı |  | 1900–2100 |
| `sayfa_sayisi` | küçük sayı |  | > 0 |
| `video_url` | metin |  | https:// bağlantı |
| `video_dosyasi` | uuid |  | → `directus_files` (o kayıt silinirse boş kalır) |
| `kaynak_adi` | metin (Türkçe sıralı) |  |  |
| `kaynak_url` | metin |  | https:// bağlantı |
| `noindex` | evet/hayır | *false* |  |
| `kanonik_url` | metin |  | https:// bağlantı |
| `olusturan` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `guncelleyen` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `onaylayan` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `onay_zamani` | tarih-saat |  |  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |
| `bulten_sayisi_id` | sayı |  | ekleyen modül: `db/moduller/bulten.sql` · → `bulten_sayisi` (bağlıyken o kayıt silinemez) |

**Tablo kuralları**

- kural: `CHECK (((bulten_sayisi_id IS NULL) OR (tur = 'makale'::text)))`
- kural: `CHECK (((durum <> 'yayinda'::text) OR ((yayin_tarihi IS NOT NULL) AND (onay_zamani IS NOT NULL))))`
- kural: `CHECK (((onaylayan IS NULL) OR (onay_zamani IS NOT NULL)))`
- kural: `CHECK (((tur = 'haber'::text) OR (num_nonnulls(kaynak_adi, kaynak_url) = 0)))`
- kural: `CHECK ( CASE WHEN (tur = 'video'::text) THEN (num_nonnulls(video_url, video_dosyasi) = 1) ELSE (num_nonnulls(video_url, video_dosyasi) = 0) END)`
- kural: `CHECK (((tur = 'kitap'::text) OR (num_nonnulls(yayinevi, isbn, basim_yili, sayfa_sayisi) = 0)))`

### `yayin_ceviri`

Yayının dile bağlı metinleri: başlık, slug, özet, içerik, SEO.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `yayin_id` | sayı | ✓ | → `yayin` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `hazir` | evet/hayır | *true* | false: çeviri sürüyor, sitede gösterme |
| `slug` | metin | ✓ | slug biçimi (a-z, 0-9, -) |
| `baslik` | metin (Türkçe sıralı) | ✓ | en çok 300 karakter |
| `ozet` | metin |  | en çok 1000 karakter |
| `icerik` | metin |  | HTML; kitap/video için boş olabilir |
| `seo_baslik` | metin |  | en çok 70 karakter |
| `seo_aciklama` | metin |  | en çok 170 karakter |
| `paylasim_gorseli` | uuid |  | 1200x630 (og:image) · → `directus_files` (o kayıt silinirse boş kalır) |

**Tablo kuralları**

- tekil: `UNIQUE (dil, slug)`
- tekil: `UNIQUE (yayin_id, dil)`

### `yayin_yazar`

Yayının yazarları ve sırası: ekipten bir kişi ya da dış yazar.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `yayin_id` | sayı | ✓ | → `yayin` (o kayıt silinirse bu da silinir) |
| `kisi_id` | sayı |  | → `kisi` (bağlıyken o kayıt silinemez) |
| `dis_yazar_adi` | metin (Türkçe sıralı) |  |  |
| `dis_yazar_unvan` | metin |  | "Prof. Dr., X Üniversitesi" |
| `sira` | küçük sayı | *0* |  |

**Tablo kuralları**

- kural: `CHECK (((dis_yazar_unvan IS NULL) OR (dis_yazar_adi IS NOT NULL)))`
- kural: `CHECK ((num_nonnulls(kisi_id, dis_yazar_adi) = 1))`
- tekil: `UNIQUE (yayin_id, kisi_id)`
- tekil (COMMIT anında): `UNIQUE (yayin_id, sira) DEFERRABLE INITIALLY DEFERRED`

### `yayin_calisma_alani`

Yayın ile çalışma alanı bağı (çoka çok).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `yayin_id` | sayı | ✓ | → `yayin` (o kayıt silinirse bu da silinir) |
| `calisma_alani_id` | sayı | ✓ | → `calisma_alani` (bağlıyken o kayıt silinemez) |

**Tablo kuralları**

- tekil: `UNIQUE (yayin_id, calisma_alani_id)`

### `yayin_etiket`

Yayın ile etiket bağı (çoka çok).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `yayin_id` | sayı | ✓ | → `yayin` (o kayıt silinirse bu da silinir) |
| `etiket_id` | sayı | ✓ | → `etiket` (bağlıyken o kayıt silinemez) |

**Tablo kuralları**

- tekil: `UNIQUE (yayin_id, etiket_id)`

### `yayin_dosya`

Yayına eklenen dosyalar (PDF vb.) ve sırası.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `yayin_id` | sayı | ✓ | → `yayin` (o kayıt silinirse bu da silinir) |
| `dosya` | uuid | ✓ | → `directus_files` (o kayıt silinirse bu da silinir) |
| `sira` | küçük sayı | *0* |  |

**Tablo kuralları**

- tekil: `UNIQUE (yayin_id, dosya)`

### `mahkeme`

Mahkemeler ve daireleri; iki seviyeli ağaç (Yargıtay > 3. Hukuk Dairesi).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `ust_mahkeme_id` | sayı |  | → `mahkeme` (bağlıyken o kayıt silinemez) |
| `tur` | metin | ✓ | değerler: aym, yargitay, danistay, bam, bim, ilk_derece_adli, ilk_derece_idari, uyusmazlik, aihm, diger |
| `ad` | metin (Türkçe sıralı) | ✓ | "Yargıtay" / "3. Hukuk Dairesi" |
| `kisa_ad` | metin |  | "Y. 3. HD" |
| `siralama` | küçük sayı | *0* |  |
| `aktif` | evet/hayır | *true* |  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- kural: `CHECK ((ust_mahkeme_id <> id))`
- tekil: `UNIQUE NULLS NOT DISTINCT (ust_mahkeme_id, ad)`

### `mevzuat`

Kanun, yönetmelik vb.; kararlarda madde bağlantısı için.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `tur` | metin | ✓ | değerler: kanun, khk, cbk, tuzuk, yonetmelik, teblig, uluslararasi, diger |
| `numara` | metin |  | '6098'; yönetmeliklerde çoğu zaman yok |
| `ad` | metin (Türkçe sıralı) | ✓ | 'Türk Borçlar Kanunu' |
| `kisa_ad` | metin |  | 'TBK' |
| `resmi_gazete_tarihi` | tarih |  |  |
| `mevzuat_url` | metin |  | https:// bağlantı |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- tekil: `UNIQUE (tur, numara)`

### `karar`

Yargı kararları (yalnızca Türkçe). Anonimleştirme işaretlenmeden ve onaysız yayına alınamaz.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `mahkeme_id` | sayı | ✓ | daire de seçilebilir · → `mahkeme` (bağlıyken o kayıt silinemez) |
| `esas_no` | metin |  | biçim `^[0-9]{4}/[0-9]{1,7}$` |
| `karar_no` | metin |  | biçim `^[0-9]{4}/[0-9]{1,7}$` |
| `karar_tarihi` | tarih | ✓ | en erken 1920-01-01 |
| `slug` | metin | ✓ | 'yargitay-3-hd-e-2024-1234-k-2025-567' · tekil · slug biçimi (a-z, 0-9, -) |
| `konu` | metin (Türkçe sıralı) | ✓ |  |
| `ozet` | metin |  |  |
| `tam_metin` | metin |  | anonimleştirilmiş metin (HTML) |
| `tam_metin_dosyasi` | uuid |  | PDF/UDF (metin mi dosya mı?) · → `directus_files` (o kayıt silinirse boş kalır) |
| `ofis_davasi` | evet/hayır | *false* | yalnızca iç bilgi; sitede gösterilmez |
| `anonimlestirildi` | evet/hayır | *false* |  |
| `anonimlestiren` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `anonimlestirme_zamani` | tarih-saat |  |  |
| `durum` | metin | *taslak* | değerler: taslak, incelemede, yayinda, arsiv |
| `yayin_tarihi` | tarih-saat |  |  |
| `olusturan` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `guncelleyen` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `onaylayan` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `onay_zamani` | tarih-saat |  |  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- kural: `CHECK ((anonimlestirildi = (anonimlestirme_zamani IS NOT NULL)))`
- kural: `CHECK (((durum <> 'yayinda'::text) OR ((yayin_tarihi IS NOT NULL) AND anonimlestirildi AND (onay_zamani IS NOT NULL))))`
- kural: `CHECK (((onaylayan IS NULL) OR (onay_zamani IS NOT NULL)))`
- tekil: `UNIQUE (mahkeme_id, karar_no)`

### `karar_mevzuat`

Kararın ilgili olduğu mevzuat ve madde (madde boşsa kanunun bütünü).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `karar_id` | sayı | ✓ | → `karar` (o kayıt silinirse bu da silinir) |
| `mevzuat_id` | sayı | ✓ | → `mevzuat` (bağlıyken o kayıt silinemez) |
| `madde` | metin |  | '49', '49/2', 'geçici 1'; NULL = kanunun bütünü · en çok 30 karakter |

**Tablo kuralları**

- tekil: `UNIQUE NULLS NOT DISTINCT (karar_id, mevzuat_id, madde)`

### `karar_etiket`

Karar ile etiket bağı (çoka çok).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `karar_id` | sayı | ✓ | → `karar` (o kayıt silinirse bu da silinir) |
| `etiket_id` | sayı | ✓ | → `etiket` (bağlıyken o kayıt silinemez) |

**Tablo kuralları**

- tekil: `UNIQUE (karar_id, etiket_id)`

### `karar_calisma_alani`

Karar ile çalışma alanı bağı (çoka çok).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `karar_id` | sayı | ✓ | → `karar` (o kayıt silinirse bu da silinir) |
| `calisma_alani_id` | sayı | ✓ | → `calisma_alani` (bağlıyken o kayıt silinemez) |

**Tablo kuralları**

- tekil: `UNIQUE (karar_id, calisma_alani_id)`

### `yayin_karar`

Makale ile karar arasındaki karşılıklı bağlantı.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `yayin_id` | sayı | ✓ | → `yayin` (o kayıt silinirse bu da silinir) |
| `karar_id` | sayı | ✓ | → `karar` (o kayıt silinirse bu da silinir) |

**Tablo kuralları**

- tekil: `UNIQUE (yayin_id, karar_id)`

### `sayfa`

Sabit sayfalar: ana sayfa, hakkımızda, arabuluculuk, KVKK, çerez, yasal uyarı.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `anahtar` | metin | ✓ | 'ana_sayfa', 'hakkimizda', 'kvkk' · tekil · biçim `^[a-z0-9_]+$` |
| `aktif` | evet/hayır | *true* |  |
| `noindex` | evet/hayır | *false* |  |
| `siralama` | küçük sayı | *0* |  |
| `olusturan` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `guncelleyen` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

### `sayfa_ceviri`

Sayfanın dile bağlı başlık, slug ve içeriği.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `sayfa_id` | sayı | ✓ | → `sayfa` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `slug` | metin |  | ana sayfa için NULL · slug biçimi (a-z, 0-9, -) |
| `baslik` | metin (Türkçe sıralı) | ✓ |  |
| `icerik` | metin |  | HTML |
| `seo_baslik` | metin |  | en çok 70 karakter |
| `seo_aciklama` | metin |  | en çok 170 karakter |
| `paylasim_gorseli` | uuid |  | → `directus_files` (o kayıt silinirse boş kalır) |

**Tablo kuralları**

- tekil: `UNIQUE NULLS NOT DISTINCT (dil, slug)`
- tekil: `UNIQUE (sayfa_id, dil)`

### `site_ayar`

Site geneli ayarlar; tek satır (Directus singleton): resmi unvan, iletişim, sosyal bağlantılar.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | küçük sayı | *1* | birincil anahtar · `((id = 1))` |
| `resmi_unvan` | metin (Türkçe sıralı) | ✓ | baroya kayıtlı unvan; başlık ve künyede aynen |
| `telefon` | metin |  | +90… biçimi |
| `faks` | metin |  | +90… biçimi |
| `eposta` | metin |  | küçük harfli ASCII e-posta |
| `form_bildirim_eposta` | metin |  | iletisim formu bildirimi buraya gider; bossa eposta (sitede gosterilmez) · küçük harfli ASCII e-posta |
| `whatsapp_numarasi` | metin |  | düz wa.me bağlantısı; widget yok · +90… biçimi |
| `linkedin_url` | metin |  | https:// bağlantı |
| `instagram_url` | metin |  | https:// bağlantı |
| `youtube_url` | metin |  | https:// bağlantı |
| `x_url` | metin |  | https:// bağlantı |
| `harita_url` | metin |  | "Haritada aç" bağlantısı (iframe yok) · https:// bağlantı |
| `aydinlatma_surumu` | metin |  | iletişim formunda gösterilen metnin sürümü |
| `guncelleyen` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

### `site_ayar_ceviri`

Adres ve alt bilgi notunun dillere göre metni.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `site_ayar_id` | küçük sayı | ✓ | → `site_ayar` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `adres` | metin |  |  |
| `alt_bilgi_notu` | metin |  | "Bu site bilgilendirme amaçlıdır ..." |

**Tablo kuralları**

- tekil: `UNIQUE (site_ayar_id, dil)`

### `iletisim_mesaji`

İletişim formundan gelen mesajlar; saklama süresi dolunca silinir.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `ad` | metin (Türkçe sıralı) | ✓ | en çok 120 karakter |
| `eposta` | metin | ✓ | küçük harfli ASCII e-posta |
| `telefon` | metin |  | +90… biçimi |
| `konu_turu` | metin | ✓ | değerler: genel, randevu, arabuluculuk, diger |
| `mesaj` | metin | ✓ | 1–5000 karakter |
| `durum` | metin | *yeni* | değerler: yeni, okundu, cevaplandi, spam |
| `cevaplayan_kisi_id` | sayı |  | → `kisi` (bağlıyken o kayıt silinemez) |
| `cevap_tarihi` | tarih-saat |  |  |
| `aydinlatma_surumu` | metin | ✓ |  |
| `ip_hmac` | metin |  | HMAC-SHA256(ip), onaltılık; yalnızca spam sınırı. Düz sha256(ip) DEĞİL · biçim `^[0-9a-f]{64}$` |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `saklama_bitis` | tarih-saat | *(now() + 1 yıl)* | süre büroyla belirlenecek |

**Tablo kuralları**

- kural: `CHECK (((durum <> 'cevaplandi'::text) OR ((cevaplayan_kisi_id IS NOT NULL) AND (cevap_tarihi IS NOT NULL))))`
- kural: `CHECK ((saklama_bitis > olusturma_zamani))`

### `yonlendirme`

Eski adreslerden yenilerine yönlendirmeler (301/302/308).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `kaynak_yol` | metin | ✓ | tekil · `(((kaynak_yol ~ '^/($\|[^/])'::text) AND (kaynak_yol !~ '[\s\\]'::text)))` |
| `hedef` | metin | ✓ | /yol ya da https:// |
| `durum_kodu` | küçük sayı | *301* | değerler:  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- kural: `CHECK ((kaynak_yol <> hedef))`

### `derleme_isi`

"Yayımla" ile kuyruğa eklenen site derlemeleri; aynı anda tek derleme çalışır.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `durum` | metin | *kuyrukta* | değerler: kuyrukta, calisiyor, basarili, hatali |
| `isteyen` | uuid |  | → `directus_users` (o kayıt silinirse boş kalır) |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `baslama_zamani` | tarih-saat |  |  |
| `bitis_zamani` | tarih-saat |  |  |
| `log_ozeti` | metin |  |  |

**Tablo kuralları**

- kural: `CHECK (((durum = 'kuyrukta'::text) OR (baslama_zamani IS NOT NULL)))`
- kural: `CHECK (((durum <> ALL (ARRAY['basarili'::text, 'hatali'::text])) OR (bitis_zamani IS NOT NULL)))`

## Modül: `db/moduller/acilir_duyuru.sql`

[`acilir_duyuru`](#acilir_duyuru) · [`acilir_duyuru_ceviri`](#acilir_duyuru_ceviri)

### `acilir_duyuru`

Açılır duyuru; yalnızca nötr duyurular, aynı anda en fazla bir aktif (opsiyonel modül).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `gorsel` | uuid |  | → `directus_files` (o kayıt silinirse boş kalır) |
| `baglanti` | metin |  | /yol ya da https:// |
| `baslangic` | tarih-saat | ✓ |  |
| `bitis` | tarih-saat | ✓ |  |
| `otomatik_kapanma_sn` | küçük sayı |  | 3–60 |
| `aktif` | evet/hayır | *true* |  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- kural: `CHECK ((bitis > baslangic))`
- çakışma yasağı: `EXCLUDE USING gist (tstzrange(baslangic, bitis) WITH &&) WHERE (aktif)`

### `acilir_duyuru_ceviri`

Duyurunun dillere göre metni.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `acilir_duyuru_id` | sayı | ✓ | → `acilir_duyuru` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `baslik` | metin (Türkçe sıralı) | ✓ |  |
| `metin` | metin |  |  |
| `buton_etiketi` | metin |  |  |

**Tablo kuralları**

- tekil: `UNIQUE (acilir_duyuru_id, dil)`

## Modül: `db/moduller/bulten.sql`

[`bulten_sayisi`](#bulten_sayisi) · [`bulten_sayisi_ceviri`](#bulten_sayisi_ceviri)

### `bulten_sayisi`

Dönemsel bülten sayıları: kapak ve PDF (opsiyonel modül).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `yil` | küçük sayı | ✓ | 2000–2100 |
| `donem` | metin |  | yıllık sayıda NULL · değerler: kis, ilkbahar, yaz, sonbahar |
| `kapak` | uuid |  | → `directus_files` (o kayıt silinirse boş kalır) |
| `pdf` | uuid |  | sayının tamamı · → `directus_files` (o kayıt silinirse boş kalır) |
| `durum` | metin | *taslak* | değerler: taslak, incelemede, yayinda, arsiv |
| `yayin_tarihi` | tarih-saat |  |  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- kural: `CHECK (((durum <> 'yayinda'::text) OR (yayin_tarihi IS NOT NULL)))`
- tekil: `UNIQUE NULLS NOT DISTINCT (yil, donem)`

### `bulten_sayisi_ceviri`

Bülten sayısının dillere göre başlığı ve slug'ı.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `bulten_sayisi_id` | sayı | ✓ | → `bulten_sayisi` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `slug` | metin | ✓ | slug biçimi (a-z, 0-9, -) |
| `baslik` | metin (Türkçe sıralı) | ✓ | "2026 Kış Sayısı" |

**Tablo kuralları**

- tekil: `UNIQUE (bulten_sayisi_id, dil)`
- tekil: `UNIQUE (dil, slug)`

## Modül: `db/moduller/karar_ek.sql`

[`karar_kisi`](#karar_kisi) · [`karar_yorum`](#karar_yorum)

### `karar_kisi`

Karar ile avukat bağı; sitede gösterilmemeli (opsiyonel modül).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `karar_id` | sayı | ✓ | → `karar` (o kayıt silinirse bu da silinir) |
| `kisi_id` | sayı | ✓ | → `kisi` (bağlıyken o kayıt silinemez) |

**Tablo kuralları**

- tekil: `UNIQUE (karar_id, kisi_id)`

### `karar_yorum`

Kararlara imzalı avukat yorumları (opsiyonel modül).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `karar_id` | sayı | ✓ | → `karar` (o kayıt silinirse bu da silinir) |
| `kisi_id` | sayı | ✓ | yorumu yazan avukat (imzalı) · → `kisi` (bağlıyken o kayıt silinemez) |
| `icerik` | metin | ✓ | HTML |
| `sira` | küçük sayı | *0* |  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

## Modül: `db/moduller/kariyer.sql`

[`ilan`](#ilan) · [`ilan_ceviri`](#ilan_ceviri)

### `ilan`

İş ilanları; başvurular e-postayla alınır (opsiyonel modül).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `calisma_tipi` | metin |  | değerler: tam_zamanli, yari_zamanli, staj |
| `lokasyon` | metin (Türkçe sıralı) |  |  |
| `basvuru_epostasi` | metin |  | küçük harfli ASCII e-posta |
| `durum` | metin | *taslak* | değerler: taslak, incelemede, yayinda, arsiv |
| `yayin_tarihi` | tarih-saat |  |  |
| `kapanis_tarihi` | tarih-saat |  |  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

**Tablo kuralları**

- kural: `CHECK (((durum <> 'yayinda'::text) OR (yayin_tarihi IS NOT NULL)))`
- kural: `CHECK (((kapanis_tarihi IS NULL) OR (yayin_tarihi IS NULL) OR (kapanis_tarihi > yayin_tarihi)))`

### `ilan_ceviri`

İlanın dillere göre başlığı ve açıklaması.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `ilan_id` | sayı | ✓ | → `ilan` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `baslik` | metin (Türkçe sıralı) | ✓ |  |
| `aciklama` | metin | ✓ | HTML |

**Tablo kuralları**

- tekil: `UNIQUE (ilan_id, dil)`

## Modül: `db/moduller/sektor.sql`

[`sektor`](#sektor) · [`sektor_ceviri`](#sektor_ceviri) · [`kisi_sektor`](#kisi_sektor) · [`yayin_sektor`](#yayin_sektor)

### `sektor`

Sektör listesi (opsiyonel modül).

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `siralama` | küçük sayı | *0* |  |
| `gorunur` | evet/hayır | *true* |  |
| `olusturma_zamani` | tarih-saat | *şimdi* |  |
| `guncelleme_zamani` | tarih-saat | *şimdi* |  |

### `sektor_ceviri`

Sektörün dillere göre adı, slug'ı ve açıklaması.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `sektor_id` | sayı | ✓ | → `sektor` (o kayıt silinirse bu da silinir) |
| `dil` | metin | ✓ | → `dil` (bağlıyken o kayıt silinemez) |
| `slug` | metin | ✓ | slug biçimi (a-z, 0-9, -) |
| `ad` | metin (Türkçe sıralı) | ✓ |  |
| `aciklama` | metin |  |  |

**Tablo kuralları**

- tekil: `UNIQUE (dil, slug)`
- tekil: `UNIQUE (sektor_id, dil)`

### `kisi_sektor`

Kişi ile sektör bağı.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `kisi_id` | sayı | ✓ | → `kisi` (o kayıt silinirse bu da silinir) |
| `sektor_id` | sayı | ✓ | → `sektor` (bağlıyken o kayıt silinemez) |

**Tablo kuralları**

- tekil: `UNIQUE (kisi_id, sektor_id)`

### `yayin_sektor`

Yayın ile sektör bağı.

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | sayı | *otomatik* | birincil anahtar |
| `yayin_id` | sayı | ✓ | → `yayin` (o kayıt silinirse bu da silinir) |
| `sektor_id` | sayı | ✓ | → `sektor` (bağlıyken o kayıt silinemez) |

**Tablo kuralları**

- tekil: `UNIQUE (yayin_id, sektor_id)`

