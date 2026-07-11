import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge, toneMap, cardToneMap } from '../Components/shared/Badge';
import { Button } from '../Components/shared/Button';
import { ErrorBoundary } from '../Components/shared/ErrorBoundary';
import { Glass } from '../Components/shared/Glass';
import { Input } from '../Components/shared/Input';
import { Screen } from '../Components/shared/Screen';

// useTenantSettings reads screenMode from localStorage('outlet_screen_mode'),
// so we drive it via localStorage (tests the real component, no mock needed).
const setMode = (mode: string) => {
    localStorage.setItem('outlet_screen_mode', mode);
};

// Screen uses usePage() from @inertiajs/react — mock that (node_modules mock injects).
const { mockUsePage } = vi.hoisted(() => ({
    mockUsePage: vi.fn(),
}));
mockUsePage.mockReturnValue({ props: { outlet: { name: 'Pawon Salam' } } });

vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        usePage: mockUsePage,
    };
});

const setOutlet = (name: string) => {
    mockUsePage.mockReturnValue({ props: { outlet: { name } } });
};

beforeEach(() => {
    localStorage.clear();
    setMode('gelap');
    setOutlet('Cabang A');
});

describe('Badge', () => {
    it('renders children with default emerald tone', () => {
        render(<Badge>Live</Badge>);
        const el = screen.getByText('Live');
        expect(el.tagName).toBe('SPAN');
        expect(el.className).toContain('border-emerald');
    });

    it('applies tone class and dot', () => {
        render(
            <Badge tone="red" dot>
                X
            </Badge>,
        );
        const el = screen.getByText('X');
        expect(el.className).toContain('border-red');
        expect(el.querySelector('span')).toBeTruthy();
    });

    it('uses light tone map in terang mode', () => {
        setMode('terang');
        render(<Badge tone="blue">B</Badge>);
        expect(screen.getByText('B').className).toContain('bg-blue-100');
    });

    it('exposes tone maps', () => {
        expect(toneMap.blue).toContain('blue');
        expect(cardToneMap.emerald).toContain('emerald');
    });
});

describe('Button', () => {
    it('renders children and handles click', () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Go</Button>);
        fireEvent.click(screen.getByText('Go'));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('applies variant and size classes', () => {
        render(
            <Button variant="danger" size="lg">
                D
            </Button>,
        );
        const btn = screen.getByText('D');
        expect(btn.className).toContain('bg-red-600');
        expect(btn.className).toContain('h-12');
    });

    it('shows spinner when isLoading and is disabled', () => {
        render(<Button isLoading>Loading</Button>);
        const btn = screen.getByRole('button');
        expect(btn.disabled).toBe(true);
        expect(btn.querySelector('span')).toBeTruthy();
    });

    it('is disabled when disabled prop set', () => {
        render(<Button disabled>Off</Button>);
        expect((screen.getByText('Off') as HTMLButtonElement).disabled).toBe(true);
    });

    it('uses dark variant in gelap mode', () => {
        setMode('gelap');
        render(<Button variant="default">D</Button>);
        expect(screen.getByText('D').className).toContain('bg-emerald-600');
    });

    it('uses light variant in terang mode', () => {
        setMode('terang');
        render(<Button variant="default">L</Button>);
        expect(screen.getByText('L').className).toContain('bg-slate-900');
    });
});

describe('Glass', () => {
    it('renders children with base glass classes', () => {
        render(<Glass>box</Glass>);
        expect(screen.getByText('box').className).toContain('rounded-3xl');
    });

    it('applies light mode classes', () => {
        setMode('terang');
        render(<Glass>box</Glass>);
        expect(screen.getByText('box').className).toContain('bg-white/95');
    });

    it('applies glassmorphic and nano-banana classes', () => {
        setMode('glassmorphic');
        render(<Glass>gm</Glass>);
        expect(screen.getByText('gm').className).toContain('border-white/[0.15]');
        setMode('nano-banana');
        render(<Glass>nb</Glass>);
        expect(screen.getByText('nb').className).toContain('border-amber-500/25');
        expect(screen.getByText('nb').className).toContain('amber-500');
    });

    it('adds hover classes when hover prop set', () => {
        render(<Glass hover>x</Glass>);
        expect(screen.getByText('x').className).toContain('hover:');
    });

    it('merges custom className', () => {
        render(<Glass className="custom">y</Glass>);
        expect(screen.getByText('y').className).toContain('custom');
    });
});

