'use client'

import React, { useEffect, useState } from 'react'
import { BASE_PATH } from '@/utilities/constant'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import {
  MICROSOFT_AUTH_ERROR_PARAM,
  getMicrosoftAuthErrorMessage,
  getMicrosoftLoginURL,
  sanitizeReturnPath,
  setPathSearchParam,
} from '@/utilities/microsoft-auth-redirect'
import { IconMicrosoft } from '../auth-microsoft/icon'

interface MicrosoftLoginButtonProps {
  disabled?: boolean
  className?: string
}

/** Frontend "Sign in with Microsoft" button that returns the user to the current page. */
export const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({
  disabled,
  className,
}) => {
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Show (then strip from the URL) an error reported back by the Microsoft callback.
  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get(MICROSOFT_AUTH_ERROR_PARAM)
    if (!code) return
    setError(getMicrosoftAuthErrorMessage(code))
    url.searchParams.delete(MICROSOFT_AUTH_ERROR_PARAM)
    window.history.replaceState(window.history.state, '', url.toString())
  }, [])

  const handleClick = () => {
    const { pathname, search, hash } = window.location
    const currentPath = sanitizeReturnPath(`${pathname}${search}${hash}`, { basePath: BASE_PATH })
    const returnPath = currentPath
      ? setPathSearchParam(currentPath, MICROSOFT_AUTH_ERROR_PARAM, null)
      : null
    setIsRedirecting(true)
    window.location.href = getMicrosoftLoginURL(`${BASE_PATH}/api`, returnPath)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {error && (
        <div role="alert" className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isRedirecting}
        className={cn('btn btn-outline btn-primary w-full gap-2 uppercase', noah.className)}
      >
        {isRedirecting ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <IconMicrosoft />
        )}
        {isRedirecting ? 'Redirecting…' : 'Sign in with Microsoft'}
      </button>
    </div>
  )
}
