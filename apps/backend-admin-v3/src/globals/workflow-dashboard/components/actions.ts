'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import {
  Form,
  FormSubmission,
  InternalMedia,
  User,
  WorkflowInstance,
  WorkflowReviews,
} from '@/payload-types'
import { hasUserAccess } from '@/utilities/access'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** form is depth:1 resolved — narrow the union */
type ResolvedFormSubmission = Omit<FormSubmission, 'form'> & { form: Form }

/** instance resolved at depth:0 — operator/workflow_v2 are still IDs */
type ResolvedInstance = WorkflowInstance

/** A single item from WorkflowReviews (the array element type) */
type WorkflowReviewItem = NonNullable<WorkflowReviews>[number]

/** A single item from WorkflowInstance.reviews (the array element type) */
type InstanceReviewItem = NonNullable<WorkflowInstance['reviews']>[number]

// ── Discriminated union row type ─────────────────────────────────────────────

/** Fields pre-computed from either engine so the table/toolbar never needs to branch on version */
interface WorkflowRowBase {
  /** The form-submission id */
  id: string
  formTitle: string
  formSlug: string
  submittedBy: string | undefined
  submittedAt: string
  operator: string | undefined
}

export type V1SubmissionRow = WorkflowRowBase & {
  version: 'v1'
  /** The full depth-1 form-submission document (workflow_* fields included) */
  submission: ResolvedFormSubmission
  // Computed display fields
  status: NonNullable<FormSubmission['workflow_status']> | 'draft'
  currentStepSlug: string | null
  currentStepLabel: string | null
  totalSteps: number
  completedSteps: number
}

export type V2SubmissionRow = WorkflowRowBase & {
  version: 'v2'
  /** The full depth-1 form-submission document */
  submission: ResolvedFormSubmission
  /** The depth-0 workflow-instance document */
  instance: ResolvedInstance
  // Computed display fields
  status: WorkflowInstance['status']
  currentStepSlug: string | null
  currentStepLabel: string | null
  totalSteps: number
  completedSteps: number
}

export type WorkflowSubmissionRow = V1SubmissionRow | V2SubmissionRow

// ── NormalizedReview ─────────────────────────────────────────────────────────

export interface NormalizedReview {
  label: string
  statusSlug: string
  reviewer: string
  response: string
  comments?: string
  reviewedAt?: string
  reviewedBy?: string
  customFieldResponses?: { name: string; label?: string; value: unknown }[]
  attachments?: { url?: string; filename?: string }[]
  signature?: string
  /** V2 only: every approver on this step and their individual response (no more primary/additional split). */
  reviewerTokens?: { email: string; response: string; reviewedAt?: string | null }[]
}

// ── Internal constants ────────────────────────────────────────────────────────

const COMPLETED_RESPONSES = ['approved', 'acknowledged', 'skipped', 'auto_completed'] as const

function resolveSubmittedBy(createdBy: FormSubmission['created_by']): string | undefined {
  if (!createdBy) return undefined
  if (typeof createdBy === 'string') return createdBy
  // createdBy is a User object
  return (createdBy as User).full_name || (createdBy as User).email || undefined
}

function resolveFormTitle(form: FormSubmission['form']): string {
  if (typeof form === 'object' && form !== null) return (form as Form).title
  return 'Unknown Form'
}

function resolveFormSlug(form: FormSubmission['form']): string {
  if (typeof form === 'object' && form !== null) return (form as Form).slug
  return ''
}

function resolveOperatorTitle(operator: FormSubmission['operator']): string | undefined {
  if (!operator) return undefined
  if (typeof operator === 'string') return undefined
  return operator.title || undefined
}

function operatorIdOf(operator: string | { id: string } | null | undefined): string | null {
  if (!operator) return null
  return typeof operator === 'string' ? operator : operator.id
}

/**
 * Mirrors `operatorAccessRefine` for callers that use `overrideAccess: true` and must
 * therefore re-implement the operator scoping manually.
 *
 * Returns `null` when the user may see all operators (super user, or belongs to a
 * super-user operator). Returns a string operatorId to scope by otherwise. Returns
 * `false` when the user has no operator at all and must see nothing.
 */
