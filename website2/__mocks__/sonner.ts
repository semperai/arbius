import { vi } from 'vitest';

const mockToast = vi.fn();

export const toast = Object.assign(mockToast, {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(() => 'toast-id'),
  info: vi.fn(),
  warning: vi.fn(),
  promise: vi.fn(),
  custom: vi.fn(),
  message: vi.fn(),
  dismiss: vi.fn(),
});

export const Toaster = () => null;
