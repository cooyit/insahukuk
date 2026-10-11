import { expect, test } from '@playwright/test';

const ogeler = '#yayin-listesi > li';

test.describe('kural: yayin filtreleri calisir', () => {
  test('tur, yazar, yil ve etiket filtreleri listeyi daraltir; temizle geri getirir', async ({ page }) => {
    await page.goto('/yayinlar');
    const filtre = page.getByRole('group', { name: 'Filtreler' });
    await expect(filtre).toBeVisible();
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(10);
    await expect(page.getByText('10 yayın gösteriliyor')).toBeVisible();

    await filtre.getByLabel('Tür', { exact: true }).selectOption({ label: 'Kitap' });
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(1);
    await expect(page.locator(`${ogeler}:visible`)).toContainText('Kira Uyuşmazlıklarında Arabuluculuk');

    await filtre.getByRole('button', { name: 'Filtreleri temizle' }).click();
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(10);

    await filtre.getByLabel('Yazar', { exact: true }).selectOption({ label: 'Mehmet Kaya' });
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(2);

    await filtre.getByLabel('Yıl', { exact: true }).selectOption('2024');
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(1);
    await expect(page.locator(`${ogeler}:visible`)).toContainText('Temerrüt Nedeniyle Tahliye');

    await filtre.getByLabel('Etiket', { exact: true }).selectOption({ label: 'Sözleşme' });
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(0);
    await expect(page.getByText('Seçimlerinize uyan yayın yok.')).toBeVisible();
  });

  test('alan filtresi', async ({ page }) => {
    await page.goto('/yayinlar');
    await page.getByLabel('Alan', { exact: true }).selectOption({ label: 'Aile Hukuku' });
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(1);
  });
});

test.describe('kural: JS kapaliyken liste tamamen gezilebilir', () => {
  test.use({ javaScriptEnabled: false });

  test('filtre formu gorunmez, butun yayinlar gorunur ve detay acilir', async ({ page }) => {
    await page.goto('/yayinlar');
    await expect(page.getByRole('group', { name: 'Filtreler' })).toBeHidden();
    await expect(page.locator(`${ogeler}:visible`)).toHaveCount(10);
    await page.getByRole('link', { name: 'Ticari Sözleşmelerde Cezai Şart' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ticari Sözleşmelerde Cezai Şart');
  });
});
