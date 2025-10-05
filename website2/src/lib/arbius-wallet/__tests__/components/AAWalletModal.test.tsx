/**
 * Basic tests for AAWalletModal component
 * This component is very complex with many dependencies, so we focus on basic rendering
 */

import React from 'react';
import { render } from '@testing-library/react';

// Setup React global before any component imports
(global as any).React = React;

import { AAWalletModal } from '../../components/AAWalletModal';
import * as viemWalletUtils from '../../utils/viemWalletUtils';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useBalance: jest.fn(),
  useWalletClient: jest.fn(),
  usePublicClient: jest.fn(),
  useReadContract: jest.fn(),
}));

// Mock viem
jest.mock('viem', () => ({
  parseEther: jest.fn((value: string) => BigInt(Math.floor(parseFloat(value) * 1e18))),
  formatEther: jest.fn((value: bigint) => (Number(value) / 1e18).toString()),
  formatUnits: jest.fn((value: bigint, decimals: number) => (Number(value) / Math.pow(10, decimals)).toString()),
  isAddress: jest.fn((address: string) => address.startsWith('0x') && address.length === 42),
}));

// Mock viem/chains
jest.mock('viem/chains', () => ({
  arbitrum: { id: 42161, name: 'Arbitrum' },
}));

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <div data-testid="close-icon">X</div>,
  EyeSlashIcon: () => <div data-testid="eye-slash-icon">Eye</div>,
  KeyIcon: () => <div data-testid="key-icon">Key</div>,
  LockClosedIcon: () => <div data-testid="lock-icon">Lock</div>,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  ArrowUpRight: () => <div>Up</div>,
  ArrowDownLeft: () => <div>Down</div>,
  RefreshCw: () => <div>Refresh</div>,
  Copy: () => <div>Copy</div>,
  Check: () => <div>Check</div>,
}));

// Mock QRCode
jest.mock('react-qr-code', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock viemWalletUtils
jest.mock('../../utils/viemWalletUtils');

import {
  useAccount,
  useBalance,
  useWalletClient,
  usePublicClient,
  useReadContract,
} from 'wagmi';

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseBalance = useBalance as jest.MockedFunction<typeof useBalance>;
const mockUseWalletClient = useWalletClient as jest.MockedFunction<typeof useWalletClient>;
const mockUsePublicClient = usePublicClient as jest.MockedFunction<typeof usePublicClient>;
const mockUseReadContract = useReadContract as jest.MockedFunction<typeof useReadContract>;
const mockGetCachedWallet = viemWalletUtils.getCachedWallet as jest.MockedFunction<typeof viemWalletUtils.getCachedWallet>;

describe('AAWalletModal', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890';
  const mockSmartAccountAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const mockOnClose = jest.fn();

  const mockWalletClient = {
    account: { address: mockAddress },
    sendTransaction: jest.fn(),
  };

  const mockPublicClient = {
    getGasPrice: jest.fn().mockResolvedValue(BigInt(1000000000)),
    estimateGas: jest.fn().mockResolvedValue(BigInt(21000)),
    estimateContractGas: jest.fn().mockResolvedValue(BigInt(50000)),
  };

  const mockAAWallet = {
    address: mockSmartAccountAddress as `0x${string}`,
    privateKey: '0xprivatekey123',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAccount.mockReturnValue({
      address: mockAddress as `0x${string}`,
      chain: { id: 42161, name: 'Arbitrum' } as any,
      isConnected: true,
    } as any);

    mockUseWalletClient.mockReturnValue({
      data: mockWalletClient as any,
    } as any);

    mockUsePublicClient.mockReturnValue(mockPublicClient as any);

    let balanceCallCount = 0;
    mockUseBalance.mockImplementation(() => {
      balanceCallCount++;
      if (balanceCallCount === 1) {
        return {
          data: { value: BigInt('1000000000000000000'), formatted: '1.0' },
          refetch: jest.fn(),
        } as any;
      } else {
        return {
          data: { value: BigInt('500000000000000000'), formatted: '0.5' },
        } as any;
      }
    });

    let aiusCallCount = 0;
    mockUseReadContract.mockImplementation(() => {
      aiusCallCount++;
      if (aiusCallCount === 1) {
        return {
          data: BigInt('1000000000000000000000'),
          refetch: jest.fn(),
        } as any;
      } else {
        return {
          data: BigInt('500000000000000000000'),
          refetch: jest.fn(),
        } as any;
      }
    });

    mockGetCachedWallet.mockReturnValue(mockAAWallet as any);

    Storage.prototype.getItem = jest.fn(() => null);
    Storage.prototype.setItem = jest.fn();
  });

  describe('Basic rendering', () => {
    it('should not render when closed', () => {
      const { container } = render(
        <AAWalletModal
          isOpen={false}
          onClose={mockOnClose}
          smartAccountAddress={mockSmartAccountAddress}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when open', () => {
      const { container } = render(
        <AAWalletModal
          isOpen={true}
          onClose={mockOnClose}
          smartAccountAddress={mockSmartAccountAddress}
        />
      );

      expect(container.firstChild).toBeTruthy();
    });

    it('should render with smart account address in content', () => {
      const { container } = render(
        <AAWalletModal
          isOpen={true}
          onClose={mockOnClose}
          smartAccountAddress={mockSmartAccountAddress}
        />
      );

      expect(container.textContent).toContain('0xab');
    });

    it('should handle missing balance gracefully', () => {
      mockUseBalance.mockReturnValue({
        data: undefined,
        refetch: jest.fn(),
      } as any);

      const { container } = render(
        <AAWalletModal
          isOpen={true}
          onClose={mockOnClose}
          smartAccountAddress={mockSmartAccountAddress}
        />
      );

      expect(container.firstChild).toBeTruthy();
    });
  });
});