async function resolveOperatorScope(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: User,
): Promise<string | null | false> {
  if (user.super_user) return null

  const operatorId = operatorIdOf(user.operator)
  if (!operatorId) return false

  const operator = await payload.findByID({
    collection: 'operators',
    id: operatorId,
    depth: 0,
    overrideAccess: true,
  })

  if (operator?.super_user) return null
  return operatorId
}

function countCompletedV1(reviews: WorkflowReviews): number {
  if (!reviews) return 0
  return reviews.filter(
    (r) => r.response && (COMPLETED_RESPONSES as readonly string[]).includes(r.response),
  ).length
}

function countCompletedV2(reviews: WorkflowInstance['reviews']): number {
  if (!reviews) return 0
  return reviews.filter(
    (r) => r.response && (COMPLETED_RESPONSES as readonly string[]).includes(r.response),
  ).length
}

/**
 * Finds a field's config within a form's field blocks (handles group/list/multi-step nesting).
 * Mirrors the equivalent helper in forms-dashboard/components/actions.ts.
 */
function findFieldConfig(fieldsList: any[], fieldName: string): any {
  if (!fieldsList || !Array.isArray(fieldsList)) return null

  for (const field of fieldsList) {
    if (!field) continue

    if ('name' in field && field.name === fieldName) return field

    if (field.blockType === 'group' && field.fields && fieldName.startsWith(`${field.name}.`)) {
      return findFieldConfig(field.fields, fieldName.split('.').slice(1).join('.'))
    }

    if (field.blockType === 'list' && field.fields && fieldName.startsWith(`${field.name}.`)) {
      const parts = fieldName.split('.')
      if (parts.length > 2 && !isNaN(Number(parts[1]))) {
        return findFieldConfig(field.fields, parts.slice(2).join('.'))
      }
      return findFieldConfig(field.fields, parts.slice(1).join('.'))
    }

    if (field.blockType === 'conditional' && field.fields) {
      const found = findFieldConfig(field.fields, fieldName)
      if (found) return found
    }

    if (field.blockType === 'multi-step' && field.steps) {
      for (const step of field.steps) {
        const found = findFieldConfig(step.fields || [], fieldName)
        if (found) return found
      }
    }
  }

  return null
}

interface EnrichedSubmissionItem {
  field: string
  value: string
  label: string
  type: string
  url?: string
  filename?: string
}

