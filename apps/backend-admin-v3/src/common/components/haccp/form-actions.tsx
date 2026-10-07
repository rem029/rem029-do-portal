import React from 'react'

export interface FormActionsProps {
  status: string
  workflowType?: '2-step' | '3-step'
  isPicUser: boolean
  isHicUser: boolean
  isSuperUser?: boolean
  isSubmitting: boolean
  onSaveDraft: (e: React.MouseEvent) => void
  onSubmitToPic?: (e: React.MouseEvent) => void
  onRequestRecheck?: (e: React.MouseEvent) => void
  onRequestRecheckToPic?: (e: React.MouseEvent) => void
  onSubmitToHic: (e: React.MouseEvent) => void
  onVerify?: (e: React.MouseEvent) => void
}

export function FormActions({
  status,
  workflowType = '3-step',
  isPicUser,
  isHicUser,
  isSuperUser = false,
  isSubmitting,
  onSaveDraft,
  onSubmitToPic,
  onRequestRecheck,
  onRequestRecheckToPic,
  onSubmitToHic,
  onVerify,
}: FormActionsProps) {
  // 1. Verified & Locked State (Universal)
  if (status === 'verified') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <div
          style={{
            padding: '12px 24px',
            background: 'var(--theme-elevation-200)',
            color: '#00CF77',
            border: '1px solid var(--theme-elevation-300)',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ✓ Verified &amp; Locked Record
        </div>
      </div>
    )
  }

  // 2. 2-Step Workflow (e.g. Personal Hygiene)
  if (workflowType === '2-step') {
    if (status === 'draft') {
      if (isHicUser && !isPicUser && !isSuperUser) {
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div
              style={{
                padding: '12px 24px',
                background: 'var(--theme-elevation-200)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-elevation-300)',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🔒 Draft in Progress (Awaiting PIC Submission to HIC)
            </div>
          </div>
        )
      }

      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSaveDraft}
            style={{
              padding: '12px 24px',
              background: 'var(--theme-elevation-200)',
              color: 'var(--theme-text)',
              border: '1px solid var(--theme-elevation-300)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmitToHic}
            style={{
              padding: '12px 28px',
              background: '#143422',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(20, 52, 34, 0.25)',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for HIC Verification'}
          </button>
        </div>
      )
    }

    if (status === 'pending-hic-verification') {
      if (isHicUser || isSuperUser) {
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            {onRequestRecheck && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onRequestRecheck}
                style={{
                  padding: '12px 20px',
                  background: 'var(--theme-elevation-200)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--theme-elevation-300)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {isSubmitting ? 'Processing...' : 'Request Re-check'}
              </button>
            )}
            {onVerify && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onVerify}
                style={{
                  padding: '12px 28px',
                  background: '#00CF77',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {isSubmitting ? 'Verifying...' : 'Verify Checklist'}
              </button>
            )}
          </div>
        )
      } else {
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div
              style={{
                padding: '12px 24px',
                background: 'var(--theme-elevation-200)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-elevation-300)',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              🔒 Submitted to HIC (Awaiting Verification)
            </div>
          </div>
        )
      }
    }
  }

  // 3. 3-Step Workflow States (Buffet, Dishwashing, Dry Store)
  if (workflowType === '3-step') {
    // Draft State
    if (!status || status === 'draft') {
      // If user is strictly an HIC, drafts are managed by staff/PIC
      if (isHicUser && !isPicUser && !isSuperUser) {
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div
              style={{
                padding: '12px 24px',
                background: 'var(--theme-elevation-200)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-elevation-300)',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              🔒 Draft in Progress (Managed by Staff / PIC)
            </div>
          </div>
        )
      }

      // If user is strictly a PIC, they wait for staff submission (no drafting inputs)
      if (isPicUser && !isSuperUser) {
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div
              style={{
                padding: '12px 24px',
                background: 'var(--theme-elevation-200)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-elevation-300)',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              ⏳ Waiting for Staff Submission for Confirmation
            </div>
          </div>
        )
      }

      // General Staff / Superuser view for drafting & submitting to PIC
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSaveDraft}
            style={{
              padding: '12px 24px',
              background: 'var(--theme-elevation-200)',
              color: 'var(--theme-text)',
              border: '1px solid var(--theme-elevation-300)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>

          {onSubmitToPic && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onSubmitToPic}
              style={{
                padding: '12px 28px',
                background: '#143422',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Save and Submit for Approval (PIC)'}
            </button>
          )}
        </div>
      )
    }

    // Pending PIC Approval State
    if (status === 'pending-pic-approval') {
      if (isPicUser || isSuperUser) {
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            {onRequestRecheck && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onRequestRecheck}
                style={{
                  padding: '12px 20px',
                  background: 'var(--theme-elevation-200)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--theme-elevation-300)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {isSubmitting ? 'Processing...' : 'Re-check / Request Corrections'}
              </button>
            )}
            {onSubmitToHic && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSubmitToHic}
                style={{
                  padding: '12px 28px',
                  background: '#143422',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Verification (HIC)'}
              </button>
            )}
          </div>
        )
      } else {
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div
              style={{
                padding: '12px 24px',
                background: 'var(--theme-elevation-200)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-elevation-300)',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              🔒 Pending PIC Approval
            </div>
          </div>
        )
      }
    }

    // Pending HIC Verification State
    if (status === 'pending-hic-verification') {
      if (isHicUser || isSuperUser) {
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            {onRequestRecheckToPic && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onRequestRecheckToPic}
                style={{
                  padding: '12px 20px',
                  background: 'var(--theme-elevation-200)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--theme-elevation-300)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {isSubmitting ? 'Processing...' : 'Request Re-check (to PIC)'}
              </button>
            )}
            {onVerify && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onVerify}
                style={{
                  padding: '12px 28px',
                  background: '#00CF77',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {isSubmitting ? 'Verifying...' : 'Verify Checklist'}
              </button>
            )}
          </div>
        )
      } else {
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div
              style={{
                padding: '12px 24px',
                background: 'var(--theme-elevation-200)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-elevation-300)',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              🔒 Pending HIC Verification
            </div>
          </div>
        )
      }
    }
  }

  // --- STRICTLY TYPED FALLBACK SAFETY NET ---
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onSaveDraft}
        style={{
          padding: '12px 24px',
          background: 'var(--theme-elevation-200)',
          color: 'var(--theme-text)',
          border: '1px solid var(--theme-elevation-300)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '14px',
        }}
      >
        {isSubmitting ? 'Saving...' : 'Save Draft'}
      </button>
    </div>
  )
}
