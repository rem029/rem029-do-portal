'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button, useModal } from '@payloadcms/ui'
import { listEventMenusAction, type MenuRow } from '../actions'
import { BuildMenuModal, buildMenuModalSlug } from './_shared/build-menu-form'
import { AddExistingMenuModal, addExistingMenuModalSlug } from './_shared/add-existing-menu-form'
import { EditMenuItemsModal, editMenuItemsModalSlug } from './_shared/menu-items-edit-modal'
import {
  PanelSection,
  Row,
  RowTitle,
  RowMeta,
  RowAction,
  List,
  EmptyHint,
  LoadingHint,
  ErrorText,
  Note,
  sp,
} from './_shared/ui'

export interface MenusPanelProps {
  eventId: string
  restaurantId: string
  locale: string
  menuIds: string[]
  setMenuIds: (ids: string[]) => void
  onMenusChanged?: () => void
  refreshToken?: number
}

export const MenusPanel: React.FC<MenusPanelProps> = ({
  eventId,
  locale,
  menuIds,
  setMenuIds,
  onMenusChanged,
  refreshToken,
}) => {
  const { openModal } = useModal()
  const [allMenus, setAllMenus] = useState<MenuRow[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const [editingMenu, setEditingMenu] = useState<MenuRow | null>(null)

  useEffect(() => {
    if (!eventId) {
      setAllMenus([])
      return
    }
    let cancelled = false
    setLoading(true)
    setFetchError(null)

    listEventMenusAction({ eventId, locale })
      .then((res) => {
        if (cancelled) return
        if (res.success) setAllMenus(res.data.allMenus)
        else setFetchError(res.error)
      })
      .catch((err) => {
        if (cancelled) return
        setFetchError(err instanceof Error ? err.message : 'Failed to load menus.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [eventId, locale, refreshToken])

  const attached = useMemo(
    () =>
      menuIds
        .map((id) => allMenus.find((m) => m.id === id))
        .filter((m): m is MenuRow => Boolean(m)),
    [allMenus, menuIds],
  )

  const available = useMemo(
    () => allMenus.filter((m) => !menuIds.includes(m.id)),
    [allMenus, menuIds],
  )

  const handleRemove = useCallback(
    (row: MenuRow) => {
      setMenuIds(menuIds.filter((id) => id !== row.id))
      setIsDirty(true)
      onMenusChanged?.()
    },
    [menuIds, onMenusChanged, setMenuIds],
  )

  const handleBuildSuccess = useCallback(
    (newMenu: MenuRow) => {
      setAllMenus((prev) => [...prev, newMenu])
      setMenuIds([...menuIds, newMenu.id])
      setIsDirty(true)
      onMenusChanged?.()
    },
    [menuIds, onMenusChanged, setMenuIds],
  )

  const handleAddExisting = useCallback(
    (selectedIds: string[]) => {
      setMenuIds([...menuIds, ...selectedIds])
      setIsDirty(true)
      onMenusChanged?.()
    },
    [menuIds, onMenusChanged, setMenuIds],
  )

  const handleMenuItemsUpdated = useCallback(
    (updated: { id: string; itemCount: number; itemIds: string[] }) => {
      setAllMenus((prev) =>
        prev.map((m) =>
          m.id === updated.id
            ? { ...m, itemCount: updated.itemCount, itemIds: updated.itemIds }
            : m,
        ),
      )
    },
    [],
  )

  const handleCloseEdit = useCallback(() => {
    setEditingMenu(null)
  }, [])

  return (
    <PanelSection
      title="Menus on this event"
      count={attached.length}
      actions={
        <>
          <Button
            buttonStyle="transparent"
            size="small"
            icon="plus"
            iconPosition="left"
            iconStyle="without-border"
            onClick={() => openModal(buildMenuModalSlug)}
          >
            Build a menu
          </Button>
          <Button
            buttonStyle="transparent"
            size="small"
            icon="plus"
            iconPosition="left"
            iconStyle="without-border"
            onClick={() => openModal(addExistingMenuModalSlug)}
          >
            Add existing
          </Button>
        </>
      }
    >
      {isDirty && <Note tone="attention">Menu changes apply when you save this event.</Note>}

      {fetchError && <ErrorText>{fetchError}</ErrorText>}

      {loading && attached.length === 0 ? (
        <LoadingHint>Loading menus…</LoadingHint>
      ) : attached.length === 0 ? (
        <EmptyHint>
          No menus on this event yet. Build one from a category, or add an existing menu.
        </EmptyHint>
      ) : (
        <List>
          {attached.map((row) => (
            <Row
              key={row.id}
              trailing={
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
                  <RowAction
                    icon="edit"
                    label="Edit items"
                    onClick={() => {
                      setEditingMenu(row)
                      openModal(editMenuItemsModalSlug)
                    }}
                  />
                  <RowAction icon="x" label="Remove" onClick={() => handleRemove(row)} />
                </div>
              }
            >
              <RowTitle>{row.title}</RowTitle>
              <RowMeta>
                {row.itemCount} {row.itemCount === 1 ? 'item' : 'items'}
              </RowMeta>
            </Row>
          ))}
        </List>
      )}

      <BuildMenuModal
        eventId={eventId}
        locale={locale}
        onSuccess={handleBuildSuccess}
      />

      <AddExistingMenuModal
        available={available}
        onAdd={handleAddExisting}
      />

      <EditMenuItemsModal
        menu={editingMenu}
        eventId={eventId}
        locale={locale}
        onSuccess={handleMenuItemsUpdated}
        onClose={handleCloseEdit}
      />
    </PanelSection>
  )
}

export default MenusPanel
