import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import WhatsAppIntegrationPage from '../Pages/WhatsAppIntegration/Index';

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
vi.mock('../Components/Settings/WhatsAppIntegration', () => ({
    WhatsAppIntegration: () => <div>WhatsApp Integration Panel</div>,
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

describe('WhatsAppIntegration/Index', () => {
    it('renders WhatsApp integration', () => {
        setRole('owner');
        render(<WhatsAppIntegrationPage />);
        expect(screen.getByText('WhatsApp Integration Panel')).toBeInTheDocument();
    });

    it('denies access for kasir role', () => {
        setRole('kasir');
        render(<WhatsAppIntegrationPage />);
        expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });
});
