import type { Form } from '@/payload-types'
import { walkFormFieldTree } from '@/utilities/form-field-tree'
import type {
  ChoiceQuestionStat,
  QuestionDef,
  QuestionOption,
  SurveySubmissionLike,
  TextAnswerRow,
} from './types'

interface ContainerStackEntry {
  path: string
  label: string
  isList: boolean
}

function extractLabel(label: unknown): string {
  if (typeof label === 'string') return label.trim()
  if (label && typeof label === 'object') {
    const obj = label as Record<string, unknown>
    if (typeof obj.en === 'string' && obj.en.trim()) return obj.en.trim()
    if (typeof obj.ar === 'string' && obj.ar.trim()) return obj.ar.trim()
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && val.trim()) return val.trim()
    }
  }
  return ''
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function classifyQuestions(
  form: Pick<Form, 'fields'>,
  opts?: {
    departmentOptions?: { id: string; title: string }[]
    lookupLabels?: Record<string, QuestionOption[]>
  },
): QuestionDef[] {
  const fields = Array.isArray(form.fields) ? form.fields : []
  const questions: QuestionDef[] = []
  const stack: ContainerStackEntry[] = []

  for (const { block, path, step } of walkFormFieldTree(fields)) {
    const blockType = String(block.blockType || '')

    // Handle container blocks (group, list)
    if (blockType === 'group' || blockType === 'list') {
      while (stack.length > 0 && !path.startsWith(`${stack[stack.length - 1].path}.`)) {
        stack.pop()
      }
      const label = extractLabel(block.label) || String(block.name || '')
      stack.push({
        path,
        label,
        isList: blockType === 'list',
      })
      continue
    }

    // Skip multi-step and conditional container envelopes themselves
    if (blockType === 'multi-step' || blockType === 'conditional') {
      continue
    }

    // Pop containers that are no longer ancestors
    while (stack.length > 0 && !path.startsWith(`${stack[stack.length - 1].path}.`)) {
      stack.pop()
    }

    const isRepeated = stack.some((s) => s.isList)

    // Format path: for blocks inside a list container, insert * after the list segment
    let questionPath = path
    for (const entry of stack) {
      if (entry.isList) {
        const prefix = `${entry.path}.`
        if (questionPath.startsWith(prefix) || questionPath.includes(`.${prefix}`)) {
          questionPath = questionPath.replace(prefix, `${entry.path}.*.`)
        }
      }
    }

    const containerLabels = stack.map((s) => s.label).filter(Boolean)
    const blockLabel = extractLabel(block.label) || String(block.name || '')
    const questionLabel = [...containerLabels, blockLabel].filter(Boolean).join(' › ')

    let kind: 'choice' | 'text' | null = null
    let options: QuestionOption[] = []

    switch (blockType) {
      case 'select':
      case 'radio': {
        kind = 'choice'
        const rawOptions = Array.isArray(block.options) ? block.options : []
        options = rawOptions.map((opt) => ({
          value: String((opt as { value: unknown }).value ?? ''),
          label:
            extractLabel((opt as { label: unknown }).label) ||
            String((opt as { value: unknown }).value ?? ''),
        }))
        break
      }

      case 'checkbox': {
        kind = 'choice'
        const rawOptions = Array.isArray(block.options) ? block.options : []
        if (rawOptions.length > 0) {
          options = rawOptions.map((opt) => ({
            value: String((opt as { value: unknown }).value ?? ''),
            label:
              extractLabel((opt as { label: unknown }).label) ||
              String((opt as { value: unknown }).value ?? ''),
          }))
        } else {
          options = [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' },
          ]
        }
        break
      }

      case 'rating': {
        kind = 'choice'
        const rawLabels = Array.isArray(block.labels) ? block.labels : []
        const count =
          typeof block.point_count === 'number' && block.point_count > 0
            ? block.point_count
            : rawLabels.length || 5
        options = Array.from({ length: count }, (_, idx) => ({
          value: String(idx + 1),
          label: extractLabel((rawLabels[idx] as { label?: unknown })?.label) || String(idx + 1),
        }))
        break
      }

      case 'scale': {
        kind = 'choice'
        const min = typeof block.min === 'number' ? block.min : 0
        const max = typeof block.max === 'number' ? block.max : 10
        const step = typeof block.step === 'number' && block.step > 0 ? block.step : 1
        options = []
        for (let v = min; v <= max; v += step) {
          options.push({
            value: String(v),
            label: String(v),
          })
        }
        break
      }

      case 'survey-department': {
        kind = 'choice'
        options = (opts?.departmentOptions || []).map((d) => ({
          value: d.id,
          label: d.title,
        }))
        break
      }

      case 'select-store-departments':
      case 'select-restaurants':
      case 'select-operators':
      case 'country': {
        kind = 'choice'
        options = opts?.lookupLabels?.[questionPath] || opts?.lookupLabels?.[path] || []
        break
      }

      case 'text':
      case 'textarea':
      case 'email': {
        kind = 'text'
        options = []
        break
      }

      default:
        break
    }

    if (!kind) {
      continue
    }

    questions.push({
      path: questionPath,
      label: questionLabel,
      fieldLabel: blockLabel,
      stepLabel: step ? extractLabel(step.label) || `Step ${step.index + 1}` : null,
      groupLabel: containerLabels.length > 0 ? containerLabels.join(' › ') : null,
      blockType,
      kind,
      options,
      isRepeated,
    })
  }

  return questions
}

