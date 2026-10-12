import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { formuDogrula, telefonNormallestir } from '../form/dogrula.mjs';
import { formSunucusu, hizSiniri, ipGrubu, YOL } from '../form/sunucu.mjs';
import { girisYap, istek, panel } from './api.mjs';

const SITE = 'https://www.insahukuk.test';
const IP_ANAHTARI = 'test-ip-anahtari';

describe('kural: form alanlari veritabaninin kurallariyla dogrulanir', () => {
  it('telefon E.164\'e cevrilir; Turkiye numarasi 10 hane', () => {
    expect(telefonNormallestir('+90 (212) 000-00-00')).toBe('+902120000000');
    expect(telefonNormallestir('0212 000 00 00')).toBe('+902120000000');
    expect(telefonNormallestir('532 123 45 67')).toBe('+905321234567');
    expect(telefonNormallestir('0049 30 1234567')).toBe('+49301234567');
    expect(telefonNormallestir('90 532 123 45 67')).toBe('+905321234567');
    expect(telefonNormallestir('0212 000 00')).toBeNull();
    expect(telefonNormallestir('90+212 000 00 00')).toBeNull();
    expect(telefonNormallestir('abc')).toBeNull();
  });

  it('e-posta kucuk harfe cevrilir; ASCII disi adres reddedilir', () => {
    const temel = { ad: 'A', konu_turu: 'genel', mesaj: 'm', aydinlatma_surumu: 'aydinlatma-2026-10' };
    expect(formuDogrula({ ...temel, eposta: ' Deneme@Example.COM ' })).toMatchObject({ hatalar: [], satir: { eposta: 'deneme@example.com' } });
    expect(formuDogrula({ ...temel, eposta: 'çağrı@example.com' }).hatalar).toEqual(['eposta']);
    // Panelin alan dogrulamasindan genis kabul edilen adres Directus'ta reddedilip 502 olurdu (inceleme).
    for (const e of ['a"b@example.com', 'a(b)@example.com', 'a,b@example.com']) expect(formuDogrula({ ...temel, eposta: e }).hatalar, e).toEqual(['eposta']);
  });

  it('mesaj: CRLF tek karakter sayilir (textarea maxlength gibi); 5000 karakter siniri', () => {
    const temel = { ad: 'A', eposta: 'a@example.com', konu_turu: 'genel', aydinlatma_surumu: 'v1' };
    const satirlar = 'x\r\n'.repeat(2500).trim();
    expect(formuDogrula({ ...temel, mesaj: satirlar })).toMatchObject({ hatalar: [], satir: { mesaj: 'x\n'.repeat(2500).trim() } });
    expect(formuDogrula({ ...temel, mesaj: 'x'.repeat(5001) }).hatalar).toEqual(['mesaj']);
    expect(formuDogrula({ ...temel, mesaj: 'a\u0000b' }).hatalar).toEqual(['mesaj']);
  });

  it('eksik ve gecersiz alanlarin hepsi bildirilir', () => {
    expect(formuDogrula({ konu_turu: 'baska', telefon: '12' }).hatalar).toEqual(['ad', 'eposta', 'telefon', 'konu_turu', 'mesaj', 'aydinlatma_surumu']);
  });

  it('hiz siniri: pencere icinde "adet"ten fazlasina izin yok; pencere gecince yeniden izin', () => {
    let t = 0;
    const izin = hizSiniri({ adet: 2, pencere: 1000 }, () => t);
    expect([izin('a'), izin('a'), izin('a'), izin('b')]).toEqual([true, true, false, true]);
    t = 1001;
    expect(izin('a')).toBe(true);
  });

  it('IPv6 /64 onekiyle gruplanir: ayni abonenin adres degistirmesi siniri asmaz', () => {
    expect(ipGrubu('2001:db8:1:2:3:4:5:6')).toBe(ipGrubu('2001:db8:1:2::9'));
    expect(ipGrubu('2001:db8:1:3::9')).not.toBe(ipGrubu('2001:db8:1:2::9'));
    expect(ipGrubu('::ffff:203.0.113.5')).toBe('203.0.113.5');
  });
});

