import { HTMLAttributes, ReactNode } from 'react'

export type CardVariant = 'default' | 'bordered' | 'gradient'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white shadow-lg',
  bordered: 'bg-white border-2 border-gray-200',
  gradient: 'bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg',
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  variant = 'default',
  padding = 'lg',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`mt-4 ${className}`}>{children}</div>
}
