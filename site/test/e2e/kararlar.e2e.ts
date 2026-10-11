import { expect, test } from '@playwright/test';

const ogeler = '#karar-listesi > li';

test.describe('kural: karar filtreleri calisir (mahkeme, yil, alan, mevzuat)', () => {
  test('filtreler listeyi daraltir ve birlesir', async ({ page }) => {
    await page.goto('/kararlar');
    const filtre = page.getByRole('group', { name: 'Filtreler' });
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(6);

    await filtre.getByLabel('Mahkeme', { exact: true }).selectOption({ label: 'Yargıtay' });
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(3);

    await filtre.getByLabel('Yıl', { exact: true }).selectOption('2025');
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(1);
    await expect(page.getByText('1 karar gösteriliyor')).toBeVisible();

    await filtre.getByRole('button', { name: 'Filtreleri temizle' }).click();
    await filtre.getByLabel('Mevzuat', { exact: true }).selectOption({ label: 'TBK (Türk Borçlar Kanunu)' });
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(3);

    await filtre.getByRole('button', { name: 'Filtreleri temizle' }).click();
    await filtre.getByLabel('Alan', { exact: true }).selectOption({ label: 'Gayrimenkul Hukuku' });
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(2);
  });

  test('listeden detaya, detaydan ilgili yayina gidilir', async ({ page }) => {
    await page.goto('/kararlar');
    await page.getByRole('link', { name: /Kira bedelinin tespiti/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Kira bedelinin tespiti');
    await page.getByRole('link', { name: 'Kira Bedelinin Tespiti Davalarında Güncel Durum' }).click();
    await expect(page).toHaveURL(/\/yayinlar\/kira-bedelinin-tespiti-davalarinda-guncel-durum$/);
  });

  test('EN menude kararlar yok', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('navigation', { name: 'Main menu' }).getByRole('link')).not.toContainText(['Kararlar']);
  });
});
