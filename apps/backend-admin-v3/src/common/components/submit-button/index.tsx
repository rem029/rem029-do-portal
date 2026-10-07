'use client'
import React from 'react'
import { Button, useForm, useFormModified } from '@payloadcms/ui'

const SubmitButton: React.FC = () => {
  const { submit } = useForm()
  const modified = useFormModified()

  return (
    <Button
      onClick={(e) => {
        e.preventDefault()
        submit()
      }}
      disabled={!modified}
      size="medium"
      buttonStyle="primary"
      type="button"
    >
      Submit
    </Button>
  )
}

export default SubmitButton
