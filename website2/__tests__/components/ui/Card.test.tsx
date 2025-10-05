import React from 'react';
import { render, screen } from '@testing-library/react';

// Setup React global
(global as any).React = React;

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card', () => {
  it('should render card with children', () => {
    render(<Card>Card content</Card>);

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply default variant', () => {
    const { container } = render(<Card>Content</Card>);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('shadow-lg');
  });

  it('should apply bordered variant', () => {
    const { container } = render(<Card variant="bordered">Content</Card>);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('border-2');
    expect(card).toHaveClass('border-gray-200');
  });

  it('should apply gradient variant', () => {
    const { container } = render(<Card variant="gradient">Content</Card>);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-gradient-to-br');
    expect(card).toHaveClass('from-purple-50');
    expect(card).toHaveClass('to-blue-50');
  });

  it('should apply no padding', () => {
    const { container } = render(<Card padding="none">Content</Card>);

    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('p-4');
    expect(card).not.toHaveClass('p-6');
    expect(card).not.toHaveClass('p-8');
  });

  it('should apply small padding', () => {
    const { container } = render(<Card padding="sm">Content</Card>);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('p-4');
  });

  it('should apply medium padding', () => {
    const { container } = render(<Card padding="md">Content</Card>);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('p-6');
  });

  it('should apply large padding by default', () => {
    const { container } = render(<Card>Content</Card>);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('p-8');
  });

  it('should apply custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });

  it('should apply rounded corners', () => {
    const { container } = render(<Card>Content</Card>);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('rounded-2xl');
  });

  it('should spread additional props', () => {
    const { container } = render(<Card data-testid="test-card">Content</Card>);

    expect(screen.getByTestId('test-card')).toBeInTheDocument();
  });
});

describe('CardHeader', () => {
  it('should render title', () => {
    render(<CardHeader title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    render(<CardHeader title="Title" subtitle="Subtitle" />);

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  it('should not render subtitle when not provided', () => {
    const { container } = render(<CardHeader title="Title" />);

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(container.textContent).not.toContain('subtitle');
  });

  it('should render action when provided', () => {
    const action = <button>Action</button>;
    render(<CardHeader title="Title" action={action} />);

    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('should not render action when not provided', () => {
    render(<CardHeader title="Title" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should apply title styles', () => {
    render(<CardHeader title="Title" />);

    const title = screen.getByText('Title');
    expect(title).toHaveClass('text-xl');
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveClass('text-gray-900');
  });

  it('should apply subtitle styles', () => {
    render(<CardHeader title="Title" subtitle="Subtitle" />);

    const subtitle = screen.getByText('Subtitle');
    expect(subtitle).toHaveClass('text-sm');
    expect(subtitle).toHaveClass('text-gray-600');
  });
});

describe('CardContent', () => {
  it('should render children', () => {
    render(<CardContent>Content text</CardContent>);

    expect(screen.getByText('Content text')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<CardContent className="custom-class">Content</CardContent>);

    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('custom-class');
  });

  it('should render complex children', () => {
    render(
      <CardContent>
        <h1>Heading</h1>
        <p>Paragraph</p>
      </CardContent>
    );

    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('should render children', () => {
    render(<CardFooter>Footer text</CardFooter>);

    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('should apply top margin', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);

    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('mt-4');
  });

  it('should apply custom className', () => {
    const { container } = render(<CardFooter className="custom-class">Footer</CardFooter>);

    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('custom-class');
    expect(div).toHaveClass('mt-4');
  });

  it('should render complex children', () => {
    render(
      <CardFooter>
        <button>Button 1</button>
        <button>Button 2</button>
      </CardFooter>
    );

    expect(screen.getByRole('button', { name: 'Button 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Button 2' })).toBeInTheDocument();
  });
});

describe('Card Components Integration', () => {
  it('should render all components together', () => {
    render(
      <Card>
        <CardHeader title="Card Title" subtitle="Card Subtitle" />
        <CardContent>Main content here</CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Main content here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
