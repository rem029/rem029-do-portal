'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { HaccpDryStore } from '@/payload-types'
import { isHicpDocumentLocked } from '../utils/permissions'
import { FormActions } from '@/common/components/haccp/form-actions'
import { HaccpExportButton } from '@/common/components/haccp/utils/export-button'
import { BASE_PATH } from '@/utilities/constant'

type DryStoreEntry = NonNullable<HaccpDryStore['dailyEntries']>[number]

interface OutletOption {
  id: string
  name: string
}

interface DryStoreClientProps {
  initialData?: any
  documentId?: string
  saveAction: (formData: {
    outlet: string
    monthYear: string
    dailyEntries: any[]
    status: any
  }) => Promise<{ success: boolean; error?: string; docId?: string | number }>
  isPicUser?: boolean
  isHicUser?: boolean
  isSuperUser?: boolean
  workflowType?: '2-step' | '3-step'
}

export default function HaccpDryStoreClientView({
  initialData,
  documentId,
  saveAction,
  isPicUser = false,
  isHicUser = false,
  isSuperUser = false,
  workflowType = '3-step',
}: DryStoreClientProps) {
  const router = useRouter()
  const [outlets, setOutlets] = useState<OutletOption[]>([])
  const [currentDocId, setCurrentDocId] = useState<string | undefined>(documentId)

  const initialOutletId = initialData?.outlet
    ? typeof initialData.outlet === 'object'
      ? initialData.outlet.id
      : initialData.outlet
    : ''

  const [outlet, setOutlet] = useState(initialOutletId)

  const getCurrentMonthYear = () => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    return `${month}-${year}`
  }

  const [monthYear, setMonthYear] = useState(initialData?.monthYear || getCurrentMonthYear())

  const [status, setStatus] = useState<string>(
    initialData?.status ? initialData.status.toLowerCase() : 'draft',
  )

  const [dailyEntries, setDailyEntries] = useState<DryStoreEntry[]>(
    initialData?.dailyEntries && initialData.dailyEntries.length > 0
      ? initialData.dailyEntries
      : Array.from({ length: 31 }, (_, i) => ({
          day: i + 1,
          tempAm: null,
          humidityAm: null,
          tempPm: null,
          humidityPm: null,
          correctiveAction: '',
          initials: '',
        })),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Document-level read-only constraint for data inputs
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

  // Background Autosave Effect when Outlet is chosen on a new form
  useEffect(() => {
    if (outlet && (!currentDocId || currentDocId === 'create') && !isSubmitting) {
      const triggerAutosave = async () => {
        setIsSubmitting(true)
        try {
          const payloadData = {
            outlet,
            monthYear: monthYear || '08-2026',
            dailyEntries: dailyEntries.map(({ id, ...rest }) => rest),
            status: 'draft',
          }

          const result = await saveAction(payloadData)
          if (result?.success && result?.docId) {
            setCurrentDocId(String(result.docId))
            router.replace(`/admin/collections/haccp-dry-store/${result.docId}`)
          }
        } catch (err) {
          console.error('Autosave failed:', err)
        } finally {
          setIsSubmitting(false)
        }
      }
      triggerAutosave()
    }
  }, [outlet])

  const handleEntryChange = <K extends keyof DryStoreEntry>(
    index: number,
    field: K,
    value: DryStoreEntry[K],
  ) => {
    const dayNum = index + 1
    if (!isRowEditable(dayNum)) return

    setDailyEntries((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSave = async (targetStatus: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Allow workflow and review actions even if data inputs are locked for oversight roles
    const isWorkflowAction =
      targetStatus === 'verified' ||
      targetStatus === 'pending-pic-approval' ||
      targetStatus === 'pending-hic-verification' ||
      targetStatus === 'draft'

    if (status === 'verified' && targetStatus !== 'draft' && !isSuperUser) return

    setErrorMessage(null)

    if (!outlet) {
      setErrorMessage('Please select an Outlet before saving.')
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
        monthYear: monthYear || '08-2026',
        dailyEntries: dailyEntries.map(({ id, ...rest }) => rest),
        status: targetStatus,
      }

      const result = await saveAction(payloadData)

      if (result?.success) {
        setStatus(targetStatus)
        if ((!currentDocId || currentDocId === 'create') && result?.docId) {
          setCurrentDocId(String(result.docId))
          router.replace(`/admin/collections/haccp-dry-store/${result.docId}`)
        } else {
          router.push('/admin/collections/haccp-dry-store')
          router.refresh()
        }
      } else {
        setErrorMessage(result?.error || 'Failed to save dry store log.')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while saving.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectStyle: React.CSSProperties = {
    padding: '8px 32px 8px 10px',
    borderRadius: '6px',
    border: '1px solid var(--theme-elevation-250)',
    background: isDataReadOnly ? 'var(--theme-elevation-100)' : 'var(--theme-elevation-0)',
    color: 'var(--theme-text)',
    fontSize: '14px',
    appearance: 'none',
    backgroundImage: isDataReadOnly
      ? 'none'
      : `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '14px',
    width: '100%',
    cursor: isDataReadOnly ? 'not-allowed' : 'pointer',
    opacity: isDataReadOnly ? 0.7 : 1,
  }

  const getInputStyle = (rowLocked: boolean): React.CSSProperties => ({
    padding: '8px 10px',
    width: '100%',
    borderRadius: '6px',
    border: '1px solid var(--theme-elevation-250)',
    background: rowLocked ? 'var(--theme-elevation-100)' : 'var(--theme-elevation-0)',
    color: 'var(--theme-text)',
    fontSize: '14px',
    cursor: rowLocked ? 'not-allowed' : 'text',
    opacity: rowLocked ? 0.6 : 1,
  })

  return (
    <div
      style={{
        padding: '32px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        minHeight: '80vh',
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
            Dry Store Temperature &amp; Humidity Log
          </h2>
          <p style={{ color: 'var(--theme-elevation-600)', margin: 0, fontSize: '14px' }}>
            Document No: DO-FSMS-FRM-13 | Limits: Temp &lt; 25°C, Humidity &lt; 65%
          </p>
        </div>
        <HaccpExportButton slug="haccp-dry-store" label="Download CSV" />
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
        <div
          style={{
            display: 'flex',
            gap: '20px',
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            padding: '20px',
            borderRadius: '10px',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
            >
              Outlet <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={outlet}
              onChange={(e) => setOutlet(e.target.value)}
              disabled={isDataReadOnly}
              style={selectStyle}
            >
              <option value="">Select Outlet...</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name || o.id}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
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
              style={getInputStyle(isDataReadOnly)}
            />
          </div>

          <div style={{ width: '220px' }}>
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
                ...getInputStyle(true),
                background: 'var(--theme-elevation-100)',
                cursor: 'not-allowed',
              }}
            />
          </div>
        </div>

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
                textAlign: 'left',
                minWidth: '1100px',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--theme-elevation-200)',
                    background: 'var(--theme-elevation-100)',
                    fontSize: '13px',
                    color: 'var(--theme-elevation-800)',
                  }}
                >
                  <th style={{ padding: '14px 16px', width: '70px' }}>Day</th>
                  <th style={{ padding: '14px 12px', width: '130px' }}>AM Temp (°C)</th>
                  <th style={{ padding: '14px 12px', width: '140px' }}>AM Humidity (%)</th>
                  <th style={{ padding: '14px 12px', width: '140px' }}>PM Temp (°C)</th>
                  <th style={{ padding: '14px 12px', width: '140px' }}>PM Humidity (%)</th>
                  <th style={{ padding: '14px 16px' }}>Corrective Action</th>
                  <th style={{ padding: '14px 12px', width: '100px' }}>Initials</th>
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
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{dayNum}</td>
                      <td style={{ padding: '12px 12px' }}>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="-- "
                          value={entry.tempAm ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              'tempAm',
                              e.target.value === '' ? null : Number(e.target.value),
                            )
                          }
                          style={getInputStyle(rowLocked)}
                        />
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <input
                          type="number"
                          step="1"
                          placeholder="-- "
                          value={entry.humidityAm ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              'humidityAm',
                              e.target.value === '' ? null : Number(e.target.value),
                            )
                          }
                          style={getInputStyle(rowLocked)}
                        />
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="-- "
                          value={entry.tempPm ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              'tempPm',
                              e.target.value === '' ? null : Number(e.target.value),
                            )
                          }
                          style={getInputStyle(rowLocked)}
                        />
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <input
                          type="number"
                          step="1"
                          placeholder="-- "
                          value={entry.humidityPm ?? ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              'humidityPm',
                              e.target.value === '' ? null : Number(e.target.value),
                            )
                          }
                          style={getInputStyle(rowLocked)}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="text"
                          placeholder="Action if out of limit..."
                          value={entry.correctiveAction || ''}
                          disabled={rowLocked}
                          onChange={(e) =>
                            handleEntryChange(index, 'correctiveAction', e.target.value)
                          }
                          style={getInputStyle(rowLocked)}
                        />
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <input
                          type="text"
                          placeholder="Initials"
                          value={entry.initials || ''}
                          disabled={rowLocked}
                          onChange={(e) => handleEntryChange(index, 'initials', e.target.value)}
                          style={getInputStyle(rowLocked)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

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
