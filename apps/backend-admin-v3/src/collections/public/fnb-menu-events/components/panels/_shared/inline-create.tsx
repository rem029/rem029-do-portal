'use client'

import React from 'react'
import { TextInput, Button } from '@payloadcms/ui'
import { SubForm, FormActions, ErrorText } from './ui'

export interface InlineCreateProps {
  title: string
  label?: string
  placeholder?: string
  noun?: string
  isSubmitting: boolean
  error: string | null
  onChange: (val: string) => void
  onSubmit: () => void
  onCancel: () => void
  children?: React.ReactNode
}

export const InlineCreate: React.FC<InlineCreateProps> = ({
  title,
  label = 'Name',
  placeholder,
  noun = 'category',
  isSubmitting,
  error,
  onChange,
  onSubmit,
  onCancel,
  children,
}) => (
  <SubForm heading={`New ${noun}`}>
    <TextInput
      path={`__new_${noun}`}
      label={label}
      required
      value={title}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (!isSubmitting && title.trim()) onSubmit()
        }
      }}
      readOnly={isSubmitting}
      placeholder={placeholder}
    />

    {children}

    {error && <ErrorText>{error}</ErrorText>}

    <FormActions>
      <Button buttonStyle="secondary" size="small" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button size="small" onClick={onSubmit} disabled={isSubmitting || !title.trim()}>
        {isSubmitting ? `Adding ${noun}…` : `Add ${noun}`}
      </Button>
    </FormActions>
  </SubForm>
)

export default InlineCreate
