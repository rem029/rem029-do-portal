'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { HaccpPersonalHygiene } from '@/payload-types'
import { isHicpDocumentLocked } from '../utils/permissions'
import { FormActions } from '@/common/components/haccp/form-actions'
import { HaccpExportButton } from '@/common/components/haccp/utils/export-button'
import { BASE_PATH } from '@/utilities/constant'

type HygieneEntry = NonNullable<HaccpPersonalHygiene['entries']>[number]

interface OutletOption {
  id: string
  name: string
}

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  yesLabel?: string
  noLabel?: string
  disabled?: boolean
}

function NeutralToggle({
  checked,
  onChange,
  yesLabel = 'YES',
  noLabel = 'NO',
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: '58px',
        height: '24px',
        backgroundColor: checked ? 'var(--theme-elevation-400)' : 'var(--theme-elevation-200)',
        borderRadius: '12px',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 7px',
        transition: 'background-color 0.2s ease',
        userSelect: 'none',
        margin: '0 auto',
        fontSize: '8px',
        fontWeight: 700,
        color: 'var(--theme-text)',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <span style={{ opacity: checked ? 1 : 0.4 }}>{yesLabel}</span>
      <span style={{ opacity: !checked ? 1 : 0.4 }}>{noLabel}</span>

      {/* Sliding Thumb */}
      <div
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '50%',
          position: 'absolute',
          top: '4px',
          left: checked ? '37px' : '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'left 0.2s ease',
        }}
      />
    </div>
  )
}

interface PersonalHygieneClientProps {
  initialData?: Partial<HaccpPersonalHygiene>
  documentId?: string
  saveAction: (formData: {
    outlet: string
    date: string
    entries: Omit<HygieneEntry, 'id'>[]
    status: string
  }) => Promise<{ success: boolean; error?: string }>
  isPicUser?: boolean
  isHicUser?: boolean
  isSuperUser?: boolean
  workflowType?: '2-step' | '3-step'
}

