'use client'
import React, { useEffect, useState } from 'react'
import { TextInput, CheckboxInput, useField, useAuth } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { slugify } from 'payload/shared'
import type { User } from '@/payload-types'

export type SlugFieldProps = {
  slugPath?: string
  watchPath: string
  watchPrefix?: string
  insideArray?: boolean
}

const SlugField: TextFieldClientComponent = (props) => {
  // Access clientProps from props
  const { watchPath, insideArray, watchPrefix } =
    ((props as any)?.slugProps as SlugFieldProps) || {}

  // If insideArray is true, build the full watch path from props.path
  let resolvedWatchPath = watchPath
  const resolvedWatchPrefixPath = watchPrefix

  if (insideArray) {
    // Split path: "steps.1.statusSlug" -> ["steps", "1", "statusSlug"]
    const pathParts = props.path.split('.')
    // Replace last part with watchPath: ["steps", "1", "label"]
    const basePath = pathParts.slice(0, -1)
    resolvedWatchPath = [...basePath, watchPath].join('.')
  }

  const { value: slugValue, setValue: setSlugValue } = useField<string>({ path: props.path })
  const { value: watchValue } = useField<string>({ path: resolvedWatchPath })
  const { value: watchPrefixValue } = useField<string>({
    path: resolvedWatchPrefixPath || '',
  })

  const [isOverride, setIsOverride] = useState(false)
  const { user } = useAuth<User>()

  const generateSlug = (text: string): string => {
    const slug = slugify(text) || ''
    return slug.replace(/^[^a-z0-9]+/, '')
  }

  // Auto-generate slug when watched field changes (unless override is enabled)
  useEffect(() => {
    if (!isOverride && watchValue) {
      let slugPart = generateSlug(watchValue as string)
      if (watchPrefix && watchPrefixValue) {
        slugPart = `${generateSlug(watchPrefixValue)}.${slugPart}`
      }

      if (slugPart && slugPart !== slugValue) {
        setSlugValue(slugPart)
      }
    }
  }, [watchValue, watchPrefix, watchPrefixValue, isOverride, slugValue, setSlugValue])

  useEffect(() => {
    let slugPart = generateSlug(watchValue as string)
    if (watchPrefixValue) {
      slugPart = `${generateSlug(watchPrefixValue)}.${slugPart}`
    }
    setSlugValue(slugPart)
  }, [])

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugValue(e.target.value)
  }

  return (
    <div className="field-type text">
      <label className="field-label">
        <span>Slug</span>
        {props.field?.required && <span className="required">*</span>}
      </label>

      <TextInput
        path={props.path}
        value={slugValue || ''}
        onChange={handleSlugChange}
        readOnly={!isOverride}
        className={`${!isOverride ? 'opacity-50 pointer-events-none' : ''}`}
      />

      <label
        className={`mt-2 field-type checkbox flex align-center gap-4 ${!user?.super_user ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
      >
        <CheckboxInput
          label="Override auto-generated slug. Requires super user permissions."
          onToggle={(e) => setIsOverride(e.target.checked)}
          checked={isOverride}
          readOnly={!user?.super_user}
        />
      </label>

      {!isOverride && (
        <div className="field-description field-description-title">
          Auto-generated from {watchPrefix ? `${watchPrefix} and ` : ''}
          {watchPath}
        </div>
      )}
    </div>
  )
}

export default SlugField
