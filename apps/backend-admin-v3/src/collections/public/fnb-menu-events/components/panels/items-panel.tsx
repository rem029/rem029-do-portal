'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button, Pill, useModal } from '@payloadcms/ui'
import {
  listMenuItemsAction,
  getItemCategoriesAction,
  toggleMenuItemStockAction,
  type MenuItemRow,
} from '../actions'
import { ItemFormModal, itemFormModalSlug } from './_shared/item-form-modal'
import {
  PanelSection,
  RowTitle,
  RowMeta,
  RowAction,
  List,
  EmptyHint,
  LoadingHint,
  ErrorText,
  StatusPill,
  sp,
} from './_shared/ui'

// Same glyph as Payload's own list-view sort icon (icons/Sort, used by SortHeader/
// FolderView's SortByPill) - not part of the public @payloadcms/ui export surface,
// so redrawn locally rather than deep-importing an internal path. `currentColor`
// keeps it theme-correct without a separate dark-mode rule.
const SortDirectionIcon: React.FC<{ direction: 'asc' | 'desc' }> = ({ direction }) => (
  <svg
    aria-hidden="true"
    width="13"
    height="13"
    viewBox="0 0 20 20"
    fill="none"
    style={{ flexShrink: 0 }}
  >
    <path
      d={
        direction === 'asc'
          ? 'M2.5 6.66668L5.83333 3.33334M5.83333 3.33334L9.16667 6.66668M5.83333 3.33334V16.6667M11.6667 7.08354H17.5M9.16667 10.4169H15M9.16667 13.7502H12.5'
          : 'M2.5 13.3333L5.83333 16.6667M5.83333 16.6667L9.16667 13.3333M5.83333 16.6667V3.33333M9.16667 7.08333H17.5M9.16667 10.4167H15M11.6667 13.75H12.5'
      }
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export interface ItemsPanelProps {
  eventId: string
  restaurantId: string
  locale: string
  localeLabel: string
  refreshToken?: number
  onItemSaved?: () => void
}

export const ItemsPanel: React.FC<ItemsPanelProps> = ({
  eventId,
  locale,
  localeLabel,
  refreshToken,
  onItemSaved,
}) => {
  const { openModal } = useModal()
  const [rows, setRows] = useState<MenuItemRow[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [editingRow, setEditingRow] = useState<MenuItemRow | null>(null)
  const [togglingStockIds, setTogglingStockIds] = useState<Set<string>>(new Set())
  // menu-items carries no category field - an item's current categories are a
  // reverse lookup against `menu` (see getItemCategoriesAction), fetched only
  // for the one item being opened to edit, never for the whole list.
  const [editingCategoryIds, setEditingCategoryIds] = useState<string[] | null>(null)
  const [sortBy, setSortBy] = useState<'title' | 'category' | 'price'>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const editRequestIdRef = useRef(0)

  useEffect(() => {
    if (!eventId) {
      setRows([])
      return
    }
    let cancelled = false
    setLoading(true)
    setFetchError(null)

    listMenuItemsAction({ eventId, locale, search: '' })
      .then((res) => {
        if (cancelled) return
        if (res.success) setRows(res.data)
        else setFetchError(res.error)
      })
      .catch((err) => {
        if (cancelled) return
        setFetchError(err instanceof Error ? err.message : 'Failed to load items.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [eventId, locale, refreshToken])

  const handleAddClick = useCallback(() => {
    editRequestIdRef.current++
    setEditingRow(null)
    setEditingCategoryIds(null)
    openModal(itemFormModalSlug)
  }, [openModal])

  const handleEditClick = useCallback(
    (row: MenuItemRow) => {
      setEditingRow(row)
      setEditingCategoryIds(null)
      openModal(itemFormModalSlug)
      const reqId = ++editRequestIdRef.current
      getItemCategoriesAction({ eventId, itemId: row.id, locale }).then((res) => {
        if (editRequestIdRef.current === reqId) {
          setEditingCategoryIds(res.success ? res.data : [])
        }
      })
    },
    [eventId, locale, openModal],
  )

  const handleCloseModal = useCallback(() => {
    editRequestIdRef.current++
    setEditingRow(null)
    setEditingCategoryIds(null)
  }, [])

  const handleToggleStock = useCallback(
    async (row: MenuItemRow, e: React.MouseEvent) => {
      e.stopPropagation()
      const nextStock = !row.inStock
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, inStock: nextStock } : r)),
      )
      setTogglingStockIds((prev) => new Set(prev).add(row.id))

      try {
        const res = await toggleMenuItemStockAction({
          eventId,
          itemId: row.id,
          inStock: nextStock,
        })
        if (!res.success) {
          setRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, inStock: row.inStock } : r)),
          )
        }
      } catch {
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, inStock: row.inStock } : r)),
        )
      } finally {
        setTogglingStockIds((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [eventId],
  )

  const handleItemSaved = useCallback(
    (item: MenuItemRow) => {
      if (editingRow) {
        setRows((prev) => prev.map((r) => (r.id === item.id ? item : r)))
      } else {
        setRows((prev) => [item, ...prev])
      }
      handleCloseModal()
      onItemSaved?.()
    },
    [editingRow, handleCloseModal, onItemSaved],
  )

  // Category isn't a single value (an item can be in several, or none) - sorting by it
  // uses the first category name alphabetically as the key, with uncategorized items
  // (empty string) sorting first, then falls back to title to keep ties stable.
  const sortedRows = useMemo(() => {
    const sorted = [...rows]
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortBy === 'price') {
      sorted.sort(
        (a, b) => dir * ((a.price ?? 0) - (b.price ?? 0)) || a.title.localeCompare(b.title),
      )
    } else if (sortBy === 'category') {
      sorted.sort((a, b) => {
        const catA = a.categoryNames?.[0] ?? ''
        const catB = b.categoryNames?.[0] ?? ''
        return dir * catA.localeCompare(catB) || a.title.localeCompare(b.title)
      })
    } else {
      sorted.sort((a, b) => dir * a.title.localeCompare(b.title))
    }
    return sorted
  }, [rows, sortBy, sortDir])

  const sortOptions: { key: typeof sortBy; label: string }[] = [
    { key: 'title', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
  ]

  return (
    <PanelSection
      first
      title="Items"
      actions={
        <>
          <div
            role="group"
            aria-label="Sort items"
            style={{ alignSelf: 'center', display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}
          >
            {sortOptions.map((opt) => {
              const active = sortBy === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={active}
                  aria-label={
                    active
                      ? `Sorted by ${opt.label}, ${sortDir === 'asc' ? 'ascending' : 'descending'} — click to reverse`
                      : `Sort by ${opt.label}`
                  }
                  title={
                    active
                      ? `${sortDir === 'asc' ? 'Ascending' : 'Descending'} — click to reverse`
                      : undefined
                  }
                  onClick={() => {
                    if (active) {
                      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                    } else {
                      setSortBy(opt.key)
                      setSortDir('asc')
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    height: 26,
                    padding: active ? '0 8px 0 10px' : '0 10px',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    border: `1px solid ${active ? 'var(--theme-elevation-250)' : 'var(--theme-elevation-150)'}`,
                    borderRadius: 'var(--style-radius-m)',
                    background: active ? 'var(--theme-elevation-150)' : 'transparent',
                    color: active ? 'var(--theme-elevation-900)' : 'var(--theme-elevation-600)',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                  {active && <SortDirectionIcon direction={sortDir} />}
                </button>
              )
            })}
          </div>
          <Button
            buttonStyle="transparent"
            size="small"
            icon="plus"
            iconPosition="left"
            iconStyle="without-border"
            onClick={handleAddClick}
          >
            Add item
          </Button>
        </>
      }
    >
      {fetchError && <ErrorText>{fetchError}</ErrorText>}

      {loading && rows.length === 0 ? (
        <LoadingHint>Loading items…</LoadingHint>
      ) : rows.length === 0 ? (
        <EmptyHint>No items yet for this venue. Add the first one above.</EmptyHint>
      ) : (
        <List>
          {sortedRows.map((row, idx) => (
            <div
              key={row.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: sp.xs,
                padding: `calc(var(--base) * 0.4) calc(var(--base) * 0.75)`,
                borderTop: idx === 0 ? 'none' : '1px solid var(--theme-elevation-100)',
              }}
            >
              {/* Row 1: image + title, edit action */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: sp.sm,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.sm, minWidth: 0 }}>
                  {row.imageUrl && (
                    <img
                      src={row.imageUrl}
                      alt=""
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--style-radius-s)',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <RowTitle>{row.title}</RowTitle>
                </div>
                <RowAction icon="edit" label="Edit" onClick={() => handleEditClick(row)} />
              </div>

              {/* Row 2: categories */}
              {row.categoryNames?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  {row.categoryNames.map((catName) => (
                    <Pill key={catName} pillStyle="light-gray" size="small">
                      {catName}
                    </Pill>
                  ))}
                </div>
              )}

              {/* Row 3: stock toggle, modifier count, price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs, flexWrap: 'wrap' }}>
                {row.status === 'draft' && <StatusPill tone="idle">Disabled</StatusPill>}
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.inStock}
                  aria-label={row.inStock ? 'In stock' : 'Out of stock'}
                  title={
                    row.inStock
                      ? 'In stock — click to mark out of stock'
                      : 'Out of stock — click to mark in stock'
                  }
                  disabled={togglingStockIds.has(row.id)}
                  onClick={(e) => handleToggleStock(row, e)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid var(--theme-elevation-200)',
                    background: 'transparent',
                    fontSize: 11,
                    cursor: togglingStockIds.has(row.id) ? 'wait' : 'pointer',
                    opacity: togglingStockIds.has(row.id) ? 0.6 : 1,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 24,
                      height: 14,
                      borderRadius: 7,
                      background: row.inStock
                        ? 'var(--theme-success-500, #22c55e)'
                        : 'var(--theme-elevation-300, #cbd5e1)',
                      position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        background: '#fff',
                        position: 'absolute',
                        top: 2,
                        left: row.inStock ? 12 : 2,
                        transition: 'left 0.2s',
                      }}
                    />
                  </span>
                  <span
                    style={{
                      color: row.inStock
                        ? 'var(--theme-elevation-800)'
                        : 'var(--theme-elevation-500)',
                    }}
                  >
                    {row.inStock ? 'In stock' : 'Out of stock'}
                  </span>
                </button>

                {row.modifierGroups?.length > 0 && (
                  <StatusPill tone="idle">
                    {row.modifierGroups.length}{' '}
                    {row.modifierGroups.length === 1 ? 'modifier' : 'modifiers'}
                  </StatusPill>
                )}
                {row.price !== null ? <RowMeta>QAR {row.price}</RowMeta> : null}
              </div>
            </div>
          ))}
        </List>
      )}

      <ItemFormModal
        eventId={eventId}
        locale={locale}
        localeLabel={localeLabel}
        mode={editingRow ? 'edit' : 'create'}
        itemId={editingRow?.id}
        initialValues={
          editingRow && editingCategoryIds !== null
            ? {
                title: editingRow.title,
                description: editingRow.description,
                price: editingRow.price ?? 0,
                inStock: editingRow.inStock,
                status: editingRow.status,
                categoryIds: editingCategoryIds,
                allergenIds: editingRow.allergenIds,
                tagIds: editingRow.tagIds,
                imageId: editingRow.imageId,
                imageUrl: editingRow.imageUrl,
                modifierGroups: editingRow.modifierGroups,
              }
            : undefined
        }
        isLoadingInitialValues={Boolean(editingRow && editingCategoryIds === null)}
        onSuccess={handleItemSaved}
        onClose={handleCloseModal}
      />
    </PanelSection>
  )
}

export default ItemsPanel
