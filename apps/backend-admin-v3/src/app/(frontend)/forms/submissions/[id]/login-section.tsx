'use client'

import React from 'react'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { LoginForm } from '@/common/components/common/login-form'

export default function SubmissionLoginSection() {
  return (
    <div className="mt-10 border-t border-base-200 pt-8">
      <div className={cn('flex items-center gap-2 mb-2', noah.className)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
        <h2 className="text-xl font-bold text-primary">Sign in to Resubmit</h2>
      </div>
      <p className="text-sm text-base-content/60 mb-6">
        Only the original creator of this submission can resubmit it. Please sign in to continue.
      </p>

      <div className="card bg-base-100 border border-base-200 shadow-md max-w-md">
        <div className="card-body p-6">
          <LoginForm onSuccess={() => window.location.reload()} />
        </div>
      </div>
    </div>
  )
}
