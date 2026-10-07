'use client'

import React, { useState } from 'react'
import { seedSalaryDeductionDataAction } from './actions'
import { Gutter } from '@payloadcms/ui'

const SeedButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSeed = async () => {
    if (
      !confirm(
        'Are you sure you want to seed 10 dummy records? This will add data to your database.',
      )
    ) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const resp = await seedSalaryDeductionDataAction()
      setResult(resp)
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'An unexpected error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        marginBottom: '20px',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
      data-theme="dohaoasis-new"
    >
      <h4 style={{ marginTop: 0 }}>Seed Dummy Data</h4>
      <p>
        Click the button below to generate 10 dummy salary deduction records for development and
        testing. This is only available in <strong>development</strong> mode.
      </p>

      <button
        onClick={handleSeed}
        disabled={loading}
        className={`btn btn-outline ${loading ? 'btn-disabled' : 'btn-primary'}`}
        style={{
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Seeding Data...' : 'Seed 10 Dummy Records'}
      </button>

      {result && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
            color: result.success ? '#155724' : '#721c24',
            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {result.message}
        </div>
      )}
    </div>
  )
}

export default SeedButton
