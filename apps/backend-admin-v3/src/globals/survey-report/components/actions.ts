'use server'

import { getPayload, type Payload, type Where } from 'payload'
import config from '@payload-config'
import type { Form, User } from '@/payload-types'
import { hasUserAccess } from '@/utilities/access'
import {
  findSurveyDepartmentBlock,
  getSurveyDepartmentOptions,
  SURVEY_DEPARTMENT_FIELD_NAME,
  type SurveyDepartmentOption,
} from '@/utilities/survey-department'
import {
  aggregateChoices,
  buildCsv,
  buildTextRows,
  classifyQuestions,
} from './aggregate'
import {
  isFormInScope,
  resolveSurveyReportScope,
  SURVEY_REPORT_SLUG,
} from './scope'
import type {
  DepartmentOption,
  QuestionDef,
  SurveyOption,
  SurveyReportBlockedReason,
  SurveyReportContext,
  SurveyReportData,
  SurveyReportFilters,
  SurveyReportScope,
  SurveyReportSummary,
  SurveySubmissionLike,
} from './types'

function extractTitle(title: unknown): string {
  if (typeof title === 'string') return title.trim()
  if (title && typeof title === 'object') {
    const obj = title as Record<string, unknown>
    if (typeof obj.en === 'string' && obj.en.trim()) return obj.en.trim()
    if (typeof obj.ar === 'string' && obj.ar.trim()) return obj.ar.trim()
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && val.trim()) return val.trim()
    }
  }
  return ''
}

async function loadReportUser(userId: string): Promise<{
  payload: Payload
  user: User
  scope: SurveyReportScope
} | null> {
  if (!userId) return null

  try {
    const payload = await getPayload({ config })
    const user = (await payload
      .findByID({
        collection: 'users',
        id: userId,
        depth: 1,
        overrideAccess: true,
      })
      .catch(() => null)) as User | null

    if (!user) return null

    if (!hasUserAccess(user, SURVEY_REPORT_SLUG, 'read')) {
      return null
    }

    const scope = resolveSurveyReportScope(user)
    if (!scope) return null

    return { payload, user, scope }
  } catch {
    return null
  }
}

