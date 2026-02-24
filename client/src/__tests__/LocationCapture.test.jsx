import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LocationCapture from '../components/LocationCapture';

describe('LocationCapture Component', () => {
    const mockOnLocationSet = jest.fn();
    const mockOnServiceUnavailable = jest.fn();
    const mockOnSkip = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render location modal', () => {
        render(
            <LocationCapture
                onLocationSet={mockOnLocationSet}
                onServiceUnavailable={mockOnServiceUnavailable}
                onSkip={mockOnSkip}
            />
        );

        expect(screen.getByText('Where do you want your order?')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your delivery address')).toBeInTheDocument();
    });

    it('should show close button', () => {
        const { container } = render(
            <LocationCapture
                onLocationSet={mockOnLocationSet}
                onServiceUnavailable={mockOnServiceUnavailable}
                onSkip={mockOnSkip}
            />
        );

        const closeButton = container.querySelector('button[aria-label="Skip location"]');
        expect(closeButton).toBeInTheDocument();
    });

    it('should call onSkip when close button clicked', () => {
        const { container } = render(
            <LocationCapture
                onLocationSet={mockOnLocationSet}
                onServiceUnavailable={mockOnServiceUnavailable}
                onSkip={mockOnSkip}
            />
        );

        const closeButton = container.querySelector('button[aria-label="Skip location"]');
        fireEvent.click(closeButton);

        expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it('should call onSkip when "Skip for now" button clicked', () => {
        render(
            <LocationCapture
                onLocationSet={mockOnLocationSet}
                onServiceUnavailable={mockOnServiceUnavailable}
                onSkip={mockOnSkip}
            />
        );

        const skipButton = screen.getByText('Skip for now');
        fireEvent.click(skipButton);

        expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it('should allow typing in address input', () => {
        render(
            <LocationCapture
                onLocationSet={mockOnLocationSet}
                onServiceUnavailable={mockOnServiceUnavailable}
                onSkip={mockOnSkip}
            />
        );

        const input = screen.getByPlaceholderText('Enter your delivery address');
        fireEvent.change(input, { target: { value: 'Test Address' } });

        expect(input).toHaveValue('Test Address');
    });

    it('should show clear button when address is entered', () => {
        const { container } = render(
            <LocationCapture
                onLocationSet={mockOnLocationSet}
                onServiceUnavailable={mockOnServiceUnavailable}
                onSkip={mockOnSkip}
            />
        );

        const input = screen.getByPlaceholderText('Enter your delivery address');
        fireEvent.change(input, { target: { value: 'Test Address' } });

        const clearButtons = container.querySelectorAll('button');
        const clearButton = Array.from(clearButtons).find(btn =>
            btn.querySelector('svg') && btn.className.includes('absolute')
        );

        expect(clearButton).toBeInTheDocument();
    });

    it('should clear address when clear button clicked', () => {
        const { container } = render(
            <LocationCapture
                onLocationSet={mockOnLocationSet}
                onServiceUnavailable={mockOnServiceUnavailable}
                onSkip={mockOnSkip}
            />
        );

        const input = screen.getByPlaceholderText('Enter your delivery address');
        fireEvent.change(input, { target: { value: 'Test Address' } });

        const clearButtons = container.querySelectorAll('button');
        const clearButton = Array.from(clearButtons).find(btn =>
            btn.querySelector('svg') && btn.className.includes('absolute')
        );

        fireEvent.click(clearButton);

        expect(input).toHaveValue('');
    });

    it('should show current location button', () => {
        render(
            <LocationCapture
                onLocationSet={mockOnLocationSet}
                onServiceUnavailable={mockOnServiceUnavailable}
                onSkip={mockOnSkip}
            />
        );

        expect(screen.getByText('Use Current Location')).toBeInTheDocument();
    });
});
