import { Form } from '@/payload-types'
import { t, type Language } from '@/utilities/translations'

export type FormFields = NonNullable<Form['fields']>[number]

export interface MultiStep {
  label: string
  fields: any[]
}

export function evaluateCondition(
  field: any,
  values: Record<string, string | boolean | number>,
  prefix: string,
) {
  const { condition_field, operator, value: compareValue } = field
  if (!condition_field) return true

  const relativeName = prefix ? `${prefix}${condition_field}` : condition_field
  const fieldValue =
    values[relativeName] !== undefined ? values[relativeName] : values[condition_field]

  const strFieldValue = String(fieldValue || '')
  const strCompareValue = String(compareValue || '')

  switch (operator) {
    case 'equal':
      return strFieldValue === strCompareValue
    case 'not_equal':
      return strFieldValue !== strCompareValue
    case 'contains':
      return strFieldValue.toLowerCase().includes(strCompareValue.toLowerCase())
    case 'not_contains':
      return !strFieldValue.toLowerCase().includes(strCompareValue.toLowerCase())
    default:
      return true
  }
}

// Element id for a rendered field: the field's own `name` with spaces stripped,
// or (for blocks without a `name`, e.g. multi-step steps) its `label` slugified.
export function buildIdSegment(name?: string, label?: string): string {
  if (name) return name.replace(/\s+/g, '')
  if (label) return label.trim().toLowerCase().replace(/\s+/g, '-')
  return ''
}

export function calculateIndices(
  fieldsList: any[],
  values: Record<string, string | boolean | number>,
  showSequenceNumber: boolean,
) {
  const indices: Record<string, number> = {}
  if (!showSequenceNumber) return indices

  let current = 0
  const walk = (list: any[], prefix = '') => {
    list.forEach((field) => {
      if (field.blockType === 'message') return

      if (field.blockType === 'conditional') {
        const isVisible = evaluateCondition(field, values, prefix)
        if (isVisible) {
          walk(field.fields || [], prefix)
        }
        return
      }

      current++
      indices[field.id] = current
    })
  }

  walk(fieldsList)
  return indices
}

export interface MissingRequiredField {
  name: string
  label: string
}

export function isFieldFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return true
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'object') return Object.keys(value).length > 0
  return false
}

export function getMissingRequiredFields(
  fieldsList: any[],
  allValues: Record<string, string | boolean | number>,
  listCounts: Record<string, number>,
  prefix = '',
): MissingRequiredField[] {
  const missing: MissingRequiredField[] = []

  for (const field of fieldsList) {
    if (field.blockType === 'message') continue

    if (field.blockType === 'group' && field.fields) {
      const gPrefix = field.name
        ? prefix
          ? `${prefix}${field.name}.`
          : `${field.name}.`
        : prefix
      missing.push(...getMissingRequiredFields(field.fields, allValues, listCounts, gPrefix))
      continue
    }

    if (field.blockType === 'list' && field.fields) {
      const name = field.name || ''
      const listKey = prefix ? `${prefix}${name}` : name
      const count = listCounts[listKey] ?? 1
      for (let i = 0; i < count; i++) {
        missing.push(
          ...getMissingRequiredFields(field.fields, allValues, listCounts, `${listKey}.${i}.`),
        )
      }
      continue
    }

    if (field.blockType === 'conditional' && field.fields) {
      if (evaluateCondition(field, allValues, prefix)) {
        missing.push(...getMissingRequiredFields(field.fields, allValues, listCounts, prefix))
      }
      continue
    }

    if (field.required) {
      const name = field.name || ''
      const fieldName = prefix ? `${prefix}${name}` : name
      const val = allValues[fieldName]
      if (!isFieldFilled(val)) {
        missing.push({
          name: fieldName,
          label: (typeof field.label === 'string' && field.label) || fieldName,
        })
      }
    }
  }

  return missing
}

export function buildFieldErrors(
  missing: MissingRequiredField[],
  language: Language,
): Record<string, string> {
  const message = t('This question is required.', language)
  return Object.fromEntries(missing.map((f) => [f.name, message]))
}

export function getHighlightedCountMessage(count: number, language: Language): string {
  if (count <= 1) return t('Please answer the highlighted question.', language)
  return t('Please answer the {count} highlighted questions.', language).replace('{count}', String(count))
}

