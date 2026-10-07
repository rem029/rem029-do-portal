'use client'
import * as React from 'react'
import { useEffect, useCallback } from 'react'
import { TextInput, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

/**
 * Custom slug field for site pages.
 * Auto-generates slug from the title field when title changes.
 */
const SitePageSlug: TextFieldClientComponent = (props) => {
  const { value: title } = useField<string>({ path: 'info.title' })
  const { value: slugOverride } = useField<boolean>({ path: 'info.slug_override' })
  const { value: slugValue, setValue: setSlug } = useField<string>({ path: props.path })

  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }, [])

  useEffect(() => {
    if (title && !slugOverride) {
      const newSlug = generateSlug(title)
      if (newSlug !== slugValue) {
        setSlug(newSlug)
      }
    }
  }, [title, slugOverride, slugValue, setSlug, generateSlug])

  return (
    <div className="field-type text">
      <label className="field-label">
        <span>Slug</span>
      </label>
      <TextInput
        path={props.path}
        value={slugValue || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
        readOnly={!slugOverride}
        className={!slugOverride ? 'opacity-50 pointer-events-none' : ''}
      />
      <div className="field-description">
        The slug is used in the URL for this site page. Auto-generated from the page title.
      </div>
    </div>
  )
}

export default SitePageSlug
