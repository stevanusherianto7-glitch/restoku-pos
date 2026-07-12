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

const fixtureUnreplied = [
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
];
const fixtureReplied = [
    {
        id: 3,
        reviewer_name: 'Joko',
        reviewer_photo: null,
        rating: 2,
        comment: 'Lama',
        reply_text: 'Maaf',
        replied_at: '2026-01-03',
        reviewed_at: '2026-01-03',
    },
    {
        id: 2,
        reviewer_name: 'Sari',
        reviewer_photo: null,
        rating: 4,
        comment: 'Oke',
        reply_text: 'Maaf',
        replied_at: '2026-01-02',
        reviewed_at: '2026-01-01',
    },
];

// mock fetch factory — tiap test bisa override behaviour
const makeFetch = (impl: (url: string, opts?: any) => any) =>
    vi.fn((input: any, opts?: any) => {
        const url = String(input);
        if (url.includes('/api/reservations')) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        return impl(url, opts);
    }) as any;

const placesSuccess = (unreplied = fixtureUnreplied, replied = fixtureReplied) => ({
    ok: true,
    json: () =>
        Promise.resolve({
            status: 'success',
            source: 'places',
            place_id: 'ChIJabc123',
            unreplied,
            replied,
        }),
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

describe('Owner/GoogleReviews — smoke (Places API pivot)', () => {
    it('renders only unreplied by default, then shows all', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch(() => placesSuccess()),
        );
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
        // Default filter = "Belum Dibalas" → yang sudah dibalas (Sari, Joko) disembunyikan.
        expect(screen.queryByText('Sari')).not.toBeInTheDocument();
        expect(screen.queryByText('Joko')).not.toBeInTheDocument();
        // Beralih ke status "Sudah Dibalas" menampilkan Sari & Joko.
        fireEvent.click(screen.getByText(/Sudah Dibalas/i));
        expect(screen.getByText('Sari')).toBeInTheDocument();
        expect(screen.getByText('Joko')).toBeInTheDocument();
        // Kembali ke "Belum Dibalas".
        fireEvent.click(screen.getByText(/Belum Dibalas/i));
        expect(screen.queryByText('Sari')).not.toBeInTheDocument();
    });

    it('shows "Real-time • Places API" badge when connected via Places', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch(() => placesSuccess()),
        );
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText(/Real-time • Places API/i)).toBeInTheDocument());
    });

    it('shows "Belum terhubung" when no place_id (local only)', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch(() =>
                Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            status: 'none',
                            source: 'local',
                            place_id: null,
                            unreplied: [],
                            replied: [],
                        }),
                }),
            ),
        );
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText(/Belum terhubung/i)).toBeInTheDocument());
    });

    it('opens "Hubungkan Maps" modal with link textarea', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch(() => placesSuccess([], [])),
        );
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText(/Hubungkan Maps/i)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Hubungkan Maps/i));
        expect(screen.getByPlaceholderText(/google\.com\/maps/i)).toBeInTheDocument();
    });

    it('saves Maps link (coordinate @lat,lng) → posts google_place_link', async () => {
        const fetchMock = makeFetch((url: string, opts?: any) => {
            if (url.includes('/api/google-reviews/settings') && opts?.body) {
                const body = JSON.parse(opts.body);
                // BE akan resolve @lat,lng → Place ID. FE cukup kirim link mentah.
                expect(body.google_place_link).toContain('@-6.2,106.8');
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ status: 'success', place_id: 'ChIJresolved' }),
                });
            }
            return placesSuccess([], []);
        });
        vi.stubGlobal('fetch', fetchMock);
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText(/Hubungkan Maps/i)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Hubungkan Maps/i));
        const ta = screen.getByPlaceholderText(/google\.com\/maps/i);
        fireEvent.change(ta, {
            target: { value: 'https://www.google.com/maps/place/Resto/@-6.2,106.8,17z' },
        });
        fireEvent.click(screen.getByText(/Simpan/i));
        await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2));
    });

    it('shows settings error when link unrecognized', async () => {
        vi.stubGlobal(
            'fetch',
            makeFetch((url: string, opts?: any) => {
                if (url.includes('/api/google-reviews/settings')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ status: 'error', message: 'Link tidak dikenali.' }),
                    });
                }
                return placesSuccess([], []);
            }),
        );
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText(/Hubungkan Maps/i)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Hubungkan Maps/i));
        const ta = screen.getByPlaceholderText(/google\.com\/maps/i);
        fireEvent.change(ta, { target: { value: 'bukan link' } });
        fireEvent.click(screen.getByText(/Simpan/i));
        await waitFor(() => expect(screen.getByText(/Link tidak dikenali/i)).toBeInTheDocument());
    });
});

describe('Owner/GoogleReviews — robustness (real, not claims)', () => {
    it('polls automatically (real-time) without user action', async () => {
        const fetchMock = makeFetch(() => placesSuccess());
        vi.stubGlobal('fetch', fetchMock);
        vi.useFakeTimers();
        render(<GoogleReviews />);
        await act(async () => {
            await Promise.resolve();
        });
        const callsAfterMount = fetchMock.mock.calls.length;
        expect(callsAfterMount).toBeGreaterThanOrEqual(1);
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
            return placesSuccess();
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
            return placesSuccess();
        });
        vi.stubGlobal('fetch', fetchMock);
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Balas Manual/i));
        fireEvent.click(screen.getByText(/Auto Balas dengan AI/i));
        await waitFor(() => expect(screen.getByText(/AI gagal membuat balasan\. Tulis manual\./)).toBeInTheDocument());
    });

    it('surfaces reply submit failure transparently', async () => {
        const fetchMock = makeFetch((url: string) => {
            if (url.includes('/reply')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ status: 'error', message: 'Gagal menyimpan balasan.' }),
                });
            }
            return placesSuccess();
        });
        vi.stubGlobal('fetch', fetchMock);
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Balas Manual/i));
        const ta = screen.getByPlaceholderText(/Tuliskan pesan balasan/i);
        fireEvent.change(ta, { target: { value: 'Terima kasih!' } });
        fireEvent.click(screen.getByText(/Kirim Balasan/i));
        await waitFor(() => expect(screen.getByText(/Gagal menyimpan balasan\./)).toBeInTheDocument());
    });

    it('copy reply button does not crash when clipboard unavailable', async () => {
        const fetchMock = makeFetch(() => placesSuccess());
        vi.stubGlobal('fetch', fetchMock);
        render(<GoogleReviews />);
        await waitFor(() => expect(screen.getByText('Budi')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Balas Manual/i));
        const ta = screen.getByPlaceholderText(/Tuliskan pesan balasan/i);
        fireEvent.change(ta, { target: { value: 'Terima kasih!' } });
        // navigator.clipboard mungkin undefined di jsdom → copyReply menangkap error.
        fireEvent.click(screen.getByText(/Salin Balasan/i));
        // Tidak boleh throw; draft tetap utuh.
        expect(screen.getByText(/Salin Balasan/i)).toBeInTheDocument();
    });
});
