import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DailyPinBadge from '../Components/DailyPinBadge';

const fetchMock = vi.fn();

describe('DailyPinBadge', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        (global as any).fetch = fetchMock;
    });

    it('shows loading placeholder before fetch resolves', () => {
        fetchMock.mockImplementation(() => new Promise(() => {}));
        render(<DailyPinBadge />);
        expect(screen.getByText('····')).toBeInTheDocument();
    });

    it('renders PIN from /owner/outlet/daily-pin', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ pin: '4271' }),
        });
        const { container } = render(<DailyPinBadge />);
        await waitFor(() => expect(container.textContent).toContain('4271'), { timeout: 2000 });
        expect(screen.getByText('PIN')).toBeInTheDocument();
    });

    it('shows error state when fetch fails', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 404 });
        render(<DailyPinBadge />);
        await waitFor(() => expect(screen.getByTitle('Gagal memuat PIN harian')).toBeInTheDocument(), {
            timeout: 2000,
        });
    });
});
