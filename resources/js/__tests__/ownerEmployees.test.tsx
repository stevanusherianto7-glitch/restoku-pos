import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Employees from '../Pages/Owner/Employees';

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

describe('Owner/Employees', () => {
    it('renders heading and department breakdown', () => {
        render(<Employees />);
        expect(screen.getByText('Ringkasan Karyawan')).toBeInTheDocument();
        expect(screen.getByText('Service (Waiter)')).toBeInTheDocument();
        expect(screen.getByText('Kitchen')).toBeInTheDocument();
    });
});
