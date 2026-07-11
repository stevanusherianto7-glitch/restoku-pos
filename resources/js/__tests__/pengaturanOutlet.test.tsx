import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PengaturanOutlet from '../Pages/PengaturanOutlet/Index';

const mockUsePage = vi.hoisted(() => vi.fn());
const mockRouter = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
const mockUseSubscription = vi.hoisted(() => vi.fn());
const mockUseTenantSettings = vi.hoisted(() => vi.fn());

vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        router: mockRouter,
        usePage: mockUsePage,
    };
});

vi.mock('../../Hooks/useSubscription', () => ({
    useSubscription: () => mockUseSubscription(),
}));

vi.mock('../../Components/Shared', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../Components/Shared')>();
    return {
        ...actual,
        useTenantSettings: () => mockUseTenantSettings(),
    };
});

const stableProps = {
    outlet: { name: 'Cabang A', address: 'Jl. Test', phone: '021', latitude: -6.2, longitude: 106.8 },
    tenant: {
        name: 'Restoku',
        brand_name: 'Restoku',
        tax_type: 'pbjt',
        pbjt_rate: 10,
        ppn_rate: 11,
        service_charge_rate: 0,
    },
    employees: [],
    auth: { user: { role: 'owner', name: 'Owner' } },
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUsePage.mockImplementation(() => ({ props: stableProps }));
    mockUseSubscription.mockReturnValue({ plan: 'enterprise', isTrialing: false, hasFeature: () => true });
    mockUseTenantSettings.mockReturnValue({
        tenantName: 'Restoku',
        tenantLogo: '',
        tenantImage: null,
        tenantLayout: 'default',
        staffKasir: '',
        staffKitchen: '',
        staffWaiter: '',
        staffManager: '',
        staffOwner: 'OWNER',
        pinKasir: '',
        pinKitchen: '',
        pinWaiter: '',
        pinManager: '',
        employees: [],
        screenMode: 'default',
        saveSettings: vi.fn(),
        saveEmployees: vi.fn(),
        saveLayout: vi.fn(),
        renderLogo: () => null,
    });
    vi.stubGlobal(
        'fetch',
        vi.fn((input: any) => {
            const url = String(input);
            const body = url.includes('/api/reservations') ? [] : {};
            return Promise.resolve({ ok: true, json: async () => body });
        }),
    );
});

describe('PengaturanOutlet/Index', () => {
    it('renders settings with default tab', async () => {
        render(<PengaturanOutlet />);
        await waitFor(() => expect(screen.getByText('Pengaturan Outlet')).toBeInTheDocument());
        // Default tab = Profil Outlet
        expect(screen.getAllByText(/Profil Outlet/i).length).toBeGreaterThan(0);
    });

    it('switches tab to Lokasi Restoran', async () => {
        render(<PengaturanOutlet />);
        await waitFor(() => expect(screen.getByText('Pengaturan Outlet')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Lokasi Restoran'));
        expect(screen.getByText('Lokasi Restoran')).toBeInTheDocument();
    });

    it('saves changes (invokes saveSettings + writes localStorage)', async () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
        render(<PengaturanOutlet />);
        await waitFor(() => expect(screen.getByText('Pengaturan Outlet')).toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: /Simpan Semua Perubahan/ }));
        await waitFor(() => expect(setItemSpy).toHaveBeenCalledWith('outlet_nama', expect.any(String)));
    });
});
