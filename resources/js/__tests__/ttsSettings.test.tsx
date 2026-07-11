import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TTSSettingsPage from '../Pages/TTSSettings/Index';

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
vi.mock('../Components/Settings/TTSSettings', () => ({
    TTSSettings: () => <div>Pengaturan TTS Panel</div>,
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

describe('TTSSettings/Index', () => {
    it('renders TTS settings', () => {
        setRole('owner');
        render(<TTSSettingsPage />);
        expect(screen.getByText('Pengaturan TTS Panel')).toBeInTheDocument();
    });

    it('denies access for kasir role', () => {
        setRole('kasir');
        render(<TTSSettingsPage />);
        expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });
});