describe('kural: form servisi mesaji Directus\'a yazar; sahte "alindi" yok', () => {
  let sunucu;
  let adres;
  let yonetici;
  let ipSayaci = 0;
  const yeniIp = () => `203.0.113.${++ipSayaci}`;

  function servis(ayar) {
    return formSunucusu({
      directusUrl: panel().url,
      token: panel().formToken,
      ipAnahtari: IP_ANAHTARI,
      izinliKaynaklar: [SITE],
      vekilArkasinda: true,
      hiz: { adet: 3, pencere: 60_000 },
      ...ayar,
    });
  }

  async function ac(s) {
    await new Promise((r) => s.listen(0, '127.0.0.1', r));
    return `http://127.0.0.1:${s.address().port}${YOL}`;
  }

  beforeAll(async () => {
    yonetici = await girisYap();
    sunucu = servis();
    adres = await ac(sunucu);
  });

  afterAll(() => sunucu?.close());

  const ALANLAR = {
    ad: 'Deneme Kişi', eposta: 'Form.Deneme@Example.com', telefon: '0212 000 00 00', konu_turu: 'randevu',
    mesaj: 'Merhaba,\r\nrandevu rica ederim.', aydinlatma_surumu: 'aydinlatma-2026-10', dil: 'tr', web_sitesi: '',
  };

  function gonder(alanlar, { json = true, ip = yeniIp(), kaynak = SITE, url = adres, ...baslik } = {}) {
    return fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        ...(json ? { accept: 'application/json' } : { accept: 'text/html' }),
        ...(kaynak ? { origin: kaynak } : {}),
        'x-forwarded-for': `198.51.100.99, ${ip}`,
        ...baslik,
      },
      body: new URLSearchParams(alanlar),
    });
  }

  async function mesajlar(eposta) {
    const { govde } = await istek(yonetici, 'GET', `/items/iletisim_mesaji?filter[eposta][_eq]=${encodeURIComponent(eposta)}&fields=*`);
    return govde.data;
  }

  it('gecerli form kaydedilir: telefon E.164, e-posta kucuk harf, IP yalnizca HMAC; ancak sonra "alindi" denir', async () => {
    const ip = yeniIp();
    const yanit = await gonder(ALANLAR, { ip });
    expect(yanit.status).toBe(200);
    expect(await yanit.json()).toEqual({ tamam: true, mesaj: 'Mesajınız bize ulaştı. Teşekkür ederiz.' });

    const [kayit] = await mesajlar('form.deneme@example.com');
    expect(kayit).toMatchObject({
      ad: 'Deneme Kişi', telefon: '+902120000000', konu_turu: 'randevu', mesaj: 'Merhaba,\nrandevu rica ederim.',
      durum: 'yeni', aydinlatma_surumu: 'aydinlatma-2026-10',
    });
    // Vekilin gordugu son adres; istemcinin yazdigi ilk deger (198.51.100.99) degil.
    expect(kayit.ip_hmac).toBe(createHmac('sha256', IP_ANAHTARI).update(ip).digest('hex'));
    expect(JSON.stringify(kayit)).not.toContain(ip);
  });

  it('telefon istege bagli: bos telefonla da kaydedilir', async () => {
    const yanit = await gonder({ ...ALANLAR, eposta: 'telefonsuz@example.com', telefon: '' });
    expect(yanit.status).toBe(200);
    expect((await mesajlar('telefonsuz@example.com'))[0].telefon).toBeNull();
  });

  it('betik yoksa (Accept: text/html) kucuk bir HTML sayfa doner; EN formda Ingilizce', async () => {
    const yanit = await gonder({ ...ALANLAR, eposta: 'html.deneme@example.com', dil: 'en' }, { json: false });
    expect(yanit.status).toBe(200);
    expect(yanit.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(yanit.headers.get('content-security-policy')).toContain("default-src 'none'");
    const html = await yanit.text();
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Your message has reached us.');
    expect(html).toContain('href="/en/contact"');
    expect(await mesajlar('html.deneme@example.com')).toHaveLength(1);
  });

  it('bal kupu alani doluysa kaydedilmez ve "alindi" denmez', async () => {
    const yanit = await gonder({ ...ALANLAR, eposta: 'bot@example.com', web_sitesi: 'http://spam.example' });
    expect(yanit.status).toBe(400);
    expect((await yanit.json()).tamam).toBe(false);
    expect(await mesajlar('bot@example.com')).toHaveLength(0);
  });

  it('gecersiz alanlar adlariyla bildirilir; kayit yok', async () => {
    const yanit = await gonder({ ...ALANLAR, eposta: 'adres-degil', telefon: '12345' });
    expect(yanit.status).toBe(400);
    expect((await yanit.json()).mesaj).toBe('Mesajınız alınamadı. Lütfen şu alanları kontrol edin: E-posta, Telefon.');
  });

  it('aydinlatma metni surumu yoksa genel ret (ziyaretci duzeltemez); fark edilsin diye log, kisisel veri yok', async () => {
    const hata = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { aydinlatma_surumu, ...eksik } = ALANLAR;
      const yanit = await gonder({ ...eksik, eposta: 'surumsuz@example.com' });
      expect(yanit.status).toBe(400);
      expect((await yanit.json()).mesaj).toBe('Mesajınız alınamadı. Lütfen e-posta ya da telefonla ulaşın.');
      expect(hata).toHaveBeenCalledWith('form: aydinlatma_surumu eksik ya da gecersiz (Site ayarlari)');
      expect(JSON.stringify(hata.mock.calls)).not.toContain('surumsuz');
    } finally {
      hata.mockRestore();
    }
    expect(await mesajlar('surumsuz@example.com')).toHaveLength(0);
  });

  it('baska sitenin sayfasindan gonderim (Origin) reddedilir', async () => {
    const yanit = await gonder({ ...ALANLAR, eposta: 'csrf@example.com' }, { kaynak: 'https://kotu.example' });
    expect(yanit.status).toBe(403);
    expect(await mesajlar('csrf@example.com')).toHaveLength(0);
  });

  it('ayni IP\'den kisa surede 3\'ten fazla deneme reddedilir (429)', async () => {
    const ip = yeniIp();
    const durumlar = [];
    for (let i = 0; i < 4; i++) durumlar.push((await gonder({ ...ALANLAR, eposta: 'adres-degil' }, { ip })).status);
    expect(durumlar).toEqual([400, 400, 400, 429]);
  });

  it('yalnizca POST /api/iletisim ve form kodlamasi; buyuk govde reddedilir', async () => {
    expect((await fetch(adres)).status).toBe(405);
    expect((await fetch(adres.replace(YOL, '/baska'), { method: 'POST' })).status).toBe(404);
    expect((await gonder(ALANLAR, { 'content-type': 'application/json' })).status).toBe(415);
    expect((await gonder({ ...ALANLAR, mesaj: 'x'.repeat(40_000) })).status).toBe(413);
  });

  it('Directus kaydi basarisizsa "kaydedilemedi" denir; kayda kisisel veri yazilmaz', async () => {
    const hata = vi.spyOn(console, 'error').mockImplementation(() => {});
    const yanlis = servis({ token: 'yanlis-anahtar' });
    try {
      const yanit = await gonder({ ...ALANLAR, eposta: 'yanlis.anahtar@example.com' }, { url: await ac(yanlis) });
      expect(yanit.status).toBe(502);
      expect((await yanit.json()).mesaj).toMatch(/^Mesajınız şu anda kaydedilemedi/);
      expect(hata).toHaveBeenCalledWith('form: Directus kaydi basarisiz (401)');
      expect(JSON.stringify(hata.mock.calls)).not.toContain('yanlis.anahtar');
    } finally {
      yanlis.close();
      hata.mockRestore();
    }
  });
});

