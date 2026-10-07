'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { TextInput, Button, CheckboxInput, useModal } from '@payloadcms/ui'
import { updateCategoryAction, type CategoryRow, type MenuRow } from '../../actions'
import { ModalShell, ModalFooter } from './modal-shell'
import { ErrorText } from './ui'

export const categoryEditModalSlug = 'fnb-event-edit-category-modal'

export interface CategoryEditModalProps {
  category: CategoryRow | null
  eventId: string
  locale: string
  localeLabel?: string
  onSuccess: (updated: { id: string; title: string }, menu?: MenuRow) => void
  onClose: () => void
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  category,
  eventId,
  locale,
  localeLabel,
  onSuccess,
  onClose,
}) => {
  const { closeModal } = useModal()
  const [title, setTitle] = useState(category?.title ?? '')
  const [addToVenueMenu, setAddToVenueMenu] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (category) {
      setTitle(category.title)
      setAddToVenueMenu(true)
      setError(null)
    }
  }, [category])

  const handleClose = useCallback(() => {
    setError(null)
    closeModal(categoryEditModalSlug)
    onClose()
  }, [closeModal, onClose])

  const handleSave = useCallback(async () => {
    if (!category) return
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Category title is required.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await updateCategoryAction({
        eventId,
        categoryId: category.id,
        title: trimmedTitle,
        locale,
        // Already has a menu for this venue — nothing to add, checkbox isn't shown either.
        addToVenueMenu: category.hasMenuForVenue ? false : addToVenueMenu,
      })
      if (!res.success) {
        setError(res.error)
        return
      }
      onSuccess({ id: category.id, title: res.data.title }, res.data.menu)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update category.')
    } finally {
      setIsSubmitting(false)
    }
  }, [addToVenueMenu, category, eventId, handleClose, locale, onSuccess, title])

  if (!category) return null

  return (
    <ModalShell
      slug={categoryEditModalSlug}
      title={`Edit Category${localeLabel ? ` - ${localeLabel}` : ''}`}
      onClose={handleClose}
      footer={
        <ModalFooter>
          <Button buttonStyle="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            buttonStyle="primary"
            onClick={handleSave}
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </ModalFooter>
      }
    >
      <TextInput
        path={`__edit_category_modal_${category.id}`}
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
            if (!isSubmitting && title.trim()) handleSave()
          }
        }}
        readOnly={isSubmitting}
      />

      {!category.hasMenuForVenue && (
        <CheckboxInput
          id={`__edit_category_modal_${category.id}_add_to_venue_menu`}
          name={`__edit_category_modal_${category.id}_add_to_venue_menu`}
          label="Add this to venue menu"
          checked={addToVenueMenu}
          onToggle={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAddToVenueMenu(Boolean(e?.target?.checked))
          }
          readOnly={isSubmitting}
        />
      )}

      {error && <ErrorText>{error}</ErrorText>}
    </ModalShell>
  )
}

export default CategoryEditModal
