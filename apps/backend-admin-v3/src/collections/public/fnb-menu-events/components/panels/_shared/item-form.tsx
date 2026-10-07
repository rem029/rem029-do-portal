'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { Data } from 'payload'
import { Button, TextInput, TextareaInput, CheckboxInput, useListDrawer } from '@payloadcms/ui'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import {
  createMenuItemAction,
  updateMenuItemAction,
  uploadMenuItemImageAction,
  type MenuItemRow,
  type ModifierGroupRow,
} from '../../actions'
import {
  SubForm,
  FormActions,
  ErrorText,
  Note,
  FieldRow,
  FieldRowItem,
  SectionDivider,
  sp,
} from './ui'
import { ModifierGroupsEditor } from './modifier-groups-editor'
import { CategoryPicker } from './category-picker'

export interface ItemFormProps {
  eventId: string
  locale?: string
  localeLabel?: string // e.g. "English" — appended to localized field labels
  mode: 'create' | 'edit'
  itemId?: string // required when mode === 'edit'
  initialValues?: {
    title: string
    description?: string
    price: number
    inStock?: boolean
    status?: 'draft' | 'published'
    categoryIds?: string[]
    allergenIds: string[]
    tagIds: string[]
    imageId?: string | null
    imageUrl?: string | null
    modifierGroups?: ModifierGroupRow[]
  }
  embedded?: boolean
  onSuccess: (item: MenuItemRow) => void
  onCancel: () => void
}

