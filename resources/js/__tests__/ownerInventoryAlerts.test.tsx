import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryAlerts from '../Pages/Owner/InventoryAlerts';

const mockUsePage = vi.hoisted(() => vi.fn());
const mockUseTenantSettings = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        usePage: mockUsePage,
    };
});
vi.mock('../Components/Shared', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../Components/Shared')>();
    return { ...actual, useTenantSettings: mockUseTenantSettings };
});
vi.mock('../Hooks/useSubscription', () => ({
    useSubscription: () => ({ isLocked: () => false, featureLocks: {} }),
}));
vi.mock('../Components/POS/GeminiCopilotWidget', () => ({
    default: () => null,
}));

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUsePage.mockImplementation(() => ({
        props: { auth: { user: { role: 'owner', name: 'Owner' } } },
    }));
    mockUseTenantSettings.mockReturnValue({
        tenantName: 'Restoku',
        tenantLogo: '',
        tenantImage: null,
        screenMode: 'default',
        saveSettings: vi.fn(),
        renderLogo: () => null,
    });
});

describe('Owner/InventoryAlerts', () => {
    it('renders heading and stock alerts', () => {
        render(<InventoryAlerts />);
        expect(screen.getByText('Peringatan Stok')).toBeInTheDocument();
        expect(screen.getByText('Nasi Putih')).toBeInTheDocument();
        expect(screen.getByText('HABIS')).toBeInTheDocument();
        expect(screen.getAllByText('Menipis').length).toBeGreaterThan(0);
    });
});
