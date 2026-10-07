import React from 'react'

interface SidebarSectionHeaderProps {
  label?: string
}

export const SidebarSectionHeader: React.FC<SidebarSectionHeaderProps> = ({ label }) => {
  return (
    <div
      style={{
        margin: '1rem 0 1.5rem 0',
        padding: 0,
      }}
    >
      <h3
        style={{
          fontSize: '20px',
          fontWeight: '600',
          lineHeight: '24px',
          color: 'var(--theme-elevation-800, #f8fafc)',
          margin: 0,
          fontFamily: 'inherit',
        }}
      >
        {label || 'Section Header'}
      </h3>
    </div>
  )
}

export default SidebarSectionHeader