export const ItemForm: React.FC<ItemFormProps> = ({
  eventId,
  locale,
  localeLabel,
  mode,
  itemId,
  initialValues,
  embedded = false,
  onSuccess,
  onCancel,
}) => {
  const localeSuffix = localeLabel ? ` - ${localeLabel}` : ''
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [price, setPrice] = useState(
    initialValues?.price !== undefined && initialValues.price !== null
      ? String(initialValues.price)
      : '',
  )
  const [inStock, setInStock] = useState<boolean>(initialValues?.inStock ?? true)
  const [status, setStatus] = useState<'draft' | 'published'>(initialValues?.status ?? 'published')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialValues?.categoryIds ?? [],
  )
  // menu-items carries no category field of its own - the server derives an
  // item's categories by reverse-looking-up which Menu docs list it (see
  // getItemCategoriesAction). initialValues.categoryIds is that lookup's
  // result, fetched once when this item was opened to edit. Pinned in a ref
  // (not state) so it stays the true "before this edit" baseline even as
  // selectedCategoryIds changes while the user picks/unpicks categories.
  const previousCategoryIdsRef = useRef(initialValues?.categoryIds ?? [])
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>(
    initialValues?.allergenIds ?? [],
  )
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialValues?.tagIds ?? [])
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupRow[]>(
    initialValues?.modifierGroups ?? [],
  )

  const [imageId, setImageId] = useState<string | null>(initialValues?.imageId ?? null)
  const [imageUrl, setImageUrl] = useState<string | null>(initialValues?.imageUrl ?? null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialValues?.imageUrl ?? null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB.')
      return
    }

    const localUrl = URL.createObjectURL(file)
    objectUrlRef.current = localUrl
    setPreviewUrl(localUrl)
    setIsUploadingImage(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await uploadMenuItemImageAction(eventId, formData)
      if (res.success) {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }
        setImageId(res.data.id)
        setImageUrl(res.data.url)
        setPreviewUrl(res.data.url)
      } else {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }
        setPreviewUrl(imageUrl)
        setUploadError(res.error)
      }
    } catch (err) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      setPreviewUrl(imageUrl)
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImageId(null)
    setImageUrl(null)
    setPreviewUrl(null)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const [MediaListDrawer, , { openDrawer: openMediaDrawer, closeDrawer: closeMediaDrawer }] =
    useListDrawer({ collectionSlugs: ['menu-media'] })

  const handleSelectExistingImage = useCallback(
    ({ doc }: { doc: Data }) => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      const url = `${BACKEND_URL_WITH_BASE}/api/menu-media/file/${doc.filename as string}`
      setImageId(String(doc.id))
      setImageUrl(url)
      setPreviewUrl(url)
      setUploadError(null)
      closeMediaDrawer()
    },
    [closeMediaDrawer],
  )

  const handleSubmit = useCallback(async () => {
    if (isUploadingImage) return

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Item title is required.')
      return
    }

    const trimmedPrice = price.trim()
    if (!trimmedPrice) {
      setError('Enter a valid price.')
      return
    }

    const numericPrice = Number(trimmedPrice)
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError('Enter a valid price.')
      return
    }

    if (mode === 'edit' && !itemId) {
      setError('Item ID is required.')
      return
    }

    for (const mg of modifierGroups) {
      if (!mg.name.trim()) {
        setError('Each modifier group must have a name.')
        return
      }
      if (!mg.options || mg.options.length === 0) {
        setError(`Modifier group "${mg.name.trim()}" must have at least one option.`)
        return
      }
      for (const opt of mg.options) {
        if (!opt.label.trim()) {
          setError(`All options in modifier group "${mg.name.trim()}" must have a label.`)
          return
        }
      }
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res =
        mode === 'edit'
          ? await updateMenuItemAction({
              eventId,
              itemId: itemId!,
              title: trimmedTitle,
              description: description.trim(),
              price: numericPrice,
              inStock,
              status,
              categoryIds: selectedCategoryIds,
              previousCategoryIds: previousCategoryIdsRef.current,
              allergenIds: selectedAllergenIds,
              tagIds: selectedTagIds,
              imageId,
              imageUrl,
              modifierGroups,
              locale,
            })
          : await createMenuItemAction({
              eventId,
              title: trimmedTitle,
              description: description.trim(),
              price: numericPrice,
              inStock,
              status,
              categoryIds: selectedCategoryIds,
              allergenIds: selectedAllergenIds,
              tagIds: selectedTagIds,
              imageId,
              imageUrl,
              modifierGroups,
              locale,
            })

      if (!res.success) {
        setError(res.error)
        return
      }

      if (mode === 'create') {
        setTitle('')
        setDescription('')
        setPrice('')
        setInStock(true)
        setStatus('published')
        setSelectedCategoryIds([])
        setSelectedAllergenIds([])
        setSelectedTagIds([])
        setImageId(null)
        setImageUrl(null)
        setPreviewUrl(null)
        setModifierGroups([])
      }
      setError(null)
      onSuccess(res.data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === 'edit'
            ? 'Could not update item.'
            : 'Could not create item.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [
    eventId,
    mode,
    itemId,
    title,
    description,
    price,
    inStock,
    status,
    selectedCategoryIds,
    selectedAllergenIds,
    selectedTagIds,
    imageId,
    imageUrl,
    modifierGroups,
    locale,
    isUploadingImage,
    onSuccess,
  ])

  const fieldPrefix = mode === 'edit' && itemId ? `__editItem_${itemId}` : '__newItem'

  const content = (
    <>
      {mode === 'create' && locale && locale !== 'en' && (
        <Note>Tip: create new items in English first, then switch locale above to translate them.</Note>
      )}

      <SectionDivider label="Details" />

      <FieldRow>
        <FieldRowItem flexGrow={3} minWidth={220}>
          <TextInput
            path={`${fieldPrefix}Title`}
            label={`Title${localeSuffix}`}
            required
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setTitle(e.target.value)
              setError(null)
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (!isSubmitting && !isUploadingImage) handleSubmit()
              }
            }}
            readOnly={isSubmitting}
            placeholder="e.g. Petit Four"
          />
        </FieldRowItem>
        <FieldRowItem flexGrow={1} minWidth={110}>
          <TextInput
            path={`${fieldPrefix}Price`}
            label="Price"
            required
            value={price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPrice(e.target.value)
              setError(null)
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (!isSubmitting && !isUploadingImage) handleSubmit()
              }
            }}
            readOnly={isSubmitting}
            placeholder="0.00"
          />
        </FieldRowItem>
      </FieldRow>

      <div className="field-type checkbox" style={{ margin: `calc(${sp.xs} * 0.5) 0` }}>
        <CheckboxInput
          id={`${fieldPrefix}InStock`}
          name={`${fieldPrefix}InStock`}
          label="In stock"
          checked={inStock}
          onToggle={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInStock(typeof e?.target?.checked === 'boolean' ? e.target.checked : !inStock)
          }
          readOnly={isSubmitting}
        />
      </div>

      <TextareaInput
        path={`${fieldPrefix}Description`}
        label={`Description${localeSuffix}`}
        value={description}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setDescription(e.target.value)
          setError(null)
        }}
        readOnly={isSubmitting}
        placeholder="e.g. Special cannella cream, crunchy biscuit and berries"
        rows={3}
      />

      <CategoryPicker
        eventId={eventId}
        locale={locale}
        value={selectedCategoryIds}
        onChange={setSelectedCategoryIds}
        disabled={isSubmitting}
      />

      <SectionDivider label="Image" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.xs }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={isUploadingImage || isSubmitting}
        />
        {previewUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.sm }}>
            <div
              style={{
                position: 'relative',
                width: 96,
                height: 96,
                borderRadius: 'var(--style-radius-s)',
                overflow: 'hidden',
                border: '1px solid var(--theme-elevation-150)',
                background: 'var(--theme-elevation-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src={previewUrl}
                alt="Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {isUploadingImage && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  Uploading…
                </div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: sp.xs,
                alignItems: 'center',
              }}
            >
              <Button
                buttonStyle="transparent"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage || isSubmitting}
              >
                Change image
              </Button>
              <Button
                buttonStyle="transparent"
                size="small"
                onClick={openMediaDrawer}
                disabled={isUploadingImage || isSubmitting}
              >
                Choose from existing
              </Button>
              <Button
                buttonStyle="transparent"
                size="small"
                onClick={handleRemoveImage}
                disabled={isUploadingImage || isSubmitting}
              >
                Remove image
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.sm }}>
            <Button
              buttonStyle="secondary"
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage || isSubmitting}
            >
              {isUploadingImage ? 'Uploading…' : 'Choose image'}
            </Button>
            <Button
              buttonStyle="secondary"
              size="small"
              onClick={openMediaDrawer}
              disabled={isUploadingImage || isSubmitting}
            >
              Choose from existing
            </Button>
          </div>
        )}
        {uploadError && <ErrorText>{uploadError}</ErrorText>}
        <MediaListDrawer onSelect={handleSelectExistingImage} />
      </div>

      {/* Allergens/Tags removed for now (2026-09-13, user request) — re-add later.
          selectedAllergenIds/selectedTagIds still flow through to the create/update
          actions unchanged so editing an item never wipes out allergen/tag data an
          item already had. */}

      <SectionDivider label="Modifier Groups" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.xs }}>
        <ModifierGroupsEditor
          groups={modifierGroups}
          onChange={setModifierGroups}
          disabled={isSubmitting}
          fieldPrefix={fieldPrefix}
          localeLabel={localeLabel}
        />
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: sp.sm,
          marginTop: sp.xs,
          flexWrap: 'wrap',
        }}
      >
        <div className="field-type checkbox" style={{ margin: 0 }}>
          <CheckboxInput
            id={`${fieldPrefix}Status`}
            name={`${fieldPrefix}Status`}
            label="Enabled (visible on guest menu)"
            checked={status === 'published'}
            onToggle={(e: React.ChangeEvent<HTMLInputElement>) => {
              const checked =
                typeof e?.target?.checked === 'boolean'
                  ? e.target.checked
                  : status !== 'published'
              setStatus(checked ? 'published' : 'draft')
            }}
            readOnly={isSubmitting}
          />
        </div>

        <FormActions>
          <Button buttonStyle="secondary" size="small" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="small" onClick={handleSubmit} disabled={isSubmitting || isUploadingImage}>
            {isSubmitting
              ? mode === 'edit'
                ? 'Saving…'
                : 'Adding item…'
              : isUploadingImage
                ? 'Uploading image…'
                : mode === 'edit'
                  ? 'Save changes'
                  : 'Add item'}
          </Button>
        </FormActions>
      </div>
    </>
  )

  if (embedded) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: sp.sm }}>{content}</div>
  }

  return <SubForm heading={mode === 'edit' ? 'Edit item' : 'New item'}>{content}</SubForm>
}

export default ItemForm
