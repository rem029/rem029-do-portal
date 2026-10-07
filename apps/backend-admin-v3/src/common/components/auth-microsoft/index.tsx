'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useConfig } from '@payloadcms/ui'
import { getMicrosoftLoginURL } from '@/utilities/microsoft-auth-redirect'
import { IconMicrosoft } from './icon'

const AuthMicrosoft = () => {
  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
  } = useConfig()
  const searchParams = useSearchParams()

  // Forward Payload's `?redirect=` (e.g. a workflow deep link) so SSO lands on the same page
  // email/password login would; the server validates it.
  const authURL = getMicrosoftLoginURL(`${serverURL}${apiRoute}`, searchParams.get('redirect'))

  const handleRedirect = () => {
    window.location.href = authURL
  }

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        className="py-4 btn btn--style-primary btn--icon-style-without-border btn--size-medium btn--icon-position-right"
        onClick={handleRedirect}
        style={{ width: '100%' }}
      >
        <span className="btn__content flex flex-row gap-2">
          <span className="btn__label">Login with Microsoft</span>
          <span className="btn__icon">
            <IconMicrosoft />
          </span>
        </span>
      </button>
      <div className="text-xs text-gray-500 text-center px-4">
        <p>
          Note: When you login with Microsoft, your password will be automatically updated and sent
          to your email.
        </p>
      </div>
    </div>
  )
}

export default AuthMicrosoft
