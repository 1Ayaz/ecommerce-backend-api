import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ProductImageCarousel from '../components/ProductImageCarousel';

describe('ProductImageCarousel Component', () => {
    const mockImages = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image4.jpg'
    ];

    it('should render first image by default', () => {
        render(<ProductImageCarousel images={mockImages} alt="Test Product" />);
        const image = screen.getByAlt('Test Product - Image 1');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', mockImages[0]);
    });

    it('should show dot indicators for multiple images', () => {
        const { container } = render(<ProductImageCarousel images={mockImages} alt="Test" />);
        const dots = container.querySelectorAll('button[aria-label^="Go to image"]');
        expect(dots).toHaveLength(4);
    });

    it('should not show dots for single image', () => {
        const { container } = render(<ProductImageCarousel images={[mockImages[0]]} alt="Test" />);
        const dots = container.querySelectorAll('button[aria-label^="Go to image"]');
        expect(dots).toHaveLength(0);
    });

    it('should navigate to clicked dot image', () => {
        const { container } = render(<ProductImageCarousel images={mockImages} alt="Test Product" />);
        const dots = container.querySelectorAll('button[aria-label^="Go to image"]');

        fireEvent.click(dots[2]); // Click third dot

        const image = screen.getByAlt('Test Product - Image 3');
        expect(image).toHaveAttribute('src', mockImages[2]);
    });

    it('should handle empty images array', () => {
        const { container } = render(<ProductImageCarousel images={[]} alt="Test" />);
        const image = container.querySelector('img');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', expect.stringContaining('placehold'));
    });

    it('should show image counter on hover', async () => {
        const { container } = render(<ProductImageCarousel images={mockImages} alt="Test" />);
        const carousel = container.firstChild;

        fireEvent.mouseEnter(carousel);

        await waitFor(() => {
            expect(screen.getByText(/1\/4/)).toBeInTheDocument();
        });
    });

    it('should auto-cycle images on hover', async () => {
        jest.useFakeTimers();
        const { container } = render(<ProductImageCarousel images={mockImages} alt="Test Product" />);
        const carousel = container.firstChild;

        fireEvent.mouseEnter(carousel);

        // Wait for 1.5 seconds (carousel interval)
        jest.advanceTimersByTime(1500);

        await waitFor(() => {
            const image = screen.getByAlt('Test Product - Image 2');
            expect(image).toHaveAttribute('src', mockImages[1]);
        });

        jest.useRealTimers();
    });

    it('should reset to first image on mouse leave', async () => {
        jest.useFakeTimers();
        const { container } = render(<ProductImageCarousel images={mockImages} alt="Test Product" />);
        const carousel = container.firstChild;

        // Hover and cycle
        fireEvent.mouseEnter(carousel);
        jest.advanceTimersByTime(1500);

        // Leave
        fireEvent.mouseLeave(carousel);

        await waitFor(() => {
            const image = screen.getByAlt('Test Product - Image 1');
            expect(image).toHaveAttribute('src', mockImages[0]);
        });

        jest.useRealTimers();
    });
});
