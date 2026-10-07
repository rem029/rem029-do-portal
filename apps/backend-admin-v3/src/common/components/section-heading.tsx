'use client'

import React from 'react'

interface SectionHeadingProps {
  title?: string
  description?: string
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, description }) => {
  if (!title) return null

  return (
    <div className="field-type ui mb-4 pt-2">
      <h4 className="m-0 text-xl sm:text-2xl font-[var(--admin-font-primary)]! font-normal! tracking-tight text-[var(--theme-elevation-800)] opacity-60">
        {title}
      </h4>
      {description && (
        <p className="m-0 mt-1 text-xs text-[var(--theme-elevation-400)]">
          {description}
        </p>
      )}
    </div>
  )
}

export default SectionHeading
