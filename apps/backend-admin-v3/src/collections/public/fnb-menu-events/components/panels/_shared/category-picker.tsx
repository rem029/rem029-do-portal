'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CheckboxInput, Button } from '@payloadcms/ui'
import {
  listCategoriesAction,
  createCategoryAction,
  type CategoryRow,
} from '../../actions'
import { InlineCreate } from './inline-create'
import { ErrorText, sp } from './ui'

export interface CategoryPickerProps {
  eventId: string
  locale?: string
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  eventId,
  locale,
  value,
  onChange,
  disabled = false,
}) => {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [addToVenueMenu, setAddToVenueMenu] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
      setCategories([])
      return
    }
    let cancelled = false
    setLoading(true)
    setFetchError(null)

    listCategoriesAction({ eventId, locale })
      .then((res) => {
        if (cancelled) return
        if (res.success) setCategories(res.data)
        else setFetchError(res.error)
      })
      .catch((err) => {
        if (cancelled) return
        setFetchError(err instanceof Error ? err.message : 'Failed to load categories.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [eventId, locale])

  const handleToggle = useCallback(
    (id: string) => {
      if (disabled) return
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
    },
    [disabled, onChange, value],
  )

  const handleClear = useCallback(() => {
    if (!disabled) onChange([])
  }, [disabled, onChange])

  const handleCreateCategory = useCallback(async () => {
    const trimmedTitle = newTitle.trim()
    if (!trimmedTitle) {
      setCreateError('Category name is required.')
      return
    }
    setIsSubmitting(true)
    setCreateError(null)
    try {
      const res = await createCategoryAction({
        eventId,
        title: trimmedTitle,
        locale,
        addToVenueMenu,
      })
      if (!res.success) {
        setCreateError(res.error)
        return
      }
      setCategories((prev) => [res.data, ...prev])
      onChange([...value, res.data.id])
      setNewTitle('')
      setIsAdding(false)
      setCreateError(null)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create category.')
    } finally {
      setIsSubmitting(false)
    }
  }, [eventId, newTitle, locale, onChange, value, addToVenueMenu])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.xs }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 24,
          borderBottom: '1px solid var(--theme-elevation-150)',
          paddingBottom: sp.xs,
        }}
      >
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            color: 'var(--theme-elevation-400)',
          }}
        >
          Categories
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
          {value.length > 0 && !disabled && (
            <Button buttonStyle="transparent" size="small" onClick={handleClear}>
              Clear ({value.length})
            </Button>
          )}
          <Button
            buttonStyle={isAdding ? 'secondary' : 'transparent'}
            size="small"
            icon={isAdding ? undefined : 'plus'}
            iconPosition="left"
            iconStyle="without-border"
            onClick={() => {
              setIsAdding((prev) => !prev)
              setCreateError(null)
              setAddToVenueMenu(true)
            }}
            disabled={disabled}
          >
            {isAdding ? 'Cancel' : 'Add new'}
          </Button>
        </div>
      </div>

      {isAdding && (
        <InlineCreate
          title={newTitle}
          label="Category name"
          placeholder="e.g. Desserts, Beverages"
          noun="category"
          isSubmitting={isSubmitting}
          error={createError}
          onChange={setNewTitle}
          onSubmit={handleCreateCategory}
          onCancel={() => {
            setIsAdding(false)
            setCreateError(null)
          }}
        >
          <CheckboxInput
            id="__new_category_add_to_venue_menu"
            name="__new_category_add_to_venue_menu"
            label="Add this to venue menu"
            checked={addToVenueMenu}
            onToggle={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAddToVenueMenu(Boolean(e?.target?.checked))
            }
            readOnly={isSubmitting}
          />
        </InlineCreate>
      )}

      {fetchError && <ErrorText>{fetchError}</ErrorText>}

      <div
        className="event-menu-category-picker"
        style={{
          maxHeight: 180,
          overflowY: 'auto',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 'var(--style-radius-s)',
          background: 'var(--theme-elevation-0)',
          padding: sp.xs,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {loading && categories.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding: `calc(var(--base) * 0.5) ${sp.sm}`,
              fontSize: 13,
              color: 'var(--theme-elevation-450)',
              textAlign: 'center',
            }}
          >
            Loading categories…
          </p>
        ) : categories.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding: `calc(var(--base) * 0.5) ${sp.sm}`,
              fontSize: 13,
              color: 'var(--theme-elevation-450)',
              textAlign: 'center',
            }}
          >
            No categories yet. Click &ldquo;Add new&rdquo; above to create one.
          </p>
        ) : (
          categories.map((cat) => {
            const isSelected = value.includes(cat.id)
            return (
              <label
                key={cat.id}
                htmlFor={`event-menu-item-cat-${cat.id}`}
                data-selected={isSelected ? 'true' : 'false'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: sp.sm,
                  padding: `calc(var(--base) * 0.3) ${sp.sm}`,
                  borderRadius: 'var(--style-radius-s)',
                  background: isSelected ? 'var(--theme-elevation-100)' : 'transparent',
                  cursor: disabled ? 'default' : 'pointer',
                }}
              >
                <CheckboxInput
                  id={`event-menu-item-cat-${cat.id}`}
                  checked={isSelected}
                  onToggle={() => handleToggle(cat.id)}
                  readOnly={disabled}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    color: 'var(--theme-elevation-800)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.title}
                </span>
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}

export default CategoryPicker
