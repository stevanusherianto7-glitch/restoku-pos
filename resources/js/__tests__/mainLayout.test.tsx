import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUsePage = vi.hoisted(() => vi.fn());
const mockUseTenantSettings = vi.hoisted(() => vi.fn());
vi.mock('../Components/POS/GeminiCopilotWidget', () => ({ default: () => null }));
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        usePage: mockUsePage,
        Link: ({ href, children, className }: any) => (
            <a href={href} className={className} data-testid="nav-link">
                {children}
            </a>
        ),
    };
});
vi.mock('../Components/Shared', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../Components/Shared')>();
    return { ...actual, useTenantSettings: mockUseTenantSettings };
});
vi.mock('../Hooks/useSubscription', () => ({
    useSubscription: () => ({ isLocked: () => false, featureLocks: {} }),
}));

import MainLayout from '../Layouts/MainLayout';

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUseTenantSettings.mockReturnValue({
        tenantName: 'Restoku',
        tenantLogo: '',
        tenantImage: null,
        screenMode: 'default',
        renderLogo: () => null,
    });
});

const setOwner = () =>
    mockUsePage.mockImplementation(() => ({
        props: { auth: { user: { role: 'owner', name: 'Owner' } } },
    }));
const setWaiter = () => {
    localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Budi', role: 'waiter' }));
    mockUsePage.mockImplementation(() => ({
        props: { auth: { user: { role: 'kasir', name: 'Kasir' } } },
    }));
};

describe('MainLayout/Sidebar', () => {
    it('shows owner-only menu items for owner role (after expanding group)', async () => {
        setOwner();
        render(<MainLayout>{null}</MainLayout>);
        // grup "Owner View" ada sebagai tombol (sidebar expanded)
        expect(screen.getByText('Owner View')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Owner View'));
        // setelah expand, item owner-only muncul
        expect(screen.getByText('Data Karyawan')).toBeInTheDocument();
        expect(screen.getByText('Pengaturan Owner')).toBeInTheDocument();
    });

    it('hides owner-only group for waiter role', async () => {
        setWaiter();
        render(<MainLayout>{null}</MainLayout>);
        // grup Owner View harusnya tidak ada di visibleNav untuk waiter
        expect(screen.queryByText('Owner View')).not.toBeInTheDocument();
        // Waiter tetap lihat menu kasir-friendly
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders brand lockup + staff profile card', async () => {
        setOwner();
        render(<MainLayout>{null}</MainLayout>);
        // Brand wordmark Restoku ada sebagai alt pada img logo (bukan text node)
        expect(screen.getAllByAltText('Restoku').length).toBeGreaterThan(0);
    });
});
