import { expect, test } from '@playwright/test';

test.describe('kural: Turkce kokte, Ingilizce /en altinda; dil secici calisir', () => {
  test('TR ana sayfa acilir, dil secici EN ana sayfaya goturur', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('link', { name: 'Türkçe' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  });

  test('bilinmeyen adres 404 durum koduyla iki dilli 404 sayfasini dondurur', async ({ page }) => {
    const yanit = await page.goto('/olmayan-bir-sayfa');
    expect(yanit?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sayfa bulunamadı');
    await expect(page.getByRole('link', { name: 'Back to home page' })).toBeVisible();
  });

  test('icerige atla baglantisi ilk Tab ile odaklanir ve ana icerige gider', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const atla = page.getByRole('link', { name: 'İçeriğe atla' });
    await expect(atla).toBeFocused();
    await atla.press('Enter');
    await expect(page).toHaveURL(/#icerik$/);
  });
});
