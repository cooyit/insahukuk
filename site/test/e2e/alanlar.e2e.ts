import { expect, test } from '@playwright/test';

test.describe('kural: calisma alanlari iki seviyeli gezilir', () => {
  test('menu -> liste -> alt alan -> breadcrumb ile ust alan', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Çalışma Alanları' }).click();
    await expect(page).toHaveURL(/\/calisma-alanlari$/);

    await page.getByRole('link', { name: 'İmar Hukuku' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('İmar Hukuku');
    // Ilgili kisi kartindan profile gidilir.
    await expect(page.getByRole('link', { name: 'Ayşe Yılmaz' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Bulunduğunuz yer' }).getByRole('link', { name: 'Kamu Hukuku' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kamu Hukuku');
  });

  test('arabuluculuk sayfasi menuden acilir, EN karsiligina gecilir', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Arabuluculuk' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Arabuluculuk');
    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en\/mediation$/);
  });
});
