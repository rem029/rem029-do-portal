'use client'

import React, { useCallback, useState } from 'react'
import { useModal } from '@payloadcms/ui'
import type { MenuItemRow } from '../../actions'
import { ModalShell } from './modal-shell'
import { ItemForm, type ItemFormProps } from './item-form'
import { LoadingHint } from './ui'

export const itemFormModalSlug = 'fnb-event-item-form-modal'

export interface ItemFormModalProps {
  eventId: string
  locale?: string
  localeLabel?: string
  mode: 'create' | 'edit'
  itemId?: string
  initialValues?: ItemFormProps['initialValues']
  isLoadingInitialValues?: boolean
  onSuccess: (item: MenuItemRow) => void
  onClose: () => void
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  eventId,
  locale,
  localeLabel,
  mode,
  itemId,
  initialValues,
  isLoadingInitialValues = false,
  onSuccess,
  onClose,
}) => {
  const { closeModal } = useModal()
  const [createKey, setCreateKey] = useState(0)

  const handleClose = useCallback(() => {
    closeModal(itemFormModalSlug)
    if (mode === 'create') {
      setCreateKey((k) => k + 1)
    }
    onClose()
  }, [closeModal, mode, onClose])

  const handleSuccess = useCallback(
    (item: MenuItemRow) => {
      onSuccess(item)
      handleClose()
    },
    [handleClose, onSuccess],
  )

  const showLoading = isLoadingInitialValues || (mode === 'edit' && !initialValues)

  return (
    <ModalShell
      slug={itemFormModalSlug}
      title={mode === 'edit' ? 'Edit item' : 'Add item'}
      onClose={handleClose}
      maxWidth="max-w-[720px]"
    >
      {showLoading ? (
        <LoadingHint>Loading item…</LoadingHint>
      ) : (
        <ItemForm
          key={mode === 'edit' ? `${itemId}_${locale}` : `new_${createKey}`}
          eventId={eventId}
          locale={locale}
          localeLabel={localeLabel}
          mode={mode}
          itemId={itemId}
          initialValues={initialValues}
          embedded
          onSuccess={handleSuccess}
          onCancel={handleClose}
        />
      )}
    </ModalShell>
  )
}

export default ItemFormModal