describe('kural: form servisinin anahtari yalnizca mesaj olusturur; panele giremez, koltuk saymaz', () => {
  it('mesajlari ve diger icerigi okuyamaz, site ayarini degistiremez', async () => {
    const anahtar = panel().formToken;
    expect((await istek(anahtar, 'GET', '/items/iletisim_mesaji')).durum).toBe(403);
    expect((await istek(anahtar, 'GET', '/items/kisi')).durum).toBe(403);
    expect((await istek(anahtar, 'PATCH', '/items/site_ayar', { form_bildirim_eposta: 'kotu@example.com' })).durum).toBe(403);
  });

  it('politikasi panel erisimi vermez; kullanicinin e-postasi ve parolasi yok; lisans koltugu saymaz', async () => {
    const yonetici = await girisYap();
    const { govde: p } = await istek(yonetici, 'GET', '/policies?filter[name][_eq]=Form servisi&fields=app_access,admin_access');
    expect(p.data[0]).toEqual({ app_access: false, admin_access: false });
    const { govde: k } = await istek(yonetici, 'GET', '/users?filter[role][name][_eq]=Form servisi&fields=email,password,status');
    expect(k.data).toHaveLength(1);
    expect(k.data[0]).toMatchObject({ email: null, password: null, status: 'active' });
    const { govde: tum } = await istek(yonetici, 'GET', '/users?filter[status][_eq]=active&aggregate[count]=*');
    const { govde: lisans } = await istek(yonetici, 'GET', '/license');
    expect(lisans.data.usage.seats).toBe(Number(tum.data[0].count) - 1);
  });
});
