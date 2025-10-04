import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyButton, CopyText } from '@/components/CopyButton';
import { toast } from 'sonner';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn()
};

Object.assign(navigator, {
  clipboard: mockClipboard
});

describe('CopyButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render copy button', () => {
    render(<CopyButton text="test text" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should have correct aria-label', () => {
    render(<CopyButton text="test text" label="Copy to clipboard" />);
    const button = screen.getByLabelText('Copy to clipboard');
    expect(button).toBeInTheDocument();
  });

  it('should copy text to clipboard on click', async () => {
    render(<CopyButton text="test text" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
    });
  });

  it('should show success toast on successful copy', async () => {
    render(<CopyButton text="test text" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });
  });

  it('should change icon after copying', async () => {
    jest.useFakeTimers();
    render(<CopyButton text="test text" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Copied!');
    });

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Copy');
    });
  });

  it('should handle copy failure', async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error('Copy failed'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<CopyButton text="test text" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to copy');
    });

    consoleError.mockRestore();
  });

  it('should accept custom className', () => {
    render(<CopyButton text="test text" className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should accept variant prop', () => {
    render(<CopyButton text="test text" variant="outline" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should accept size prop', () => {
    render(<CopyButton text="test text" size="sm" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});

describe('CopyText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  it('should render text and copy button', () => {
    render(<CopyText text="test text" />);
    expect(screen.getByText('test text')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render displayText when provided', () => {
    render(<CopyText text="full text" displayText="short" />);
    expect(screen.getByText('short')).toBeInTheDocument();
    expect(screen.queryByText('full text')).not.toBeInTheDocument();
  });

  it('should copy full text even when displayText is different', async () => {
    render(<CopyText text="full text" displayText="short" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('full text');
    });
  });

  it('should accept custom className', () => {
    const { container } = render(<CopyText text="test text" className="custom-class" />);
    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('should render text in code element', () => {
    render(<CopyText text="test text" />);
    const code = screen.getByText('test text');
    expect(code.tagName).toBe('CODE');
  });
});
