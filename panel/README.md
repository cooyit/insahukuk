# Yonetim paneli (Directus 12.5) - yerel gelistirme

Gereken: Node >= 22.12, PostgreSQL 16 (yalnizca programlari; sunucu bu klasorde acilir).

```
cd panel
npm ci
npm run kur        # .env uretir, panel/.veri altinda PostgreSQL kumesi acar, Directus + sema + ornek veri + panel yapilandirmasi
npm run panel      # http://localhost:8055  (giris: .env icindeki ADMIN_EMAIL / ADMIN_PASSWORD)
npm run form       # iletisim formu servisi: http://127.0.0.1:8065/api/iletisim (panel acikken)
npm run posta      # sahte SMTP alicisi (127.0.0.1:2525): e-postalar panel/.veri/posta/ altina .eml olarak yazilir
npm test           # ayri bir test veritabani (insa_test) ve 8056 portunda ayri Directus ile
npm run yapilandir # yapilandirma/*.mjs degisince: calisan panele yeniden uygular
npm run sifirla    # gelistirme veritabanini silip sifirdan kurar (panel kapaliyken)
npm run db:durdur  # PostgreSQL kumesini durdurur
```

- PostgreSQL 16 programlarinin yeri `.env` icindeki `PG_BIN` ile verilir (macOS Homebrew: `/opt/homebrew/opt/postgresql@16/bin`, Windows: `C:\Program Files\PostgreSQL\16\bin`).
- Her sey `panel/.veri/` altinda; silmek icin once `npm run db:durdur`, sonra klasoru silin.
- Iletisim formu: sitenin formu `POST /api/iletisim`e gider; `form/sunucu.mjs` dogrular ve Directus'a "Form servisi" kullanicisinin anahtariyla (`.env`: `FORM_DIRECTUS_TOKEN`) yazar. Yerelde denemek icin `npm run panel`, `npm run form` ve sitede `npm run dev` (Astro, `/api` istegini 8065'e yonlendirir). Canlida ters vekil (Caddy) `/api/iletisim`i servise yonlendirir ve `FORM_VEKIL_ARKASINDA=evet`, `FORM_IZINLI_KAYNAK=<site adresi>` yazilir. Ayrinti: [`docs/unvan-form-calismasi.md`](../docs/unvan-form-calismasi.md).
- Bildirim e-postasi: yeni mesaj gelince "Yeni mesaj bildirimi" akisi Site ayarlari > "Form bildirim e-postasi"na (bossa buro e-postasina) yalnizca panel baglantisi iceren bir e-posta yollar. Yerelde gercek e-posta gitmez (`npm run posta`); canlida `.env`'deki `EMAIL_SMTP_*` buronun e-posta saglayicisiyla doldurulur.
- Lisans, sinirlar ve kararlar: [`docs/panel-gece-calismasi.md`](../docs/panel-gece-calismasi.md).
