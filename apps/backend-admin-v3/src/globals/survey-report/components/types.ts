export interface SurveyReportScope {
  operatorId: string | 'all'
  formSlugs: string[] | 'all'
  departmentId: string | 'all' | null
}

export interface SurveyReportFilters {
  formId: string
  from: string
  to: string
  departmentId?: string | null
}

export interface SurveyOption {
  id: string
  title: string
  survey_code: string
  slug: string
}

export interface DepartmentOption {
  id: string
  title: string
  offered: boolean
}

export type SurveyReportBlockedReason =
  | 'no_department_field'
  | 'department_not_offered'
  | 'no_user_department'

export interface SurveyReportContext {
  surveys: SurveyOption[]
  selectedFormId: string | null
  hasDepartmentField: boolean
  departments: DepartmentOption[]
  departmentLocked: boolean
  lockedDepartmentId: string | null
  blockedReason: SurveyReportBlockedReason | null
}

export interface QuestionOption {
  value: string
  label: string
}

export interface QuestionDef {
  path: string
  label: string
  /** The question's own label, without its step or group/list labels. */
  fieldLabel: string
  stepLabel: string | null
  /** Enclosing group/list labels joined with " › ", or null at step/top level. */
  groupLabel: string | null
  blockType: string
  kind: 'choice' | 'text'
  options: QuestionOption[]
  isRepeated: boolean
}

export interface ChoiceQuestionStat {
  path: string
  label: string
  fieldLabel: string
  stepLabel: string | null
  groupLabel: string | null
  blockType: string
  isRepeated: boolean
  options: {
    value: string
    label: string
    count: number
    percent: number
  }[]
  other: number
  answered: number
  responses: number
  answerCount: number
  average: number | null
}

export interface TextAnswerRow {
  submittedAt: string
  departmentTitle: string | null
  answers: {
    path: string
    label: string
    value: string
  }[]
}

export interface SurveySubmissionLike {
  id: string
  createdAt: string
  submissionData: {
    field: string
    value: string
  }[]
}

export interface SurveyReportSummary {
  sent: number
  responded: number
  rate: number | null
}

export interface SurveyReportData {
  summary: SurveyReportSummary
  questions: QuestionDef[]
  choices: ChoiceQuestionStat[]
  textRows: TextAnswerRow[]
  departmentFilterActive: boolean
}
