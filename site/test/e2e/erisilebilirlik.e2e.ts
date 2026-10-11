import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Her sayfa turunden bir ornek. Yeni bir sayfa turu eklenince buraya da eklenir.
const SAYFALAR = ['/', '/en', '/404', '/ekip', '/ekip/ayse-yilmaz', '/en/team', '/en/team/ayse-yilmaz'];

test.describe('kural: WCAG 2.2 AA, ciddi ve kritik axe ihlali yok', () => {
  for (const yol of SAYFALAR) {
    test(`axe: ${yol}`, async ({ page }) => {
      await page.goto(yol);
      const sonuc = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const agir = sonuc.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      expect(agir).toEqual([]);
    });
  }
});
