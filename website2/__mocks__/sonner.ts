const mockToast = jest.fn();

export const toast = Object.assign(mockToast, {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(() => 'toast-id'),
  info: jest.fn(),
  warning: jest.fn(),
  promise: jest.fn(),
  custom: jest.fn(),
  message: jest.fn(),
  dismiss: jest.fn(),
});

export const Toaster = () => null;
