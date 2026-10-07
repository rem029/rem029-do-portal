'use client'
import React, { useMemo } from 'react'
import { useFormFields } from '@payloadcms/ui'

interface TotalSalaryProps {
  fieldPaths: string[]
  label?: string
}

const TotalSalary: React.FC<TotalSalaryProps> = ({ fieldPaths, label = 'Total Salary' }) => {
  // Get all field values at once
  const fields = useFormFields(([fields]) => {
    return fieldPaths.reduce(
      (acc, path) => {
        acc[path] = fields[path]?.value
        return acc
      },
      {} as Record<string, any>,
    )
  })

  // Calculate total using useMemo to avoid infinite re-renders
  const total = useMemo(() => {
    return fieldPaths.reduce((acc, path) => {
      const val = parseFloat(fields[path]) || 0
      return acc + val
    }, 0)
  }, [fieldPaths, fields])

  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '4px',
        backgroundColor: 'var(--theme-elevation-50)',
        marginTop: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{ fontSize: '0.8rem', color: 'var(--theme-elevation-500)', marginBottom: '0.5rem' }}
      >
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR
      </div>
    </div>
  )
}

export default TotalSalary
