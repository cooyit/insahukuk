import { expect, test } from '@playwright/test';

test.describe('kural: ekip listesi ve profil gezilebilir', () => {
  test('menuden ekip, oradan profil; breadcrumb geri goturur', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Ekip' }).click();
    await expect(page).toHaveURL(/\/ekip$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ekip');

    await page.getByRole('link', { name: 'Zeynep Çelik' }).click();
    await expect(page).toHaveURL(/\/ekip\/zeynep-celik$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Zeynep Çelik');

    await page.getByRole('navigation', { name: 'Bulunduğunuz yer' }).getByRole('link', { name: 'Ekip' }).click();
    await expect(page).toHaveURL(/\/ekip$/);
  });

  test('EN profili olan kiside dil secici karsilik sayfaya, olmayanda EN ana sayfaya gider', async ({ page }) => {
    await page.goto('/ekip/ayse-yilmaz');
    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en\/team\/ayse-yilmaz$/);

    await page.goto('/ekip/mehmet-kaya');
    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en$/);
  });
});
