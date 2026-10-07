'use client'

import React from 'react'

export interface ReportCardProps {
  title: string
  caption?: string
  children?: React.ReactNode
  empty?: boolean
  emptyLabel?: string
  className?: string
  headerRight?: React.ReactNode
  /** Title size + weight; defaults to the FnB report's compact title */
  titleClassName?: string
  captionClassName?: string
}

export const ReportCard: React.FC<ReportCardProps> = ({
  title,
  caption,
  children,
  empty = false,
  emptyLabel,
  className = '',
  headerRight,
  titleClassName = 'text-[13px] font-semibold',
  captionClassName = 'text-xs text-(--theme-elevation-500)',
}) => {
  return (
    <section
      className={`rounded-md border border-(--theme-elevation-150) bg-(--theme-elevation-0) p-4 flex flex-col ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className={`${titleClassName} text-(--theme-elevation-900) m-0 leading-tight`}>
            {title}
          </h3>
          {caption && (
            <p className={`${captionClassName} mt-1 m-0 leading-snug`}>{caption}</p>
          )}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>

      {empty ? (
        <div className="py-6 px-2 text-center text-xs text-(--theme-elevation-400) leading-relaxed">
          {emptyLabel ?? 'No data for this range.'}
        </div>
      ) : (
        children
      )}
    </section>
  )
}
