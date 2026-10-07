'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { collectFormEmailFields } from '@/utilities/form-email-fields'
import { Form } from '@/payload-types'

export interface WorkflowFormEmailFieldOption {
  value: string
  label: string
  fieldPath: string
  fieldLabel: string
  formId: string
  formTitle: string
}

export async function fetchWorkflowFormEmailFieldsAction(
  workflowSlug: string,
  operatorId: string,
): Promise<WorkflowFormEmailFieldOption[]> {
  if (!workflowSlug || !operatorId) return []

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'forms',
    where: {
      and: [
        { workflow_slug: { equals: workflowSlug } },
        { operator: { equals: operatorId } },
        { enable_workflow: { equals: true } },
      ],
    },
    limit: 1000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  return (result.docs as Form[])
    .flatMap((form) =>
      collectFormEmailFields((form.fields as any[]) || []).map((field) => ({
        value: `${form.id}::${field.path}`,
        label: `${form.title} — ${field.sourceLabel}`,
        fieldPath: field.path,
        fieldLabel: field.sourceLabel,
        formId: form.id,
        formTitle: form.title,
      })),
    )
    .sort((left, right) => left.label.localeCompare(right.label))
}
