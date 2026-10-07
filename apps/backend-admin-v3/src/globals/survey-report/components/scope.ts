import type { Form, User, UsersAccess } from '@/payload-types'
import { hasUserAccess, isCollectionSuperUser } from '@/utilities/access'
import { toId } from '@/utilities/survey-department'
import type { SurveyReportScope } from './types'

export const SURVEY_REPORT_SLUG = 'survey-report'

export function resolveSurveyReportScope(user: User): SurveyReportScope | null {
  if (!user) return null

  if (user.super_user) {
    return {
      operatorId: 'all',
      formSlugs: 'all',
      departmentId: 'all',
    }
  }

  if (isCollectionSuperUser(user, SURVEY_REPORT_SLUG)) {
    const operatorId = toId(user.operator)
    if (!operatorId) return null
    return {
      operatorId,
      formSlugs: 'all',
      departmentId: 'all',
    }
  }

  if (hasUserAccess(user, SURVEY_REPORT_SLUG, 'read')) {
    const operatorId = toId(user.operator)
    if (!operatorId) return null

    const userAccess = user.access as UsersAccess | undefined
    const accessRows = Array.isArray(userAccess?.access) ? userAccess.access : []

    const prefix = `${SURVEY_REPORT_SLUG}-`
    const matchingSlugs = accessRows
      .filter((row) => row?.slug?.startsWith(prefix) && row.read === true)
      .map((row) => row.slug.slice(prefix.length))
      .filter(Boolean)

    const formSlugs: string[] | 'all' = matchingSlugs.length > 0 ? matchingSlugs : 'all'
    const departmentId = toId(user.department) ?? null

    return {
      operatorId,
      formSlugs,
      departmentId,
    }
  }

  return null
}

export function isFormInScope(
  scope: SurveyReportScope,
  form: Pick<Form, 'slug' | 'operator'>,
): boolean {
  if (scope.operatorId !== 'all') {
    const formOperatorId = toId(form.operator)
    if (formOperatorId !== scope.operatorId) return false
  }

  if (scope.formSlugs !== 'all') {
    if (!scope.formSlugs.includes(form.slug)) return false
  }

  return true
}
