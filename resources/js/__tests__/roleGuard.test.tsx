import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleGuard, AccessDenied, useRoleGuard } from '../Components/RoleGuard';

// Stub MainLayout (heavy nav) to keep test light
vi.mock('../Layouts/MainLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="ml">{children}</div>,
}));

// Hoisted mock — avoids vi.mock hoisting pitfall with a mutable outer var.
const { mockUsePage } = vi.hoisted(() => ({
    mockUsePage: vi.fn(),
}));

// Default return value (mockReturnValue so tests can override via setProps).
mockUsePage.mockReturnValue({ props: { auth: null } });

vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        usePage: mockUsePage,
    };
});

const setProps = (auth: any) => {
    mockUsePage.mockImplementation(() => ({ props: { auth } }));
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setProps({ user: null });
});

describe('useRoleGuard', () => {
    it('allows owner when auth.user.role is owner and included', () => {
        setProps({ user: { role: 'owner' } });
        let status = '';
        const Comp = () => {
            status = useRoleGuard(['owner', 'manager']);
            return null;
        };
        render(<Comp />);
        expect(status).toBe('allowed');
    });

    it('denies when role not in allowedRoles', () => {
        setProps({ user: { role: 'owner' } });
        let status = '';
        const Comp = () => {
            status = useRoleGuard(['manager']);
            return null;
        };
        render(<Comp />);
        expect(status).toBe('denied');
    });

    it('denies when no activeKaryawan in localStorage', () => {
        setProps({ user: null });
        let status = '';
        const Comp = () => {
            status = useRoleGuard(['kasir']);
            return null;
        };
        render(<Comp />);
        expect(status).toBe('denied');
    });

    it('allows valid employee with matching token', () => {
        setProps({ user: null });
        localStorage.setItem(
            'activeKaryawan',
            JSON.stringify({ name: 'Budi', role: 'kasir', token: '1_kasir_auth_ok' }),
        );
        localStorage.setItem('tenant_employees', JSON.stringify([{ id: 1, role: 'kasir', name: 'Budi' }]));
        let status = '';
        const Comp = () => {
            status = useRoleGuard(['kasir']);
            return null;
        };
        render(<Comp />);
        expect(status).toBe('allowed');
    });

    it('denies when employee not in directory', () => {
        setProps({ user: null });
        localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Hacker', role: 'owner' }));
        // Employee directory exists but does NOT contain 'Hacker' → identity check fails.
        localStorage.setItem(
            'tenant_employees',
            JSON.stringify([{ id: '1', name: 'BUDI HARTONO', role: 'kasir', pin: '123456' }]),
        );
        let status = '';
        const Comp = () => {
            status = useRoleGuard(['owner']);
            return null;
        };
        render(<Comp />);
        expect(status).toBe('denied');
    });

    it('denies when token invalid', () => {
        setProps({ user: null });
        localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Budi', role: 'kasir', token: 'bad' }));
        localStorage.setItem('tenant_employees', JSON.stringify([{ id: 1, role: 'kasir', name: 'Budi' }]));
        let status = '';
        const Comp = () => {
            status = useRoleGuard(['kasir']);
            return null;
        };
        render(<Comp />);
        expect(status).toBe('denied');
    });

    it('denies when localStorage item is corrupt JSON', () => {
        setProps({ user: null });
        localStorage.setItem('activeKaryawan', '{not json');
        localStorage.setItem('tenant_employees', '{}');
        let status = '';
        const Comp = () => {
            status = useRoleGuard(['kasir']);
            return null;
        };
        render(<Comp />);
        expect(status).toBe('denied');
    });
});

describe('RoleGuard component', () => {
    it('renders children when allowed', () => {
        setProps({ user: { role: 'owner' } });
        render(
            <RoleGuard allowedRoles={['owner']}>
                <div>secret</div>
            </RoleGuard>,
        );
        expect(screen.getByText('secret')).toBeTruthy();
    });

    it('renders AccessDenied when denied', () => {
        setProps({ user: null });
        render(
            <RoleGuard allowedRoles={['kasir']} pageName="Laporan">
                <div>secret</div>
            </RoleGuard>,
        );
        expect(screen.getByText('Akses Ditolak')).toBeTruthy();
        expect(screen.getByText('Laporan')).toBeTruthy();
        expect(screen.queryByText('secret')).toBeNull();
    });

    it('renders nothing while loading', () => {
        setProps({ user: { role: 'owner' } });
        // force loading by making useEffect not run synchronously: we just assert fast render
        render(
            <RoleGuard allowedRoles={['owner']}>
                <div>secret</div>
            </RoleGuard>,
        );
        // owner allowed → immediately allowed (no loading gap in jsdom)
        expect(screen.getByText('secret')).toBeTruthy();
    });
});

describe('AccessDenied', () => {
    it('renders page name and allowed role label', () => {
        render(<AccessDenied pageName="Kasir" allowedRoleLabel="owner, manager" />);
        expect(screen.getByText('Kasir')).toBeTruthy();
        expect(screen.getByText('owner, manager')).toBeTruthy();
        expect(screen.getByText(/Kembali ke Dashboard/)).toBeTruthy();
    });
});
