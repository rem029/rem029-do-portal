'use client'

import React, { useState, useCallback } from 'react'
import { TextInput, Button, CheckboxInput, useModal } from '@payloadcms/ui'
import { createCategoryAction, type CategoryRow, type MenuRow } from '../../actions'
import { ModalShell, ModalFooter } from './modal-shell'
import { ErrorText } from './ui'

export const categoryCreateModalSlug = 'fnb-event-add-category-modal'

export interface CategoryCreateModalProps {
  eventId: string
  locale: string
  localeLabel?: string
  onSuccess: (newCategory: CategoryRow, menu?: MenuRow) => void
  onClose?: () => void
}

export const CategoryCreateModal: React.FC<CategoryCreateModalProps> = ({
  eventId,
  locale,
  localeLabel,
  onSuccess,
  onClose,
}) => {
  const { closeModal } = useModal()
  const [title, setTitle] = useState('')
  const [addToVenueMenu, setAddToVenueMenu] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    setTitle('')
    setAddToVenueMenu(true)
    setError(null)
    closeModal(categoryCreateModalSlug)
    onClose?.()
  }, [closeModal, onClose])

  const handleCreate = useCallback(async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Category name is required.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await createCategoryAction({
        eventId,
        title: trimmedTitle,
        locale,
        addToVenueMenu,
      })
      if (!res.success) {
        setError(res.error)
        return
      }
      onSuccess(res.data, res.data.menu)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create category.')
    } finally {
      setIsSubmitting(false)
    }
  }, [addToVenueMenu, eventId, handleClose, locale, onSuccess, title])

  return (
    <ModalShell
      slug={categoryCreateModalSlug}
      title={`Add Category${localeLabel ? ` - ${localeLabel}` : ''}`}
      onClose={handleClose}
      footer={
        <ModalFooter>
          <Button buttonStyle="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            buttonStyle="primary"
            onClick={handleCreate}
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? 'Adding category…' : 'Add category'}
          </Button>
        </ModalFooter>
      }
    >
      <TextInput
        path="__new_category_modal"
        label={`Category name${localeLabel ? ` - ${localeLabel}` : ''}`}
        required
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setTitle(e.target.value)
          setError(null)
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (!isSubmitting && title.trim()) handleCreate()
          }
        }}
        readOnly={isSubmitting}
        placeholder="e.g. Canapés"
      />

      <CheckboxInput
        id="__new_category_modal_add_to_venue_menu"
        name="__new_category_modal_add_to_venue_menu"
        label="Add this to venue menu"
        checked={addToVenueMenu}
        onToggle={(e: React.ChangeEvent<HTMLInputElement>) =>
          setAddToVenueMenu(Boolean(e?.target?.checked))
        }
        readOnly={isSubmitting}
      />

      {error && <ErrorText>{error}</ErrorText>}
    </ModalShell>
  )
}

export default CategoryCreateModal
