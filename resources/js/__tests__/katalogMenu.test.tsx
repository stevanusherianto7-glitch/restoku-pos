import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KatalogMenu from '../Pages/KatalogMenu/Index';

// --- Mock @inertiajs/react ---
const mockUsePage = vi.hoisted(() => vi.fn());
const mockRouter = vi.hoisted(() => ({
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    reload: vi.fn(),
}));
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        usePage: mockUsePage,
        router: mockRouter,
    };
});

const sampleProps = {
    menuItems: [
        {
            id: 1,
            outlet_id: 1,
            menu_category_id: 1,
            name: 'Nasi Goreng',
            description: 'Enak',
            price: 25000,
            image_path: null,
            is_available: true,
            is_popular: true,
            sort_order: 1,
        },
        {
            id: 2,
            outlet_id: 1,
            menu_category_id: 2,
            name: 'Es Teh',
            description: null,
            price: 8000,
            image_path: null,
            is_available: false,
            is_popular: false,
            sort_order: 2,
        },
    ],
    outlets: [{ id: 1, name: 'Cabang A' }],
    categories: [
        { id: 1, name: 'Makanan' },
        { id: 2, name: 'Minuman' },
    ],
};

const setPage = () => {
    mockUsePage.mockImplementation(() => ({ props: { outlet: { name: 'Cabang A' } } }));
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setPage();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('KatalogMenu/Index', () => {
    it('renders title and menu items', () => {
        render(<KatalogMenu {...sampleProps} />);
        expect(screen.getByText('Katalog Menu (Mode Edit)')).toBeInTheDocument();
        expect(screen.getByText('Nasi Goreng')).toBeInTheDocument();
        expect(screen.getByText('Es Teh')).toBeInTheDocument();
        expect(screen.getByText('Habis')).toBeInTheDocument();
    });

    it('filters by category', () => {
        render(<KatalogMenu {...sampleProps} />);
        // chip filter "Minuman" adalah elemen pertama; kartu Es Teh juga punya badge "Minuman"
        const minumanChips = screen.getAllByText('Minuman');
        fireEvent.click(minumanChips[0]);
        expect(screen.getByText('Es Teh')).toBeInTheDocument();
        expect(screen.queryByText('Nasi Goreng')).not.toBeInTheDocument();
    });

    it('opens add form', () => {
        render(<KatalogMenu {...sampleProps} />);
        fireEvent.click(screen.getByText('Tambah Menu'));
        // Judul modal "Tambah Menu" muncul (berbeda dari tombol "Tambah Menu" di grid bawah)
        const headings = screen.getAllByText('Tambah Menu');
        expect(headings.length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText('Nama menu')).toBeInTheDocument();
    });

    it('opens edit form and calls router.put on save', () => {
        render(<KatalogMenu {...sampleProps} />);
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);
        expect(screen.getByText('Edit Menu')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Simpan'));
        expect(mockRouter.put).toHaveBeenCalledWith('/api/menu/1', expect.any(Object), expect.any(Object));
    });

    it('deletes item via router.delete', () => {
        render(<KatalogMenu {...sampleProps} />);
        const delButtons = screen.getAllByText('Hapus');
        fireEvent.click(delButtons[0]);
        expect(mockRouter.delete).toHaveBeenCalledWith('/api/menu/1', expect.any(Object));
    });
});
