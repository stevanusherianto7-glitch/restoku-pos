import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { ErrorBoundary } from './Components/shared/ErrorBoundary';
import '../css/app.css';

const appName = 'Restoku';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true });
        return pages[`./Pages/${name}.tsx`] as never;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>,
        );
    },
});
