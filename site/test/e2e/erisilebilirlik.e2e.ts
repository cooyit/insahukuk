import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { distVarMi, htmlSayfalari } from '../cikti/dist';

// Elle secilmis liste yerine dist'teki BUTUN sayfalar: yeni bir sayfa ya da sayfa turu
// eklenince ayrica yazmak gerekmez, tarama kendiliginden kapsar.
if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
const SAYFALAR = htmlSayfalari().map((s) => s.yol).sort();

test.describe('kural: WCAG 2.2 AA, ciddi ve kritik axe ihlali yok (butun sayfalar)', () => {
  test('en az 60 sayfa taraniyor (dist bos ya da eksik degil)', () => {
    expect(SAYFALAR.length).toBeGreaterThanOrEqual(60);
  });

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