export function scrollToFirstInvalidField(fieldName: string): void {
  if (typeof document === 'undefined') return
  setTimeout(() => {
    const escaped =
      typeof CSS !== 'undefined' && CSS.escape
        ? CSS.escape(fieldName)
        : fieldName.replace(/["\\]/g, '\\$&')
    const container = document.querySelector(`[data-field-name="${escaped}"]`) as HTMLElement | null
    if (!container) return

    container.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const focusable = container.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not(.rating-hidden):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (focusable) {
      focusable.focus()
    }
  }, 50)
}

export interface FieldEntry {
  name: string
  blockType: string
  label?: string
  messageContent?: any
  options?: { label: string; value: string }[]
}

export function collectFieldEntries(
  fieldsList: any[],
  prefix: string,
  listCounts: Record<string, number>,
  includeMessages = false
): FieldEntry[] {
  const entries: FieldEntry[] = []
  for (const field of fieldsList) {
    if (field.blockType === 'message') {
      if (includeMessages) {
        entries.push({ name: field.id, blockType: 'message', messageContent: field.message })
      }
      continue
    }
    if (field.blockType === 'group') {
      const name = field.name || ''
      const gPrefix = name ? (prefix ? `${prefix}${name}.` : `${name}.`) : prefix
      entries.push(...collectFieldEntries(field.fields || [], gPrefix, listCounts, includeMessages))
    } else if (field.blockType === 'list') {
      const name = field.name || ''
      const listKey = prefix ? `${prefix}${name}` : name
      const count = listCounts[listKey] ?? 1
      for (let i = 0; i < count; i++) {
        entries.push(...collectFieldEntries(field.fields || [], `${listKey}.${i}.`, listCounts, includeMessages))
      }
    } else if (field.blockType === 'conditional') {
      entries.push(...collectFieldEntries(field.fields || [], prefix, listCounts, includeMessages))
    } else {
      const name = field.name || ''
      if (name)
        entries.push({
          name: prefix ? `${prefix}${name}` : name,
          blockType: field.blockType,
          label: typeof field.label === 'string' ? field.label : undefined,
          options: Array.isArray(field.options)
            ? field.options
            : field.blockType === 'rating' && Array.isArray(field.labels)
              ? // rating stores the 1-based point index; its labels are indexed by position
                field.labels.map((row: { label?: string }, i: number) => ({
                  label: row.label || String(i + 1),
                  value: String(i + 1),
                }))
              : undefined,
        })
    }
  }
  return entries
}

// Names of fields hidden behind an unmet `conditional` block, so their stale state can
// be cleared. A `conditional` block can only ever sit as a direct sibling inside a
// step's (or another conditional's) `fields` list — group.ts/list.ts don't allow
// nesting a conditional, and conditional.ts doesn't allow nesting itself — so there's
// no need to track prefixes through groups/lists here: just scan each step's flat field
// list for conditionals and, for any whose condition no longer matches, collect every
// name inside it via the existing collectFieldNames. Clearing those names re-triggers
// the caller, which is what cascades a chain (main1 -> dep1_conditional ->
// dep2_conditional): dep1 clears first, then dep2's conditional (which reads dep1)
// stops matching on the next pass.
export function collectHiddenFieldNames(
  formFields: any[],
  values: Record<string, string | boolean | number>,
  listCounts: Record<string, number>,
): string[] {
  const hidden: string[] = []

  const scanFlatList = (list: any[]) => {
    for (const field of list) {
      if (field.blockType === 'conditional' && !evaluateCondition(field, values, '')) {
        hidden.push(...collectFieldNames(field.fields || [], '', listCounts))
      }
    }
  }

  const multiStep = formFields.find((f: any) => f.blockType === 'multi-step')
  if (multiStep?.steps) {
    multiStep.steps.forEach((step: any) => scanFlatList(step.fields || []))
  } else {
    scanFlatList(formFields)
  }

  return hidden
}

export function collectFieldNames(
  fieldsList: any[],
  prefix: string,
  listCounts: Record<string, number>,
): string[] {
  const names: string[] = []
  for (const field of fieldsList) {
    if (field.blockType === 'message') continue
    if (field.blockType === 'group') {
      const name = field.name || ''
      const gPrefix = name ? (prefix ? `${prefix}${name}.` : `${name}.`) : prefix
      names.push(...collectFieldNames(field.fields || [], gPrefix, listCounts))
    } else if (field.blockType === 'list') {
      const name = field.name || ''
      const listKey = prefix ? `${prefix}${name}` : name
      const count = listCounts[listKey] ?? 1
      for (let i = 0; i < count; i++) {
        names.push(...collectFieldNames(field.fields || [], `${listKey}.${i}.`, listCounts))
      }
    } else if (field.blockType === 'conditional') {
      names.push(...collectFieldNames(field.fields || [], prefix, listCounts))
    } else {
      const name = field.name || ''
      if (name) names.push(prefix ? `${prefix}${name}` : name)
    }
  }
  return names
}

// Submission field paths encode list item indices inline, e.g. "childrens.0.name".
// Derive how many items each list held so readOnly/prefilled renders show every
// submitted item instead of defaulting to 1.
export function computeInitialListCounts(
  initialData?: Array<{ field: string; value: string }>,
): Record<string, number> {
  const counts: Record<string, number> = {}
  if (!initialData) return counts

  for (const item of initialData) {
    const tokens = item.field.split('.')
    for (let i = 0; i < tokens.length; i++) {
      if (/^\d+$/.test(tokens[i])) {
        const listKey = tokens.slice(0, i).join('.')
        const idx = Number(tokens[i])
        counts[listKey] = Math.max(counts[listKey] ?? 0, idx + 1)
      }
    }
  }

  return counts
}

export function partitionForReview(
  allFields: any[],
  language: Language,
): MultiStep[] {
  const steps: MultiStep[] = []
  let loose: any[] = []

  for (const field of allFields) {
    if (field.blockType === 'group') {
      if (loose.length) {
        steps.push({ label: t('General', language), fields: loose })
        loose = []
      }
      const label =
        (typeof field.label === 'string' && field.label) ||
        (typeof field.name === 'string' && field.name) ||
        `${t('Section', language)} ${steps.length + 1}`
      steps.push({ label, fields: [field] })
    } else {
      loose.push(field)
    }
  }

  if (loose.length) {
    steps.push({ label: steps.length === 0 ? t('Your Submission', language) : t('Additional Info', language), fields: loose })
  }

  return steps.length ? steps : [{ label: t('Your Submission', language), fields: allFields }]
}
