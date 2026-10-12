import { expect, test, type Page, type Request } from '@playwright/test';

// Form servisi (panel/form) bu testlerde yok: /api/iletisim istegi page.route ile yakalanir ve
// sunucunun yaniti taklit edilir. Servisin kendisi panel/test/form.test.mjs'de uctan uca sinanir.
const API = '**/api/iletisim';

async function doldur(page: Page) {
  await page.getByLabel('Ad soyad *', { exact: true }).fill('Deneme Kişi');
  await page.getByLabel('E-posta *', { exact: true }).fill('deneme@example.com');
  await page.getByLabel('Telefon (isteğe bağlı)', { exact: true }).fill('0212 000 00 00');
  await page.getByLabel('Konu *', { exact: true }).selectOption('genel');
  await page.getByLabel('Mesajınız *', { exact: true }).fill('Deneme mesajı.');
}

const alanlar = (istek: Request) => Object.fromEntries(new URLSearchParams(istek.postData() ?? ''));

test.describe('kural: JS yoksa form normal gonderilir (sunucu HTML sayfa dondurur)', () => {
  test.use({ javaScriptEnabled: false });

  test('form gorunur; POST /api/iletisim form kodlamasiyla, gizli alanlarla gider', async ({ page }) => {
    let gelen: Request | undefined;
    await page.route(API, (route) => {
      gelen = route.request();
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<p role="status">sunucu yaniti</p>' });
    });
    await page.goto('/iletisim');
    await expect(page.locator('main').getByRole('link', { name: 'info@insahukuk.test' })).toBeVisible();
    await doldur(page);
    await page.getByRole('button', { name: 'Gönder' }).click();

    await expect(page.getByRole('status')).toHaveText('sunucu yaniti');
    expect(gelen!.method()).toBe('POST');
    expect(gelen!.headers()['content-type']).toBe('application/x-www-form-urlencoded');
    expect(alanlar(gelen!)).toEqual({
      ad: 'Deneme Kişi', eposta: 'deneme@example.com', telefon: '0212 000 00 00', konu_turu: 'genel', mesaj: 'Deneme mesajı.',
      dil: 'tr', aydinlatma_surumu: 'aydinlatma-2026-10', web_sitesi: '',
    });
  });
});

test.describe('kural: iletisim formu HTML ile dogrulanir', () => {
  test('bos gonderimde zorunlu alanlar gecersiz ve dogrulama mesaji var; istek gitmez', async ({ page }) => {
    let istekSayisi = 0;
    await page.route(API, (route) => {
      istekSayisi++;
      return route.abort();
    });
    await page.goto('/iletisim');
    await page.getByRole('button', { name: 'Gönder' }).click();
    await expect(page).toHaveURL(/\/iletisim$/);

    for (const ad of ['Ad soyad *', 'E-posta *', 'Konu *', 'Mesajınız *']) {
      const alan = page.getByLabel(ad, { exact: true });
      expect(await alan.evaluate((e: HTMLInputElement) => e.validity.valid), ad).toBe(false);
      expect(await alan.evaluate((e: HTMLInputElement) => e.validationMessage), ad).not.toBe('');
    }
    // Ilk gecersiz alana odaklanilir (tarayici davranisi).
    await expect(page.getByLabel('Ad soyad *', { exact: true })).toBeFocused();
    expect(istekSayisi).toBe(0);
  });

  test('gecersiz e-posta ve telefon bicimi reddedilir', async ({ page }) => {
    await page.goto('/iletisim');
    const eposta = page.getByLabel('E-posta *', { exact: true });
    await eposta.fill('adres-degil');
    expect(await eposta.evaluate((e: HTMLInputElement) => e.validity.typeMismatch)).toBe(true);
    const telefon = page.getByLabel('Telefon (isteğe bağlı)', { exact: true });
    await telefon.fill('abc');
    expect(await telefon.evaluate((e: HTMLInputElement) => e.validity.patternMismatch)).toBe(true);
    await telefon.fill('+90 (212) 000-00-00');
    expect(await telefon.evaluate((e: HTMLInputElement) => e.validity.valid)).toBe(true);
  });

  test('bal kupu alani insana gorunmez ve klavyeyle ulasilamaz', async ({ page }) => {
    await page.goto('/iletisim');
    const bal = page.locator('input[name="web_sitesi"]');
    await expect(bal).toBeHidden();
    await expect(bal).toHaveAttribute('tabindex', '-1');
  });
});

