'use client'
import React from 'react'
import type { TextFieldClientComponent } from 'payload'

export type HelperTextProps = {
  description: string
}

const HelperText: TextFieldClientComponent = (props) => {
  // Access clientProps from props
  const { description } = (props as any as HelperTextProps) || {}

  return (
    <div className="field-type text">
      <label className="field-label">
        <span>{description}</span>
      </label>
    </div>
  )
}

export default HelperText
