import { expect, test } from '@playwright/test';
import { htmlSayfalari } from '../cikti/dist';

const TR_MENU = ['Hakkımızda', 'Çalışma Alanları', 'Arabuluculuk', 'Ekip', 'Yayınlar', 'Kararlar', 'İletişim'];

test.describe('kural: menu klavyeyle kullanilabilir', () => {
  test('Tab sirasi: icerige atla, site adi, menu ogeleri, dil secici; Enter ile gidilir', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'İçeriğe atla' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.site-adi')).toBeFocused();
    for (const ad of TR_MENU) {
      await page.keyboard.press('Tab');
      await expect(page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: ad, exact: true })).toBeFocused();
    }
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'English' })).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/iletisim$/);
    // Bulunulan sayfa menude aria-current ile isaretli.
    await expect(page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'İletişim' })).toHaveAttribute('aria-current', 'page');
  });

  test('odaklanan baglantinin odak cercevesi gorunur', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const cerceve = await page.locator('.site-adi').evaluate((e) => getComputedStyle(e).outlineStyle);
    expect(cerceve).not.toBe('none');
  });
});

test.describe('kural: mobil genislikte sayfa bozulmaz (yatay kaydirma yok)', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  // dist'teki butun sayfalar (erisilebilirlik testindeki gibi).
  const SAYFALAR = htmlSayfalari().map((s) => s.yol).sort();

  for (const yol of SAYFALAR) {
    test(`360px: ${yol}`, async ({ page }) => {
      await page.goto(yol);
      const { kaydirma, genislik } = await page.evaluate(() => ({
        kaydirma: document.documentElement.scrollWidth,
        genislik: document.documentElement.clientWidth,
      }));
      expect(kaydirma).toBeLessThanOrEqual(genislik);
      await expect(page.getByRole('navigation', { name: /Ana menü|Main menu/ })).toBeVisible();
    });
  }
});
