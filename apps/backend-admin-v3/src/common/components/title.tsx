'use client'
import React from 'react'

const Title: React.FC<{ label?: string }> = ({ label }) => {
  return (
    <span className="field-label font-bold text-lg opacity-70 mb-4 block">
      {label || 'NA'}
      {/* <FieldLabel label={label} path={path} as="h3" /> */}
    </span>
  )
}

export default Title
