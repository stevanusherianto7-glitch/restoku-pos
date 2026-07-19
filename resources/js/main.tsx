import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './Components/shared/ErrorBoundary';
import '../css/app.css';

const appName = 'Restoku';

// P-1 (audit 2026-07-19): route-level code splitting.
// Glob TIDAK eager → tiap Page jadi chunk terpisah (lazy), bukan 1 bundle raksasa.
// Suspense fallback ringan agar navigasi antar-page tidak blank.
const pages = import.meta.glob('./Pages/**/*.tsx');

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const page = pages[`./Pages/${name}.tsx`];
        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }
        return lazy(() => page().then((m) => ({ default: (m as { default: unknown }).default })));
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ErrorBoundary>
                <Suspense fallback={<div className="min-h-screen bg-[#0a0b0f]" />}>
                    <App {...props} />
                </Suspense>
            </ErrorBoundary>,
        );
    },
});
