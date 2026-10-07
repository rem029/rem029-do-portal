'use client'
import React from 'react'
import { useFormFields } from '@payloadcms/ui'

interface TotalUIProps {
  fieldPaths: string[]
  label?: string
  variant?: 'default' | 'highlight'
  isMultiplication?: boolean
  isCurrency?: boolean // The new hero prop
}

const TotalUI: React.FC<TotalUIProps> = ({
  fieldPaths,
  label = 'Total',
  variant = 'default',
  isMultiplication = false,
  isCurrency = true, // Default to true so existing totals don't break
}) => {
  const total = useFormFields(([fields]) => {
    if (isMultiplication) {
      const val1 = parseFloat(fields[fieldPaths[0]]?.value as string) || 0
      const val2 = parseFloat(fields[fieldPaths[1]]?.value as string) || 0
      return val1 * val2
    }
    return fieldPaths.reduce(
      (acc, path) => acc + (parseFloat(fields[path]?.value as string) || 0),
      0,
    )
  })

  const isHighlight = variant === 'highlight'

  return (
    <div className="field-type" style={{ marginBottom: isHighlight ? '0' : '20px' }}>
      <label
        className="field-label"
        style={{
          marginBottom: '8px',
          display: 'block',
          fontSize: isHighlight ? '0.9rem' : 'inherit',
        }}
      >
        {label}
      </label>
      <div
        style={{
          padding: isHighlight ? '20px' : '15px',
          border: isHighlight ? '2px solid #DEC37D' : '1px solid #DEC37D',
          borderRadius: '8px',
          backgroundColor: '#143422',
          color: '#DEC37D',
          fontSize: isHighlight ? '1.8rem' : '1.3rem',
          fontWeight: 'bold',
          textAlign: 'right',
          boxShadow: isHighlight ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
          marginBottom: '16px',
        }}
      >
        {/* If it's guests, we don't need .00 decimals either */}
        {total.toLocaleString('en-US', {
          minimumFractionDigits: isCurrency ? 2 : 0,
          maximumFractionDigits: isCurrency ? 2 : 0,
        })}
        {isCurrency ? ' QAR' : ''}
      </div>
    </div>
  )
}

export default TotalUI