/** Enriches raw {field,value} submissionData with the label/type/url/filename the detail modal renders. */
async function enrichSubmissionData(
  payload: Awaited<ReturnType<typeof getPayload>>,
  submissionData: NonNullable<FormSubmission['submissionData']>,
  formFields: any[],
): Promise<EnrichedSubmissionItem[]> {
  return Promise.all(
    submissionData.map(async (item) => {
      const fieldCfg = findFieldConfig(formFields, item.field)
      const blockType = fieldCfg?.blockType

      let url: string | undefined
      let filename: string | undefined
      let displayValue = item.value

      if (blockType === 'file' && item.value) {
        try {
          const media = (await payload.findByID({
            collection: 'forms-media',
            id: item.value,
            depth: 0,
            overrideAccess: true,
          })) as InternalMedia
          url = media?.url ?? undefined
          filename = media?.filename ?? undefined
        } catch {
          // item.value wasn't a valid media id — leave url/filename undefined
        }
      } else if (
        (blockType === 'select-operators' ||
          blockType === 'select-restaurants' ||
          blockType === 'select-store-departments' ||
          blockType === 'select-crm-category') &&
        item.value
      ) {
        const collectionSlug =
          blockType === 'select-operators'
            ? 'operators'
            : blockType === 'select-restaurants'
              ? 'restaurants'
              : blockType === 'select-store-departments'
                ? 'store-departments'
                : 'crm-categories'

        try {
          const doc = (await payload.findByID({
            collection: collectionSlug,
            id: item.value,
            depth: 0,
            overrideAccess: true,
          })) as { title?: string | null; name?: string | null; id: string }

          displayValue = doc?.title || doc?.name || doc?.id || item.value
        } catch {
          // item.value wasn't a valid relation id — fall through to the raw id
        }
      }

      return {
        field: item.field,
        value: displayValue,
        label: fieldCfg?.label || item.field.split('.').pop() || item.field,
        type: blockType === 'file' ? 'file' : blockType || 'text',
        url,
        filename,
      }
    }),
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch all workflow-enabled forms that the current user can read, tagged with
 * which workflow engine each form actually uses.
 *
 * Version is a per-FORM setting, not something to infer per-submission:
 * `use_workflow_v2` checked → that form's submissions are always v2.
 * `enable_workflow` checked without `use_workflow_v2` → v1.
 */
export async function fetchWorkflowForms(
  userId: string,
): Promise<{ id: string; title: string; slug: string; version: 'v1' | 'v2' }[]> {
  try {
    const payload = await getPayload({ config })

    const user = (await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 1,
      overrideAccess: true,
    })) as User

    if (!user) return []

    const formsResult = await payload.find({
      collection: 'forms',
      limit: 1000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    const accessible: { id: string; title: string; slug: string; version: 'v1' | 'v2' }[] = []

    for (const form of formsResult.docs as Form[]) {
      const isV2 = !!form.use_workflow_v2
      const isV1 = !!form.enable_workflow && !isV2
      if (!isV1 && !isV2) continue

      const accessSlug = `form-workflow-${form.slug}`
      if (hasUserAccess(user, accessSlug, 'read')) {
        accessible.push({
          id: form.id,
          title: form.title,
          slug: form.slug,
          version: isV2 ? 'v2' : 'v1',
        })
      }
    }

    return accessible
  } catch (error) {
    console.error('Error fetching workflow forms:', error)
    return []
  }
}

/**
 * Fetch paginated workflow submissions from both v1 (form-submissions) and v2
 * (workflow-instances), merged and filtered in memory.
 *
 * NOTE: Merge-then-paginate is intentional and acceptable at realistic submission
 * volumes. If this ever needs to scale to tens of thousands of rows, the correct
 * fix is to denormalize the v2 status back onto form-submissions.
 */
export async function fetchWorkflowSubmissions(
  userId: string,
  filters: {
    search?: string
    status?: string
    workflowVersion?: 'v1' | 'v2'
    formId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  },
): Promise<{
  docs: WorkflowSubmissionRow[]
  totalDocs: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
}> {
  const empty = { docs: [], totalDocs: 0, totalPages: 0, hasPrevPage: false, hasNextPage: false }

  try {
    const payload = await getPayload({ config })

    const user = (await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      overrideAccess: true,
    })) as User | null

    if (!user) return empty

    const accessibleForms = await fetchWorkflowForms(userId)
    if (accessibleForms.length === 0) return empty

    // Version is a per-form setting (see fetchWorkflowForms) — partition up front
    // so each query only ever touches submissions of forms that actually use it.
    // No merge-time dedup needed: a form is v1 or v2, never both.
    const v1FormIds = accessibleForms.filter((f) => f.version === 'v1').map((f) => f.id)
    const v2FormIds = accessibleForms.filter((f) => f.version === 'v2').map((f) => f.id)
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20

    // workflow-instances (v2) is operator-scoped in its real access config
    // (operatorAccessRefine). overrideAccess bypasses that, so it must be
    // re-applied manually here.
    const operatorScope = await resolveOperatorScope(payload, user)

    const v1Rows: V1SubmissionRow[] = []
    const v2Rows: V2SubmissionRow[] = []

    // ── V1 ──────────────────────────────────────────────────────────────────
    if (filters.workflowVersion !== 'v2' && v1FormIds.length > 0) {
      const v1Result = await payload.find({
        collection: 'form-submissions',
        where: {
          AND: [{ form: { in: v1FormIds } }, { workflow_status: { not_equals: null } }],
        },
        depth: 1,
        limit: 10000,
        overrideAccess: true,
      })

      for (const doc of v1Result.docs as ResolvedFormSubmission[]) {
        const reviews: WorkflowReviews = doc.workflow_reviews ?? null
        const currentStepSlug: string | null = doc._workflow_status ?? null
        const currentReview = reviews?.find((r) => r.status_slug === currentStepSlug)
        const currentStepLabel = currentReview?.label ?? currentStepSlug

        v1Rows.push({
          id: doc.id,
          version: 'v1',
          submission: doc,
          formTitle: resolveFormTitle(doc.form),
          formSlug: resolveFormSlug(doc.form),
          submittedBy: resolveSubmittedBy(doc.created_by),
          submittedAt: doc.createdAt,
          operator: resolveOperatorTitle(doc.operator),
          status: doc.workflow_status ?? 'draft',
          currentStepSlug,
          currentStepLabel,
          totalSteps: reviews?.length ?? 0,
          completedSteps: countCompletedV1(reviews),
        })
      }
    }

    // ── V2 ──────────────────────────────────────────────────────────────────
    if (filters.workflowVersion !== 'v1' && v2FormIds.length > 0 && operatorScope !== false) {
      const instancesResult = await payload.find({
        collection: 'workflow-instances',
        where:
          operatorScope === null
            ? { document_collection: { equals: 'form-submissions' } }
            : {
                AND: [
                  { document_collection: { equals: 'form-submissions' } },
                  { operator: { equals: operatorScope } },
                ],
              },
        depth: 0,
        limit: 10000,
        overrideAccess: true,
      })

      const instances = instancesResult.docs as ResolvedInstance[]
      const documentIds = instances.map((inst) => inst.document_id).filter(Boolean)

      if (documentIds.length > 0) {
        const submissionsResult = await payload.find({
          collection: 'form-submissions',
          where: {
            AND: [{ id: { in: documentIds } }, { form: { in: v2FormIds } }],
          },
          depth: 1,
          limit: 10000,
          overrideAccess: true,
        })

        const submissionMap = new Map(
          (submissionsResult.docs as ResolvedFormSubmission[]).map((s) => [s.id, s]),
        )

        for (const instance of instances) {
          const submission = submissionMap.get(instance.document_id)
          if (!submission) continue

          const reviews = instance.reviews ?? []
          const currentStepSlug: string | null = instance.current_step ?? null
          const currentStepLabel: string | null = instance.current_step_label ?? currentStepSlug

          v2Rows.push({
            id: submission.id,
            version: 'v2',
            submission,
            instance,
            formTitle: resolveFormTitle(submission.form),
            formSlug: resolveFormSlug(submission.form),
            submittedBy: resolveSubmittedBy(submission.created_by),
            submittedAt: submission.createdAt,
            operator: resolveOperatorTitle(submission.operator),
            status: instance.status,
            currentStepSlug,
            currentStepLabel,
            totalSteps: reviews.length,
            completedSteps: countCompletedV2(reviews),
          })
        }
      }
    }

    // ── Merge + filter ───────────────────────────────────────────────────────
    // No dedup needed: v1Rows and v2Rows are already partitioned by form version.
    let merged: WorkflowSubmissionRow[] = [...v1Rows, ...v2Rows]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      merged = merged.filter(
        (row) =>
          row.id.toLowerCase().includes(q) ||
          row.formTitle.toLowerCase().includes(q) ||
          (row.submittedBy ?? '').toLowerCase().includes(q),
      )
    }

    if (filters.status) {
      merged = merged.filter((row) => row.status === filters.status)
    }

    if (filters.formId) {
      const target = accessibleForms.find((f) => f.id === filters.formId)
      if (target) merged = merged.filter((row) => row.formSlug === target.slug)
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime()
      merged = merged.filter((row) => new Date(row.submittedAt).getTime() >= start)
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate)
      end.setHours(23, 59, 59, 999)
      merged = merged.filter((row) => new Date(row.submittedAt).getTime() <= end.getTime())
    }

    merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    const totalDocs = merged.length
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
    const start = (page - 1) * limit
    const docs = merged.slice(start, start + limit)

    return { docs, totalDocs, totalPages, hasPrevPage: page > 1, hasNextPage: page < totalPages }
  } catch (error) {
    console.error('Error fetching workflow submissions:', error)
    return empty
  }
}

