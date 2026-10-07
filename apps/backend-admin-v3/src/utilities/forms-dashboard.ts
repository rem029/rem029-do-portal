import { FormSubmissionRow } from '@/globals/forms-dashboard/components/actions'

// ─── Form field extraction ────────────────────────────────────────────────────

export interface FormFieldDef {
  key: string
  label: string
  blockType: string
  isList: boolean
  parentKey?: string
  parentLabel?: string
}

/**
 * Walks a form's field definitions and returns a flat list of every addressable
 * leaf field. The `key` matches the dot-notation path stored in submissionData
 * (e.g. `'name'`, `'address.city'`, `'attachments'`).
 *
 * Nesting rules:
 *   group / conditional → recurse with their name as the path prefix
 *   multi-step          → recurse through each step's fields with NO added prefix
 *   list                → emitted as a single isList:true entry (shown as Count)
 *   signature           → excluded from table columns
 */
export function extractFormFields(
  fields: any[],
  prefix = '',
  parentKey?: string,
  parentLabel?: string,
): FormFieldDef[] {
  const result: FormFieldDef[] = []

  for (const field of fields || []) {
    if (!field) continue

    const name: string = field.name || ''
    const fullKey = prefix ? (name ? `${prefix}.${name}` : prefix) : name
    const label: string = field.label || name.replace(/_/g, ' ') || ''

    switch (field.blockType) {
      case 'group':
      case 'conditional':
        result.push(...extractFormFields(field.fields || [], fullKey, fullKey, label))
        break

      case 'multi-step':
        for (const step of field.steps || []) {
          result.push(...extractFormFields(step.fields || [], prefix, parentKey, parentLabel))
        }
        break

      case 'list': {
        if (!fullKey) break
        // Only emit the count column if the list has at least one user-input sub-field
        const listSubFields = extractFormFields(field.fields || [], fullKey)
        if (listSubFields.length > 0) {
          result.push({ key: fullKey, label, blockType: 'list', isList: true, parentKey, parentLabel })
        }
        break
      }

      case 'signature':
      case 'message':
        // excluded from table columns
        break

      default:
        if (fullKey) {
          result.push({ key: fullKey, label, blockType: field.blockType || 'text', isList: false, parentKey, parentLabel })
        }
        break
    }
  }

  return result
}

// ─── Submitted-by resolution ──────────────────────────────────────────────────

export function resolveSubmittedBy(row: FormSubmissionRow): string {
  if (row.submittedBy && row.submittedBy !== 'N/A') return row.submittedBy
  if (!row.submissionData?.length) return 'N/A'
  const priorityKeys = ['name', 'full_name', 'fullname', 'parent.name', 'first_name']
  for (const key of priorityKeys) {
    const match = row.submissionData.find((d) => d.field.toLowerCase() === key)
    if (match?.value) return match.value
  }
  const fuzzyMatch = row.submissionData.find(
    (d) => d.field.toLowerCase().includes('name') && d.value,
  )
  if (fuzzyMatch?.value) return fuzzyMatch.value
  return 'N/A'
}
