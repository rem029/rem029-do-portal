'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button, useModal } from '@payloadcms/ui'
import { updateMenuItemsAction, type MenuRow } from '../../actions'
import { ItemPicker } from './item-picker'
import { ErrorText } from './ui'
import { ModalShell, ModalFooter } from './modal-shell'

export const editMenuItemsModalSlug = 'fnb-event-edit-menu-items-modal'

export interface EditMenuItemsModalProps {
  menu: MenuRow | null
  eventId: string
  locale: string
  onSuccess: (updated: { id: string; itemCount: number; itemIds: string[] }) => void
  onClose: () => void
}

export const EditMenuItemsModal: React.FC<EditMenuItemsModalProps> = ({
  menu,
  eventId,
  locale,
  onSuccess,
  onClose,
}) => {
  const { closeModal } = useModal()
  const [draftItemIds, setDraftItemIds] = useState<string[]>(menu?.itemIds || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (menu) {
      setDraftItemIds(menu.itemIds || [])
      setError(null)
    }
  }, [menu])

  const handleClose = useCallback(() => {
    setError(null)
    closeModal(editMenuItemsModalSlug)
    onClose()
  }, [closeModal, onClose])

  const handleSave = useCallback(async () => {
    if (!menu) return
    if (draftItemIds.length === 0) {
      setError('Pick at least one item.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const res = await updateMenuItemsAction({
        eventId,
        menuId: menu.id,
        itemIds: draftItemIds,
        locale,
      })
      if (!res.success) {
        setError(res.error)
        return
      }
      onSuccess({
        id: menu.id,
        itemCount: res.data.itemCount,
        itemIds: res.data.itemIds,
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update menu items.')
    } finally {
      setIsSaving(false)
    }
  }, [draftItemIds, eventId, handleClose, locale, menu, onSuccess])

  if (!menu) return null

  return (
    <ModalShell
      slug={editMenuItemsModalSlug}
      title={`Edit Items · ${menu.title}`}
      subtitle={`${draftItemIds.length} ${draftItemIds.length === 1 ? 'item' : 'items'} selected`}
      onClose={handleClose}
      maxWidth="max-w-[640px]"
      footer={
        <ModalFooter>
          <Button buttonStyle="secondary" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            buttonStyle="primary"
            onClick={handleSave}
            disabled={isSaving || draftItemIds.length === 0}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </ModalFooter>
      }
    >
      <ItemPicker
        eventId={eventId}
        locale={locale}
        value={draftItemIds}
        onChange={setDraftItemIds}
        disabled={isSaving}
      />

      {error && <ErrorText>{error}</ErrorText>}
    </ModalShell>
  )
}

export default EditMenuItemsModal
