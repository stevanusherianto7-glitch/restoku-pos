import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

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
vi.mock('../Components/POS/GeminiCopilotWidget', () => ({ default: () => null }));
vi.mock('../Hooks/useSubscription', () => ({
    useSubscription: () => ({ isLocked: () => false, featureLocks: {} }),
}));

import GoogleReviews from '../Pages/Owner/GoogleReviews';

const reviewsFixture = [
    {
        id: 1,
        reviewer_name: 'Budi',
        reviewer_photo: null,
        rating: 5,
        comment: 'Enak',
        reply_text: null,
        replied_at: null,
        reviewed_at: '2026-01-01',
    },
    {
        id: 2,
        reviewer_name: 'Sari',
        reviewer_photo: null,
        rating: 2,
        comment: 'Lama',
        reply_text: 'Maaf',
        replied_at: '2026-01-02',
        reviewed_at: '2026-01-01',
    },
];

// mock fetch factory — tiap test bisa override behaviour
const makeFetch = (impl: (url: string) => any) =>
    vi.fn((input: any) => {
        const url = String(input);
        if (url.includes('/api/reservations')) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        return impl(url);
    }) as any;

const reviewsSuccess = (reviews: any[] = reviewsFixture) => ({
    ok: true,
    json: () => Promise.resolve({ status: 'success', reviews }),
});

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
    mockUseTenantSettings.mockReturnValue({ screenMode: 'default' });
    mockUsePage.mockImplementation(() => ({
        props: { auth: { user: { role: 'owner', name: 'Owner' } } },
    }));
});

afterEach(() => {
    vi.useRealTimers();
});

describe('Owner/GoogleReviews — smoke', () => {
    it('renders and loads reviews', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch(() => reviewsSuccess()),
        );
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
        expect(screen.getByText('Sari')).toBeInTheDocument();
    });

    it('filters complaints', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch(() => reviewsSuccess()),
        );
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Komplain/i));
        expect(screen.queryByText('Budi')).not.toBeInTheDocument();
        expect(screen.getByText('Sari')).toBeInTheDocument();
    });

    it('extracts REAL Place ID (hex) from Maps URL — no fake ChIJ', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch(() => reviewsSuccess([])),
        );
        render(<GoogleReviews />);
        fireEvent.click(screen.getByText(/Pengaturan GBP/i));
        fireEvent.click(screen.getByText(/Tempel Link Maps/i));
        const urlInput = screen.getByPlaceholderText(/Tempel tautan Google Maps/i);
        fireEvent.change(urlInput, {
            target: { value: 'https://maps.google.com/maps/place/x/@1s0x2e68dd612d0f5c99:0x9f13c4b77ce33cf' },
        });
        fireEvent.click(screen.getByText(/Ekstrak Place ID dari Tautan/i));
        // Kode baru menyimpan hex asli, BUKAN ChIJ palsu (bug lama).
        const placeInput = await screen.findByDisplayValue(/^0x2e68dd612d0f5c99:0x9f13c4b77ce33cf$/);
        expect(placeInput).toBeInTheDocument();
        // Tidak boleh ada nilai ChIJ palsu.
        expect(screen.queryByDisplayValue(/^ChIJ/i)).not.toBeInTheDocument();
    });

    it('shows demo banner when not connected to GBP (transparent, not silent)', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch((url: string) => {
                if (url.includes('/api/google-reviews/sync')) {
                    return Promise.resolve({
                        ok: true,
                        json: () =>
                            Promise.resolve({
                                status: 'demo',
                                connected: false,
                                message:
                                    'Menampilkan data contoh. Hubungkan Google Business Profile untuk ulasan sungguhan.',
                                reviews: reviewsFixture,
                            }),
                    });
                }
                return reviewsSuccess();
            }),
        );
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Sinkronkan Ulasan/i));
        await waitFor(() =>
            expect(screen.getByText(/Hubungkan Google Business Profile untuk ulasan sungguhan/i)).toBeInTheDocument(),
        );
        // Tombol "Hubungkan GBP" harus tampil (belum connected).
        expect(screen.getByText(/Hubungkan GBP/i)).toBeInTheDocument();
    });

    it('shows connected badge after live sync', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch((url: string) => {
                if (url.includes('/api/google-reviews/sync')) {
                    return Promise.resolve({
                        ok: true,
                        json: () =>
                            Promise.resolve({
                                status: 'success',
                                connected: true,
                                message: 'OK',
                                reviews: reviewsFixture,
                            }),
                    });
                }
                return reviewsSuccess();
            }),
        );
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Sinkronkan Ulasan/i));
        await waitFor(() => expect(screen.getByText(/Terhubung GBP/i)).toBeInTheDocument());
    });

    it('opens settings panel', () => {
        vi.stubGlobal(
            'fetch',
            makeFetch(() => reviewsSuccess([])),
        );
        render(<GoogleReviews />);
        fireEvent.click(screen.getByText(/Pengaturan GBP/i));
        expect(screen.getAllByText(/Place ID|API Key|API/i).length).toBeGreaterThan(0);
    });
});

