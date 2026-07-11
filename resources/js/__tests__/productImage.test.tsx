import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductImage } from '../Components/ProductImage';

describe('ProductImage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders an img with src when provided', () => {
        render(<ProductImage src="https://x.com/a.jpg" alt="Ayam" />);
        const img = screen.getByAltText('Ayam') as HTMLImageElement;
        expect(img.tagName).toBe('IMG');
        expect(img.getAttribute('src')).toBe('https://x.com/a.jpg');
    });

    it('falls back to icon when src is null', () => {
        render(<ProductImage src={null} alt="Kosong" />);
        expect(screen.getByTestId('fallback-icon')).toBeTruthy();
        expect(screen.queryByRole('img')).toBeNull();
    });

    it('falls back to icon when src empty string', () => {
        render(<ProductImage src="" alt="Kosong2" />);
        expect(screen.getByTestId('fallback-icon')).toBeTruthy();
    });

    it('falls back when image fails to load', () => {
        render(<ProductImage src="https://broken" alt="Broken" />);
        const img = screen.getByAltText('Broken') as HTMLImageElement;
        // simulate load error
        fireEvent.error(img);
        expect(screen.getByTestId('fallback-icon')).toBeTruthy();
    });

    it('applies variant size classes', () => {
        render(<ProductImage src="x" alt="S" variant="small" />);
        expect(screen.getByAltText('S').className).toContain('size-16');
    });

    it('applies custom className', () => {
        render(<ProductImage src="x" alt="C" className="custom-c" />);
        expect(screen.getByAltText('C').className).toContain('custom-c');
    });
});
