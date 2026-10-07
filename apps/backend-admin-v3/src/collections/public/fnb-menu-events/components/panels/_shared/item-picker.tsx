'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { TextInput, CheckboxInput, Button } from '@payloadcms/ui'
import { listMenuItemsAction, type MenuItemRow } from '../../actions'
import { ErrorText, sp } from './ui'

export interface ItemPickerProps {
  eventId: string
  restaurantId?: string
  locale?: string
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export const ItemPicker: React.FC<ItemPickerProps> = ({
  eventId,
  locale,
  value,
  onChange,
  disabled = false,
}) => {
  const [items, setItems] = useState<MenuItemRow[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!eventId) {
      setItems([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    listMenuItemsAction({ eventId, search: debouncedSearch, locale })
      .then((res) => {
        if (cancelled) return
        if (res.success) setItems(res.data)
        else setError(res.error)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load menu items.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [eventId, debouncedSearch, locale])

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

  const centerHint = (text: string) => (
    <p
      style={{
        margin: 0,
        padding: `calc(var(--base) * 0.9) ${sp.sm}`,
        fontSize: 13,
        color: 'var(--theme-elevation-450)',
        textAlign: 'center',
      }}
    >
      {text}
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.sm }}>
      <TextInput
        path="__itemPickerSearch"
        placeholder="Search items…"
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        readOnly={disabled}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 24,
          fontSize: 12,
          color: 'var(--theme-elevation-600)',
          padding: `0 ${sp.xs}`,
        }}
      >
        <span>
          {value.length > 0 ? `${value.length} selected` : 'Select the items for this menu'}
        </span>
        {value.length > 0 && !disabled && (
          <Button buttonStyle="transparent" size="small" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      <div
        className="event-menu-item-picker"
        style={{
          maxHeight: 240,
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
        {loading && items.length === 0
          ? centerHint('Loading items…')
          : items.length === 0
            ? centerHint(
                debouncedSearch
                  ? `No items match “${debouncedSearch}”.`
                  : 'No items for this venue yet — add them in the Items collection first.',
              )
            : items.map((item) => {
                const isSelected = value.includes(item.id)
                return (
                  <label
                    key={item.id}
                    htmlFor={`event-menu-item-${item.id}`}
                    data-selected={isSelected ? 'true' : 'false'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: sp.sm,
                      padding: `calc(var(--base) * 0.35) ${sp.sm}`,
                      borderRadius: 'var(--style-radius-s)',
                      background: isSelected ? 'var(--theme-elevation-100)' : 'transparent',
                      cursor: disabled ? 'default' : 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: sp.sm, minWidth: 0 }}>
                      <CheckboxInput
                        id={`event-menu-item-${item.id}`}
                        checked={isSelected}
                        onToggle={() => handleToggle(item.id)}
                        readOnly={disabled}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--theme-elevation-800)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </span>
                    </span>
                    {item.price !== null && (
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--theme-elevation-500)',
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        QAR {item.price}
                      </span>
                    )}
                  </label>
                )
              })}
      </div>
    </div>
  )
}

export default ItemPicker
