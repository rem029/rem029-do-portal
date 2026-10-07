'use client'
import React, { useMemo } from 'react'
import { useFormFields } from '@payloadcms/ui'

const InfoItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold text-[var(--theme-elevation-400)] uppercase">
        {label}
      </span>
      <span className="text-[14px] text-[var(--theme-elevation-800)]">{value}</span>
    </div>
  )
}

const WorkflowFieldData: React.FC = () => {
  // Use useFormFields to get the full form state
  const allFields = useFormFields(([fields]) => fields)

  const customFields = useMemo(() => {
    // `allFields` contains a flat key `workflow_reviews.N.custom_field_responses`
    // whose value is already the full array: [{ name, label, value }, ...]
    // Collect entries keyed by review index so we can process in order.
    const byIndex: Array<{
      index: number
      responses: Array<{ name: string; label: string; value: string }>
    }> = []

    Object.entries(allFields).forEach(([path, field]) => {
      const m = path.match(/^workflow_reviews\.(\d+)\.custom_field_responses$/)
      if (!m) return
      const responses = field.value
      if (!Array.isArray(responses) || responses.length === 0) return
      byIndex.push({ index: Number(m[1]), responses })
    })

    // Sort ascending so later reviews overwrite earlier ones for the same field name
    byIndex.sort((a, b) => a.index - b.index)

    const nameMap: Record<string, { label: string; value: string }> = {}
    byIndex.forEach(({ responses }) => {
      responses.forEach((resp) => {
        if (
          resp.name &&
          resp.label &&
          resp.value !== undefined &&
          resp.value !== null &&
          resp.value !== ''
        ) {
          nameMap[resp.name] = { label: resp.label, value: resp.value }
        }
      })
    })

    return Object.values(nameMap)
  }, [allFields])

  const hasData = customFields && customFields.length > 0

  if (!hasData) return null

  return (
    <div className="p-5 bg-[var(--theme-elevation-50)] border border-[var(--theme-elevation-150)] rounded-md my-5">
      <h4 className="mb-4 text-base font-semibold text-[var(--theme-elevation-900)] border-b border-[var(--theme-elevation-150)] pb-2.5">
        Workflow Custom Fields Summary
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {hasData &&
          customFields.map((field, i) => (
            <InfoItem key={i} label={field.label} value={field.value} />
          ))}
      </div>
    </div>
  )
}

export default WorkflowFieldData