/**
 * Fetch the full detail for a single workflow submission row, normalizing the
 * review history from either engine into a uniform NormalizedReview[].
 */
export async function fetchWorkflowSubmissionDetail(
  userId: string,
  submissionId: string,
  version: 'v1' | 'v2',
  instanceId?: string,
): Promise<{
  submission: ResolvedFormSubmission
  submissionData: EnrichedSubmissionItem[]
  reviews: NormalizedReview[]
  currentStepSlug: string | null
  status: string
} | null> {
  try {
    const payload = await getPayload({ config })

    const user = (await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      overrideAccess: true,
    })) as User | null

    if (!user) return null

    const doc = (await payload.findByID({
      collection: 'form-submissions',
      id: submissionId,
      depth: 1,
      overrideAccess: true,
    })) as ResolvedFormSubmission

    if (!doc) return null

    // Re-apply the RBAC check that overrideAccess bypassed, scoped to this
    // submission's own form — otherwise any authenticated user could read any
    // other operator's submission by guessing/enumerating its id.
    const formSlug = resolveFormSlug(doc.form)
    if (!hasUserAccess(user, `form-workflow-${formSlug}`, 'read')) return null

    let reviews: NormalizedReview[] = []
    let currentStepSlug: string | null = null
    let status = 'draft'

    const formFields = (
      typeof doc.form === 'object' && doc.form !== null ? (doc.form as Form).fields : []
    ) as any[]
    const submissionData = await enrichSubmissionData(
      payload,
      doc.submissionData ?? [],
      formFields ?? [],
    )

    if (version === 'v1') {
      currentStepSlug = doc._workflow_status ?? null
      status = doc.workflow_status ?? 'draft'

      const rawReviews: WorkflowReviews = doc.workflow_reviews ?? null
      reviews = (rawReviews ?? []).map(
        (r: WorkflowReviewItem): NormalizedReview => ({
          label: r.label ?? r.status_slug ?? 'Step',
          statusSlug: r.status_slug ?? '',
          reviewer: r.reviewer ?? '',
          response: r.response ?? 'pending',
          comments: r.comments ?? undefined,
          reviewedAt: r.reviewed_at ?? undefined,
          reviewedBy: r.reviewed_by ?? undefined,
          // custom_field_responses is typed as json (unknown) — normalize to array of {name,label,value}
          customFieldResponses: Array.isArray(r.custom_field_responses)
            ? (r.custom_field_responses as { name: string; label?: string; value: unknown }[])
            : undefined,
          attachments: (r.attachments ?? [])
            .filter((a): a is InternalMedia => typeof a === 'object' && a !== null)
            .map((a) => ({ url: a.url ?? undefined, filename: a.filename ?? undefined })),
          signature: r.signature ?? undefined,
        }),
      )
    } else if (instanceId) {
      // depth:1 so reviews[].attachments resolve to InternalMedia objects
      // instead of unresolved id strings (depth:0 silently drops attachments).
      const instance = (await payload.findByID({
        collection: 'workflow-instances',
        id: instanceId,
        depth: 1,
        overrideAccess: true,
      })) as ResolvedInstance

      if (instance) {
        // workflow-instances is operator-scoped in its real access config;
        // re-apply it manually since overrideAccess bypassed it above.
        const operatorScope = await resolveOperatorScope(payload, user)
        const instanceOperatorId = operatorIdOf(instance.operator)
        if (operatorScope === false) return null
        if (operatorScope !== null && operatorScope !== instanceOperatorId) return null

        currentStepSlug = instance.current_step ?? null
        status = instance.status

        const rawReviews: InstanceReviewItem[] = instance.reviews ?? []
        reviews = rawReviews.map((r: InstanceReviewItem): NormalizedReview => {
          const reviewerTokens = Array.isArray((r as any).reviewer_tokens)
            ? ((r as any).reviewer_tokens as Array<{
                email: string
                response: string
                reviewed_at?: string | null
              }>)
            : []
          const fieldResponses = Array.isArray((r as any).field_responses)
            ? ((r as any).field_responses as Array<{
                name: string
                label?: string
                value: unknown
                blockType?: string
              }>)
            : []
          // Signature is rendered specially (as an image) — pull the first
          // signature-type entry out into its own slot, same as V1's dedicated
          // `signature` field. File-type entries store raw media IDs (no resolved
          // url/filename without an extra lookup) — excluded from the generic grid
          // for now rather than showing a raw id string.
          const signatureEntry = fieldResponses.find((f) => f.blockType === 'signature')

          return {
            label: r.label ?? r.status_slug ?? 'Step',
            statusSlug: r.status_slug ?? '',
            reviewer: reviewerTokens
              .map((t) => t.email)
              .filter(Boolean)
              .join(', '),
            response: r.response ?? 'pending',
            reviewedAt: r.reviewed_at ?? undefined,
            reviewedBy: r.reviewed_by ?? undefined,
            customFieldResponses: fieldResponses
              .filter((f) => f.blockType !== 'signature' && f.blockType !== 'file')
              .map((f) => ({ name: f.name, label: f.label, value: f.value })),
            attachments: [],
            signature: signatureEntry ? (signatureEntry.value as string) : undefined,
            reviewerTokens: reviewerTokens.length > 1 ? reviewerTokens.map((t) => ({
              email: t.email,
              response: t.response,
              reviewedAt: t.reviewed_at,
            })) : undefined,
          }
        })
      }
    }

    return { submission: doc, submissionData, reviews, currentStepSlug, status }
  } catch (error) {
    console.error('Error fetching workflow submission detail:', error)
    return null
  }
}

