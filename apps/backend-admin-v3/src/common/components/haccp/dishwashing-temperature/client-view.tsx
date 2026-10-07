'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { HaccpDishwashingTemperature } from '@/payload-types'
import { isHicpDocumentLocked } from '../utils/permissions'
import { FormActions } from '@/common/components/haccp/form-actions'
import { HaccpExportButton } from '@/common/components/haccp/utils/export-button'
import { BASE_PATH } from '@/utilities/constant'

type DailyEntry = NonNullable<HaccpDishwashingTemperature['dailyEntries']>[number]
type WeeklyEntry = NonNullable<HaccpDishwashingTemperature['weeklyDescaling']>[number]
type StatusType = NonNullable<HaccpDishwashingTemperature['status']>

interface OutletOption {
  id: string
  name: string
}

interface DishwasherClientProps {
  initialData?: HaccpDishwashingTemperature | null
  documentId?: string
  saveAction: (formData: {
    outlet: string
    unit: string
    monthYear: string
    dailyEntries: Omit<DailyEntry, 'id'>[]
    weeklyDescaling: Omit<WeeklyEntry, 'id'>[]
    correctiveAction: string
    status: StatusType
  }) => Promise<{ success: boolean; error?: string }>
  isPicUser?: boolean
  isHicUser?: boolean
  isSuperUser?: boolean
  workflowType?: '2-step' | '3-step'
}

