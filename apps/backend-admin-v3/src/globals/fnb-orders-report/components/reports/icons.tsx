import React from 'react'

/**
 * Small authored icon set for the FnB report surface. Drawn to match Payload's
 * own admin icons: 20-unit viewBox, single `currentColor` stroke, square caps,
 * no fill. Kept local — the report is the only consumer.
 */

type IconProps = {
  className?: string
  size?: number
}

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
  className,
  'aria-hidden': true,
})

export const PrinterIcon: React.FC<IconProps> = ({ className, size = 15 }) => (
  <svg {...base(size, className)}>
    <path d="M6 7V3h8v4" />
    <path d="M6 14H4V8.5A1.5 1.5 0 0 1 5.5 7h9A1.5 1.5 0 0 1 16 8.5V14h-2" />
    <rect x="6" y="12" width="8" height="5" />
  </svg>
)

export const CloseIcon: React.FC<IconProps> = ({ className, size = 13 }) => (
  <svg {...base(size, className)}>
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
)

export const CaretIcon: React.FC<IconProps & { direction?: 'up' | 'down' }> = ({
  className,
  size = 12,
  direction = 'down',
}) => (
  <svg
    {...base(size, className)}
    style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined }}
  >
    <path d="M5 8l5 5 5-5" />
  </svg>
)

export const RefreshIcon: React.FC<IconProps> = ({ className, size = 13 }) => (
  <svg {...base(size, className)}>
    <path d="M15.5 6.5A6 6 0 1 0 16 10" />
    <path d="M16 4v3h-3" />
  </svg>
)
