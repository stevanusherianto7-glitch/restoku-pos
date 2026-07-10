/**
 * StaffLogin.test.tsx
 *
 * Unit tests untuk komponen StaffLogin — khususnya memverifikasi
 * ketahanan (null-safety) terhadap data login_employees yang bermasalah.
 *
 * Bug yang pernah terjadi:
 *   - TypeError: Cannot read properties of undefined (reading 'length')
 *   - Terjadi ketika login_employees dari Inertia props berisi record
 *     dengan pin: null (karyawan baru yang belum diset PIN-nya).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mock semua dependency eksternal ────────────────────────────────────────

// Mock @inertiajs/react — usePage dan Head
vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
    router: { post: vi.fn() },
    usePage: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    ChefHat: () => <svg data-testid="icon-chef-hat" />,
    Delete: () => <svg data-testid="icon-delete" />,
    ArrowRight: () => <svg data-testid="icon-arrow-right" />,
}));

// Mock Shared components & utilities
vi.mock('../../Components/Shared', () => ({
    RestokuLogo: () => <svg data-testid="restoku-logo" />,
    verifyPin: vi.fn(async () => false),
    DEFAULT_EMPLOYEES: [
        { id: '1', name: 'BUDI HARTONO', role: 'kasir', pin: '123456' },
        { id: '2', name: 'DEDI CAHYONO', role: 'kitchen', pin: '111111' },
        { id: '3', name: 'SARI PERTIWI', role: 'waiter', pin: '654321' },
        { id: '4', name: 'AGUS SETIAWAN', role: 'manager', pin: '999999' },
    ],
}));

// ─── Import komponen setelah semua mock siap ─────────────────────────────────
import { usePage } from '@inertiajs/react';
import StaffLogin from '../Pages/Auth/StaffLogin';

// ─── Helper: atur mock usePage dengan data tertentu ─────────────────────────
function setupUsePage(login_employees: any) {
    (usePage as any).mockReturnValue({
        props: { login_employees },
    });
}

// ─── Mock localStorage ───────────────────────────────────────────────────────
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── Test Suites ─────────────────────────────────────────────────────────────

describe('StaffLogin — null-safety & rendering', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    // ────────────────────────────────────────────────────────────────────────
    // KELOMPOK A: Skenario data yang bermasalah — semua harus TIDAK CRASH
    // ────────────────────────────────────────────────────────────────────────

    it('A1 — tidak crash ketika login_employees adalah null', () => {
        setupUsePage(null);
        expect(() => render(<StaffLogin />)).not.toThrow();
    });

    it('A2 — tidak crash ketika login_employees adalah undefined', () => {
        setupUsePage(undefined);
        expect(() => render(<StaffLogin />)).not.toThrow();
    });

    it('A3 — tidak crash ketika login_employees adalah array kosong', () => {
        setupUsePage([]);
        expect(() => render(<StaffLogin />)).not.toThrow();
    });

    it('A4 — tidak crash ketika login_employees mengandung record dengan pin: null', () => {
        setupUsePage([
            { id: '10', name: 'KARYAWAN BARU', role: 'kasir', pin: null },
            { id: '11', name: 'KARYAWAN LAMA', role: 'kitchen', pin: '654321' },
        ]);
        expect(() => render(<StaffLogin />)).not.toThrow();
    });

    it('A5 — tidak crash ketika login_employees mengandung record dengan pin: undefined', () => {
        setupUsePage([{ id: '12', name: 'NO PIN USER', role: 'waiter', pin: undefined }]);
        expect(() => render(<StaffLogin />)).not.toThrow();
    });

    it('A6 — tidak crash ketika login_employees mengandung record dengan pin: "" (string kosong)', () => {
        setupUsePage([{ id: '13', name: 'EMPTY PIN USER', role: 'kasir', pin: '' }]);
        expect(() => render(<StaffLogin />)).not.toThrow();
    });

    it('A7 — tidak crash ketika login_employees bukan array (misalnya object atau string)', () => {
        setupUsePage('invalid_data' as any);
        expect(() => render(<StaffLogin />)).not.toThrow();
    });

    it('A8 — tidak crash ketika semua record di login_employees memiliki pin: null', () => {
        setupUsePage([
            { id: '1', name: 'A', role: 'kasir', pin: null },
            { id: '2', name: 'B', role: 'kitchen', pin: null },
        ]);
        expect(() => render(<StaffLogin />)).not.toThrow();
    });

    // ────────────────────────────────────────────────────────────────────────
    // KELOMPOK B: Data normal — render harus benar
    // ────────────────────────────────────────────────────────────────────────

    it('B1 — merender "Masukkan PIN" ketika data karyawan valid', () => {
        setupUsePage([{ id: '1', name: 'BUDI', role: 'kasir', pin: '123456' }]);
        render(<StaffLogin />);
        expect(screen.getByText('Masukkan PIN')).toBeInTheDocument();
    });

    it('B2 — merender numpad 0-9', () => {
        setupUsePage([{ id: '1', name: 'BUDI', role: 'kasir', pin: '123456' }]);
        render(<StaffLogin />);
        // Tombol 1 sampai 9 harus ada
        for (let i = 1; i <= 9; i++) {
            expect(screen.getByText(i.toString())).toBeInTheDocument();
        }
        // Tombol 0 juga harus ada
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('B3 — menampilkan PIN bcrypt hash sebagai "******"', () => {
        // bcrypt hash adalah 60 karakter, SHA256 adalah 64 karakter
        // Komponen cek pin.length === 64 — test menggunakan SHA256-style hash
        const sha256Hash = 'a'.repeat(64); // 64 karakter = terdeteksi sebagai hash
        setupUsePage([{ id: '1', name: 'BUDI', role: 'kasir', pin: sha256Hash }]);
        const { container } = render(<StaffLogin />);
        // PIN hash (64 char) ditampilkan sebagai bintang — cek di textContent keseluruhan
        expect(container.textContent).toContain('******');
    });

    it('B4 — menampilkan PIN plaintext apa adanya', () => {
        setupUsePage([{ id: '1', name: 'BUDI', role: 'kasir', pin: '123456' }]);
        render(<StaffLogin />);
        // PIN plaintext harus muncul di halaman
        expect(screen.getByText(/123456/)).toBeInTheDocument();
    });

    it('B5 — fallback ke DEFAULT_EMPLOYEES ketika login_employees null', () => {
        setupUsePage(null);
        render(<StaffLogin />);
        // DEFAULT_EMPLOYEES memiliki role 'kasir' yang harus muncul
        const kasirEls = screen.getAllByText(/kasir/i);
        expect(kasirEls.length).toBeGreaterThan(0);
    });

    // ────────────────────────────────────────────────────────────────────────
    // KELOMPOK C: Skenario filterValid — hanya karyawan dengan PIN valid yang dipakai
    // ────────────────────────────────────────────────────────────────────────

    it('C1 — memfilter karyawan dengan pin null, hanya render yang valid', () => {
        setupUsePage([
            { id: '1', name: 'INVALID', role: 'kasir', pin: null },
            { id: '2', name: 'VALID', role: 'kitchen', pin: '111111' },
        ]);
        // Tidak boleh crash — ini yang paling penting
        expect(() => render(<StaffLogin />)).not.toThrow();
        // PIN yang valid harus muncul
        expect(screen.getByText(/111111/)).toBeInTheDocument();
    });

    it('C2 — semua null-pin → fallback ke DEFAULT_EMPLOYEES', () => {
        setupUsePage([
            { id: '1', name: 'A', role: 'kasir', pin: null },
            { id: '2', name: 'B', role: 'kitchen', pin: null },
        ]);
        // Tidak boleh crash — fallback ke DEFAULT_EMPLOYEES
        expect(() => render(<StaffLogin />)).not.toThrow();
        // DEFAULT_EMPLOYEES memiliki role kasir/kitchen/waiter/manager
        const roleEls = screen.getAllByText(/kasir|kitchen|waiter|manager/i);
        expect(roleEls.length).toBeGreaterThan(0);
    });
});
