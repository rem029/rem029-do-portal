'use client'

import React from 'react'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { lexicalToHtml } from '@/utilities/lexical-converter'
import { FormFields, evaluateCondition, buildIdSegment } from './helpers'
import { FieldItem } from './field-item'
import { t, type Language } from '@/utilities/translations'

export const RecursiveFields: React.FC<{
  fieldsList: FormFields[]
  prefix?: string
  idPrefix?: string
  // Nearest containing group label / step number / list label, slugified — used to
  // build the id of a `message` block. Overwritten as we descend into a group/list,
  // so the closest container always wins; `undefined` means no container yet.
  messageIdContext?: string
  values: Record<string, string | boolean | number>
  fieldErrors?: Record<string, string>
  onChange: (name: string, value: string | boolean | number) => void
  disabled: boolean
  uploading: Record<string, boolean>
  setUploading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setError: (error: string | null) => void
  status: string
  showSequenceNumber?: boolean
  listCounts: Record<string, number>
  setListCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>
  fieldIndices: Record<string, number>
  language: string
  readOnly: boolean
  showNoInputFields?: boolean
}> = ({
  fieldsList,
  prefix = '',
  idPrefix = '',
  messageIdContext,
  values,
  fieldErrors = {},
  onChange,
  disabled,
  uploading,
  setUploading,
  setError,
  status,
  showSequenceNumber = true,
  listCounts,
  setListCounts,
  fieldIndices,
  language,
  readOnly,
  showNoInputFields = false,
}) => {
  return (
    <div className="flex flex-row flex-wrap gap-y-4 w-full">
      {fieldsList.map((field) => {
        const displayIndex = (field.id && fieldIndices[field.id]) || 0

        if (field.blockType === 'message') {
          if (readOnly && !showNoInputFields) return null
          const messageId = messageIdContext ? `${messageIdContext}-message` : 'message'
          return (
            <div key={field.id} id={messageId} className="w-full py-1">
              <div
                className="prose prose-sm max-w-none text-gray-700 text-xs!"
                dangerouslySetInnerHTML={{ __html: lexicalToHtml(field.message) }}
              />
            </div>
          )
        }

        if (field.blockType === 'group') {
          const name = 'name' in field ? (field.name as string) : ''
          const label = 'label' in field ? (field.label as string) : ''
          const groupPrefix = name ? (prefix ? `${prefix}${name}.` : `${name}.`) : ''
          const groupSlug = buildIdSegment(name, label)
          const groupElementId = idPrefix + groupSlug
          return (
            <fieldset
              key={field.id}
              id={groupElementId}
              className="fieldset bg-base-100/50 border border-base-200 shadow-sm mb-4 rounded-box p-4"
            >
              <legend
                className={cn(
                  'fieldset-legend md:text-xl text-sm font-bold text-secondary text-wrap flex items-center gap-2',
                  noah.className,
                )}
              >
                {showSequenceNumber && displayIndex > 0 && (
                  <span className="badge badge-info badge-outline badge-xs font-bold">
                    {displayIndex}
                  </span>
                )}
                {label || name}
              </legend>
              <div className="flex flex-col gap-8 w-full">
                <RecursiveFields
                  fieldsList={('fields' in field && (field.fields as FormFields[])) || []}
                  prefix={groupPrefix}
                  idPrefix={`${groupElementId}.`}
                  messageIdContext={groupSlug || messageIdContext}
                  values={values}
                  fieldErrors={fieldErrors}
                  onChange={onChange}
                  disabled={disabled}
                  uploading={uploading}
                  setUploading={setUploading}
                  setError={setError}
                  status={status}
                  showSequenceNumber={showSequenceNumber}
                  listCounts={listCounts}
                  setListCounts={setListCounts}
                  fieldIndices={fieldIndices}
                  language={language}
                  readOnly={readOnly}
                  showNoInputFields={showNoInputFields}
                />
              </div>
            </fieldset>
          )
        }

        if ((field as any).blockType === 'list') {
          const anyField = field as any
          const name = anyField.name ?? ''
          const listKey = prefix ? `${prefix}${name}` : name
          const count = listCounts[listKey] ?? 1
          const subFields = anyField.fields || []
          const label = anyField.label || name
          const listSlug = buildIdSegment(name, anyField.label)
          const listElementId = idPrefix + listSlug

          return (
            <fieldset
              key={anyField.id}
              id={listElementId}
              className="fieldset bg-base-100/50 border border-base-200 shadow-sm mb-4 rounded-box p-4"
            >
              <legend
                className={cn(
                  'fieldset-legend md:text-xl text-sm font-bold text-secondary flex items-center gap-2',
                  noah.className,
                )}
              >
                {showSequenceNumber && displayIndex > 0 && (
                  <span className="badge badge-info badge-outline badge-xs font-bold">
                    {displayIndex}
                  </span>
                )}
                {label}
              </legend>

              <div className="flex flex-col gap-8 w-full">
                {Array.from({ length: count }).map((_, idx) => {
                  const itemPrefix = `${listKey}.${idx}.`
                  return (
                    <div key={idx} className="flex flex-col gap-2">
                      <p
                        className={cn('text-sm font-semibold text-base-content/60', noah.className)}
                      >
                        Entry #{idx + 1}
                      </p>
                      <RecursiveFields
                        fieldsList={subFields}
                        prefix={itemPrefix}
                        idPrefix={`${listElementId}.${idx}.`}
                        messageIdContext={listSlug || messageIdContext}
                        values={values}
                        fieldErrors={fieldErrors}
                        onChange={onChange}
                        disabled={disabled}
                        uploading={uploading}
                        setUploading={setUploading}
                        setError={setError}
                        status={status}
                        showSequenceNumber={showSequenceNumber}
                        listCounts={listCounts}
                        setListCounts={setListCounts}
                        fieldIndices={fieldIndices}
                        language={language}
                        readOnly={readOnly}
                        showNoInputFields={showNoInputFields}
                      />
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2 justify-end mt-4 flex-col">
                {count > 0 && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setListCounts((prev) => ({ ...prev, [listKey]: count - 1 }))}
                    className="btn btn-sm btn-error text-wrap btn-outline gap-1"
                  >
                    {t('Delete Last', language as Language)}
                  </button>
                )}
                <button
                  type="button"
                  disabled={disabled || (anyField.max_items && count >= anyField.max_items)}
                  onClick={() => setListCounts((prev) => ({ ...prev, [listKey]: count + 1 }))}
                  className="btn btn-sm btn-primary text-wrap btn-outline gap-1 w-full"
                >
                  {t('Add', language as Language)} {label}
                </button>
              </div>
            </fieldset>
          )
        }

        if ((field as any).blockType === 'conditional') {
          const anyField = field as any
          if (!evaluateCondition(anyField, values, prefix)) return null
          return (
            <fieldset key={anyField.id} className="fieldset border-l-4 border-primary/20 pl-4 my-2">
              <RecursiveFields
                fieldsList={anyField.fields || []}
                prefix={prefix}
                idPrefix={idPrefix}
                messageIdContext={messageIdContext}
                values={values}
                fieldErrors={fieldErrors}
                onChange={onChange}
                disabled={disabled}
                uploading={uploading}
                setUploading={setUploading}
                setError={setError}
                status={status}
                showSequenceNumber={showSequenceNumber}
                listCounts={listCounts}
                setListCounts={setListCounts}
                fieldIndices={fieldIndices}
                language={language}
                readOnly={readOnly}
                showNoInputFields={showNoInputFields}
              />
            </fieldset>
          )
        }

        const name = 'name' in field ? (field.name as string) : ''
        const fieldName = name ? (prefix ? `${prefix}${name}` : name) : ''
        const error = fieldName ? fieldErrors[fieldName] : undefined

        return (
          <FieldItem
            key={field.id}
            field={field}
            prefix={prefix}
            idPrefix={idPrefix}
            displayIndex={displayIndex}
            values={values}
            error={error}
            onChange={onChange}
            disabled={disabled}
            uploading={uploading}
            setUploading={setUploading}
            setError={setError}
            status={status}
            showSequenceNumber={showSequenceNumber}
            language={language}
            readOnly={readOnly}
          />
        )
      })}
    </div>
  )
}
