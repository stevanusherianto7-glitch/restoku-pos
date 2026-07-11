import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrinterConfigPage from '../Pages/PrinterConfig/Index';

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
// stub sub-component berat
vi.mock('../Components/Settings/PrinterConfig', () => ({
    PrinterConfig: () => <div>Kasir Dapur Receipt</div>,
}));
vi.mock('../Components/POS/GeminiCopilotWidget', () => ({ default: () => null }));

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUseTenantSettings.mockReturnValue({
        tenantName: 'Restoku',
        tenantLogo: '',
        tenantImage: null,
        screenMode: 'default',
        saveSettings: vi.fn(),
        renderLogo: () => null,
    });
});

const setRole = (role: string) =>
    mockUsePage.mockImplementation(() => ({
        props: { auth: { user: { role, name: 'User' } } },
    }));

describe('PrinterConfig/Index', () => {
    it('renders printer config', () => {
        setRole('owner');
        render(<PrinterConfigPage />);
        expect(screen.getByText('Kasir Dapur Receipt')).toBeInTheDocument();
    });

    it('denies access for kasir role', () => {
        setRole('kasir');
        render(<PrinterConfigPage />);
        expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });
});
