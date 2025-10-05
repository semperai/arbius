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
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useBalance: vi.fn(),
  useWalletClient: vi.fn(),
  usePublicClient: vi.fn(),
  useReadContract: vi.fn(),
}));

// Mock viem
vi.mock('viem', () => ({
  parseEther: vi.fn((value: string) => BigInt(Math.floor(parseFloat(value) * 1e18))),
  formatEther: vi.fn((value: bigint) => (Number(value) / 1e18).toString()),
  formatUnits: vi.fn((value: bigint, decimals: number) => (Number(value) / Math.pow(10, decimals)).toString()),
  isAddress: vi.fn((address: string) => address.startsWith('0x') && address.length === 42),
}));

// Mock viem/chains
vi.mock('viem/chains', () => ({
  arbitrum: { id: 42161, name: 'Arbitrum' },
}));

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <div data-testid="close-icon">X</div>,
  EyeSlashIcon: () => <div data-testid="eye-slash-icon">Eye</div>,
  KeyIcon: () => <div data-testid="key-icon">Key</div>,
  LockClosedIcon: () => <div data-testid="lock-icon">Lock</div>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ArrowUpRight: () => <div>Up</div>,
  ArrowDownLeft: () => <div>Down</div>,
  RefreshCw: () => <div>Refresh</div>,
  Copy: () => <div>Copy</div>,
  Check: () => <div>Check</div>,
}));

// Mock QRCode
vi.mock('react-qr-code', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock viemWalletUtils
vi.mock('../../utils/viemWalletUtils');

import {
  useAccount,
  useBalance,
  useWalletClient,
  usePublicClient,
  useReadContract,
} from 'wagmi';

const mockUseAccount = useAccount as vi.MockedFunction<typeof useAccount>;
const mockUseBalance = useBalance as vi.MockedFunction<typeof useBalance>;
const mockUseWalletClient = useWalletClient as vi.MockedFunction<typeof useWalletClient>;
const mockUsePublicClient = usePublicClient as vi.MockedFunction<typeof usePublicClient>;
const mockUseReadContract = useReadContract as vi.MockedFunction<typeof useReadContract>;
const mockGetCachedWallet = viemWalletUtils.getCachedWallet as vi.MockedFunction<typeof viemWalletUtils.getCachedWallet>;

describe('AAWalletModal', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890';
  const mockSmartAccountAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const mockOnClose = vi.fn();

  const mockWalletClient = {
    account: { address: mockAddress },
    sendTransaction: vi.fn(),
  };

  const mockPublicClient = {
    getGasPrice: vi.fn().mockResolvedValue(BigInt(1000000000)),
    estimateGas: vi.fn().mockResolvedValue(BigInt(21000)),
    estimateContractGas: vi.fn().mockResolvedValue(BigInt(50000)),
  };

  const mockAAWallet = {
    address: mockSmartAccountAddress as `0x${string}`,
    privateKey: '0xprivatekey123',
  };

  beforeEach(() => {
    vi.clearAllMocks();

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
          refetch: vi.fn(),
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
          refetch: vi.fn(),
        } as any;
      } else {
        return {
          data: BigInt('500000000000000000000'),
          refetch: vi.fn(),
        } as any;
      }
    });

    mockGetCachedWallet.mockReturnValue(mockAAWallet as any);

    Storage.prototype.getItem = vi.fn(() => null);
    Storage.prototype.setItem = vi.fn();
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
        refetch: vi.fn(),
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
