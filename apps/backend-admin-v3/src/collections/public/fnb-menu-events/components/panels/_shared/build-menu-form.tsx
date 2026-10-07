'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button, SelectInput, useModal } from '@payloadcms/ui'
import {
  listCategoriesAction,
  createMenuAction,
  type CategoryRow,
  type MenuRow,
} from '../../actions'
import { ItemPicker } from './item-picker'
import { EmptyHint, LoadingHint, ErrorText } from './ui'
import { ModalShell, ModalFooter } from './modal-shell'

export const buildMenuModalSlug = 'fnb-event-build-menu-modal'

export interface BuildMenuFormProps {
  eventId: string
  locale?: string
  onSuccess: (menu: MenuRow) => void
  onClose?: () => void
  onCancel?: () => void
}

export const BuildMenuModal: React.FC<BuildMenuFormProps> = ({
  eventId,
  locale,
  onSuccess,
  onClose,
  onCancel,
}) => {
  const { closeModal, isModalOpen } = useModal()
  const isOpen = isModalOpen(buildMenuModalSlug)

  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [isBuilding, setIsBuilding] = useState(false)
  const [buildError, setBuildError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId || !isOpen) return
    let cancelled = false
    setLoadingCategories(true)
    listCategoriesAction({ eventId, locale })
      .then((res) => {
        if (cancelled) return
        if (res.success) setCategories(res.data)
      })
      .catch(() => {
        /* non-fatal — the empty state covers it */
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId, locale, isOpen])

  const availableCategories = useMemo(
    () => categories.filter((c) => !c.hasMenuForVenue),
    [categories],
  )

  const handleClose = useCallback(() => {
    setSelectedCategoryId('')
    setSelectedItemIds([])
    setBuildError(null)
    closeModal(buildMenuModalSlug)
    onClose?.()
    onCancel?.()
  }, [closeModal, onCancel, onClose])

  const handleBuild = useCallback(async () => {
    if (!selectedCategoryId || selectedItemIds.length === 0) return
    setIsBuilding(true)
    setBuildError(null)
    try {
      const res = await createMenuAction({
        eventId,
        categoryId: selectedCategoryId,
        itemIds: selectedItemIds,
        locale,
      })
      if (!res.success) {
        setBuildError(res.error)
        return
      }
      onSuccess(res.data)
      handleClose()
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : 'Could not build menu.')
    } finally {
      setIsBuilding(false)
    }
  }, [eventId, handleClose, locale, onSuccess, selectedCategoryId, selectedItemIds])

  const canBuild = availableCategories.length > 0

  return (
    <ModalShell
      slug={buildMenuModalSlug}
      title="Build a menu"
      onClose={handleClose}
      maxWidth="max-w-[640px]"
      footer={
        <ModalFooter>
          <Button buttonStyle="secondary" onClick={handleClose} disabled={isBuilding}>
            Cancel
          </Button>
          {canBuild && (
            <Button
              buttonStyle="primary"
              onClick={handleBuild}
              disabled={isBuilding || !selectedCategoryId || selectedItemIds.length === 0}
            >
              {isBuilding
                ? 'Building menu…'
                : selectedItemIds.length > 0
                  ? `Build menu · ${selectedItemIds.length} ${
                      selectedItemIds.length === 1 ? 'item' : 'items'
                    }`
                  : 'Build menu'}
            </Button>
          )}
        </ModalFooter>
      }
    >
      {loadingCategories ? (
        <LoadingHint>Loading categories…</LoadingHint>
      ) : !canBuild ? (
        <EmptyHint>
          Every category already has a menu for this venue. Edit those from the Menus collection, or
          add a new category above.
        </EmptyHint>
      ) : (
        <div className="flex flex-col gap-4">
          <SelectInput
            path="__buildMenuCategory"
            name="__buildMenuCategory"
            label="Category"
            required
            options={availableCategories.map((c) => ({ label: c.title, value: c.id }))}
            value={selectedCategoryId}
            onChange={(selected) => {
              // Structural cast: `selected` is a ReactSelectOption
              const opt = selected as unknown as { value?: string } | null | undefined
              setSelectedCategoryId(opt?.value || '')
              setBuildError(null)
            }}
            placeholder="Choose a category…"
            isClearable
          />

          <ItemPicker
            eventId={eventId}
            locale={locale}
            value={selectedItemIds}
            onChange={setSelectedItemIds}
            disabled={isBuilding}
          />
        </div>
      )}

      {buildError && <ErrorText>{buildError}</ErrorText>}
    </ModalShell>
  )
}

export const BuildMenuForm = BuildMenuModal
export default BuildMenuForm