async function loadScopedForm(
  payload: Payload,
  scope: SurveyReportScope,
  formId: string,
): Promise<Form | null> {
  if (!formId?.trim()) return null

  try {
    const form = (await payload
      .findByID({
        collection: 'forms',
        id: formId,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null)) as Form | null

    if (!form || !form.is_survey) return null
    if (!isFormInScope(scope, form)) return null

    return form
  } catch {
    return null
  }
}

async function resolveDepartmentState(
  payload: Payload,
  scope: SurveyReportScope,
  form: Form,
): Promise<{
  hasDepartmentField: boolean
  offered: SurveyDepartmentOption[]
  departmentLocked: boolean
  lockedDepartmentId: string | null
  blockedReason: SurveyReportBlockedReason | null
}> {
  const block = findSurveyDepartmentBlock(form)
  const hasDepartmentField = Boolean(block)
  const offered = hasDepartmentField ? await getSurveyDepartmentOptions(payload, form) : []

  const departmentLocked = scope.departmentId !== 'all'
  const lockedDepartmentId = departmentLocked ? scope.departmentId : null

  let blockedReason: SurveyReportBlockedReason | null = null

  if (departmentLocked) {
    if (!scope.departmentId) {
      blockedReason = 'no_user_department'
    } else if (!hasDepartmentField) {
      blockedReason = 'no_department_field'
    } else if (!offered.some((d) => d.id === scope.departmentId)) {
      blockedReason = 'department_not_offered'
    }
  }

  return {
    hasDepartmentField,
    offered,
    departmentLocked,
    lockedDepartmentId,
    blockedReason,
  }
}

async function loadSubmissions(
  payload: Payload,
  formId: string,
  fromDate?: Date,
  toDate?: Date,
): Promise<SurveySubmissionLike[]> {
  const conditions: Where[] = [{ form: { equals: formId } }]
  if (fromDate) {
    conditions.push({ createdAt: { greater_than_equal: fromDate.toISOString() } })
  }
  if (toDate) {
    conditions.push({ createdAt: { less_than_equal: toDate.toISOString() } })
  }

  const where: Where = conditions.length === 1 ? conditions[0] : { and: conditions }

  const { docs } = await payload.find({
    collection: 'form-submissions',
    where,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  return docs.map((doc) => ({
    id: String(doc.id),
    createdAt: doc.createdAt,
    submissionData: Array.isArray(doc.submissionData)
      ? doc.submissionData.map((item) => ({
          field: String(item.field ?? ''),
          value: String(item.value ?? ''),
        }))
      : [],
  }))
}

async function buildDepartmentList(
  payload: Payload,
  offered: SurveyDepartmentOption[],
  submissions: SurveySubmissionLike[],
): Promise<DepartmentOption[]> {
  const offeredList: DepartmentOption[] = offered.map((o) => ({
    id: o.id,
    title: o.title,
    offered: true,
  }))

  const offeredIds = new Set(offered.map((o) => o.id))
  const unofferedIds = new Set<string>()

  for (const sub of submissions) {
    const deptItem = sub.submissionData.find((item) => item.field === SURVEY_DEPARTMENT_FIELD_NAME)
    const val = deptItem?.value ? String(deptItem.value).trim() : ''
    if (val && !offeredIds.has(val)) {
      unofferedIds.add(val)
    }
  }

  if (unofferedIds.size === 0) {
    return offeredList
  }

  const { docs } = await payload.find({
    collection: 'departments',
    where: {
      id: { in: Array.from(unofferedIds) },
    },
    overrideAccess: true,
    depth: 0,
    pagination: false,
    select: { title: true },
  })

  const titleById = new Map<string, string>()
  for (const doc of docs) {
    titleById.set(doc.id, doc.title)
  }

  const unofferedList: DepartmentOption[] = Array.from(unofferedIds).map((id) => ({
    id,
    title: titleById.get(id) ?? id,
    offered: false,
  }))

  unofferedList.sort((a, b) => a.title.localeCompare(b.title))

  return [...offeredList, ...unofferedList]
}

type PrepareReportSuccess = {
  payload: Payload
  user: User
  scope: SurveyReportScope
  form: Form
  fromDate: Date
  toDate: Date
  deptState: {
    hasDepartmentField: boolean
    offered: SurveyDepartmentOption[]
    departmentLocked: boolean
    lockedDepartmentId: string | null
    blockedReason: SurveyReportBlockedReason | null
  }
  departments: DepartmentOption[]
  departmentTitleById: Record<string, string>
  questions: QuestionDef[]
  submissions: SurveySubmissionLike[]
  filteredSubmissions: SurveySubmissionLike[]
  effectiveDepartmentId: string | null
  departmentFilterActive: boolean
}

type PrepareReportResult =
  | {
      error: string
    }
  | PrepareReportSuccess

async function prepareReport(
  userId: string,
  filters: SurveyReportFilters,
): Promise<PrepareReportResult> {
  const userCtx = await loadReportUser(userId)
  if (!userCtx) {
    return { error: 'Unauthorized' }
  }

  const { payload, user, scope } = userCtx

  if (!filters?.formId?.trim()) {
    return { error: 'formId is required' }
  }

  const form = await loadScopedForm(payload, scope, filters.formId)
  if (!form) {
    return { error: 'Form not found or outside scope' }
  }

  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
  if (
    !filters?.from ||
    !DATE_REGEX.test(filters.from) ||
    !filters?.to ||
    !DATE_REGEX.test(filters.to)
  ) {
    return { error: 'Invalid date format' }
  }

  const fromDate = new Date(`${filters.from}T00:00:00.000+03:00`)
  const toDate = new Date(`${filters.to}T23:59:59.999+03:00`)
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
    return { error: 'Invalid date range' }
  }

  const deptState = await resolveDepartmentState(payload, scope, form)
  if (deptState.blockedReason) {
    return { error: deptState.blockedReason }
  }

  const effectiveDepartmentId =
    scope.departmentId !== 'all'
      ? scope.departmentId
      : (filters.departmentId ? String(filters.departmentId).trim() : null) || null

  const departmentFilterActive = Boolean(effectiveDepartmentId)

  const submissions = await loadSubmissions(payload, form.id, fromDate, toDate)
  const departments = await buildDepartmentList(payload, deptState.offered, submissions)

  const departmentTitleById: Record<string, string> = {}
  for (const dept of departments) {
    departmentTitleById[dept.id] = dept.title
  }

  const questions = classifyQuestions(form, { departmentOptions: departments })

  const filteredSubmissions = effectiveDepartmentId
    ? submissions.filter((sub) => {
        const deptItem = sub.submissionData.find(
          (item) => item.field === SURVEY_DEPARTMENT_FIELD_NAME,
        )
        const val = deptItem?.value ? String(deptItem.value).trim() : ''
        return val === effectiveDepartmentId
      })
    : submissions

  return {
    payload,
    user,
    scope,
    form,
    fromDate,
    toDate,
    deptState,
    departments,
    departmentTitleById,
    questions,
    submissions,
    filteredSubmissions,
    effectiveDepartmentId,
    departmentFilterActive,
  }
}

export async function fetchSurveyReportContext(
  userId: string,
  formId?: string,
): Promise<SurveyReportContext | null> {
  try {
    const loaded = await loadReportUser(userId)
    if (!loaded) return null

    const { payload, scope } = loaded

    const formConditions: Where[] = [{ is_survey: { equals: true } }]
    if (scope.operatorId !== 'all') {
      formConditions.push({ operator: { equals: scope.operatorId } })
    }
    if (scope.formSlugs !== 'all') {
      formConditions.push({ slug: { in: scope.formSlugs } })
    }

    const where: Where = formConditions.length === 1 ? formConditions[0] : { and: formConditions }

    const { docs: formDocs } = await payload.find({
      collection: 'forms',
      where,
      sort: '-createdAt',
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    const surveys: SurveyOption[] = formDocs.map((doc) => ({
      id: String(doc.id),
      title: extractTitle(doc.title) || doc.slug,
      survey_code: String(doc.survey_code ?? ''),
      slug: doc.slug,
    }))

    const selectedFormId =
      formId && surveys.some((s) => s.id === formId)
        ? formId
        : (surveys[0]?.id ?? null)

    const departmentLocked = scope.departmentId !== 'all'
    const lockedDepartmentId = departmentLocked ? scope.departmentId : null

    if (!selectedFormId) {
      return {
        surveys,
        selectedFormId: null,
        hasDepartmentField: false,
        departments: [],
        departmentLocked,
        lockedDepartmentId,
        blockedReason: null,
      }
    }

    const selectedForm = formDocs.find((doc) => String(doc.id) === selectedFormId)
    if (!selectedForm) {
      return {
        surveys,
        selectedFormId: null,
        hasDepartmentField: false,
        departments: [],
        departmentLocked,
        lockedDepartmentId,
        blockedReason: null,
      }
    }

    const deptState = await resolveDepartmentState(payload, scope, selectedForm)
    const submissions = await loadSubmissions(payload, selectedForm.id)
    const departments = await buildDepartmentList(payload, deptState.offered, submissions)

    return {
      surveys,
      selectedFormId,
      hasDepartmentField: deptState.hasDepartmentField,
      departments,
      departmentLocked: deptState.departmentLocked,
      lockedDepartmentId: deptState.lockedDepartmentId,
      blockedReason: deptState.blockedReason,
    }
  } catch (e) {
    console.error('[survey-report] fetchSurveyReportContext error:', e)
    return null
  }
}

export async function fetchSurveyReport(
  userId: string,
  filters: SurveyReportFilters,
): Promise<{ success: true; data: SurveyReportData } | { success: false; error: string }> {
  try {
    const prepared = await prepareReport(userId, filters)
    if ('error' in prepared) {
      return { success: false, error: prepared.error }
    }

    const {
      payload,
      form,
      fromDate,
      toDate,
      questions,
      filteredSubmissions,
      departmentTitleById,
      departmentFilterActive,
    } = prepared

    const { totalDocs: sent } = await payload.count({
      collection: 'survey-invitations',
      where: {
        and: [
          { form: { equals: form.id } },
          { status: { in: ['sent', 'responded'] } },
          { sent_at: { greater_than_equal: fromDate.toISOString() } },
          { sent_at: { less_than_equal: toDate.toISOString() } },
        ],
      },
      overrideAccess: true,
    })

    const responded = filteredSubmissions.length
    const rate = departmentFilterActive
      ? null
      : sent > 0
        ? Math.round((responded / sent) * 100)
        : null

    const summary: SurveyReportSummary = {
      sent,
      responded,
      rate,
    }

    const choices = aggregateChoices(questions, filteredSubmissions)
    const textRows = buildTextRows(questions, filteredSubmissions, departmentTitleById)

    const data: SurveyReportData = {
      summary,
      questions,
      choices,
      textRows,
      departmentFilterActive,
    }

    return {
      success: true,
      data,
    }
  } catch (e) {
    console.error('[survey-report] fetchSurveyReport error:', e)
    return { success: false, error: 'Failed to fetch survey report' }
  }
}

export async function exportSurveyReportCsv(
  userId: string,
  filters: SurveyReportFilters,
): Promise<{ success: true; csv: string; filename: string } | { success: false; error: string }> {
  try {
    const prepared = await prepareReport(userId, filters)
    if ('error' in prepared) {
      return { success: false, error: prepared.error }
    }

    const { form, questions, filteredSubmissions, deptState, departmentTitleById } = prepared

    const csv = buildCsv(questions, filteredSubmissions, {
      includeDepartment: deptState.hasDepartmentField,
      departmentTitleById,
    })

    const surveyCode = form.survey_code || form.slug
    const filename = `survey-${surveyCode}-${filters.from}-${filters.to}.csv`

    return {
      success: true,
      csv,
      filename,
    }
  } catch (e) {
    console.error('[survey-report] exportSurveyReportCsv error:', e)
    return { success: false, error: 'Failed to export survey report CSV' }
  }
}
