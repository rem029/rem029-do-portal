'use client'

import React from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
  title?: string
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/**
 * Two/three-way toggle used inside report card headers. Flat: the active
 * segment reads through elevation + a hairline, never a resting shadow.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded border border-(--theme-elevation-200) p-0.5 bg-(--theme-elevation-100)"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            title={opt.title}
            aria-pressed={active}
            onClick={() => !opt.disabled && onChange(opt.value)}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--theme-success-500) ${
              opt.disabled
                ? 'text-(--theme-elevation-400) cursor-not-allowed'
                : active
                  ? 'bg-(--theme-elevation-0) text-(--theme-elevation-900) border border-(--theme-elevation-200) cursor-pointer'
                  : 'text-(--theme-elevation-600) hover:text-(--theme-elevation-900) cursor-pointer'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
