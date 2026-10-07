'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/(frontend)/forms/login/actions'
import { noah } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'

export default function UnauthorizedSection() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
      router.refresh()
    })
  }

  return (
    <div className="mt-10 border-t border-base-200 pt-8">
      <div role="alert" className="alert alert-error shadow-md flex items-start">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col gap-1">
            <h3 className={cn('font-bold text-lg', noah.className)}>Not Authorized to Resubmit</h3>
            <p className="text-sm opacity-90">
              Only the original creator of this submission can resubmit it. You are currently signed
              in as a different user.
              <button
                onClick={handleLogout}
                disabled={isPending}
                className={cn('btn btn-link btn-sm btn-secondary', noah.className)}
              >
                {isPending ? <span className="loading loading-spinner loading-xs" /> : null}
                Logout and Switch Account
              </button>
            </p>
          </div>
          <div className="flex justify-end"></div>
        </div>
      </div>
    </div>
  )
}
