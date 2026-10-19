import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '@/lib/utils/cn'
import { buttonBase, buttonSizes, buttonVariants, type ButtonSize, type ButtonVariant } from './Button'

/** A router link styled as a button (navigation stays a link for a11y and middle-click). */
export function LinkButton({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  block,
  className,
  children,
  ...rest
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize; icon?: ReactNode; iconRight?: ReactNode; block?: boolean }) {
  return (
    <Link className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], block && 'w-full', className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </Link>
  )
}