describe('Owner/GoogleReviews — robustness (real, not claims)', () => {
    it('polls automatically (real-time) without user action', async () => {
        const fetchMock = makeFetch(() => reviewsSuccess());
        vi.stubGlobal('fetch', fetchMock);
        vi.useFakeTimers();
        render(<GoogleReviews />);
        // mount fetch
        await act(async () => {
            await Promise.resolve();
        });
        const callsAfterMount = fetchMock.mock.calls.length;
        expect(callsAfterMount).toBeGreaterThanOrEqual(1);
        // advance 30s -> interval harus trigger fetch lagi
        await act(async () => {
            vi.advanceTimersByTime(30000);
            await Promise.resolve();
        });
        expect(fetchMock.mock.calls.length).toBeGreaterThan(callsAfterMount);
        vi.useRealTimers();
    });

    it('shows error banner when reviews API fails (not silent)', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch(() =>
                Promise.resolve({
                    ok: false,
                    status: 500,
                    json: () => Promise.resolve({ status: 'error', message: 'Server down' }),
                }),
            ),
        );
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText(/Server down/)).toBeInTheDocument());
        expect(screen.getByText(/Coba Lagi/)).toBeInTheDocument();
    });

    it('retry button re-fetches after error', async () => {
        let fail = true;
        const fetchMock = makeFetch(() => {
            if (fail)
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: () => Promise.resolve({ status: 'error', message: 'Server down' }),
                });
            return reviewsSuccess();
        });
        vi.stubGlobal('fetch', fetchMock);
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText(/Server down/)).toBeInTheDocument());
        fail = false;
        fireEvent.click(screen.getByText(/Coba Lagi/));
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
    });

    it('surfaces AI failure transparently (no silent fallback)', async () => {
        const fetchMock = makeFetch((url: string) => {
            if (url.includes('/generate-ai-reply')) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({ status: 'error', message: 'AI gagal membuat balasan. Tulis manual.' }),
                });
            }
            return reviewsSuccess();
        });
        vi.stubGlobal('fetch', fetchMock);
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
        // buka draft balasan untuk Budi (belum dibalas)
        fireEvent.click(screen.getByText(/Balas Manual/i));
        fireEvent.click(screen.getByText(/Auto Balas dengan AI/i));
        await waitFor(() => expect(screen.getByText(/AI gagal membuat balasan\. Tulis manual\./)).toBeInTheDocument());
    });

    it('surfaces reply submit failure transparently', async () => {
        const fetchMock = makeFetch((url: string) => {
            if (url.includes('/reply')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ status: 'error', message: 'Gagal mengirim balasan.' }),
                });
            }
            return reviewsSuccess();
        });
        vi.stubGlobal('fetch', fetchMock);
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Balas Manual/i));
        const ta = screen.getByPlaceholderText(/Tuliskan pesan balasan/i);
        fireEvent.change(ta, { target: { value: 'Terima kasih!' } });
        fireEvent.click(screen.getByText(/Kirim Balasan/i));
        await waitFor(() => expect(screen.getByText(/Gagal mengirim balasan\./)).toBeInTheDocument());
    });
});
