import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthLayout from '../Layouts/AuthLayout';

describe('AuthLayout', () => {
    it('renders default title and subtitle', () => {
        render(<AuthLayout>form</AuthLayout>);
        expect(screen.getByText('Selamat Datang Kembali.')).toBeTruthy();
        expect(screen.getByText(/Masuk ke sistem/)).toBeTruthy();
        expect(screen.getByText('form')).toBeTruthy();
    });

    it('renders custom title and subtitle', () => {
        render(
            <AuthLayout title="Masuk Owner" subtitle="Kelola resto">
                body
            </AuthLayout>,
        );
        expect(screen.getByText('Masuk Owner')).toBeTruthy();
        expect(screen.getByText('Kelola resto')).toBeTruthy();
    });

    it('renders back link by default and hides when showBackLink false', () => {
        const { rerender } = render(<AuthLayout>body</AuthLayout>);
        expect(screen.getByText('Kembali ke website')).toBeTruthy();
        rerender(<AuthLayout showBackLink={false}>body</AuthLayout>);
        expect(screen.queryByText('Kembali ke website')).toBeNull();
    });

    it('shows copyright with current year', () => {
        render(<AuthLayout>x</AuthLayout>);
        const year = String(new Date().getFullYear());
        expect(screen.getByText(new RegExp(`© ${year} Restoku`))).toBeTruthy();
    });
});
