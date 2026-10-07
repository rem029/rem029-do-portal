'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { noah } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'
import { LoginForm } from '../common/login-form'
import { logoutAction } from '@/app/(frontend)/forms/login/actions'

interface FormAuthWrapperProps {
  requiresAuth: boolean
  isAuthenticated: boolean
  isAuthorized: boolean
  theme?: string
  children: React.ReactNode
  hideBackground?: boolean
}

export const FormAuthWrapper: React.FC<FormAuthWrapperProps> = ({
  requiresAuth,
  isAuthenticated,
  isAuthorized,
  theme,
  children,
  hideBackground = false,
}) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const showLoginModal = requiresAuth && !isAuthenticated
  const showDenied = requiresAuth && isAuthenticated && !isAuthorized

  const handleLogout = async () => {
    startTransition(async () => {
      await logoutAction()
      router.refresh()
    })
  }

  if (!showLoginModal && !showDenied) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Form content visible but blurred in background - only if not hideBackground */}
      {!hideBackground && (
        <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
          {children}
        </div>
      )}

      {/* Login modal / access-denied overlay */}
      <div
        data-theme={theme || 'dohaoasis-new'}
        className={cn(
          'z-50 flex items-center justify-center p-4',
          hideBackground
            ? 'min-h-screen bg-base-200'
            : 'fixed inset-0 bg-black/40 backdrop-blur-sm',
        )}
      >
        <div className="card bg-base-100 shadow-2xl w-full max-w-md border border-base-200">
          <div className="card-body p-8">
            {showDenied ? (
              /* Access denied — authenticated but missing required access role */
              <div className="text-center">
                <div className="bg-error/10 p-4 rounded-full inline-flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-error"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </div>
                <h2 className={cn('text-2xl font-bold text-error mb-2', noah.className)}>
                  Access Denied
                </h2>
                <p className="text-base-content/60 text-sm mb-6">
                  You do not have permission to access this form. Please contact your administrator
                  if you believe this is an error.
                </p>

                <div className="border-t border-base-200 pt-6">
                  <p className="text-xs text-base-content/40 mb-3 uppercase tracking-widest font-bold">
                    Logged in as
                  </p>
                  <button
                    onClick={handleLogout}
                    disabled={isPending}
                    className={cn(
                      'btn btn-outline btn-error btn-sm w-full gap-2',
                      isPending && 'loading',
                    )}
                  >
                    {!isPending && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    )}
                    {isPending ? 'Signing out...' : 'Sign Out / Switch Account'}
                  </button>
                </div>
              </div>
            ) : (
              /* Login form — unauthenticated */
              <>
                <div className="text-center mb-6">
                  <div className="bg-primary/10 p-4 rounded-full inline-flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h2 className={cn('text-2xl font-bold text-primary', noah.className)}>
                    Sign In Required
                  </h2>
                  <p className="text-base-content/60 text-sm mt-2">
                    Please sign in to access this form.
                  </p>
                </div>

                <LoginForm />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
