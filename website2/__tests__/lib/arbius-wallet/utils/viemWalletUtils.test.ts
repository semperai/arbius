import { keccak256, toBytes, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  initDeterministicWallet,
  getCachedWalletAddress,
  getCachedWallet,
} from '../viemWalletUtils';
import * as safeStorage from '../safeStorage';

jest.mock('viem');
jest.mock('viem/accounts');
jest.mock('../safeStorage');

const mockKeccak256 = keccak256 as jest.MockedFunction<typeof keccak256>;
const mockToBytes = toBytes as jest.MockedFunction<typeof toBytes>;
const mockPrivateKeyToAccount = privateKeyToAccount as jest.MockedFunction<typeof privateKeyToAccount>;
const mockSafeLocalStorageGet = safeStorage.safeLocalStorageGet as jest.MockedFunction<typeof safeStorage.safeLocalStorageGet>;
const mockSafeLocalStorageSet = safeStorage.safeLocalStorageSet as jest.MockedFunction<typeof safeStorage.safeLocalStorageSet>;
const mockSafeLocalStorageRemove = safeStorage.safeLocalStorageRemove as jest.MockedFunction<typeof safeStorage.safeLocalStorageRemove>;

describe('viemWalletUtils', () => {
  const mockOwnerAddress = '0x1234567890123456789012345678901234567890';
  const mockDerivedAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const mockPrivateKey = '0xprivatekey123' as Hex;
  const mockSignature = '0xsignature' as Hex;
  const mockHashedSignature = '0xhashed' as Hex;
  const mockBytes = new Uint8Array([1, 2, 3]);

  const mockAccount = {
    address: mockDerivedAddress as `0x${string}`,
    signMessage: jest.fn(),
    signTransaction: jest.fn(),
    signTypedData: jest.fn(),
    source: 'privateKey',
    type: 'local',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location
    delete (global as any).window;
    (global as any).window = { location: { hostname: 'arbius.ai' } };

    mockToBytes.mockReturnValue(mockBytes);
    mockKeccak256.mockReturnValue(mockHashedSignature);
    mockPrivateKeyToAccount.mockReturnValue(mockAccount as any);
    mockSafeLocalStorageSet.mockReturnValue(true);
  });

  afterEach(() => {
    delete (global as any).window;
  });

  describe('initDeterministicWallet', () => {
    it('should throw error when ownerAddress is missing', async () => {
      const signMessage = jest.fn();

      await expect(
        initDeterministicWallet('', signMessage)
      ).rejects.toThrow('ownerAddress and signMessage are required.');
    });

    it('should throw error when signMessage is missing', async () => {
      await expect(
        initDeterministicWallet(mockOwnerAddress, null as any)
      ).rejects.toThrow('ownerAddress and signMessage are required.');
    });

    it('should return cached wallet if available for same address', async () => {
      const signMessage = jest.fn();
      const cachedData = {
        ownerAddress: mockOwnerAddress.toLowerCase(),
        derivedPrivateKey: mockPrivateKey,
        derivedAddress: mockDerivedAddress,
        signatureVersion: 1,
        createdAt: new Date().toISOString(),
      };

      mockSafeLocalStorageGet.mockReturnValue(JSON.stringify(cachedData));

      const result = await initDeterministicWallet(mockOwnerAddress, signMessage);

      expect(result).toBe(mockAccount);
      expect(signMessage).not.toHaveBeenCalled();
      expect(mockPrivateKeyToAccount).toHaveBeenCalledWith(mockPrivateKey);
    });

    it('should create new wallet if no cache exists', async () => {
      const signMessage = jest.fn().mockResolvedValue(mockSignature);
      mockSafeLocalStorageGet.mockReturnValue(null);

      const result = await initDeterministicWallet(mockOwnerAddress, signMessage);

      expect(signMessage).toHaveBeenCalledWith(
        expect.stringContaining('Arbius wants you to create a deterministic wallet')
      );
      expect(mockToBytes).toHaveBeenCalledWith(mockSignature);
      expect(mockKeccak256).toHaveBeenCalledWith(mockBytes);
      expect(mockPrivateKeyToAccount).toHaveBeenCalledWith(mockHashedSignature);
      expect(result).toBe(mockAccount);
    });

    it('should cache the new wallet', async () => {
      const signMessage = jest.fn().mockResolvedValue(mockSignature);
      mockSafeLocalStorageGet.mockReturnValue(null);

      await initDeterministicWallet(mockOwnerAddress, signMessage);

      expect(mockSafeLocalStorageSet).toHaveBeenCalledWith(
        'arbiuswallet_derivedWalletCache',
        expect.stringContaining(mockOwnerAddress.toLowerCase())
      );
    });

    it('should warn if caching fails', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const signMessage = jest.fn().mockResolvedValue(mockSignature);
      mockSafeLocalStorageGet.mockReturnValue(null);
      mockSafeLocalStorageSet.mockReturnValue(false);

      await initDeterministicWallet(mockOwnerAddress, signMessage);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to cache derived wallet. Wallet will need to be re-derived on page reload.'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should use custom title in message', async () => {
      const signMessage = jest.fn().mockResolvedValue(mockSignature);
      mockSafeLocalStorageGet.mockReturnValue(null);
      const customTitle = 'CustomApp';

      await initDeterministicWallet(mockOwnerAddress, signMessage, customTitle);

      expect(signMessage).toHaveBeenCalledWith(
        expect.stringContaining('CustomApp wants you to create a deterministic wallet')
      );
    });

    it('should handle corrupted cache by clearing it', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const signMessage = jest.fn().mockResolvedValue(mockSignature);
      mockSafeLocalStorageGet.mockReturnValue('corrupted-json');

      const result = await initDeterministicWallet(mockOwnerAddress, signMessage);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse cached wallet, clearing cache:',
        expect.any(String)
      );
      expect(mockSafeLocalStorageRemove).toHaveBeenCalledWith('arbiuswallet_derivedWalletCache');
      expect(result).toBe(mockAccount);

      consoleErrorSpy.mockRestore();
    });

    it('should create new wallet if cached address does not match', async () => {
      const signMessage = jest.fn().mockResolvedValue(mockSignature);
      const differentAddress = '0x9999999999999999999999999999999999999999';
      const cachedData = {
        ownerAddress: differentAddress.toLowerCase(),
        derivedPrivateKey: mockPrivateKey,
        derivedAddress: mockDerivedAddress,
        signatureVersion: 1,
        createdAt: new Date().toISOString(),
      };

      mockSafeLocalStorageGet.mockReturnValue(JSON.stringify(cachedData));

      const result = await initDeterministicWallet(mockOwnerAddress, signMessage);

      expect(signMessage).toHaveBeenCalled();
      expect(result).toBe(mockAccount);
    });

    it('should normalize owner address to lowercase', async () => {
      const signMessage = jest.fn().mockResolvedValue(mockSignature);
      const upperCaseAddress = mockOwnerAddress.toUpperCase();
      mockSafeLocalStorageGet.mockReturnValue(null);

      await initDeterministicWallet(upperCaseAddress, signMessage);

      const setCallArg = mockSafeLocalStorageSet.mock.calls[0][1];
      const cachedData = JSON.parse(setCallArg);
      expect(cachedData.ownerAddress).toBe(mockOwnerAddress.toLowerCase());
    });
  });

  describe('getCachedWalletAddress', () => {
    it('should return null if no cache exists', () => {
      mockSafeLocalStorageGet.mockReturnValue(null);

      const result = getCachedWalletAddress(mockOwnerAddress);

      expect(result).toBeNull();
    });

    it('should return cached address for matching owner address', () => {
      const cachedData = {
        ownerAddress: mockOwnerAddress.toLowerCase(),
        derivedPrivateKey: mockPrivateKey,
        derivedAddress: mockDerivedAddress,
        signatureVersion: 1,
        createdAt: new Date().toISOString(),
      };

      mockSafeLocalStorageGet.mockReturnValue(JSON.stringify(cachedData));

      const result = getCachedWalletAddress(mockOwnerAddress);

      expect(result).toBe(mockDerivedAddress);
    });

    it('should return null if owner address does not match', () => {
      const differentAddress = '0x9999999999999999999999999999999999999999';
      const cachedData = {
        ownerAddress: differentAddress.toLowerCase(),
        derivedPrivateKey: mockPrivateKey,
        derivedAddress: mockDerivedAddress,
        signatureVersion: 1,
        createdAt: new Date().toISOString(),
      };

      mockSafeLocalStorageGet.mockReturnValue(JSON.stringify(cachedData));

      const result = getCachedWalletAddress(mockOwnerAddress);

      expect(result).toBeNull();
    });

    it('should handle corrupted cache gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSafeLocalStorageGet.mockReturnValue('corrupted-json');

      const result = getCachedWalletAddress(mockOwnerAddress);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get cached address:',
        expect.any(String)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should be case-insensitive for address matching', () => {
      const cachedData = {
        ownerAddress: mockOwnerAddress.toLowerCase(),
        derivedPrivateKey: mockPrivateKey,
        derivedAddress: mockDerivedAddress,
        signatureVersion: 1,
        createdAt: new Date().toISOString(),
      };

      mockSafeLocalStorageGet.mockReturnValue(JSON.stringify(cachedData));

      const result = getCachedWalletAddress(mockOwnerAddress.toUpperCase());

      expect(result).toBe(mockDerivedAddress);
    });
  });

  describe('getCachedWallet', () => {
    it('should return null if no cache exists', () => {
      mockSafeLocalStorageGet.mockReturnValue(null);

      const result = getCachedWallet(mockDerivedAddress);

      expect(result).toBeNull();
    });

    it('should return cached wallet for matching derived address', () => {
      const cachedData = {
        ownerAddress: mockOwnerAddress.toLowerCase(),
        derivedPrivateKey: mockPrivateKey,
        derivedAddress: mockDerivedAddress,
        signatureVersion: 1,
        createdAt: new Date().toISOString(),
      };

      mockSafeLocalStorageGet.mockReturnValue(JSON.stringify(cachedData));

      const result = getCachedWallet(mockDerivedAddress);

      expect(result).toBe(mockAccount);
      expect(mockPrivateKeyToAccount).toHaveBeenCalledWith(mockPrivateKey);
    });

    it('should return null if derived address does not match', () => {
      const differentAddress = '0x9999999999999999999999999999999999999999';
      const cachedData = {
        ownerAddress: mockOwnerAddress.toLowerCase(),
        derivedPrivateKey: mockPrivateKey,
        derivedAddress: differentAddress,
        signatureVersion: 1,
        createdAt: new Date().toISOString(),
      };

      mockSafeLocalStorageGet.mockReturnValue(JSON.stringify(cachedData));

      const result = getCachedWallet(mockDerivedAddress);

      expect(result).toBeNull();
    });

    it('should handle corrupted cache gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSafeLocalStorageGet.mockReturnValue('corrupted-json');

      const result = getCachedWallet(mockDerivedAddress);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get cached wallet:',
        expect.any(String)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should be case-insensitive for address matching', () => {
      const cachedData = {
        ownerAddress: mockOwnerAddress.toLowerCase(),
        derivedPrivateKey: mockPrivateKey,
        derivedAddress: mockDerivedAddress,
        signatureVersion: 1,
        createdAt: new Date().toISOString(),
      };

      mockSafeLocalStorageGet.mockReturnValue(JSON.stringify(cachedData));

      const result = getCachedWallet(mockDerivedAddress.toUpperCase());

      expect(result).toBe(mockAccount);
    });
  });
});
