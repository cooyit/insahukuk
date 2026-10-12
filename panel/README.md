# Yonetim paneli (Directus 12.5) - yerel gelistirme

Gereken: Node >= 22.12, PostgreSQL 16 (yalnizca programlari; sunucu bu klasorde acilir).

```
cd panel
npm ci
npm run kur        # .env uretir, panel/.veri altinda PostgreSQL kumesi acar, Directus + sema + ornek veri
npm run panel      # http://localhost:8055  (giris: .env icindeki ADMIN_EMAIL / ADMIN_PASSWORD)
npm test           # ayri bir test veritabani (insa_test) ve 8056 portunda ayri Directus ile
npm run db:durdur  # PostgreSQL kumesini durdurur
```

- PostgreSQL 16 programlarinin yeri `.env` icindeki `PG_BIN` ile verilir (macOS Homebrew: `/opt/homebrew/opt/postgresql@16/bin`, Windows: `C:\Program Files\PostgreSQL\16\bin`).
- Her sey `panel/.veri/` altinda; silmek icin once `npm run db:durdur`, sonra klasoru silin.
- Lisans, sinirlar ve kararlar: [`docs/panel-gece-calismasi.md`](../docs/panel-gece-calismasi.md).
