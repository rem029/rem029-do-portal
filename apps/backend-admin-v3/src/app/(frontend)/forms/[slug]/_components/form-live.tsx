'use client'

import { BACKEND_URL, BASE_PATH } from '@/utilities/constant'
import { Form, User } from '@/payload-types'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { FormContent } from './form-content'
import React from 'react'

interface FormLiveProps {
  initialData: Form
  user: User | null
  isAuthenticated: boolean
  isAuthorized: boolean
}

export const FormLive: React.FC<FormLiveProps> = ({
  initialData,
  user,
  isAuthenticated,
  isAuthorized,
}) => {
  const { data } = useLivePreview({
    initialData: initialData,
    serverURL: BACKEND_URL,
    apiRoute: BASE_PATH ? `${BASE_PATH}/api` : `/api`,
  })

  return (
    <FormContent
      form={(data as Form) || initialData}
      user={user}
      isAuthenticated={isAuthenticated}
      isAuthorized={isAuthorized}
    />
  )
}
