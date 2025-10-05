/**
 * Tests for AAWalletDisplay component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Setup React global
(global as any).React = React;

// Mock wagmi before importing components
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useWalletClient: jest.fn(),
  usePublicClient: jest.fn(),
}));

import { AAWalletDisplay } from '../../components/AAWalletDisplay';
import { useAAWallet } from '../../hooks/useAAWallet';

// Mock the useAAWallet hook
jest.mock('../../hooks/useAAWallet');
const mockUseAAWallet = useAAWallet as jest.MockedFunction<typeof useAAWallet>;

// Mock the AAWalletModal component
jest.mock('../../components/AAWalletModal', () => ({
  AAWalletModal: ({ isOpen, onClose, smartAccountAddress }: any) =>
    isOpen ? (
      <div data-testid="wallet-modal">
        <div>{smartAccountAddress}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-down" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
}));

describe('AAWalletDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render initializing state', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: null,
      signerAddress: null,
      chainId: 42161,
      isInitializing: true,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    render(<AAWalletDisplay />);

    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });

  it('should return null when not initialized and no smart account', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: null,
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    const { container } = render(<AAWalletDisplay />);

    expect(container.firstChild).toBeNull();
  });

  it('should render wallet button when smart account is connected', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: '0x1234567890abcdef1234567890abcdef12345678',
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    render(<AAWalletDisplay />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/0x12.*5678/)).toBeInTheDocument();
  });

  it('should display truncated address', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: '0x1234567890abcdef1234567890abcdef12345678',
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    render(<AAWalletDisplay />);

    // Should show first 2 chars after 0x and last 4 chars
    expect(screen.getByText(/0x12\.\.\.5678/)).toBeInTheDocument();
  });

  it('should render arbius logo when provided', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: '0x1234567890abcdef1234567890abcdef12345678',
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    render(<AAWalletDisplay arbiusLogoSrc="/logo.png" />);

    const img = screen.getByRole('img', { name: 'Arbius' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/logo.png');
  });

  it('should not render logo when arbiusLogoSrc is not provided', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: '0x1234567890abcdef1234567890abcdef12345678',
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    render(<AAWalletDisplay />);

    expect(screen.queryByRole('img', { name: 'Arbius' })).not.toBeInTheDocument();
  });

  it('should render chevron down icon', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: '0x1234567890abcdef1234567890abcdef12345678',
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    render(<AAWalletDisplay />);

    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
  });

  it('should open modal when button is clicked', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: '0x1234567890abcdef1234567890abcdef12345678',
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    render(<AAWalletDisplay />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: '0x1234567890abcdef1234567890abcdef12345678',
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    render(<AAWalletDisplay />);

    // Open modal
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('wallet-modal')).not.toBeInTheDocument();
    });
  });

  it('should not open modal when button is clicked without smart account', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: null,
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    const { container } = render(<AAWalletDisplay />);

    // Component returns null, so no button to click
    expect(container.firstChild).toBeNull();
  });

  it('should apply correct CSS classes to initializing state', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: null,
      signerAddress: null,
      chainId: 42161,
      isInitializing: true,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    const { container } = render(<AAWalletDisplay />);

    const div = container.querySelector('div');
    expect(div).toHaveClass('text-base');
    expect(div).toHaveClass('text-gray-900');
    expect(div).toHaveClass('bg-white');
    expect(div).toHaveClass('rounded-xl');
  });

  it('should apply correct CSS classes to wallet button', () => {
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: '0x1234567890abcdef1234567890abcdef12345678',
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    render(<AAWalletDisplay />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-base');
    expect(button).toHaveClass('text-gray-700');
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('rounded-xl');
    expect(button).toHaveClass('hover:scale-105');
  });

  it('should pass smart account address to modal', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    mockUseAAWallet.mockReturnValue({
      smartAccountAddress: address,
      signerAddress: null,
      chainId: 42161,
      isInitializing: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchChain: jest.fn(),
      sendTransaction: jest.fn(),
      signMessage: jest.fn(),
      signTypedData: jest.fn(),
    });

    render(<AAWalletDisplay />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText(address)).toBeInTheDocument();
  });
});
