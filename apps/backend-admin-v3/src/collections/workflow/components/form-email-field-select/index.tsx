'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FieldLabel, SelectInput, useDocumentInfo, useField } from '@payloadcms/ui'
import {
  fetchWorkflowFormEmailFieldsAction,
  WorkflowFormEmailFieldOption,
} from './actions'

type WorkflowFormEmailFieldSelectProps = {
  path: string
}

const SELECTOR_SUFFIX = '.form_field_selector'

const getBasePath = (path: string): string =>
  path.endsWith(SELECTOR_SUFFIX) ? path.slice(0, -SELECTOR_SUFFIX.length) : path

const getRelationshipId = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const relation = value as { id?: unknown; value?: unknown }
    if (typeof relation.id === 'string') return relation.id
    if (typeof relation.value === 'string') return relation.value
  }
  return ''
}

const WorkflowFormEmailFieldSelect: React.FC<WorkflowFormEmailFieldSelectProps> = ({ path }) => {
  const { id } = useDocumentInfo()
  const basePath = useMemo(() => getBasePath(path), [path])

  const { value: workflowSlug } = useField<string>({ path: 'slug' })
  const { value: operatorValue } = useField<unknown>({ path: 'operator' })
  const { value: recipientType } = useField<string>({ path: `${basePath}.type` })
  const { value: fieldPath, setValue: setFieldPath } = useField<string>({
    path: `${basePath}.form_field_path`,
  })
  const { value: fieldLabel, setValue: setFieldLabel } = useField<string>({
    path: `${basePath}.form_field_label`,
  })
  const { value: formId, setValue: setFormId } = useField<string>({
    path: `${basePath}.form_field_form_id`,
  })
  const { value: formTitle, setValue: setFormTitle } = useField<string>({
    path: `${basePath}.form_field_form_title`,
  })

  const [options, setOptions] = useState<WorkflowFormEmailFieldOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const operatorId = useMemo(() => getRelationshipId(operatorValue), [operatorValue])

  useEffect(() => {
    if (!recipientType || recipientType === 'form_email') return
    if (!fieldPath && !fieldLabel && !formId && !formTitle) return

    setFieldPath('')
    setFieldLabel('')
    setFormId('')
    setFormTitle('')
  }, [
    fieldLabel,
    fieldPath,
    formId,
    formTitle,
    recipientType,
    setFieldLabel,
    setFieldPath,
    setFormId,
    setFormTitle,
  ])

  useEffect(() => {
    if (!id || !workflowSlug || !operatorId || recipientType !== 'form_email') {
      setOptions([])
      setError(null)
      return
    }

    let cancelled = false

    const loadOptions = async () => {
      setLoading(true)
      setError(null)

      try {
        const nextOptions = await fetchWorkflowFormEmailFieldsAction(workflowSlug, operatorId)
        if (!cancelled) setOptions(nextOptions)
      } catch (loadError) {
        if (!cancelled) {
          setOptions([])
          setError(loadError instanceof Error ? loadError.message : 'Failed to load form email fields.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOptions()

    return () => {
      cancelled = true
    }
  }, [id, operatorId, recipientType, workflowSlug])

  const selectedValue = useMemo(() => {
    const exactMatch = options.find(
      (option) => option.fieldPath === fieldPath && option.formId === formId,
    )
    if (exactMatch) return exactMatch.value

    const fallbackMatch = options.find((option) => option.fieldPath === fieldPath)
    return fallbackMatch?.value || ''
  }, [fieldPath, formId, options])

  if (!id) {
    return (
      <div className="field-type">
        <FieldLabel label="Form Email Field" />
        <p className="text-[11px] text-(--theme-elevation-400) italic">
          Save the workflow first before selecting a form email field recipient.
        </p>
      </div>
    )
  }

  if (!workflowSlug || !operatorId) {
    return (
      <div className="field-type">
        <FieldLabel label="Form Email Field" />
        <p className="text-[11px] text-(--theme-elevation-400) italic">
          Save the workflow with both slug and operator before selecting a form email field.
        </p>
      </div>
    )
  }

  return (
    <div className="field-type">
      <SelectInput
        path={path}
        name={path}
        label="Form Email Field"
        required={false}
        options={options}
        value={selectedValue}
        onChange={(selectedOption: any) => {
          const nextOption = options.find((option) => option.value === selectedOption?.value)

          setFieldPath(nextOption?.fieldPath || '')
          setFieldLabel(nextOption?.fieldLabel || '')
          setFormId(nextOption?.formId || '')
          setFormTitle(nextOption?.formTitle || '')
        }}
        isClearable
        readOnly={loading}
      />
      {loading && (
        <p className="text-[11px] text-(--theme-elevation-400) mt-2">Loading form email fields...</p>
      )}
      {!loading && !error && options.length === 0 && (
        <p className="text-[11px] text-(--theme-elevation-400) mt-2">
          No workflow-enabled forms with email fields match this workflow yet.
        </p>
      )}
      {error && <p className="text-[11px] text-red-500 mt-2">{error}</p>}
    </div>
  )
}

export default WorkflowFormEmailFieldSelect
