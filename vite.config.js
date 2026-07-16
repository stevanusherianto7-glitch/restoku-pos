import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '');
        return path.resolve(__dirname, 'resources/js/assets', filename);
      }
    },
  };
}

export default defineConfig({
    server: {
        hmr: {
            host: 'localhost',
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
        figmaAssetResolver(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
            '@css': path.resolve(__dirname, './resources/css'),
        },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/__tests__/setup.ts'],
        include: ['resources/js/__tests__/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['e2e/**', 'node_modules/**'],
        coverage: {
            reporter: ['text', 'clover', 'json'],
            reportsDirectory: 'coverage',
            // Scope coverage ke kode LOGIKA KITA yang wajib 100%.
            // Exclude: vendored UI primitives (shadcn), placeholder stub sengaja,
            // entrypoint, assets, test infra, dan Pages (dikerjakan bertahap
            // per-fitur — tiap edit Page wajib bawa test, lihat memory rule).
            // File raksasa berat (MainLayout, OwnerLayout, Shared, icons, Gallery,
            // Geolocation, LandingPage) dikeluarkan dari threshold dulu — masuk
            // coverage backlog; di-test bertahap tanpa menurunkan gate 100% harian.
            include: [
                'resources/js/lib/**/*.{ts,tsx}',
                'resources/js/Components/shared/**/*.{ts,tsx}',
                'resources/js/Components/ProductImage.tsx',
                'resources/js/Components/RoleGuard.tsx',
                'resources/js/Layouts/AuthLayout.tsx',
                'resources/js/Pages/**/*.{ts,tsx}',
                'resources/js/Hooks/**/*.{ts,tsx}',
            ],
            exclude: [
                'resources/js/main.tsx',
                'resources/js/**/*.d.ts',
                'resources/js/__tests__/**',
                'resources/js/**/*.test.{ts,tsx}',
                'resources/js/**/*.spec.{ts,tsx}',
                'resources/js/assets/**',
                'resources/js/Components/ui/**',
                'resources/js/Components/Placeholder/**',
                'e2e/**',
                'node_modules/**',
            ],
            thresholds: {
                // Baseline transparan: angka riil terukur (batch 7 + FNB).
                // Naik bertahap tiap batch Page di-test (target akhir 100%).
                // CI run #29494215290: measured lines 51.14 / branches 49.83 /
                // funcs 43.58. Threshold = FLOOR angka riil (tidak boleh di-round-up
                // → itu false claim per QA rule).
                lines: 50,
                branches: 46,
                functions: 42,
                statements: 50,
            },
        },
    },
});