export default function DishwashingTemperatureClientView({
  initialData,
  documentId,
  saveAction,
  isPicUser = false,
  isHicUser = false,
  isSuperUser = false,
  workflowType = '3-step',
}: DishwasherClientProps) {
  const router = useRouter()
  const [outlets, setOutlets] = useState<OutletOption[]>([])

  const initialOutletId = initialData?.outlet
    ? typeof initialData.outlet === 'object'
      ? initialData.outlet.id
      : initialData.outlet
    : ''

  const [outlet, setOutlet] = useState(initialOutletId)
  const [unit, setUnit] = useState(initialData?.unit || '')
  const [monthYear, setMonthYear] = useState(initialData?.monthYear || '')
  const [correctiveAction, setCorrectiveAction] = useState(initialData?.correctiveAction || '')

  const [status, setStatus] = useState<StatusType>(
    initialData?.status ? (initialData.status as StatusType) : 'draft',
  )

  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>(
    initialData?.dailyEntries && initialData.dailyEntries.length > 0
      ? initialData.dailyEntries
      : Array.from({ length: 31 }, (_, i) => ({
          day: i + 1,
          breakfastWash: null,
          breakfastFinalRinse: null,
          breakfastInitials: '',
          lunchWash: null,
          lunchFinalRinse: null,
          lunchInitials: '',
          dinnerWash: null,
          dinnerFinalRinse: null,
          dinnerInitials: '',
          supperWash: null,
          supperFinalRinse: null,
          supperInitials: '',
          cleanlinessWashArms: '',
          cleanlinessInsideMachine: '',
        })),
  )

  const [weeklyDescaling, setWeeklyDescaling] = useState<WeeklyEntry[]>(
    initialData?.weeklyDescaling && initialData.weeklyDescaling.length > 0
      ? initialData.weeklyDescaling
      : Array.from({ length: 4 }, (_, i) => ({
          weekNumber: i + 1,
          date: '',
          descalingSignature: '',
        })),
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isDataReadOnly = isHicpDocumentLocked({
    status,
    workflowType,
    isHicUser,
    isPicUser,
    isSuperUser,
  })

  const isRowEditable = (dayNumber: number) => {
    if (isSuperUser) return true
    if (isDataReadOnly) return false

    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0')
    const currentYear = today.getFullYear()
    const currentMonthYearStr = `${currentMonth}-${currentYear}`

    if (monthYear && monthYear.trim() !== currentMonthYearStr) {
      return false
    }

    return dayNumber === currentDay
  }

  useEffect(() => {
    if (initialData?.outlet) {
      const resolvedOutletId =
        typeof initialData.outlet === 'object' ? initialData.outlet.id : initialData.outlet
      setOutlet(resolvedOutletId)
    }
  }, [initialData])

  useEffect(() => {
    async function fetchOutlets() {
      try {
        const res = await fetch(`${BASE_PATH}/api/outlets?limit=100&depth=0`)
        if (res.ok) {
          const data = await res.json()
          setOutlets(data.docs || [])
        } else {
          console.error('Failed to load outlets', res.status)
        }
      } catch (err) {
        console.error('Failed to load outlets:', err)
      }
    }
    fetchOutlets()
  }, [])

  const handleDailyChange = <K extends keyof DailyEntry>(
    index: number,
    field: K,
    value: DailyEntry[K],
  ) => {
    const dayNum = index + 1
    if (!isRowEditable(dayNum)) return

    setDailyEntries((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleWeeklyChange = <K extends keyof WeeklyEntry>(
    index: number,
    field: K,
    value: WeeklyEntry[K],
  ) => {
    if (isDataReadOnly) return
    setWeeklyDescaling((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSave = async (targetStatus: StatusType, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (status === 'verified' && targetStatus !== 'draft' && !isSuperUser) return

    setErrorMessage(null)

    if (!outlet) {
      setErrorMessage('Please select an Outlet / Location before saving.')
      return
    }
    if (!monthYear.trim()) {
      setErrorMessage('Please enter the Month & Year (MM-YYYY) before saving.')
      return
    }

    setIsSubmitting(true)
    try {
      const payloadData = {
        outlet,
        unit,
        monthYear: monthYear || '08-2026',
        dailyEntries: dailyEntries.map(({ id, ...rest }) => rest),
        weeklyDescaling: weeklyDescaling.map(({ id, ...rest }) => rest),
        correctiveAction,
        status: targetStatus,
      }

      const result = await saveAction(payloadData)

      if (result?.success) {
        setStatus(targetStatus)
        router.push('/admin/collections/haccp-dishwashing-temperature')
        router.refresh()
      } else {
        setErrorMessage(result?.error || 'Failed to save dishwasher record.')
      }
    } catch (err: unknown) {
      const error = err as Error
      setErrorMessage(error?.message || 'An unexpected error occurred while saving.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 8px',
    width: '100%',
    borderRadius: '4px',
    border: '1px solid var(--theme-elevation-250)',
    background: isDataReadOnly ? 'var(--theme-elevation-100)' : 'var(--theme-elevation-0)',
    color: 'var(--theme-text)',
    fontSize: '13px',
    cursor: isDataReadOnly ? 'not-allowed' : 'text',
    opacity: isDataReadOnly ? 0.7 : 1,
  }

  const getMatrixInputStyle = (rowLocked: boolean): React.CSSProperties => ({
    padding: '4px 2px',
    width: '100%',
    textAlign: 'center',
    borderRadius: '4px',
    border: '1px solid var(--theme-elevation-250)',
    background: rowLocked ? 'var(--theme-elevation-100)' : 'var(--theme-elevation-0)',
    color: 'var(--theme-text)',
    fontSize: '11px',
    cursor: rowLocked ? 'not-allowed' : 'text',
    opacity: rowLocked ? 0.6 : 1,
  })

  const selectStyle: React.CSSProperties = {
    padding: '8px 32px 8px 10px',
    borderRadius: '6px',
    border: '1px solid var(--theme-elevation-250)',
    backgroundColor: isDataReadOnly ? 'var(--theme-elevation-100)' : 'var(--theme-elevation-0)',
    backgroundImage: isDataReadOnly ? 'none' : `url(...)`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '14px',
    color: 'var(--theme-text)',
    fontSize: '14px',
    appearance: 'none',
    width: '100%',
    cursor: isDataReadOnly ? 'not-allowed' : 'pointer',
    opacity: isDataReadOnly ? 0.7 : 1,
  }

  return (
    <div
      style={{
        padding: '32px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        color: 'var(--theme-text)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>
            Dishwasher / Glass Washer Temperature Monitoring Record
          </h2>
          <p style={{ color: 'var(--theme-elevation-600)', margin: 0, fontSize: '14px' }}>
            Critical Limits: Wash Cycle &ge; 55°C | Final Rinse &ge; 82°C
          </p>
        </div>
        <HaccpExportButton slug="haccp-dishwashing-temperature" label="Download CSV" />
      </div>

      {errorMessage && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#991B1B',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            padding: '20px',
            borderRadius: '10px',
            alignItems: 'center',
          }}
        >
          <div>
            <label
              style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
            >
              Unit / Machine ID
            </label>
            <input
              type="text"
              placeholder="e.g. Dishwasher #1"
              value={unit}
              disabled={isDataReadOnly}
              onChange={(e) => setUnit(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
            >
              Outlet / Location <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={outlet}
              onChange={(e) => setOutlet(e.target.value)}
              disabled={isDataReadOnly}
              style={selectStyle}
            >
              <option value="">Select Location...</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name || o.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
            >
              Month &amp; Year (MM-YYYY) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 08-2026"
              value={monthYear}
              disabled={isDataReadOnly}
              onChange={(e) => setMonthYear(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
            >
              Status
            </label>
            <input
              type="text"
              readOnly
              value={status}
              style={{
                ...inputStyle,
                background: 'var(--theme-elevation-100)',
                cursor: 'not-allowed',
              }}
            />
          </div>
        </div>

        {/* 31-Day Matrix Table */}
        <div
          style={{
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'center',
                minWidth: '950px',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--theme-elevation-100)',
                    borderBottom: '1px solid var(--theme-elevation-200)',
                  }}
                >
                  <th
                    rowSpan={2}
                    style={{
                      padding: '8px 4px',
                      width: '40px',
                      borderRight: '1px solid var(--theme-elevation-200)',
                    }}
                  >
                    Date
                  </th>
                  <th
                    colSpan={3}
                    style={{ padding: '6px', borderRight: '1px solid var(--theme-elevation-200)' }}
                  >
                    Breakfast
                  </th>
                  <th
                    colSpan={3}
                    style={{ padding: '6px', borderRight: '1px solid var(--theme-elevation-200)' }}
                  >
                    Lunch
                  </th>
                  <th
                    colSpan={3}
                    style={{ padding: '6px', borderRight: '1px solid var(--theme-elevation-200)' }}
                  >
                    Dinner
                  </th>
                  <th
                    colSpan={3}
                    style={{ padding: '6px', borderRight: '1px solid var(--theme-elevation-200)' }}
                  >
                    Supper
                  </th>
                  <th colSpan={2} style={{ padding: '6px' }}>
                    Cleanliness
                  </th>
                </tr>
                <tr
                  style={{
                    background: 'var(--theme-elevation-100)',
                    borderBottom: '1px solid var(--theme-elevation-200)',
                    fontSize: '10px',
                  }}
                >
                  <th style={{ padding: '4px 2px', width: '50px' }}>Wash</th>
                  <th style={{ padding: '4px 2px', width: '50px' }}>Rinse</th>
                  <th
                    style={{
                      padding: '4px 2px',
                      width: '40px',
                      borderRight: '1px solid var(--theme-elevation-200)',
                    }}
                  >
                    Init
                  </th>
                  <th style={{ padding: '4px 2px', width: '50px' }}>Wash</th>
                  <th style={{ padding: '4px 2px', width: '50px' }}>Rinse</th>
                  <th
                    style={{
                      padding: '4px 2px',
                      width: '40px',
                      borderRight: '1px solid var(--theme-elevation-200)',
                    }}
                  >
                    Init
                  </th>
                  <th style={{ padding: '4px 2px', width: '50px' }}>Wash</th>
                  <th style={{ padding: '4px 2px', width: '50px' }}>Rinse</th>
                  <th
                    style={{
                      padding: '4px 2px',
                      width: '40px',
                      borderRight: '1px solid var(--theme-elevation-200)',
                    }}
                  >
                    Init
                  </th>
                  <th style={{ padding: '4px 2px', width: '50px' }}>Wash</th>
                  <th style={{ padding: '4px 2px', width: '50px' }}>Rinse</th>
                  <th
                    style={{
                      padding: '4px 2px',
                      width: '40px',
                      borderRight: '1px solid var(--theme-elevation-200)',
                    }}
                  >
                    Init
                  </th>
                  <th style={{ padding: '4px 2px', width: '70px' }}>Wash Arms</th>
                  <th style={{ padding: '4px 2px', width: '70px' }}>Inside Mach.</th>
                </tr>
              </thead>
              <tbody>
                {dailyEntries.map((entry, index) => {
                  const dayNum = index + 1
                  const rowLocked = !isRowEditable(dayNum)

                  return (
                    <tr
                      key={dayNum}
                      style={{
                        borderBottom: '1px solid var(--theme-elevation-150)',
                        background: rowLocked ? 'rgba(0,0,0,0.02)' : 'transparent',
                      }}
                    >
                      <td
                        style={{
                          padding: '6px 4px',
                          fontWeight: 600,
                          borderRight: '1px solid var(--theme-elevation-150)',
                        }}
                      >
                        {dayNum}
                      </td>

                      {/* Breakfast */}
                      <td style={{ padding: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={entry.breakfastWash ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(
                              index,
                              'breakfastWash',
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={entry.breakfastFinalRinse ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(
                              index,
                              'breakfastFinalRinse',
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>
                      <td
                        style={{
                          padding: '4px',
                          borderRight: '1px solid var(--theme-elevation-150)',
                        }}
                      >
                        <input
                          type="text"
                          value={entry.breakfastInitials || ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(index, 'breakfastInitials', e.target.value)
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>

                      {/* Lunch */}
                      <td style={{ padding: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={entry.lunchWash ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(
                              index,
                              'lunchWash',
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={entry.lunchFinalRinse ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(
                              index,
                              'lunchFinalRinse',
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>
                      <td
                        style={{
                          padding: '4px',
                          borderRight: '1px solid var(--theme-elevation-150)',
                        }}
                      >
                        <input
                          type="text"
                          value={entry.lunchInitials || ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(index, 'lunchInitials', e.target.value)
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>

                      {/* Dinner */}
                      <td style={{ padding: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={entry.dinnerWash ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(
                              index,
                              'dinnerWash',
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={entry.dinnerFinalRinse ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(
                              index,
                              'dinnerFinalRinse',
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>
                      <td
                        style={{
                          padding: '4px',
                          borderRight: '1px solid var(--theme-elevation-150)',
                        }}
                      >
                        <input
                          type="text"
                          value={entry.dinnerInitials || ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(index, 'dinnerInitials', e.target.value)
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>

                      {/* Supper */}
                      <td style={{ padding: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={entry.supperWash ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(
                              index,
                              'supperWash',
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={entry.supperFinalRinse ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(
                              index,
                              'supperFinalRinse',
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>
                      <td
                        style={{
                          padding: '4px',
                          borderRight: '1px solid var(--theme-elevation-150)',
                        }}
                      >
                        <input
                          type="text"
                          value={entry.supperInitials || ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(index, 'supperInitials', e.target.value)
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>

                      {/* Cleanliness */}
                      <td style={{ padding: '4px' }}>
                        <input
                          type="text"
                          value={entry.cleanlinessWashArms || ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(index, 'cleanlinessWashArms', e.target.value)
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="text"
                          value={entry.cleanlinessInsideMachine || ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleDailyChange(index, 'cleanlinessInsideMachine', e.target.value)
                          }
                          style={getMatrixInputStyle(rowLocked)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly Descaling Section */}
        <div
          style={{
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            padding: '20px',
            borderRadius: '10px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>
            Weekly Descaling Log
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {weeklyDescaling.map((week, index) => (
              <div
                key={week.weekNumber}
                style={{
                  background: 'var(--theme-elevation-0)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--theme-elevation-200)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px' }}>
                  Week {week.weekNumber}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Date (DD-MM)"
                    value={week.date || ''}
                    disabled={isDataReadOnly}
                    onChange={(e) => handleWeeklyChange(index, 'date', e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Descaling Signature / Initials"
                    value={week.descalingSignature || ''}
                    disabled={isDataReadOnly}
                    onChange={(e) =>
                      handleWeeklyChange(index, 'descalingSignature', e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corrective Action */}
        <div
          style={{
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            padding: '20px',
            borderRadius: '10px',
          }}
        >
          <label
            style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
          >
            Corrective Action (if any)
          </label>
          <textarea
            rows={3}
            placeholder="Describe corrective actions taken for out-of-limit temperatures..."
            value={correctiveAction}
            disabled={isDataReadOnly}
            onChange={(e) => setCorrectiveAction(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Global Form Actions - 3-Step Workflow with PIC Re-check Support */}
        <FormActions
          status={status}
          workflowType={workflowType}
          isPicUser={isPicUser}
          isHicUser={isHicUser}
          isSuperUser={isSuperUser}
          isSubmitting={isSubmitting}
          onSaveDraft={(e) => handleSave('draft', e)}
          onSubmitToPic={(e) => handleSave('pending-pic-approval', e)}
          onRequestRecheck={(e) => handleSave('draft', e)}
          onRequestRecheckToPic={(e) => handleSave('pending-pic-approval', e)}
          onSubmitToHic={(e) => handleSave('pending-hic-verification', e)}
          onVerify={(e) => handleSave('verified', e)}
        />
      </div>
    </div>
  )
}
