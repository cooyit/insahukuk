import { defineConfig, devices } from '@playwright/test';

// Testler derlenmis siteyi (dist/) "astro preview" ile acar; once "npm run build" gerekir.
// CHROMIUM_YOLU verilirse o tarayici kullanilir (ornek: sistemdeki Chrome). Verilmezse
// Playwright'in kendi Chromium'u aranir: "npx playwright install chromium" ile kurulur.
const PORT = 4329;

export default defineConfig({
  testDir: 'test/e2e',
  testMatch: '**/*.e2e.ts',
  outputDir: 'test-sonuclari',
  reporter: 'list',
  fullyParallel: true,
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath: process.env.CHROMIUM_YOLU || undefined },
      },
    },
  ],
  webServer: {
    // --ignore-lock: Astro 7 bazi ortamlarda (ornegin bir kodlama ajani algilarsa) preview'i
    // kendiliginden arka plana atip cikiyor; Playwright bunu "sunucu erken kapandi" sanar.
    command: `npm run preview -- --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
