'use client'
import React, { useState } from 'react'
import { exportBookings } from '@/collections/trip-scheduling-bookings/actions/export-bookings'
import { exportAdhoc } from '@/collections/trip-scheduling-adhoc/actions/export-adhoc'
import { addMissingDefaultData } from '@/collections/trip-scheduling/actions/add-missing-default-data'

const DataTools: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const handleExport = async (target: 'bookings' | 'adhoc') => {
    setLoading(true)
    try {
      const res =
        target === 'bookings'
          ? await exportBookings()
          : await exportAdhoc()

      if (!res.success || !res.csvContent) {
        alert(res.error || 'Export failed')
        return
      }

      const blob = new Blob([res.csvContent], { type: 'text/csv; charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename || `trip-${target}-export.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Connection error during export')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    if (
      !confirm(
        "Creates any default trip-scheduling records that don't exist yet. Existing records are never changed or deleted.",
      )
    )
      return
    setLoading(true)
    try {
      const res = await addMissingDefaultData()
      if (res.success) {
        alert(res.message || 'Seeding completed successfully')
        window.location.reload()
      } else {
        alert(res.error || 'Seeding failed')
      }
    } catch (err) {
      console.error(err)
      alert('Connection error during seeding')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    marginTop: '16px',
    color: '#85754E',
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  }

  return (
    <div className="data-tools-container">
      <p style={labelStyle}>Guest & Corporate Bookings</p>
      <div style={rowStyle}>
        <button
          type="button"
          className="btn btn--style-primary btn--size-small"
          onClick={() => handleExport('bookings')}
          style={{ flex: 1, fontSize: '11px', cursor: 'pointer' }}
          disabled={loading}
        >
          Export CSV
        </button>
      </div>

      <p style={labelStyle}>Employee Adhoc Requests</p>
      <div style={rowStyle}>
        <button
          type="button"
          className="btn btn--style-primary btn--size-small"
          onClick={() => handleExport('adhoc')}
          style={{ flex: 1, fontSize: '11px', cursor: 'pointer' }}
          disabled={loading}
        >
          Export CSV
        </button>
      </div>

      <p style={labelStyle}>System Actions</p>
      <div style={{ ...rowStyle, marginBottom: 0 }}>
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          onClick={handleSeed}
          style={{ flex: 1, fontSize: '11px', cursor: 'pointer' }}
          disabled={loading}
        >
          Add missing default data
        </button>
      </div>
    </div>
  )
}

export default DataTools