test.describe('kural: betik sunucunun gercek yanitini gosterir; sahte "gonderildi" yok', () => {
  test('sunucu kabul edince onun mesaji gorunur ve form temizlenir', async ({ page }) => {
    let gelen: Request | undefined;
    await page.route(API, (route) => {
      gelen = route.request();
      return route.fulfill({ status: 200, json: { tamam: true, mesaj: 'Sunucu: kaydedildi.' } });
    });
    await page.goto('/iletisim');
    await doldur(page);
    await page.getByRole('button', { name: 'Gönder' }).click();

    await expect(page.getByRole('status')).toHaveText('Sunucu: kaydedildi.');
    await expect(page).toHaveURL(/\/iletisim$/);
    await expect(page.getByLabel('Ad soyad *', { exact: true })).toHaveValue('');
    expect(gelen!.headers().accept).toBe('application/json');
    expect(alanlar(gelen!)).toMatchObject({ ad: 'Deneme Kişi', dil: 'tr', web_sitesi: '' });
  });

  test('sunucu reddedince onun mesaji gorunur, yazilanlar silinmez', async ({ page }) => {
    await page.route(API, (route) => route.fulfill({ status: 400, json: { tamam: false, mesaj: 'Sunucu: alanları kontrol edin.' } }));
    await page.goto('/iletisim');
    await doldur(page);
    await page.getByRole('button', { name: 'Gönder' }).click();

    await expect(page.getByRole('status')).toHaveText('Sunucu: alanları kontrol edin.');
    await expect(page.getByLabel('Ad soyad *', { exact: true })).toHaveValue('Deneme Kişi');
    await expect(page.getByRole('button', { name: 'Gönder' })).toBeEnabled();
  });

  test('sunucuya ulasilamazsa ya da yanit beklenen bicimde degilse "iletilemedi" denir', async ({ page }) => {
    await page.route(API, (route) => route.abort());
    await page.goto('/iletisim');
    await doldur(page);
    await page.getByRole('button', { name: 'Gönder' }).click();
    const iletilemedi = 'Mesajınız iletilemedi; sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin ya da e-posta veya telefonla ulaşın.';
    await expect(page.getByRole('status')).toHaveText(iletilemedi);
    await expect(page.getByText(/gönderildi|başarıyla|ulaştı/)).toHaveCount(0);

    await page.unroute(API);
    await page.route(API, (route) => route.fulfill({ status: 502, contentType: 'text/html', body: '<h1>Bad Gateway</h1>' }));
    await page.getByRole('button', { name: 'Gönder' }).click();
    await expect(page.getByRole('status')).toHaveText(iletilemedi);
  });

  test('EN formu dil=en gonderir', async ({ page }) => {
    let gelen: Request | undefined;
    await page.route(API, (route) => {
      gelen = route.request();
      return route.fulfill({ status: 200, json: { tamam: true, mesaj: 'Server: saved.' } });
    });
    await page.goto('/en/contact');
    await page.getByLabel('Full name *', { exact: true }).fill('Test Person');
    await page.getByLabel('E-mail *', { exact: true }).fill('test@example.com');
    await page.getByLabel('Subject *', { exact: true }).selectOption('genel');
    await page.getByLabel('Your message *', { exact: true }).fill('Test.');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('status')).toHaveText('Server: saved.');
    expect(alanlar(gelen!).dil).toBe('en');
  });
});