export function getAnswerValues(
  question: QuestionDef,
  submission: SurveySubmissionLike,
): string[][] {
  const submissionData = Array.isArray(submission.submissionData) ? submission.submissionData : []

  const parseValue = (raw: unknown): string[] => {
    if (raw == null) return []
    const str = String(raw).trim()
    if (!str) return []

    if (question.blockType === 'select' || question.blockType === 'checkbox') {
      return str
        .split(',')
        .map((s) => {
          const trimmed = s.trim()
          if (question.blockType === 'checkbox') {
            const lower = trimmed.toLowerCase()
            if (lower === 'true' || lower === '1' || lower === 'on' || lower === 'yes') {
              return 'true'
            }
            if (lower === 'false' || lower === '0' || lower === 'off' || lower === 'no') {
              return 'false'
            }
          }
          return trimmed
        })
        .filter(Boolean)
    }

    return [str]
  }

  if (!question.isRepeated) {
    const results: string[][] = []
    for (const item of submissionData) {
      if (item.field === question.path) {
        const vals = parseValue(item.value)
        if (vals.length > 0) results.push(vals)
      }
    }
    return results
  }

  const segments = question.path.split('.*.')
  const pattern = segments.map((seg) => escapeRegExp(seg)).join('\\.(\\d+)\\.')
  const regex = new RegExp(`^${pattern}$`)

  const matched: { index: number; value: unknown }[] = []
  for (const item of submissionData) {
    const match = regex.exec(item.field)
    if (match) {
      const idx = parseInt(match[1], 10)
      matched.push({ index: isNaN(idx) ? 0 : idx, value: item.value })
    }
  }

  matched.sort((a, b) => a.index - b.index)

  const results: string[][] = []
  for (const item of matched) {
    const vals = parseValue(item.value)
    if (vals.length > 0) results.push(vals)
  }

  return results
}

export function aggregateChoices(
  questions: QuestionDef[],
  submissions: SurveySubmissionLike[],
): ChoiceQuestionStat[] {
  const choiceQuestions = questions.filter((q) => q.kind === 'choice')

  return choiceQuestions.map((q) => {
    const isDynamicBlock = [
      'select-store-departments',
      'select-restaurants',
      'select-operators',
      'country',
    ].includes(q.blockType)

    const optionList: QuestionOption[] = [...q.options]
    const optionCounts = new Map<string, number>()
    for (const opt of optionList) {
      optionCounts.set(opt.value, 0)
    }

    let answered = 0
    let answerCount = 0
    let other = 0
    let numericSum = 0
    let numericCount = 0
    const isRatingOrScale = q.blockType === 'rating' || q.blockType === 'scale'

    for (const sub of submissions) {
      const answers = getAnswerValues(q, sub)
      const allVals = answers.flat()
      if (allVals.length > 0) {
        answered++
      }

      for (const val of allVals) {
        answerCount++

        if (isRatingOrScale) {
          const num = Number(val)
          if (!isNaN(num)) {
            numericSum += num
            numericCount++
          }
        }

        if (optionCounts.has(val)) {
          optionCounts.set(val, (optionCounts.get(val) || 0) + 1)
        } else if (isDynamicBlock && q.options.length === 0) {
          optionCounts.set(val, 1)
          optionList.push({ value: val, label: val })
        } else {
          other++
        }
      }
    }

    const options = optionList.map((opt) => {
      const count = optionCounts.get(opt.value) || 0
      const percent = answerCount > 0 ? Math.round((count / answerCount) * 1000) / 10 : 0
      return {
        value: opt.value,
        label: opt.label,
        count,
        percent,
      }
    })

    let average: number | null = null
    if (isRatingOrScale && numericCount > 0) {
      average = Math.round((numericSum / numericCount) * 100) / 100
    }

    return {
      path: q.path,
      label: q.label,
      fieldLabel: q.fieldLabel,
      stepLabel: q.stepLabel,
      groupLabel: q.groupLabel,
      blockType: q.blockType,
      isRepeated: q.isRepeated,
      options,
      other,
      answered,
      responses: submissions.length,
      answerCount,
      average,
    }
  })
}

