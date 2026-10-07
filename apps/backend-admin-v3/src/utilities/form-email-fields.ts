export interface FormFieldLike {
  blockType?: string | null
  fields?: FormFieldLike[] | null
  name?: string | null
  label?: string | null
}

export interface FormEmailFieldOption {
  path: string
  label: string
  sourceLabel: string
  isListField: boolean
}

export interface SubmissionDataItem {
  field?: string | null
  value?: string | null
}

const joinPath = (prefix: string, name?: string | null): string => {
  if (!name) return prefix
  return prefix ? `${prefix}.${name}` : name
}

const joinSourceLabel = (labels: string[], label?: string | null, name?: string | null): string => {
  const current = label || name || 'Unnamed field'
  return [...labels, current].join(' → ')
}

const isNumericSegment = (segment: string): boolean => /^\d+$/.test(segment)

export const normalizeSubmissionFieldPath = (fieldPath: string): string =>
  fieldPath
    .split('.')
    .filter((segment) => segment.length > 0 && !isNumericSegment(segment))
    .join('.')

export const collectFormEmailFields = (
  fields: FormFieldLike[] | null | undefined,
  prefix = '',
  parentLabels: string[] = [],
  insideList = false,
): FormEmailFieldOption[] => {
  if (!Array.isArray(fields)) return []

  const emailFields: FormEmailFieldOption[] = []

  for (const field of fields) {
    if (!field || typeof field !== 'object') continue

    const fieldPath = joinPath(prefix, field.name)
    const nextLabels =
      field.blockType === 'group' || field.blockType === 'list' || field.blockType === 'conditional'
        ? [...parentLabels, field.label || field.name || field.blockType || 'Field']
        : parentLabels

    if (field.blockType === 'email' && fieldPath) {
      emailFields.push({
        path: fieldPath,
        label: field.label || field.name || fieldPath,
        sourceLabel: joinSourceLabel(parentLabels, field.label, field.name || fieldPath),
        isListField: insideList,
      })
      continue
    }

    if (
      (field.blockType === 'group' ||
        field.blockType === 'list' ||
        field.blockType === 'conditional') &&
      Array.isArray(field.fields)
    ) {
      emailFields.push(
        ...collectFormEmailFields(
          field.fields,
          fieldPath,
          nextLabels,
          insideList || field.blockType === 'list',
        ),
      )
    }
  }

  return emailFields
}

export const isValidEmailAddress = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const resolveSubmissionEmailFieldValues = (
  submissionData: SubmissionDataItem[] | null | undefined,
  fieldPath: string,
): string[] => {
  if (!Array.isArray(submissionData) || !fieldPath) return []

  return submissionData
    .filter((item): item is SubmissionDataItem & { field: string; value: string } => {
      return (
        typeof item?.field === 'string' &&
        normalizeSubmissionFieldPath(item.field) === fieldPath &&
        typeof item.value === 'string'
      )
    })
    .map((item) => item.value.trim())
    .filter((value) => value.length > 0 && isValidEmailAddress(value))
}