describe('Input', () => {
    it('renders label and input', () => {
        render(<Input label="Nama" />);
        expect(screen.getByText('Nama')).toBeTruthy();
        expect(screen.getByLabelText('Nama')).toBeTruthy();
    });

    it('shows error state', () => {
        render(<Input label="Email" error="Wajib" />);
        expect(screen.getByText('Wajib')).toBeTruthy();
        expect(screen.getByLabelText('Email').className).toContain('border-red');
    });

    it('shows hint when no error', () => {
        render(<Input label="Pin" hint="6 digit" />);
        expect(screen.getByText('6 digit')).toBeTruthy();
    });

    it('uses light mode classes', () => {
        setMode('terang');
        render(<Input label="X" />);
        expect(screen.getByLabelText('X').className).toContain('bg-white');
    });

    it('shows required asterisk', () => {
        render(<Input label="Y" required />);
        expect(screen.getByText('*')).toBeTruthy();
    });
});

describe('Screen', () => {
    it('renders title, default subtitle with outlet, and children', () => {
        setOutlet('Cabang A');
        render(
            <Screen title="Kasir">
                <div>content</div>
            </Screen>,
        );
        expect(screen.getByText('Kasir')).toBeTruthy();
        expect(screen.getByText(/Cabang A/)).toBeTruthy();
        expect(screen.getByText('content')).toBeTruthy();
    });

    it('renders custom subtitle when provided', () => {
        render(
            <Screen title="X" subtitle="sub">
                kid
            </Screen>,
        );
        expect(screen.getByText('sub')).toBeTruthy();
    });

    it('renders single action when provided', () => {
        render(
            <Screen title="T" action={<button>A</button>}>
                c
            </Screen>,
        );
        expect(screen.getByText('A')).toBeTruthy();
    });

    it('renders actions (multiple) and ignores action when both present', () => {
        render(
            <Screen title="T" action={<button>A</button>} actions={<span>B</span>}>
                c
            </Screen>,
        );
        expect(screen.getByText('B')).toBeTruthy();
        // Per Screen implementation: `actions || action` — when actions exists, action is dropped.
        expect(screen.queryByText('A')).toBeNull();
    });

    it('applies noPadding and noScroll modifiers', () => {
        const { rerender } = render(
            <Screen title="T" noPadding noScroll>
                c
            </Screen>,
        );
        expect(screen.getByText('T').className).toContain('truncate');
        rerender(<Screen title="T">c</Screen>);
    });

    it('uses light mode for title', () => {
        setOutlet('Cabang A');
        setMode('terang');
        render(<Screen title="Light">c</Screen>);
        expect(screen.getByText('Light').className).toContain('text-slate-900');
    });
});

describe('ErrorBoundary', () => {
    const Boom = () => {
        throw new Error('boom');
    };

    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div>safe</div>
            </ErrorBoundary>,
        );
        expect(screen.getByText('safe')).toBeTruthy();
    });

    it('renders fallback UI on error and resets', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Something went wrong')).toBeTruthy();
        fireEvent.click(screen.getByText('Coba Lagi'));
        spy.mockRestore();
    });

    it('uses custom fallback node', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary fallback={<div>custom fallback</div>}>
                <Boom />
            </ErrorBoundary>,
        );
        expect(screen.getByText('custom fallback')).toBeTruthy();
        spy.mockRestore();
    });
});
