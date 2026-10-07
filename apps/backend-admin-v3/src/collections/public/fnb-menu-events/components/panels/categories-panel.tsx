'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button, useModal } from '@payloadcms/ui'
import {
  listCategoriesAction,
  type CategoryRow,
  type MenuRow,
} from '../actions'
import {
  PanelSection,
  Row,
  RowTitle,
  RowAction,
  List,
  StatusPill,
  EmptyHint,
  LoadingHint,
  ErrorText,
  sp,
} from './_shared/ui'
import {
  CategoryCreateModal,
  categoryCreateModalSlug,
} from './_shared/category-create-modal'
import {
  CategoryEditModal,
  categoryEditModalSlug,
} from './_shared/category-edit-modal'

export interface CategoriesPanelProps {
  eventId: string
  restaurantId: string
  locale: string
  localeLabel: string
  refreshToken?: number
  menuIds: string[]
  setMenuIds: (ids: string[]) => void
  onMenusChanged?: () => void
}

export const CategoriesPanel: React.FC<CategoriesPanelProps> = ({
  eventId,
  locale,
  localeLabel,
  refreshToken,
  menuIds,
  setMenuIds,
  onMenusChanged,
}) => {
  const { openModal } = useModal()
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Default to "used" — most operators have far more categories than this one
  // venue actually uses. Flips to "all" automatically right after a create, so
  // a brand-new (not-yet-used) category never looks like it vanished.
  const [showAll, setShowAll] = useState(false)

  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)

  useEffect(() => {
    if (!eventId) {
      setRows([])
      return
    }
    let cancelled = false
    setLoading(true)
    setFetchError(null)

    listCategoriesAction({ eventId, locale })
      .then((res) => {
        if (cancelled) return
        if (res.success) setRows(res.data)
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
  }, [eventId, locale, refreshToken])

  const visibleRows = useMemo(
    () => (showAll ? rows : rows.filter((r) => r.hasMenuForVenue)),
    [rows, showAll],
  )

  const handleCategoryCreated = useCallback(
    (newCategory: CategoryRow, menu?: MenuRow) => {
      setRows((prev) => [newCategory, ...prev])
      setShowAll(true)
      if (menu) {
        setMenuIds([...menuIds, menu.id])
        onMenusChanged?.()
      }
    },
    [menuIds, onMenusChanged, setMenuIds],
  )

  const handleCategoryUpdated = useCallback(
    (updated: { id: string; title: string }, menu?: MenuRow) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === updated.id
            ? { ...r, title: updated.title, hasMenuForVenue: r.hasMenuForVenue || Boolean(menu) }
            : r,
        ),
      )
      if (menu) {
        setMenuIds([...menuIds, menu.id])
        onMenusChanged?.()
      }
    },
    [menuIds, onMenusChanged, setMenuIds],
  )

  const handleCloseEdit = useCallback(() => {
    setEditingCategory(null)
  }, [])

  return (
    <PanelSection
      title="Categories"
      count={visibleRows.length}
      actions={
        <>
          <Button
            buttonStyle="transparent"
            size="small"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? 'Show used only' : 'Show all'}
          </Button>
          <Button
            buttonStyle="transparent"
            size="small"
            icon="plus"
            iconPosition="left"
            iconStyle="without-border"
            onClick={() => openModal(categoryCreateModalSlug)}
          >
            Add category
          </Button>
        </>
      }
    >
      {fetchError && <ErrorText>{fetchError}</ErrorText>}

      {loading && rows.length === 0 ? (
        <LoadingHint>Loading categories…</LoadingHint>
      ) : rows.length === 0 ? (
        <EmptyHint>No categories yet for this operator. Add the first one above.</EmptyHint>
      ) : visibleRows.length === 0 ? (
        <EmptyHint>
          No categories are used by this venue yet. Build a menu from one below, or{' '}
          <Button buttonStyle="transparent" size="small" onClick={() => setShowAll(true)}>
            show all {rows.length}
          </Button>
          .
        </EmptyHint>
      ) : (
        <List>
          {visibleRows.map((row) => (
            <Row
              key={row.id}
              trailing={
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
                  <StatusPill tone={row.hasMenuForVenue ? 'ready' : 'idle'}>
                    {row.hasMenuForVenue ? 'has a menu' : 'no menu yet'}
                  </StatusPill>
                  <RowAction
                    icon="edit"
                    label="Edit"
                    onClick={() => {
                      setEditingCategory(row)
                      openModal(categoryEditModalSlug)
                    }}
                  />
                </div>
              }
            >
              <RowTitle>{row.title}</RowTitle>
            </Row>
          ))}
        </List>
      )}

      <CategoryCreateModal
        eventId={eventId}
        locale={locale}
        localeLabel={localeLabel}
        onSuccess={handleCategoryCreated}
      />

      <CategoryEditModal
        category={editingCategory}
        eventId={eventId}
        locale={locale}
        localeLabel={localeLabel}
        onSuccess={handleCategoryUpdated}
        onClose={handleCloseEdit}
      />
    </PanelSection>
  )
}

export default CategoriesPanel
