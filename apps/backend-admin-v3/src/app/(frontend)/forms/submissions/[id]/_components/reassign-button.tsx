'use client'

import { useState } from 'react'
import { ReassignDrawer } from './reassign-drawer'

export function ReassignButton({
  instanceId,
  submissionId,
  currentStepLabel,
  token,
}: {
  instanceId: string
  submissionId: string
  currentStepLabel: string
  token?: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-sm btn-link btn-info gap-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Reassign
      </button>

      <ReassignDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        instanceId={instanceId}
        submissionId={submissionId}
        currentStepLabel={currentStepLabel}
        token={token}
      />
    </>
  )
}
