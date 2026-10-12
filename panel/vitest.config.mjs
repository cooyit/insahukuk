import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.mjs'],
    globalSetup: ['test/hazirlik.mjs'],
    // Testler ayni Directus ornegini paylasir ve sirayla veri yazar; paralel calismasinlar.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
});
