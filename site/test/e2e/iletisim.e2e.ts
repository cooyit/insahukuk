import { expect, test } from '@playwright/test';

test.describe('kural: iletisim formu HTML ile dogrulanir; sahte "gonderildi" yok', () => {
  test('bos gonderimde zorunlu alanlar gecersiz ve dogrulama mesaji var; sayfa degismez', async ({ page }) => {
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

  test('gecerli formda "gonderilmedi" bilgisi gorunur, basari mesaji gorunmez', async ({ page }) => {
    await page.goto('/iletisim');
    await page.getByLabel('Ad soyad *', { exact: true }).fill('Deneme Kişi');
    await page.getByLabel('E-posta *', { exact: true }).fill('deneme@example.com');
    await page.getByLabel('Konu *', { exact: true }).selectOption('genel');
    await page.getByLabel('Mesajınız *', { exact: true }).fill('Deneme mesajı.');
    await page.getByRole('button', { name: 'Gönder' }).click();

    await expect(page).toHaveURL(/\/iletisim$/);
    await expect(page.getByRole('status')).toHaveText('Form henüz etkin değil; mesajınız gönderilmedi. Lütfen e-posta ya da telefonla ulaşın.');
    await expect(page.getByText(/gönderildi|başarıyla/)).toHaveCount(0);
  });
});
