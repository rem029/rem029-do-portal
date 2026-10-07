import type { Payload, Where } from 'payload'
import type { Form, SurveyDepartmentBlock } from '@/payload-types'
import { walkFormFieldTree } from '@/utilities/form-field-tree'

export const SURVEY_DEPARTMENT_FIELD_NAME = 'department'

export type SurveyDepartmentOption = { id: string; title: string }

export function findSurveyDepartmentBlock(form: Pick<Form, 'fields'>): SurveyDepartmentBlock | null {
  for (const { block } of walkFormFieldTree(form.fields || [])) {
    if (block.blockType === 'survey-department') return block as unknown as SurveyDepartmentBlock
  }
  return null
}

export const toId = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: unknown }).id)
  return undefined
}

/** The departments a form's survey-department field offers: `{ id, title }` only, form operator only. */
export async function getSurveyDepartmentOptions(
  payload: Payload,
  form: Form,
): Promise<SurveyDepartmentOption[]> {
  const block = findSurveyDepartmentBlock(form)
  const operatorId = toId(form.operator)
  if (!block || !operatorId) return []

  const where: Where = { operator: { equals: operatorId } }
  if (!block.add_all) {
    const selectedIds = (block.selected_items || []).map(toId).filter((id): id is string => Boolean(id))
    if (selectedIds.length === 0) return []
    where.id = { in: selectedIds }
  }

  const { docs } = await payload.find({
    collection: 'departments',
    where,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    depth: 0,
    sort: 'title',
    select: { title: true },
  })
  return docs.map((doc) => ({ id: doc.id, title: doc.title }))
}

/** Rejects a missing required department, or one the form doesn't offer. */
export async function isSurveyDepartmentSubmissionValid(
  payload: Payload,
  form: Form,
  submissionData: { field: string; value: unknown }[],
): Promise<boolean> {
  const block = findSurveyDepartmentBlock(form)
  if (!block) return true

  const entry = submissionData.find((item) => item.field === SURVEY_DEPARTMENT_FIELD_NAME)
  const value = entry?.value == null ? '' : String(entry.value).trim()
  if (!value) return !block.required

  const options = await getSurveyDepartmentOptions(payload, form)
  return options.some((option) => option.id === value)
}
