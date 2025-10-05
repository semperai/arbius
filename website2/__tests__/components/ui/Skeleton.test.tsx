import React from 'react';
import { render, screen } from '@testing-library/react';

// Setup React global
(global as any).React = React;

import { Skeleton, BalanceCardSkeleton, ActionCardSkeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('should render skeleton with loading state', () => {
    render(<Skeleton />);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-label', 'Loading...');
  });

  it('should apply animate-pulse class', () => {
    render(<Skeleton />);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should apply base styles', () => {
    render(<Skeleton />);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('rounded-lg');
    expect(skeleton).toHaveClass('bg-gray-200');
  });

  it('should apply custom className', () => {
    render(<Skeleton className="custom-class" />);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('custom-class');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should have sr-only text for screen readers', () => {
    render(<Skeleton />);

    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
  });

  it('should support different sizes via className', () => {
    const { rerender } = render(<Skeleton className="h-10 w-full" />);

    let skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('h-10');
    expect(skeleton).toHaveClass('w-full');

    rerender(<Skeleton className="h-20 w-20" />);

    skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('h-20');
    expect(skeleton).toHaveClass('w-20');
  });
});

describe('BalanceCardSkeleton', () => {
  it('should render balance card skeleton', () => {
    const { container } = render(<BalanceCardSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply card styles', () => {
    const { container } = render(<BalanceCardSkeleton />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('p-8');
    expect(card).toHaveClass('shadow-lg');
  });

  it('should render multiple skeleton elements', () => {
    const { container } = render(<BalanceCardSkeleton />);

    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBeGreaterThan(1);
  });

  it('should render title skeleton', () => {
    const { container } = render(<BalanceCardSkeleton />);

    const titleSkeleton = container.querySelector('.mb-4.h-7.w-40');
    expect(titleSkeleton).toBeInTheDocument();
  });

  it('should render balance skeleton', () => {
    const { container } = render(<BalanceCardSkeleton />);

    const balanceSkeleton = container.querySelector('.h-12.flex-1');
    expect(balanceSkeleton).toBeInTheDocument();
  });

  it('should render additional info skeleton', () => {
    const { container } = render(<BalanceCardSkeleton />);

    const infoSkeleton = container.querySelector('.h-6.w-24');
    expect(infoSkeleton).toBeInTheDocument();
  });

  it('should have flex layout for balance section', () => {
    const { container } = render(<BalanceCardSkeleton />);

    const flexContainer = container.querySelector('.flex.items-center.gap-4');
    expect(flexContainer).toBeInTheDocument();
  });
});

describe('ActionCardSkeleton', () => {
  it('should render action card skeleton', () => {
    const { container } = render(<ActionCardSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply card styles', () => {
    const { container } = render(<ActionCardSkeleton />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('p-8');
    expect(card).toHaveClass('shadow-lg');
  });

  it('should render multiple skeleton elements', () => {
    const { container } = render(<ActionCardSkeleton />);

    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBe(2);
  });

  it('should render title skeleton', () => {
    const { container } = render(<ActionCardSkeleton />);

    const titleSkeleton = container.querySelector('.mb-4.h-7.w-32');
    expect(titleSkeleton).toBeInTheDocument();
  });

  it('should render action skeleton', () => {
    const { container } = render(<ActionCardSkeleton />);

    const actionSkeleton = container.querySelector('.h-12.w-full');
    expect(actionSkeleton).toBeInTheDocument();
  });
});

describe('Skeleton Components Integration', () => {
  it('should render multiple skeleton types together', () => {
    const { container } = render(
      <div>
        <Skeleton className="mb-4" />
        <BalanceCardSkeleton />
        <ActionCardSkeleton />
      </div>
    );

    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBeGreaterThan(3);
  });

  it('should all have loading accessibility', () => {
    const { container } = render(
      <div>
        <Skeleton />
        <BalanceCardSkeleton />
        <ActionCardSkeleton />
      </div>
    );

    const skeletons = container.querySelectorAll('[role="status"]');
    skeletons.forEach(skeleton => {
      expect(skeleton).toHaveAttribute('aria-label', 'Loading...');
    });
  });
});
