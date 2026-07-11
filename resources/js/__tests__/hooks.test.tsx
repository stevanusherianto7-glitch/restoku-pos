import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from '../Hooks/useCart';
import { useSubscription } from '../Hooks/useSubscription';

// Hoisted mock — avoids vi.mock hoisting pitfall with a mutable outer var.
const { mockUsePage } = vi.hoisted(() => ({
    mockUsePage: vi.fn(),
}));

// Default return value (mockReturnValue so tests can override via setProps).
mockUsePage.mockReturnValue({ props: {} });

vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        usePage: mockUsePage,
    };
});

const setProps = (props: any) => {
    mockUsePage.mockImplementation(() => ({ props }));
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setProps({});
});

describe('useCart', () => {
    it('starts empty', () => {
        const { result } = renderHook(() => useCart());
        expect(result.current.items).toEqual([]);
        expect(result.current.itemCount).toBe(0);
        expect(result.current.subtotal).toBe(0);
    });

    it('adds new item and increments quantity for existing', () => {
        const { result } = renderHook(() => useCart());
        act(() => result.current.addItem({ id: 1, name: 'A', price: 1000, category: 'M' }));
        act(() => result.current.addItem({ id: 1, name: 'A', price: 1000, category: 'M' }));
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(2);
        expect(result.current.subtotal).toBe(2000);
        expect(result.current.itemCount).toBe(2);
    });

    it('removes items and updates quantity', () => {
        const { result } = renderHook(() => useCart());
        act(() => result.current.addItem({ id: 1, name: 'A', price: 1000, category: 'M' }));
        act(() => result.current.addItem({ id: 2, name: 'B', price: 500, category: 'M' }));
        act(() => result.current.removeItem(1));
        expect(result.current.items.map((i) => i.id)).toEqual([2]);
        act(() => result.current.updateQuantity(2, 3));
        expect(result.current.items[0].quantity).toBe(3);
    });

    it('removes item when quantity set to 0', () => {
        const { result } = renderHook(() => useCart());
        act(() => result.current.addItem({ id: 1, name: 'A', price: 1000, category: 'M' }));
        act(() => result.current.updateQuantity(1, 0));
        expect(result.current.items).toHaveLength(0);
    });

    it('updates notes', () => {
        const { result } = renderHook(() => useCart());
        act(() => result.current.addItem({ id: 1, name: 'A', price: 1000, category: 'M' }));
        act(() => result.current.updateNote(1, 'no spicy'));
        expect(result.current.items[0].note).toBe('no spicy');
    });

    it('applies percentage and nominal discounts', () => {
        const { result } = renderHook(() => useCart());
        act(() => result.current.addItem({ id: 1, name: 'A', price: 1000, category: 'M' }));
        act(() => result.current.setDiscount('percentage', 10));
        expect(result.current.discountAmount).toBe(100);
        expect(result.current.subtotalAfterDiscount).toBe(900);
        act(() => result.current.setDiscount('nominal', 250));
        expect(result.current.discountAmount).toBe(250);
        expect(result.current.subtotalAfterDiscount).toBe(750);
    });

    it('never lets discount go negative', () => {
        const { result } = renderHook(() => useCart());
        act(() => result.current.addItem({ id: 1, name: 'A', price: 100, category: 'M' }));
        act(() => result.current.setDiscount('nominal', 500));
        expect(result.current.subtotalAfterDiscount).toBe(0);
    });

    it('clears and loads cart', () => {
        const { result } = renderHook(() => useCart());
        act(() => result.current.addItem({ id: 1, name: 'A', price: 1000, category: 'M' }));
        act(() => result.current.clearCart());
        expect(result.current.items).toEqual([]);
        act(() => result.current.loadCartItems([{ id: 9, name: 'Z', price: 5, quantity: 1, note: '', category: 'X' }]));
        expect(result.current.items[0].id).toBe(9);
    });

    it('persists to localStorage', () => {
        const { result } = renderHook(() => useCart());
        act(() => result.current.addItem({ id: 1, name: 'A', price: 1000, category: 'M' }));
        const stored = JSON.parse(localStorage.getItem('restoku_cart') || '{}');
        expect(stored.items).toHaveLength(1);
    });
});

describe('useSubscription', () => {
    it('falls back to pro plan and active status', () => {
        setProps({ subscription: undefined });
        const { result } = renderHook(() => useSubscription());
        expect(result.current.plan).toBe('pro');
        expect(result.current.status).toBe('active');
        expect(result.current.isTrialing).toBe(false);
    });

    it('reads server subscription values', () => {
        setProps({
            subscription: {
                plan: 'enterprise',
                status: 'trialing',
                days_left: 7,
                plan_features: ['kds', 'white_label'],
                feature_locks: { X: { feature: 'kds' } },
            },
        });
        const { result } = renderHook(() => useSubscription());
        expect(result.current.plan).toBe('enterprise');
        expect(result.current.isTrialing).toBe(true);
        expect(result.current.daysLeft).toBe(7);
        expect(result.current.hasFeature('kds')).toBe(true);
        // isLocked = !hasFeature → white_label IS in plan_features, so it is NOT locked.
        expect(result.current.isLocked('white_label')).toBe(false);
        expect(result.current.isLocked('nonexistent_feature')).toBe(true);
        expect(result.current.featureLocks.X.feature).toBe('kds');
    });

    it('hasFeature false for missing feature', () => {
        setProps({ subscription: undefined });
        const { result } = renderHook(() => useSubscription());
        expect(result.current.hasFeature('nope')).toBe(false);
    });
});
