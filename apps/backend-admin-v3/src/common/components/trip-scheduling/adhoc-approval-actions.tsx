'use client'

import React, { useEffect, useState } from 'react'
import { useAuth, useDocumentInfo, useField, Button as PayloadButton, ReactSelect as PayloadReactSelect } from '@payloadcms/ui'
import { updateAdhocStatus } from '@/collections/trip-scheduling-adhoc/actions/update-status'
import { getDrivers } from '@/collections/trip-scheduling-drivers/actions/get-drivers'
import { checkDriverDayForApprover } from '@/collections/trip-scheduling/actions/driver-day-check'
import {
  DriverDayNotice,
  useDriverDayAssignments,
} from '@/common/components/trip-scheduling/driver-day-notice'

// Doha Oasis Branding Palette
const DO_GOLD = '#DEC37D'
const DO_GREEN = '#143422'
const DO_BANYAN = '#85754E'
const DO_ERROR = '#ED1C24'

const AdhocApprovalActions: React.FC<{ path: string }> = () => {
  const [isUpdating, setIsUpdating] = useState(false)

  // Mirrors the public adhoc-action-form's own mode/driver/note state
  const [mode, setMode] = useState<'idle' | 'approving' | 'declining'>('idle')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [driverOptions, setDriverOptions] = useState<
    { id: string; name: string; phone?: string }[]
  >([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [declineReasonInput, setDeclineReasonInput] = useState('')

  const { user: contextUser } = useAuth()
  const docInfo = useDocumentInfo()
  const statusField = useField<string | null>({ path: 'status' })
  const approverNotesField = useField<string | null>({ path: 'approverNotes' })
  const contextDocId = docInfo?.id
  const contextStatus = statusField?.value
  const approverNotesValue = approverNotesField?.value

  // Robust document initialization status resolution
  const docInitialStatus = docInfo?.initialData?.status || docInfo?.data?.status || 'pending'

  const activeStatus = contextStatus || docInitialStatus
  const docId = contextDocId

  const driverDayAssignments = useDriverDayAssignments(selectedDriverId, (driverId) =>
    docId
      ? checkDriverDayForApprover({ slug: 'trip-scheduling-adhoc', id: String(docId), driverId })
      : Promise.resolve({ success: false as const, error: 'No document' }),
  )

  useEffect(() => {
    if (mode !== 'approving' || driverOptions.length > 0 || loadingDrivers) return
    let cancelled = false
    setLoadingDrivers(true)
    getDrivers(true)
      .then((res) => {
        if (!cancelled && res.success) setDriverOptions(res.docs || [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingDrivers(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, driverOptions.length])

  // No document id yet (create page), so there is nothing to approve.
  if (!docId) return null

  if (!contextUser || activeStatus === undefined) {
    return (
      <div style={{ padding: '10px', fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
        Waiting for session & data...
      </div>
    )
  }

  const isApprover =
    contextUser?.super_user ||
    contextUser?.access?.access?.some((a: any) => a.slug === 'trip-scheduling-adhoc' && a.update)

  const resetSubForm = () => {
    setMode('idle')
    setSelectedDriverId('')
    setDeclineReasonInput('')
    setErrorMessage(null)
  }

  const submit = async (
    newStatus: 'approved' | 'declined' | 'pending',
    opts?: { driverId?: string; declineReason?: string; approverNotes?: string },
  ) => {
    setIsUpdating(true)
    setErrorMessage(null)

    try {
      if (docId) {
        const result = await updateAdhocStatus({
          docId: String(docId),
          status: newStatus,
          driverId: newStatus === 'approved' ? opts?.driverId || null : null,
          declineReason: newStatus === 'declined' ? opts?.declineReason : undefined,
          approverNotes: opts?.approverNotes,
        })

        if (!result.success) {
          setErrorMessage(result.error || 'Failed to update ad-hoc status.')
          setIsUpdating(false)
          return
        }

        setSuccessMessage(
          newStatus === 'approved'
            ? 'Request Approved & Driver Assigned!'
            : newStatus === 'declined'
              ? 'Request Successfully Declined.'
              : 'Request Reset to Pending.',
        )

        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setIsUpdating(false)
      }
    } catch (err) {
      console.error('Error executing ad-hoc status change request:', err)
      setErrorMessage('An unexpected error occurred.')
      setIsUpdating(false)
    }
  }

  const handleResetToPending = () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset this ad-hoc request back to pending? This will clear out the current driver allocation.',
    )
    if (!confirmReset) return
    submit('pending')
  }

  if (!isApprover) {
    return (
      <div style={{ padding: '10px', border: '1px dashed #ccc', fontSize: '11px' }}>
        <span style={{ color: 'red' }}>Permission Denied:</span> User lacks Approver role for Ad-hoc
        requests.
      </div>
    )
  }

  // 🏛️ LOCKED STATE GUARD: Hide buttons once processed and show saved status
  if (
    ['approved', 'declined', 'completed', 'expired'].includes(String(activeStatus).toLowerCase())
  ) {
    return (
      <div
        className="p-4 mb-4 rounded-xl border shadow-sm space-y-2"
        style={{
          backgroundColor: 'var(--theme-elevation-50)',
          borderColor: 'var(--theme-elevation-150)',
          color: 'var(--theme-elevation-800)',
        }}
      >
        <div
          className="text-[10px] font-black uppercase tracking-wider"
          style={{ color: 'var(--theme-elevation-400)' }}
        >
          Workflow Status Finalized
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs" style={{ color: 'var(--theme-elevation-800)' }}>
            Current Status:
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide text-white"
            style={{
              backgroundColor:
                activeStatus === 'approved' || activeStatus === 'completed' ? DO_GREEN : DO_ERROR,
            }}
          >
            {activeStatus}
          </span>
        </div>
        <p className="text-[11px] italic mt-1" style={{ color: 'var(--theme-elevation-500)' }}>
          This ad-hoc request has been processed and locked from further alterations.
        </p>
      </div>
    )
  }

  if (successMessage) {
    return (
      <div
        className="p-4 rounded-xl text-center font-bold space-y-1"
        style={{
          backgroundColor: 'var(--theme-success-100)',
          border: '1px solid var(--theme-success-300)',
          color: 'var(--theme-success-800)',
        }}
      >
        <p className="uppercase text-xs">{successMessage}</p>
        <p className="text-[11px] font-normal">Updating portal view...</p>
      </div>
    )
  }

  // Format drivers for Payload's ReactSelect
  const formattedDriverOptions = driverOptions.map((driver) => ({
    label: `${driver.name}${driver.phone ? ` (${driver.phone})` : ''}`,
    value: driver.id,
  }))

  const selectedDriverOption =
    formattedDriverOptions.find((opt) => opt.value === selectedDriverId)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        margin: '20px 0',
        padding: '15px',
        backgroundColor: 'rgba(222, 195, 125, 0.05)',
        borderRadius: '4px',
        borderLeft: `4px solid ${DO_GOLD}`,
        border: `1px solid rgba(222, 195, 125, 0.2)`,
      }}
    >
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: DO_BANYAN,
            textTransform: 'uppercase',
          }}
        >
          Adhoc Request Approval {isUpdating && '(Updating...)'}
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: '6px',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold',
            backgroundColor:
              activeStatus === 'approved'
                ? DO_GREEN
                : activeStatus === 'declined'
                  ? DO_ERROR
                  : DO_GOLD,
            color: activeStatus === 'pending' ? DO_GREEN : '#FFF',
          }}
        >
          {(activeStatus || 'PENDING').toUpperCase()}
        </div>
      </div>

      {errorMessage && (
        <p
          style={{
            color: 'var(--theme-error-500)',
            fontSize: '11px',
            fontWeight: 700,
            margin: 0,
          }}
        >
          {errorMessage}
        </p>
      )}

      {mode === 'approving' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: DO_BANYAN,
              textTransform: 'uppercase',
            }}
          >
            Assign Driver *
          </label>

          {/* Payload native theme-aware ReactSelect implementation */}
          {PayloadReactSelect ? (
            <div style={{ width: '100%' }}>
              <PayloadReactSelect
                disabled={isUpdating || loadingDrivers}
                isLoading={loadingDrivers}
                options={formattedDriverOptions}
                value={selectedDriverOption}
                placeholder={loadingDrivers ? 'Loading drivers...' : 'Select a driver...'}
                onChange={(option) => {
                  // react-select passes null when cleared, despite Payload's Option | Option[] typing
                  const picked = Array.isArray(option) ? option[0] : option
                  setSelectedDriverId(typeof picked?.value === 'string' ? picked.value : '')
                }}
                isClearable
              />
            </div>
          ) : (
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              disabled={isUpdating || loadingDrivers}
              required
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                borderRadius: '4px',
                border: '1px solid rgba(222, 195, 125, 0.3)',
                background: 'rgba(0,0,0,0.15)',
                color: 'inherit',
              }}
            >
              <option value="">
                {loadingDrivers ? 'Loading drivers...' : 'Select a driver...'}
              </option>
              {driverOptions.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} {driver.phone ? `(${driver.phone})` : ''}
                </option>
              ))}
            </select>
          )}

          <DriverDayNotice assignments={driverDayAssignments} />

          <p
            style={{
              fontSize: '10px',
              color: 'var(--theme-elevation-400)',
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            To add a note for the driver, use the Approver Notes field in the sidebar below.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <PayloadButton
              size="small"
              buttonStyle="primary"
              disabled={isUpdating || !selectedDriverId}
              onClick={() =>
                submit('approved', {
                  driverId: selectedDriverId,
                  approverNotes: approverNotesValue || undefined,
                })
              }
            >
              {isUpdating ? 'Processing...' : 'Confirm & Approve'}
            </PayloadButton>
            <PayloadButton
              size="small"
              buttonStyle="secondary"
              disabled={isUpdating}
              onClick={resetSubForm}
            >
              Cancel
            </PayloadButton>
          </div>
        </div>
      ) : mode === 'declining' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: DO_BANYAN,
              textTransform: 'uppercase',
            }}
          >
            Reason for Declining *
          </label>
          <textarea
            value={declineReasonInput}
            onChange={(e) => setDeclineReasonInput(e.target.value)}
            placeholder="Provide a reason for rejection..."
            disabled={isUpdating}
            rows={2}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '12px',
              borderRadius: '4px',
              border: '1px solid rgba(222, 195, 125, 0.3)',
              background: 'rgba(0,0,0,0.15)',
              color: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <PayloadButton
              size="small"
              buttonStyle="error"
              disabled={isUpdating || !declineReasonInput.trim()}
              onClick={() => submit('declined', { declineReason: declineReasonInput.trim() })}
            >
              {isUpdating ? 'Processing...' : 'Confirm Decline'}
            </PayloadButton>
            <PayloadButton
              size="small"
              buttonStyle="secondary"
              disabled={isUpdating}
              onClick={resetSubForm}
            >
              Cancel
            </PayloadButton>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <PayloadButton
            size="small"
            disabled={isUpdating}
            buttonStyle={activeStatus === 'approved' ? 'primary' : 'secondary'}
            onClick={() => setMode('approving')}
          >
            Approve
          </PayloadButton>
          <PayloadButton
            size="small"
            disabled={isUpdating}
            buttonStyle={activeStatus === 'declined' ? 'error' : 'secondary'}
            onClick={() => setMode('declining')}
          >
            Decline
          </PayloadButton>

          {activeStatus !== 'pending' && (
            <PayloadButton
              size="small"
              disabled={isUpdating}
              buttonStyle="secondary"
              onClick={handleResetToPending}
            >
              Reset to Pending
            </PayloadButton>
          )}
        </div>
      )}
    </div>
  )
}

export default AdhocApprovalActions