export function buildTextRows(
  questions: QuestionDef[],
  submissions: SurveySubmissionLike[],
  departmentTitleById?: Record<string, string>,
): TextAnswerRow[] {
  const textQuestions = questions.filter((q) => q.kind === 'text')
  const sorted = [...submissions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const rows: TextAnswerRow[] = []

  for (const sub of sorted) {
    const answers: { path: string; label: string; value: string }[] = []

    for (const q of textQuestions) {
      const answerInstances = getAnswerValues(q, sub)
      const flat = answerInstances.map((arr) => arr.join('; ')).filter(Boolean)
      const combined = flat.join('; ')
      if (combined.trim()) {
        answers.push({
          path: q.path,
          label: q.label,
          value: combined.trim(),
        })
      }
    }

    if (answers.length > 0) {
      const deptItem = sub.submissionData.find((item) => item.field === 'department')
      const deptId = deptItem?.value ? String(deptItem.value).trim() : null
      let departmentTitle: string | null = null
      if (deptId) {
        departmentTitle = departmentTitleById?.[deptId] ?? deptId
      }

      rows.push({
        submittedAt: sub.createdAt,
        departmentTitle,
        answers,
      })
    }
  }

  return rows
}

function formatQatarDateTime(isoString: string): string {
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return isoString
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Qatar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(d)
  const partMap: Record<string, string> = {}
  for (const p of parts) {
    partMap[p.type] = p.value
  }
  return `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}`
}

function escapeCsvCell(value: unknown): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildCsv(
  questions: QuestionDef[],
  submissions: SurveySubmissionLike[],
  options: {
    includeDepartment: boolean
    departmentTitleById: Record<string, string>
  },
): string {
  const exportQuestions = questions.filter((q) => q.blockType !== 'survey-department')

  const headerRow: string[] = ['Submitted at']
  if (options.includeDepartment) {
    headerRow.push('Department')
  }
  for (const q of exportQuestions) {
    headerRow.push(q.label)
  }

  const sorted = [...submissions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const dataRows: string[][] = []

  for (const sub of sorted) {
    const row: string[] = [formatQatarDateTime(sub.createdAt)]

    if (options.includeDepartment) {
      const deptItem = sub.submissionData.find((item) => item.field === 'department')
      const deptId = deptItem?.value ? String(deptItem.value).trim() : ''
      const deptTitle = deptId ? options.departmentTitleById[deptId] ?? deptId : ''
      row.push(deptTitle)
    }

    for (const q of exportQuestions) {
      const answerInstances = getAnswerValues(q, sub)

      if (q.kind === 'choice') {
        const optMap = new Map<string, string>()
        for (const opt of q.options) {
          optMap.set(opt.value, opt.label)
        }
        const formattedInstances = answerInstances.map((instance) =>
          instance.map((val) => optMap.get(val) ?? val).join('; '),
        )
        row.push(formattedInstances.filter(Boolean).join('; '))
      } else {
        const formattedInstances = answerInstances.map((instance) => instance.join('; '))
        row.push(formattedInstances.filter(Boolean).join('; '))
      }
    }

    dataRows.push(row)
  }

  const allRows = [headerRow, ...dataRows]
  const csvContent = allRows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n')

  return `\uFEFF${csvContent}`
}
