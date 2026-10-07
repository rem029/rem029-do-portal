'use client'

import { useFormFields } from '@payloadcms/ui'

interface MultiplierProps {
  fieldPath: string
  multiplier: number
  label: string
}

const Multiplier: React.FC<MultiplierProps> = ({ fieldPath, multiplier, label }) => {
  const fieldValue = useFormFields(([fields]) => fields[fieldPath]?.value as number)

  const calculatedValue = fieldValue ? fieldValue * multiplier : 0

  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        style={{
          display: 'block',
          fontWeight: '600',
          marginBottom: '8px',
          fontSize: '14px',
          color: '#333',
        }}
      >
        {label}
      </label>
      <div
        style={{
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          fontSize: '16px',
          fontWeight: '500',
          color: '#007bff',
        }}
      >
        {calculatedValue.toFixed(2)} QAR
      </div>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
        Calculated as: {fieldValue?.toFixed(2) || 0} × {multiplier}
      </p>
    </div>
  )
}

export default Multiplier
