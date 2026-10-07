'use client'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getMicrosoftAuthErrorMessage } from '@/utilities/microsoft-auth-redirect'

const LoginError = () => {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')

    if (error) {
      setErrorMessage(getMicrosoftAuthErrorMessage(error))
    }
  }, [searchParams])

  if (!errorMessage) return null

  return (
    <div className="mb-4 p-3 border-l-4 border-red-600 bg-red-50 text-red-900 text-sm rounded">
      <strong>Error:</strong> {errorMessage}
    </div>
  )
}

export default LoginError
