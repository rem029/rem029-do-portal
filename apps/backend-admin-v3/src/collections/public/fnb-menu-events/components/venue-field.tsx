'use client'

import React, { useState, useEffect, useMemo, useCallback, useId } from 'react'
import {
  useField,
  SelectInput,
  FieldLabel,
  TextInput,
  Button,
  Modal,
  useModal,
} from '@payloadcms/ui'
import type { RelationshipFieldClientProps } from 'payload'
import { FaPlus } from 'react-icons/fa'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { listEventVenuesAction, createVenueAction } from './actions'

/* -------------------------------------------------------------------------- */
/* the field                                                                  */
/* -------------------------------------------------------------------------- */

export const VenueField: React.FC<RelationshipFieldClientProps> = (props) => {
  const { path = 'restaurant', field } = props
  const { value, setValue, showError } = useField<string | number | { id?: string | number }>({
    path,
  })

  // Sibling `operator` field: top-level sidebar field — plain 'operator', not inside a tab.
  const { value: operatorValue } = useField<unknown>({ path: 'operator' })

  const operatorId = useMemo(() => {
    if (!operatorValue) return ''
    if (typeof operatorValue === 'string') return operatorValue
    if (typeof operatorValue === 'number') return String(operatorValue)
    if (typeof operatorValue === 'object' && operatorValue !== null) {
      const obj = operatorValue as { id?: string | number; value?: string | number }
      if (obj.id !== undefined) return String(obj.id)
      if (obj.value !== undefined) return String(obj.value)
    }
    return ''
  }, [operatorValue])

  const selectedId = useMemo(() => {
    if (!value) return ''
    if (typeof value === 'object' && value !== null) {
      const v = value as { id?: string | number; value?: string | number }
      if (v.id !== undefined) return String(v.id)
      if (v.value !== undefined) return String(v.value)
    }
    return String(value)
  }, [value])

  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const [newName, setNewName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Unique modal slug per mount, scoped to field path and React unique ID
  const uniqueId = useId()
  const modalSlug = useMemo(
    () => `create-venue-modal-${path || 'restaurant'}-${uniqueId.replace(/:/g, '')}`,
    [path, uniqueId],
  )
  const { closeModal, openModal } = useModal()

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery), 250)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!operatorId) {
      setOptions([])
      return
    }
    let cancelled = false
    setLoading(true)
    listEventVenuesAction({
      operatorId,
      query: debouncedQuery,
      selectedId: selectedId || undefined,
    })
      .then((res) => {
        if (cancelled) return
        setOptions(
          res.success && res.data
            ? res.data.map((v) => ({
                label: v.title,
                value: String(v.id),
              }))
            : [],
        )
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, operatorId, selectedId])

  const handleCreateVenue = useCallback(async () => {
    const trimmedName = newName.trim()
    if (!trimmedName) {
      setCreateError('Enter a venue name.')
      return
    }
    if (!operatorId) {
      setCreateError('Pick an operator first.')
      return
    }

    setIsSubmitting(true)
    setCreateError(null)
    try {
      const res = await createVenueAction({
        title: trimmedName,
        operatorId,
      })
      if (!res.success) {
        setCreateError(res.error)
        return
      }
      const { id, title } = res.data
      setOptions((prev) => [
        { label: title, value: String(id) },
        ...prev.filter((o) => o.value !== String(id)),
      ])
      setValue(String(id))
      closeModal(modalSlug)
      setNewName('')
      setCreateError(null)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create the venue.')
    } finally {
      setIsSubmitting(false)
    }
  }, [closeModal, modalSlug, newName, operatorId, setValue])

  const label = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--base)',
        marginBottom: 6,
      }}
    >
      <FieldLabel
        label={typeof field?.label === 'string' ? field.label : 'Venue'}
        required={field?.required}
        path={path}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--base) * 0.5)' }}>
        {!operatorId && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--theme-warning-600, var(--theme-elevation-500))',
            }}
          >
            Pick an operator first
          </span>
        )}
        <Button
          buttonStyle="transparent"
          size="small"
          disabled={!operatorId}
          onClick={() => {
            setCreateError(null)
            openModal(modalSlug)
          }}
          icon={<FaPlus size={11} />}
        >
          Create venue
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <SelectInput
        path={path}
        name={path}
        Label={label}
        required={field?.required}
        description={field?.admin?.description}
        options={options}
        value={selectedId}
        onChange={(selected) => {
          // Structural cast: `selected` is a ReactSelectOption for a single select.
          const opt = selected as unknown as { value?: string | number } | null | undefined
          setValue(opt?.value !== undefined ? String(opt.value) : null)
        }}
        onInputChange={(val: string) => setSearchQuery(val)}
        filterOption={() => true}
        isClearable
        showError={showError}
        placeholder={
          !operatorId
            ? 'Pick an operator first'
            : loading
              ? 'Loading venues…'
              : 'Search or select a venue'
        }
        readOnly={!operatorId}
      />

      <Modal slug={modalSlug} className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => {
            closeModal(modalSlug)
            setCreateError(null)
          }}
          aria-hidden="true"
        />
        <div className="relative w-full max-w-[480px] bg-(--theme-elevation-50) text-(--theme-elevation-800) border border-(--theme-elevation-150) p-6 rounded-lg shadow-2xl overflow-y-auto max-h-[90vh] z-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className={cn('font-bold text-xl m-0', noah.className)}>Create Venue</h3>
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-(--theme-elevation-150) transition-all duration-200 border-none bg-transparent cursor-pointer text-(--theme-elevation-400) hover:text-(--theme-elevation-800)"
              onClick={() => {
                closeModal(modalSlug)
                setCreateError(null)
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <TextInput
              path="__newVenueName"
              label="Venue name"
              required
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setNewName(e.target.value)
                setCreateError(null)
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (!isSubmitting && newName.trim()) {
                    handleCreateVenue()
                  }
                }
              }}
              readOnly={isSubmitting}
              placeholder="e.g. Grand Ballroom"
            />

            {createError && (
              <p
                role="alert"
                className="m-0 mt-3 p-2 text-xs text-(--theme-error-700) bg-(--theme-error-50) border border-(--theme-error-500) rounded"
              >
                {createError}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-(--theme-elevation-100)">
            <div className="flex justify-end gap-2 w-full">
              <Button
                buttonStyle="secondary"
                onClick={() => {
                  closeModal(modalSlug)
                  setCreateError(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                buttonStyle="primary"
                onClick={handleCreateVenue}
                disabled={isSubmitting || !newName.trim()}
              >
                {isSubmitting ? 'Creating…' : 'Create venue'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default VenueField
