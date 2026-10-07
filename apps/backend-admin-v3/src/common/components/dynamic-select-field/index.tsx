'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'

export const DynamicSelectField: React.FC<{
  field: { add_all?: boolean | null; selected_items?: unknown }
  fieldName: string
  elementId: string
  fieldLabel: string
  fieldPlaceholder: string
  isRequired: boolean
  displayIndex: number
  showSequenceNumber: boolean
  values: Record<string, string | boolean | number>
  onChange: (name: string, value: string | boolean | number) => void
  disabled: boolean
  isLabelOnTop?: boolean
  action: () => Promise<{ success: boolean; data: { id: string; title?: string }[] }>
  /** Which field to store as the submitted value. Defaults to 'title'. Use 'id' for relationship fields. */
  valueKey?: 'id' | 'title'
  lockedValue?: string
}> = ({
  field,
  fieldName,
  elementId,
  fieldLabel,
  fieldPlaceholder,
  isRequired,
  displayIndex,
  showSequenceNumber,
  values,
  onChange,
  disabled,
  isLabelOnTop = false,
  action,
  valueKey = 'title',
  lockedValue,
}) => {
  const [options, setOptions] = useState<{ id: string; title?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (lockedValue && values[fieldName] !== lockedValue) {
      onChange(fieldName, lockedValue)
    }
  }, [lockedValue, fieldName, onChange, values])

  useEffect(() => {
    let isMounted = true
    const fetchOptions = async () => {
      setLoading(true)
      const res = await action()
      if (isMounted && res.success) {
        if (field.add_all) {
          setOptions(res.data)
        } else {
          const selectedItems = Array.isArray(field.selected_items) ? field.selected_items : []
          const selectedIds = selectedItems.map((item: unknown) =>
            typeof item === 'object' && item !== null ? (item as { id: string }).id : item,
          )
          setOptions(res.data.filter((item) => selectedIds.includes(item.id)))
        }
      }
      if (isMounted) setLoading(false)
    }
    fetchOptions()
    return () => {
      isMounted = false
    }
  }, [action, field.add_all, field.selected_items])

  const SequenceBadge =
    showSequenceNumber && displayIndex > 0 ? (
      <span className="badge badge-info badge-outline badge-xs font-bold shrink-0">
        {displayIndex}
      </span>
    ) : null

  const RequiredMark = isRequired ? <span className="text-error ml-1">*</span> : null
  const effectiveDisabled = disabled || Boolean(lockedValue) || loading
  const isLocked = Boolean(lockedValue)

  if (isLabelOnTop) {
    return (
      <fieldset className="fieldset w-full">
        <legend className={cn('fieldset-legend text-primary', noah.className)}>
          {SequenceBadge}
          {fieldLabel}
          {RequiredMark}
        </legend>
        <select
          id={elementId}
          required={isRequired}
          className={cn(
            'select w-full',
            (!values[fieldName] || loading) && 'text-xs',
            isLocked && 'bg-base-200 opacity-70 cursor-not-allowed appearance-none bg-none',
          )}
          name={fieldName}
          value={(values[fieldName] as string) || ''}
          onChange={(e) => {
            const selectedOption = options.find((opt) => opt[valueKey] === e.target.value)
            onChange(fieldName, selectedOption?.[valueKey] || e.target.value)
          }}
          disabled={effectiveDisabled}
        >
          <option value="" disabled>
            {loading ? 'Loading options...' : fieldPlaceholder || 'Please select...'}
          </option>
          {options.map((option) => (
            <option key={option.id} value={option[valueKey]}>
              {option.title}
            </option>
          ))}
        </select>
      </fieldset>
    )
  }

  return (
    <label
      className={cn(
        'input md:input-lg input-sm md:text-sm w-full validator',
        isLocked && 'bg-base-200 opacity-70 cursor-not-allowed',
      )}
    >
      {SequenceBadge}
      <span className={cn('label-text-alt text-primary whitespace-nowrap', noah.className)}>
        {fieldLabel} {RequiredMark}
      </span>
      <select
        id={elementId}
        required={isRequired}
        className={cn(
          'grow border-none focus:outline-none bg-transparent',
          (!values[fieldName] || loading) && 'text-xs',
          isLocked && 'cursor-not-allowed appearance-none',
        )}
        name={fieldName}
        value={(values[fieldName] as string) || ''}
        onChange={(e) => {
          const selectedOption = options.find((opt) => opt[valueKey] === e.target.value)
          onChange(fieldName, selectedOption?.[valueKey] || e.target.value)
        }}
        disabled={effectiveDisabled}
      >
        <option value="" disabled>
          {loading ? 'Loading options...' : fieldPlaceholder || 'Please select...'}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option[valueKey]}>
            {option.title}
          </option>
        ))}
      </select>
    </label>
  )
}
