'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { HaccpBuffetTemperature } from '@/payload-types'
import { isHicpDocumentLocked } from '../utils/permissions'
import { FormActions } from '@/common/components/haccp/form-actions'
import { HaccpExportButton } from '@/common/components/haccp/utils/export-button'
import { BASE_PATH } from '@/utilities/constant'

type FoodItemLog = NonNullable<HaccpBuffetTemperature['items']>[number]

interface OutletOption {
  id: string
  name: string
}

interface BuffetTemperatureClientProps {
  initialData?: any
  documentId?: string
  saveAction: (formData: {
    outlet: string
    date: string
    functionType: string
    items: any[]
    status: any
  }) => Promise<{ success: boolean; error?: string; docId?: string | number }>
  isPicUser?: boolean
  isHicUser?: boolean
  isSuperUser?: boolean
  workflowType?: '2-step' | '3-step'
}

export default function BuffetTemperatureClientView({
  initialData,
  documentId,
  saveAction,
  isPicUser = false,
  isHicUser = false,
  isSuperUser = false,
  workflowType = '3-step',
}: BuffetTemperatureClientProps) {
  const router = useRouter()
  const [outlets, setOutlets] = useState<OutletOption[]>([])
  const [currentDocId, setCurrentDocId] = useState<string | undefined>(documentId)

  const initialOutletId = initialData?.outlet
    ? typeof initialData.outlet === 'object'
      ? initialData.outlet.id
      : initialData.outlet
    : ''

  const [outlet, setOutlet] = useState(initialOutletId)
  const [date, setDate] = useState(
    initialData?.date
      ? new Date(initialData.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  )
  const [functionType, setFunctionType] = useState(initialData?.functionType || '')
  const [status, setStatus] = useState<string>(
    initialData?.status ? initialData.status.toLowerCase() : 'draft',
  )

  const [items, setItems] = useState<FoodItemLog[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [
          {
            foodItem: '',
            pickupTime: '',
            initialTemp: 0,
            tempAfter2Hrs: undefined,
            tempAfter4Hrs: undefined,
            correctiveAction: 'none',
            initials: '',
          },
        ],
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Document-level read-only constraint for data inputs matching dry-store/dishwashing
  const isDataReadOnly = isHicpDocumentLocked({
    status,
    workflowType,
    isHicUser,
    isPicUser,
    isSuperUser,
  })

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

  const handleAddRow = () => {
    if (isDataReadOnly) return
    setItems((prev) => [
      ...prev,
      {
        foodItem: '',
        pickupTime: '',
        initialTemp: 0,
        tempAfter2Hrs: undefined,
        tempAfter4Hrs: undefined,
        correctiveAction: 'none',
        initials: '',
      },
    ])
  }

  const handleRemoveRow = (index: number) => {
    if (isDataReadOnly) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = <K extends keyof FoodItemLog>(
    index: number,
    field: K,
    value: FoodItemLog[K],
  ) => {
    if (isDataReadOnly) return
    setItems((prev) => {
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

    if (status === 'verified' && targetStatus !== 'draft' && !isSuperUser) return

    setErrorMessage(null)

    if (!outlet) {
      setErrorMessage('Please select an Outlet before saving.')
      return
    }
    if (!functionType.trim()) {
      setErrorMessage('Please enter a Function Type before saving.')
      return
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].initials || !String(items[i].initials).trim()) {
        setErrorMessage(`Food Item Row #${i + 1} is missing staff Initials.`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payloadData = {
        outlet,
        date: initialData?.date || new Date().toISOString(),
        functionType,
        items: items.map(({ id, ...rest }) => rest),
        status: targetStatus,
      }

      const result = await saveAction(payloadData)

      if (result?.success) {
        setStatus(targetStatus)
        if ((!currentDocId || currentDocId === 'create') && result?.docId) {
          setCurrentDocId(String(result.docId))
          router.replace(`/admin/collections/haccp-buffet-temperature/${result.docId}`)
        } else {
          router.push('/admin/collections/haccp-buffet-temperature')
          router.refresh()
        }
      } else {
        setErrorMessage(result?.error || 'Failed to save buffet temperature record.')
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
    width: '100%',
    cursor: isDataReadOnly ? 'not-allowed' : 'pointer',
    opacity: isDataReadOnly ? 0.7 : 1,
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px',
    width: '100%',
    borderRadius: '6px',
    border: '1px solid var(--theme-elevation-250)',
    background: isDataReadOnly ? 'var(--theme-elevation-100)' : 'var(--theme-elevation-0)',
    color: 'var(--theme-text)',
    fontSize: '14px',
    cursor: isDataReadOnly ? 'not-allowed' : 'text',
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
            Buffet Temperature Monitoring Record
          </h2>
          <p style={{ color: 'var(--theme-elevation-600)', margin: 0, fontSize: '14px' }}>
            Critical Limit: Hot Food Core Temp &gt; 65°C / Cold Food Core Temp &lt; 5°C
          </p>
        </div>
        <HaccpExportButton slug="haccp-buffet-temperature" label="Download CSV" />
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
              Checklist Date
            </label>
            <input
              type="date"
              value={date}
              disabled={isDataReadOnly}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
            >
              Function Type <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Breakfast Buffet"
              value={functionType}
              disabled={isDataReadOnly}
              onChange={(e) => setFunctionType(e.target.value)}
              style={inputStyle}
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
                ...inputStyle,
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
                minWidth: '1250px',
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
                  <th style={{ padding: '14px 16px', width: '220px' }}>Food Item Pickup</th>
                  <th style={{ padding: '14px 12px', width: '120px' }}>Pickup Time</th>
                  <th style={{ padding: '14px 12px', width: '130px' }}>Initial Temp (°C)</th>
                  <th style={{ padding: '14px 12px', width: '130px' }}>Temp After 2 hrs</th>
                  <th style={{ padding: '14px 12px', width: '130px' }}>Temp After 4 hrs</th>
                  <th style={{ padding: '14px 12px', width: '200px' }}>Corrective Action</th>
                  <th style={{ padding: '14px 12px', width: '100px' }}>Initials *</th>
                  {!isDataReadOnly && (
                    <th style={{ padding: '14px 16px', textAlign: 'center', width: '90px' }}>
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--theme-elevation-150)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="text"
                        placeholder="Food Item Name"
                        value={item.foodItem}
                        disabled={isDataReadOnly}
                        onChange={(e) => handleItemChange(index, 'foodItem', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <input
                        type="text"
                        placeholder="HH:MM"
                        value={item.pickupTime}
                        disabled={isDataReadOnly}
                        onChange={(e) => handleItemChange(index, 'pickupTime', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <input
                        type="number"
                        step="0.1"
                        value={item.initialTemp}
                        disabled={isDataReadOnly}
                        onChange={(e) =>
                          handleItemChange(index, 'initialTemp', parseFloat(e.target.value) || 0)
                        }
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <input
                        type="number"
                        step="0.1"
                        value={item.tempAfter2Hrs ?? ''}
                        disabled={isDataReadOnly}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'tempAfter2Hrs',
                            e.target.value ? parseFloat(e.target.value) : undefined,
                          )
                        }
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <input
                        type="number"
                        step="0.1"
                        value={item.tempAfter4Hrs ?? ''}
                        disabled={isDataReadOnly}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'tempAfter4Hrs',
                            e.target.value ? parseFloat(e.target.value) : undefined,
                          )
                        }
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <select
                        value={item.correctiveAction || 'none'}
                        disabled={isDataReadOnly}
                        onChange={(e) =>
                          handleItemChange(index, 'correctiveAction', e.target.value as any)
                        }
                        style={selectStyle}
                      >
                        <option value="none">None Required</option>
                        <option value="reheated">Reheated</option>
                        <option value="cooled">Cooled</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <input
                        type="text"
                        placeholder="Init"
                        value={item.initials}
                        disabled={isDataReadOnly}
                        onChange={(e) => handleItemChange(index, 'initials', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    {!isDataReadOnly && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            style={{
                              background: '#ED1C24',
                              color: 'white',
                              border: 'none',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isDataReadOnly && (
            <div style={{ padding: '16px 20px', background: 'var(--theme-elevation-100)' }}>
              <button
                type="button"
                onClick={handleAddRow}
                style={{
                  padding: '8px 16px',
                  background: 'var(--theme-elevation-0)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--theme-elevation-300)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                + Add Food Item
              </button>
            </div>
          )}
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