/**
 * Export workflow submissions to a CSV format.
 * NOTE: Per-row relation resolution (via enrichSubmissionData) is not batched across the export.
 * This has the same performance posture as fetchWorkflowSubmissions and is acceptable at realistic
 * submission volumes. If this ever needs to scale, the fix would be batching the relation lookups
 * by collection across all rows before building the CSV.
 */
export async function exportWorkflowSubmissionsToCSV(
  userId: string,
  formId?: string,
  status?: string,
  startDate?: string,
  endDate?: string,
): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    const payload = await getPayload({ config })

    const result = await fetchWorkflowSubmissions(userId, {
      formId,
      status,
      startDate,
      endDate,
      page: 1,
      limit: 10000,
    })

    if (result.docs.length === 0) {
      return { success: false, error: 'No submissions found to export' }
    }

    const dynamicColumns = new Set<string>()
    const fieldMapping: Record<string, string> = {}

    // Process all rows to find dynamic columns and resolve field values
    const processedRows = await Promise.all(
      result.docs.map(async (row) => {
        const formFields = row.submission.form?.fields || []
        const enrichedData = await enrichSubmissionData(
          payload,
          row.submission.submissionData ?? [],
          formFields,
        )

        const dynamicData: Record<string, string> = {}

        enrichedData.forEach((d) => {
          dynamicColumns.add(d.field)
          if (!fieldMapping[d.field]) {
            fieldMapping[d.field] = d.label || d.field.split('.').pop() || d.field
          }

          if (d.type === 'file') {
            dynamicData[d.field] = d.url || ''
          } else {
            dynamicData[d.field] = d.value || ''
          }
        })

        return {
          row,
          dynamicData,
        }
      }),
    )

    const fixedColumns = [
      'ID',
      'Form',
      'Submitted By',
      'Submitted At',
      'Status',
      'Current Step',
      'Progress',
      'Operator',
      'Version',
    ]
    const columns = [...fixedColumns, ...Array.from(dynamicColumns)]

    const headerRow = columns
      .map((col) => {
        const label = fixedColumns.includes(col) ? col : fieldMapping[col] || col.replace(/_/g, ' ')
        return `"${label.replace(/"/g, '""')}"`
      })
      .join(',')

    const dataRows = processedRows.map(({ row, dynamicData }) => {
      const csvRow: Record<string, string> = {
        ID: row.id,
        Form: row.formTitle,
        'Submitted By': row.submittedBy || 'N/A',
        'Submitted At': new Date(row.submittedAt).toISOString(),
        Status: row.status,
        'Current Step': row.currentStepLabel || '',
        Progress: `${row.completedSteps}/${row.totalSteps}`,
        Operator: row.operator || '',
        Version: row.version,
      }

      // Add dynamic fields
      Object.assign(csvRow, dynamicData)

      return columns
        .map((col) => {
          const val = csvRow[col] || ''
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(',')
    })

    const csvContent = [headerRow, ...dataRows].join('\n')
    return { success: true, csv: csvContent }
  } catch (error) {
    console.error('Error exporting workflow CSV:', error)
    return { success: false, error: (error as Error).message }
  }
}
