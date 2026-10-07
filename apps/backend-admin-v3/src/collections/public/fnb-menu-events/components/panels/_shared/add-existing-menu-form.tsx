'use client'

import React, { useState, useCallback } from 'react'
import { Button, SelectInput, useModal } from '@payloadcms/ui'
import type { MenuRow } from '../../actions'
import { EmptyHint } from './ui'
import { ModalShell, ModalFooter } from './modal-shell'

export const addExistingMenuModalSlug = 'fnb-event-add-existing-menu-modal'

export interface AddExistingMenuFormProps {
  available: MenuRow[]
  onAdd: (selectedIds: string[]) => void
  onClose?: () => void
  onCancel?: () => void
}

export const AddExistingMenuModal: React.FC<AddExistingMenuFormProps> = ({
  available,
  onAdd,
  onClose,
  onCancel,
}) => {
  const { closeModal } = useModal()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleClose = useCallback(() => {
    setSelectedIds([])
    closeModal(addExistingMenuModalSlug)
    onClose?.()
    onCancel?.()
  }, [closeModal, onCancel, onClose])

  const handleConfirm = useCallback(() => {
    if (selectedIds.length === 0) return
    onAdd(selectedIds)
    handleClose()
  }, [handleClose, onAdd, selectedIds])

  return (
    <ModalShell
      slug={addExistingMenuModalSlug}
      title="Add existing menu"
      onClose={handleClose}
      maxWidth="max-w-[500px]"
      footer={
        <ModalFooter>
          <Button buttonStyle="secondary" onClick={handleClose}>
            Cancel
          </Button>
          {available.length > 0 && (
            <Button
              buttonStyle="primary"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
            >
              Add to event
            </Button>
          )}
        </ModalFooter>
      }
    >
      {available.length === 0 ? (
        <EmptyHint>No other menus exist for this venue yet.</EmptyHint>
      ) : (
        <SelectInput
          path="__addExistingMenus"
          name="__addExistingMenus"
          label="Menus"
          hasMany
          options={available.map((m) => ({
            label: `${m.title} · ${m.itemCount} ${m.itemCount === 1 ? 'item' : 'items'}`,
            value: m.id,
          }))}
          value={selectedIds}
          onChange={(selected) => {
            // Structural cast: `selected` is an array of ReactSelectOption for hasMany
            const opts = Array.isArray(selected)
              ? (selected as unknown as Array<{ value?: string }>)
              : []
            setSelectedIds(
              opts.map((o) => (o?.value !== undefined ? String(o.value) : '')).filter(Boolean),
            )
          }}
          placeholder="Pick menus to add…"
        />
      )}
    </ModalShell>
  )
}

export const AddExistingMenuForm = AddExistingMenuModal
export default AddExistingMenuForm
