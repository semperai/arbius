import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('should render badge with text', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should apply default variant', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it('should apply secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText('Secondary');
    expect(badge).toBeInTheDocument();
  });

  it('should apply destructive variant', () => {
    render(<Badge variant="destructive">Destructive</Badge>);
    const badge = screen.getByText('Destructive');
    expect(badge).toBeInTheDocument();
  });

  it('should apply outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badge = screen.getByText('Outline');
    expect(badge).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });

  it('should render as span by default', () => {
    const { container } = render(<Badge>Span Badge</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Span Badge');
  });

  it('should render with asChild prop', () => {
    render(
      <Badge asChild>
        <div>As Child</div>
      </Badge>
    );
    expect(screen.getByText('As Child')).toBeInTheDocument();
  });

  it('should spread additional props', () => {
    render(<Badge data-testid="test-badge">Test</Badge>);
    expect(screen.getByTestId('test-badge')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Badge>Badge</Badge>);
    const badge = screen.getByText('Badge');
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });
});