export default function PersonalHygieneClientView({
  initialData,
  documentId,
  saveAction,
  isPicUser = false,
  isHicUser = false,
  isSuperUser = false,
  workflowType = '2-step',
}: PersonalHygieneClientProps) {
  const router = useRouter()
  const [outlets, setOutlets] = useState<OutletOption[]>([])

  const initialOutletId = initialData?.outlet
    ? typeof initialData.outlet === 'object' && initialData.outlet !== null
      ? (initialData.outlet as OutletOption).id
      : String(initialData.outlet)
    : ''

  const [outlet, setOutlet] = useState(initialOutletId)
  const [status, setStatus] = useState<string>(initialData?.status || 'draft')

  const [entries, setEntries] = useState<HygieneEntry[]>(
    initialData?.entries && initialData.entries.length > 0
      ? initialData.entries
      : [
          {
            staffName: '',
            hair: 'Short',
            nails: 'Short',
            uniform: 'Clean',
            shoes: 'Clean',
            jewellery: false,
            symptomsOfSick: false,
            medicalCard: true,
            remark: '',
          },
        ],
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Centralized lockdown evaluation supporting 2-step workflow roles
  const isLocked = isHicpDocumentLocked({
    status,
    workflowType,
    isHicUser,
    isPicUser,
    isSuperUser,
  })

  useEffect(() => {
    if (initialData?.outlet) {
      const resolvedOutletId =
        typeof initialData.outlet === 'object' && initialData.outlet !== null
          ? (initialData.outlet as OutletOption).id
          : String(initialData.outlet)
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
    if (isLocked) return
    setEntries((prev) => [
      ...prev,
      {
        staffName: '',
        hair: 'Short',
        nails: 'Short',
        uniform: 'Clean',
        shoes: 'Clean',
        jewellery: false,
        symptomsOfSick: false,
        medicalCard: true,
        remark: '',
      },
    ])
  }

  const handleRemoveRow = (index: number) => {
    if (isLocked) return
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEntryChange = <K extends keyof HygieneEntry>(
    index: number,
    field: K,
    value: HygieneEntry[K],
  ) => {
    if (isLocked) return
    setEntries((prev) => {
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

    // Allow saving if it's not fully locked, or if we are verifying or requesting a re-check/draft reversion
    if (isLocked && targetStatus !== 'verified' && targetStatus !== 'draft') return
    setErrorMessage(null)

    // Client-side validation checks
    if (!outlet) {
      setErrorMessage('Please select an Outlet before saving.')
      return
    }
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].staffName || !entries[i].staffName.trim()) {
        setErrorMessage(`Staff Row #${i + 1} is missing a Staff Name.`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payloadData = {
        outlet,
        date: typeof initialData?.date === 'string' ? initialData.date : new Date().toISOString(),
        entries: entries.map(({ id, ...rest }) => rest),
        status: targetStatus,
      }

      const result = await saveAction(payloadData)

      if (result?.success) {
        setStatus(targetStatus)
        router.push('/admin/collections/haccp-personal-hygiene')
        router.refresh()
      } else {
        setErrorMessage(result?.error || 'Failed to save personal hygiene checklist.')
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
    background: isLocked ? 'var(--theme-elevation-100)' : 'var(--theme-elevation-0)',
    color: 'var(--theme-text)',
    fontSize: '14px',
    appearance: 'none',
    backgroundImage: isLocked
      ? 'none'
      : `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '14px',
    width: '100%',
    cursor: isLocked ? 'not-allowed' : 'pointer',
    opacity: isLocked ? 0.7 : 1,
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px',
    width: '100%',
    borderRadius: '6px',
    border: '1px solid var(--theme-elevation-250)',
    background: isLocked ? 'var(--theme-elevation-100)' : 'var(--theme-elevation-0)',
    color: 'var(--theme-text)',
    fontSize: '14px',
    cursor: isLocked ? 'not-allowed' : 'text',
    opacity: isLocked ? 0.7 : 1,
  }

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
            Personal Hygiene Checklist
          </h2>
          <p style={{ color: 'var(--theme-elevation-600)', margin: 0, fontSize: '14px' }}>
            Records compliance of staff to hygiene standards.
          </p>
        </div>
        <HaccpExportButton slug="haccp-personal-hygiene" label="Download CSV" />
      </div>

      {/* Error Banner Notification */}
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
        {/* Header Controls Card */}
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
              disabled={isLocked}
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

        {/* Rapid Entry Table Card */}
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
                  <th style={{ padding: '14px 16px', width: '260px' }}>Staff Name *</th>
                  <th style={{ padding: '14px 12px', width: '110px' }}>Hair</th>
                  <th style={{ padding: '14px 12px', width: '110px' }}>Nails</th>
                  <th style={{ padding: '14px 12px', width: '110px' }}>Uniform</th>
                  <th style={{ padding: '14px 12px', width: '110px' }}>Shoes</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', width: '110px' }}>
                    Jewellery
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', width: '120px' }}>
                    Sick Symptoms
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', width: '120px' }}>
                    Medical Card
                  </th>
                  <th style={{ padding: '14px 16px' }}>Remarks</th>
                  {!isLocked && (
                    <th style={{ padding: '14px 16px', textAlign: 'center', width: '90px' }}>
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--theme-elevation-150)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={entry.staffName}
                        disabled={isLocked}
                        onChange={(e) => handleEntryChange(index, 'staffName', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <select
                        value={entry.hair}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleEntryChange(index, 'hair', e.target.value as 'Short' | 'Long')
                        }
                        style={selectStyle}
                      >
                        <option value="Short">Short</option>
                        <option value="Long">Long</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <select
                        value={entry.nails}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleEntryChange(index, 'nails', e.target.value as 'Short' | 'Long')
                        }
                        style={selectStyle}
                      >
                        <option value="Short">Short</option>
                        <option value="Long">Long</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <select
                        value={entry.uniform}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleEntryChange(index, 'uniform', e.target.value as 'Clean' | 'Dirty')
                        }
                        style={selectStyle}
                      >
                        <option value="Clean">Clean</option>
                        <option value="Dirty">Dirty</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <select
                        value={entry.shoes}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleEntryChange(index, 'shoes', e.target.value as 'Clean' | 'Dirty')
                        }
                        style={selectStyle}
                      >
                        <option value="Clean">Clean</option>
                        <option value="Dirty">Dirty</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      <NeutralToggle
                        checked={entry.jewellery ?? false}
                        disabled={isLocked}
                        onChange={(val) => handleEntryChange(index, 'jewellery', val)}
                      />
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      <NeutralToggle
                        checked={entry.symptomsOfSick ?? false}
                        disabled={isLocked}
                        onChange={(val) => handleEntryChange(index, 'symptomsOfSick', val)}
                      />
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      <NeutralToggle
                        checked={entry.medicalCard ?? true}
                        disabled={isLocked}
                        onChange={(val) => handleEntryChange(index, 'medicalCard', val)}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="text"
                        placeholder="Optional remarks..."
                        value={entry.remark || ''}
                        disabled={isLocked}
                        onChange={(e) => handleEntryChange(index, 'remark', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    {!isLocked && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {entries.length > 1 && (
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

          {/* Table Footer / Add Row */}
          {!isLocked && (
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
                + Add Staff Row
              </button>
            </div>
          )}
        </div>

        {/* Global Form Actions - Integrated with 2-Step Workflow */}
        <FormActions
          status={status}
          workflowType={workflowType}
          isPicUser={isPicUser}
          isHicUser={isHicUser}
          isSubmitting={isSubmitting}
          onSaveDraft={(e) => handleSave('draft', e)}
          onRequestRecheck={(e) => handleSave('draft', e)}
          onSubmitToHic={(e) => handleSave('pending-hic-verification', e)}
          onVerify={(e) => handleSave('verified', e)}
        />
      </div>
    </div>
  )
}
