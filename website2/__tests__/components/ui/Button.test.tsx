import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Setup React global
(global as any).React = React;

import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should render button with default props', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should apply primary variant by default', () => {
    render(<Button>Primary</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('should apply secondary variant when specified', () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');
  });

  it('should apply gradient variant when specified', () => {
    render(<Button variant="gradient">Gradient</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r');
  });

  it('should apply outline variant when specified', () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-2');
    expect(button).toHaveClass('border-primary');
  });

  it('should apply ghost variant when specified', () => {
    render(<Button variant="ghost">Ghost</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-transparent');
  });

  it('should apply small size when specified', () => {
    render(<Button size="sm">Small</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4');
    expect(button).toHaveClass('py-2');
    expect(button).toHaveClass('text-sm');
  });

  it('should apply medium size by default', () => {
    render(<Button>Medium</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6');
    expect(button).toHaveClass('py-3');
    expect(button).toHaveClass('text-base');
  });

  it('should apply large size when specified', () => {
    render(<Button size="lg">Large</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-8');
    expect(button).toHaveClass('py-4');
    expect(button).toHaveClass('text-lg');
  });

  it('should apply full width when specified', () => {
    render(<Button fullWidth>Full Width</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  it('should not apply full width by default', () => {
    render(<Button>Not Full Width</Button>);

    const button = screen.getByRole('button');
    expect(button).not.toHaveClass('w-full');
  });

  it('should show loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);

    const button = screen.getByRole('button');
    const spinner = button.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should disable button when loading', () => {
    render(<Button loading>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should disable button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should apply disabled styles when disabled', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toHaveClass('disabled:cursor-not-allowed');
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not trigger click when disabled', () => {
    const handleClick = jest.fn();

    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>With Ref</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should spread additional props', () => {
    render(<Button data-testid="test-button" aria-label="Test button">Test</Button>);

    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('aria-label', 'Test button');
  });

  it('should render children', () => {
    render(
      <Button>
        <span>Child 1</span>
        <span>Child 2</span>
      </Button>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('should have displayName set', () => {
    expect(Button.displayName).toBe('Button');
  });

  it('should apply base styles', () => {
    render(<Button>Base</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('inline-flex');
    expect(button).toHaveClass('items-center');
    expect(button).toHaveClass('justify-center');
    expect(button).toHaveClass('rounded-lg');
    expect(button).toHaveClass('font-medium');
    expect(button).toHaveClass('transition-all');
  });

  it('should support all variant and size combinations', () => {
    const variants: Array<'primary' | 'secondary' | 'gradient' | 'outline' | 'ghost'> = [
      'primary',
      'secondary',
      'gradient',
      'outline',
      'ghost',
    ];
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

    variants.forEach(variant => {
      sizes.forEach(size => {
        const { unmount } = render(
          <Button variant={variant} size={size}>
            {variant}-{size}
          </Button>
        );
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        unmount();
      });
    });
  });
});
