'use client'
import React, { useEffect, useState } from 'react'
import { getCutoffSettings } from './action'

interface CutoffNoticeProps {
  settingsSlug: string
}

const CutoffNotice: React.FC<CutoffNoticeProps> = ({ settingsSlug }) => {
  const [cutoffDay, setCutoffDay] = useState<number>(15)
  const [isAfterCutoff, setIsAfterCutoff] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const __hide = true // Set to false to disable

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getCutoffSettings(settingsSlug)
        const day = data.cutoffDay
        setCutoffDay(day)

        const currentDay = new Date().getDate()
        setIsAfterCutoff(currentDay > day)
      } catch (error) {
        console.error('Error fetching cutoff settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [settingsSlug])

  if (loading) {
    return null
  }

  const currentDay = new Date().getDate()

  if (__hide) return <></>

  return (
    <div
      style={{
        padding: '1rem',
        marginBottom: '1rem',
        borderRadius: '4px',
        border: `1px solid ${isAfterCutoff ? 'var(--theme-error-500)' : 'var(--theme-success-500)'}`,
        backgroundColor: isAfterCutoff ? 'var(--theme-error-50)' : 'var(--theme-success-50)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span
          style={{
            fontSize: '1.25rem',
          }}
        >
          {isAfterCutoff ? '⚠️' : 'ℹ️'}
        </span>
        <strong
          style={{
            color: isAfterCutoff ? 'var(--theme-error-700)' : 'var(--theme-success-700)',
          }}
        >
          Monthly Cutoff Notice
        </strong>
      </div>
      <div
        style={{
          fontSize: '0.875rem',
          color: isAfterCutoff ? 'var(--theme-error-700)' : 'var(--theme-success-700)',
        }}
      >
        {isAfterCutoff ? (
          <>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Creating and updating forms is restricted.</strong>
            </p>
            <p style={{ margin: 0 }}>
              The monthly cutoff day is the <strong>{cutoffDay}th</strong>. Today is the{' '}
              <strong>{currentDay}th</strong>. Only users in final approval steps can make changes
              after the cutoff day.
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              You can create and update forms until the <strong>{cutoffDay}th</strong> of the month.
            </p>
            <p style={{ margin: 0 }}>
              Today is the <strong>{currentDay}th</strong>. You have{' '}
              <strong>{cutoffDay - currentDay}</strong> day(s) remaining.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default CutoffNotice
