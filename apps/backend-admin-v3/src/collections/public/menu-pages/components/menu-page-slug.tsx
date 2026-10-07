'use client'
import * as React from 'react'
import { useEffect, useCallback, useRef } from 'react'
import { TextInput, useField, useConfig } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { getRestaurantSlugAction } from './actions'

const DEFAULT_DESCRIPTION =
  'The slug is used in the URL for this menu page. Auto-generated from the selected restaurant.'

/**
 * Custom slug field for menu pages.
 * Auto-generates slug from the restaurant name when a restaurant is selected.
 */
const MenuPageSlug: TextFieldClientComponent = (props) => {
  // Payload passes clientProps as top-level props to custom field components
  const { description } = props as typeof props & { description?: string }
  const { value: restaurantId } = useField<string>({ path: 'restaurant' })
  const { value: slugOverride } = useField<boolean>({ path: 'info.slug_override' })
  const { value: slugValue, setValue: setSlug } = useField<string>({ path: props.path })
  const { config } = useConfig()
  // Payload's form reducer marks the document "modified" on every `setValue` call,
  // regardless of whether the new value equals the current one. Without this ref +
  // guard, the effect below re-fetches and re-sets the slug on every mount (any saved
  // doc with a restaurant and no slug override), permanently flipping the doc to
  // "modified" the instant it loads — surfaces as an unprompted "Leave without
  // saving?" warning on refresh/navigate even though nothing was edited.
  const slugValueRef = useRef(slugValue)
  slugValueRef.current = slugValue
  const fetchRestaurantSlug = useCallback(
    async (id: string) => {
      try {
        const result = await getRestaurantSlugAction(id)
        if (result.success && result.slug && result.slug !== slugValueRef.current) {
          setSlug(result.slug)
        }
      } catch (err) {
        console.error('Error fetching restaurant slug:', err)
      }
    },
    [setSlug],
  )

  useEffect(() => {
    if (restaurantId && !slugOverride) {
      fetchRestaurantSlug(restaurantId)
    }
  }, [restaurantId, slugOverride, fetchRestaurantSlug])

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
      <div className="field-description">{description ?? DEFAULT_DESCRIPTION}</div>
    </div>
  )
}

export default MenuPageSlug
