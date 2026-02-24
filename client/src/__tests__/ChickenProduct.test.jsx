import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ChickenProduct from '../components/ChickenProduct';

// Mock zustand stores
jest.mock('../store/useCartStore', () => ({
    __esModule: true,
    default: () => ({
        addItem: jest.fn(),
        removeItem: jest.fn(),
        getItemCount: jest.fn(() => 0)
    })
}));

jest.mock('../store/useAuthStore', () => ({
    __esModule: true,
    default: () => ({
        user: null
    })
}));

describe('ChickenProduct Component', () => {
    const mockProduct = {
        _id: '123',
        name: 'Chicken Breast Boneless',
        image: 'https://example.com/chicken.jpg',
        images: [
            'https://example.com/chicken1.jpg',
            'https://example.com/chicken2.jpg',
            'https://example.com/chicken3.jpg'
        ],
        deliveryTime: 20,
        variants: [
            {
                _id: 'v1',
                weight: '500g',
                price: 250,
                marketPrice: 300,
                inStock: true,
                bestValue: false
            },
            {
                _id: 'v2',
                weight: '1kg',
                price: 480,
                marketPrice: 600,
                inStock: true,
                bestValue: true
            }
        ]
    };

    const mockOnShowVariations = jest.fn();

    it('should render product card', () => {
        render(
            <BrowserRouter>
                <ChickenProduct 
                    product={mockProduct}
                    onShowVariations={mockOnShowVariations}
                />
            </BrowserRouter>
        );

        expect(screen.getByText('Chicken Breast Boneless')).toBeInTheDocument();
        expect(screen.getByText('20 mins')).toBeInTheDocument();
    });

    it('should show discount badge', () => {
        render(
            <BrowserRouter>
                <ChickenProduct 
                    product={mockProduct}
                    onShowVariations={mockOnShowVariations}
                />
            </BrowserRouter>
        );

        // Discount = (300-250)/300 * 100 = 16.67% ≈ 17%
        expect(screen.getByText(/17% OFF/)).toBeInTheDocument();
    });

    it('should show best value badge for variant', () => {
        render(
            <BrowserRouter>
                <ChickenProduct 
                    product={mockProduct}
                    onShowVariations={mockOnShowVariations}
                />
            </BrowserRouter>
        );

        const variantButton = screen.getByText('1kg');
        fireEvent.click(variantButton);

        expect(screen.getByText('BEST VALUE')).toBeInTheDocument();
    });

    it('should show all variants', () => {
        render(
            <BrowserRouter>
                <ChickenProduct 
                    product={mockProduct}
                    onShowVariations={mockOnShowVariations}
                />
            </BrowserRouter>
        );

        expect(screen.getByText('500g')).toBeInTheDocument();
        expect(screen.getByText('1kg')).toBeInTheDocument();
    });

    it('should switch variants on click', () => {
        render(
            <BrowserRouter>
                <ChickenProduct 
                    product={mockProduct}
                    onShowVariations={mockOnShowVariations}
                />
            </BrowserRouter>
        );

        // Initially shows first variant price
        expect(screen.getByText('₹250')).toBeInTheDocument();

        // Click second variant
        const variantButton = screen.getByText('1kg');
        fireEvent.click(variantButton);

        // Should show second variant price
        expect(screen.getByText('₹480')).toBeInTheDocument();
    });

    it('should show ADD button when count is 0', () => {
        render(
            <BrowserRouter>
                <ChickenProduct 
                    product={mockProduct}
                    onShowVariations={mockOnShowVariations}
                />
            </BrowserRouter>
        );

        expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('should show market price with strikethrough', () => {
        const { container } = render(
            <BrowserRouter>
                <ChickenProduct 
                    product={mockProduct}
                    onShowVariations={mockOnShowVariations}
                />
            </BrowserRouter>
        );

        const strikethrough = container.querySelector('.line-through');
        expect(strikethrough).toHaveTextContent('₹300');
    });

    it('should render product image carousel', () => {
        const { container } = render(
            <BrowserRouter>
                <ChickenProduct 
                    product={mockProduct}
                    onShowVariations={mockOnShowVariations}
                />
            </BrowserRouter>
        );

        const images = container.querySelectorAll('img');
        expect(images.length).toBeGreaterThan(0);
    });

    it('should link to product detail page', () => {
        const { container } = render(
            <BrowserRouter>
                <ChickenProduct 
                    product={mockProduct}
                    onShowVariations={mockOnShowVariations}
                />
            </BrowserRouter>
        );

        const links = container.querySelectorAll('a[href="/product/123"]');
        expect(links.length).toBeGreaterThan(0);
    });
});
