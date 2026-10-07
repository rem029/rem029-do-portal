'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { User, Form } from '@/payload-types'
import { format } from 'date-fns'
import { hasUserAccess } from '@/utilities/access'

export interface FieldMetadata {
  label: string
  type: string
}

export interface FormSubmissionRow {
  id: string
  formId: string
  formTitle: string
  submittedBy: string
  submittedAt: string
  workflowStatus: string | null
  formStatus: string | null
  enableFormStatus: boolean
  formStatuses: { label: string; value: string }[]
  submissionData?: {
    field: string
    value: string
    label: string
    type: string
    parentField?: string
    parentLabel?: string
    options?: { label: string; value: string }[]
    relationTo?: string
    url?: string
    filename?: string
    mimeType?: string
  }[]
  canUpdate?: boolean
  canDelete?: boolean
  formSlug?: string
  enablePublicSubmissionLink?: boolean
  enableWorkflow?: boolean
  isArchived: boolean
}

export type FormOption = Form & {
  label: string
  value: string
  canUpdate?: boolean
  canDelete?: boolean
}

export type SubmissionStatusFilter = 'active' | 'archived' | 'all'

/**
 * Robustly finds the field configuration within a form's field blocks.
 * Handles dot notation and numerical indices for nested groups, lists, conditionals, and multi-step.
 */
function findFieldConfig(fieldsList: any[], fieldName: string): any {
  if (!fieldsList || !Array.isArray(fieldsList)) return null

  for (const field of fieldsList) {
    if (!field) continue

    // Direct match
    if ('name' in field && field.name === fieldName) return field

    // Handle nested Group blocks
    if (field.blockType === 'group' && field.fields && fieldName.startsWith(`${field.name}.`)) {
      return findFieldConfig(field.fields, fieldName.split('.').slice(1).join('.'))
    }

    // Handle nested List blocks (parent.0.child)
    if (field.blockType === 'list' && field.fields && fieldName.startsWith(`${field.name}.`)) {
      const parts = fieldName.split('.')
      if (parts.length === 1) return field
      if (parts.length > 2 && !isNaN(Number(parts[1]))) {
        return findFieldConfig(field.fields, parts.slice(2).join('.'))
      }
      return findFieldConfig(field.fields, parts.slice(1).join('.'))
    }

    // Handle conditional blocks (fields nested inside without a name wrapper)
    if (field.blockType === 'conditional' && field.fields) {
      const found = findFieldConfig(field.fields, fieldName)
      if (found) return found
    }

    // Handle multi-step blocks (fields nested inside steps[].fields)
    if (field.blockType === 'multi-step' && field.steps) {
      for (const step of field.steps) {
        const found = findFieldConfig(step.fields || [], fieldName)
        if (found) return found
      }
    }
  }

  return null
}

// Strip numeric indices from a submission field path so it can match form-definition paths.
// "items.0.photo" → "items.photo"
function normaliseFieldPath(path: string): string {
  return path.replace(/\.(\d+)\./g, '.').replace(/\.(\d+)$/, '')
}

// Collect all paths of file-typed fields from a form definition.
function collectFileFieldPaths(fields: any[], prefix = ''): Set<string> {
  const paths = new Set<string>()
  for (const field of fields || []) {
    const name: string = field.name || ''
    const fullPath = prefix ? (name ? `${prefix}.${name}` : prefix) : name

    switch (field.blockType) {
      case 'file':
        if (fullPath) paths.add(fullPath)
        break
      case 'group':
      case 'conditional':
        collectFileFieldPaths(field.fields || [], fullPath).forEach((p) => paths.add(p))
        break
      case 'list':
        collectFileFieldPaths(field.fields || [], fullPath).forEach((p) => paths.add(p))
        break
      case 'multi-step':
        for (const step of field.steps || []) {
          collectFileFieldPaths(step.fields || [], prefix).forEach((p) => paths.add(p))
        }
        break
    }
  }
  return paths
}

/**
 * Fetch all forms that the current user is allowed to see in the dashboard.
 */
export async function fetchAccessibleForms(userId: string): Promise<FormOption[]> {
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

    const accessible: FormOption[] = []

    for (const form of formsResult.docs as Form[]) {
      const accessSlug = `form-submission-${form.slug}`

      if (hasUserAccess(user, accessSlug, 'read')) {
        accessible.push({
          ...form,
          label: form.title,
          value: form.id,
          canUpdate: hasUserAccess(user, accessSlug, 'update'),
          canDelete: hasUserAccess(user, accessSlug, 'delete'),
        })
      }
    }

    return accessible
  } catch (error) {
    console.error('Error fetching accessible forms:', error)
    return []
  }
}

/**
 * Fetch form submissions for a given form (or all accessible forms if no formId provided).
 */
export async function fetchFormSubmissions(
  userId: string,
  formId?: string,
  page = 1,
  limit = 20,
  startDate?: string,
  endDate?: string,
  searchQuery?: string,
  statusFilter: SubmissionStatusFilter = 'active',
): Promise<{
  docs: FormSubmissionRow[]
  totalDocs: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
}> {
  try {
    const payload = await getPayload({ config })

    const accessibleForms = await fetchAccessibleForms(userId)
    const accessibleFormIds = accessibleForms.map((f) => f.value)

    if (accessibleFormIds.length === 0) {
      return { docs: [], totalDocs: 0, totalPages: 0, hasPrevPage: false, hasNextPage: false }
    }

    const where: any =
      formId && accessibleFormIds.includes(formId)
        ? { form: { equals: formId } }
        : { form: { in: accessibleFormIds } }

    if (startDate || endDate) {
      const createdAt: any = {}
      if (startDate) createdAt.greater_than_equal = new Date(startDate).toISOString()
      if (endDate) {
        const d = new Date(endDate)
        d.setHours(23, 59, 59, 999)
        createdAt.less_than_equal = d.toISOString()
      }
      where.createdAt = createdAt
    }

    if (statusFilter === 'active') {
      where.is_archived = { not_equals: true }
    } else if (statusFilter === 'archived') {
      where.is_archived = { equals: true }
    }

    if (searchQuery?.trim()) {
      const q = searchQuery.trim()
      where.or = [
        { 'submissionData.value': { contains: q } },
        { 'created_by.full_name': { contains: q } },
        { 'created_by.email': { contains: q } },
      ]
    }

    const result = await payload.find({
      collection: 'form-submissions',
      where,
      limit,
      page,
      depth: 1,
      sort: '-createdAt',
      overrideAccess: true,
    })

    const formMap: Record<string, FormOption> = {}
    for (const f of accessibleForms) {
      formMap[f.value] = f
    }

    // Process rows asynchronously to handle potential media database fetches
    const rows: FormSubmissionRow[] = await Promise.all(
      result.docs.map(async (doc) => {
        const rawDoc = doc as typeof doc & {
          form?: string | { id: string }
          created_by?: string | User | null
          workflow_status?: string | null
          submissionData?: { field: string; value: string }[] | null
          is_archived?: boolean | null
        }
        const docFormId =
          typeof rawDoc.form === 'object' && rawDoc.form !== null
            ? rawDoc.form.id
            : (rawDoc.form ?? '')

        const formConfig = formMap[docFormId]
        const formFields = formConfig?.fields || []

        // Collect all file-field paths for this form using the definition as source of truth.
        // This handles multi-step, group, list, and conditional nesting correctly.
        const fileFieldPaths = collectFileFieldPaths(formFields as any[])

        let submittedBy = 'N/A'
        if (typeof rawDoc.created_by === 'object' && rawDoc.created_by !== null) {
          submittedBy = rawDoc.created_by.full_name || rawDoc.created_by.email || 'N/A'
        } else if (typeof rawDoc.created_by === 'string') {
          submittedBy = rawDoc.created_by
        }

        // Resolve metadata and files asynchronously for each submission item
        const submissionData = await Promise.all(
          (rawDoc.submissionData || []).map(async (item) => {
            const fieldCfg = findFieldConfig(formFields, item.field)
            const type = fieldCfg?.blockType || fieldCfg?.type || 'text'

            let parentField: string | undefined
            let parentLabel: string | undefined
            let resolvedUrl: string | undefined

            const parts = item.field.split('.')
            if (parts.length > 1) {
              parentField = parts[0]
              const parentCfg = findFieldConfig(formFields, parentField)
              parentLabel = parentCfg?.label || parentField.replace(/_/g, ' ')
            }

            // Resolve media for file fields. Use collectFileFieldPaths (not findFieldConfig blockType)
            // so that fields nested inside multi-step blocks are correctly identified.
            const isFileField = fileFieldPaths.has(normaliseFieldPath(item.field))
            let resolvedFilename: string | undefined
            let resolvedMimeType: string | undefined

            if (isFileField && item.value) {
              try {
                const mediaDoc = (await payload.findByID({
                  collection: 'forms-media',
                  id: item.value,
                  depth: 0,
                  overrideAccess: true,
                })) as any

                if (mediaDoc) {
                  resolvedUrl = mediaDoc.url || undefined
                  resolvedFilename = mediaDoc.filename || undefined
                  resolvedMimeType = mediaDoc.mimeType || undefined
                }
              } catch (_) {
                // Not a valid media ID — leave url/filename/mimeType undefined
              }
            }

            // Dynamically build selection options if applicable
            let options = fieldCfg?.options
            const blockType = fieldCfg?.blockType

            if (blockType === 'select-operators') {
              if (fieldCfg?.add_all) {
                const res = await payload.find({
                  collection: 'operators',
                  limit: 1000,
                  depth: 0,
                  overrideAccess: true,
                })
                options = res.docs.map((d: any) => ({
                  label: d.title || d.name || d.id,
                  value: d.id,
                }))
              } else if (Array.isArray(fieldCfg?.selected_items)) {
                const ids = fieldCfg.selected_items.map((i: any) =>
                  typeof i === 'string' ? i : i.id,
                )
                const res = await payload.find({
                  collection: 'operators',
                  where: { id: { in: ids } },
                  limit: 1000,
                  depth: 0,
                  overrideAccess: true,
                })
                options = res.docs.map((d: any) => ({
                  label: d.title || d.name || d.id,
                  value: d.id,
                }))
              }
            } else if (blockType === 'select-restaurants') {
              if (fieldCfg?.add_all) {
                const res = await payload.find({
                  collection: 'restaurants',
                  limit: 1000,
                  depth: 0,
                  overrideAccess: true,
                })
                options = res.docs.map((d: any) => ({
                  label: d.title || d.name || d.id,
                  value: d.id,
                }))
              } else if (Array.isArray(fieldCfg?.selected_items)) {
                const ids = fieldCfg.selected_items.map((i: any) =>
                  typeof i === 'string' ? i : i.id,
                )
                const res = await payload.find({
                  collection: 'restaurants',
                  where: { id: { in: ids } },
                  limit: 1000,
                  depth: 0,
                  overrideAccess: true,
                })
                options = res.docs.map((d: any) => ({
                  label: d.title || d.name || d.id,
                  value: d.id,
                }))
              }
            }

            return {
              ...item,
              label: fieldCfg?.label || item.field.split('.').pop() || item.field,
              type: isFileField ? 'file' : type,
              parentField,
              parentLabel,
              url: resolvedUrl,
              filename: resolvedFilename,
              mimeType: resolvedMimeType,
              options,
              relationTo: fieldCfg?.relationTo,
            }
          }),
        )

        return {
          id: doc.id,
          formId: docFormId,
          formTitle: formConfig?.label || 'Unknown Form',
          submittedBy,
          submittedAt: doc.createdAt,
          workflowStatus: rawDoc.workflow_status || null,
          formStatus: (rawDoc as any).form_status || null,
          enableFormStatus: formConfig?.enable_form_status || false,
          formStatuses: formConfig?.form_statuses || [],
          submissionData,
          canUpdate: formConfig?.canUpdate || false,
          canDelete: formConfig?.canDelete || false,
          formSlug: formConfig?.slug,
          enablePublicSubmissionLink: formConfig?.enable_public_submission_link || false,
          enableWorkflow: formConfig?.enable_workflow || false,
          isArchived: rawDoc.is_archived || false,
        }
      }),
    )

    return {
      docs: rows,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
    }
  } catch (error) {
    console.error('Error fetching form submissions:', error)
    return { docs: [], totalDocs: 0, totalPages: 0, hasPrevPage: false, hasNextPage: false }
  }
}

/**
 * Export form submissions to a CSV format.
 */
export async function exportSubmissionsToCSV(
  userId: string,
  formId?: string,
  startDate?: string,
  endDate?: string,
  includeArchived = false,
): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    const payload = await getPayload({ config })

    const accessibleForms = await fetchAccessibleForms(userId)
    const accessibleFormIds = accessibleForms.map((f) => f.value)

    if (accessibleFormIds.length === 0) {
      return { success: false, error: 'No accessible forms found' }
    }

    const where: any =
      formId && accessibleFormIds.includes(formId)
        ? { form: { equals: formId } }
        : { form: { in: accessibleFormIds } }

    if (startDate || endDate) {
      const createdAt: any = {}
      if (startDate) createdAt.greater_than_equal = new Date(startDate).toISOString()
      if (endDate) {
        const d = new Date(endDate)
        d.setHours(23, 59, 59, 999)
        createdAt.less_than_equal = d.toISOString()
      }
      where.createdAt = createdAt
    }

    if (!includeArchived) {
      where.is_archived = { not_equals: true }
    }

    const result = await payload.find({
      collection: 'form-submissions',
      where,
      limit: 10000,
      depth: 1,
      sort: '-createdAt',
      overrideAccess: true,
    })

    const formMap: Record<string, FormOption> = {}
    for (const f of accessibleForms) {
      formMap[f.value] = f
    }

    const dynamicColumns = new Set<string>()
    const fieldMapping: Record<string, string> = {}

    result.docs.forEach((doc: any) => {
      const docFormId = typeof doc.form === 'object' ? doc.form.id : doc.form
      const formFields = formMap[docFormId]?.fields || []

      doc.submissionData?.forEach((d: any) => {
        dynamicColumns.add(d.field)
        if (!fieldMapping[d.field]) {
          const cfg = findFieldConfig(formFields, d.field)
          fieldMapping[d.field] = cfg?.label || d.field.split('.').pop() || d.field
        }
      })
    })

    const columns = [
      'ID',
      'Form',
      'Submitted By',
      'Submitted At',
      'Archived',
      ...Array.from(dynamicColumns),
    ]

    const headerRow = columns
      .map((col) => {
        const label = fieldMapping[col] || col.replace(/_/g, ' ')
        return `"${label.replace(/"/g, '""')}"`
      })
      .join(',')

    const dataRows = result.docs.map((doc: any) => {
      const row: Record<string, string> = {
        ID: doc.id,
        Form: typeof doc.form === 'object' ? doc.form.title : 'Unknown',
        'Submitted By': doc.created_by?.full_name || doc.created_by?.email || 'N/A',
        'Submitted At': format(new Date(doc.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        Archived: doc.is_archived ? 'Yes' : 'No',
      }
      doc.submissionData?.forEach((d: any) => {
        row[d.field] = d.value
      })

      return columns
        .map((col) => {
          const val = row[col] || ''
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(',')
    })

    const csvContent = [headerRow, ...dataRows].join('\n')
    return { success: true, csv: csvContent }
  } catch (error) {
    console.error('Error exporting CSV:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Update submission status.
 */
export async function updateSubmissionStatus(
  userId: string,
  submissionId: string,
  newStatus: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })

    const user = (await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 1,
      overrideAccess: true,
    })) as User

    if (!user) return { success: false, error: 'User not found' }

    const submission = await payload.findByID({
      collection: 'form-submissions',
      id: submissionId,
      depth: 0,
      overrideAccess: true,
    })

    if (!submission) return { success: false, error: 'Submission not found' }

    const formId =
      typeof submission.form === 'object' && submission.form !== null
        ? submission.form.id
        : submission.form

    if (!formId) return { success: false, error: 'Associated form not found' }

    const form = (await payload.findByID({
      collection: 'forms',
      id: formId as string,
      depth: 0,
      overrideAccess: true,
    })) as Form

    if (!form) return { success: false, error: 'Associated form not found' }

    let allowedToUpdate = false
    if (user.super_user) {
      allowedToUpdate = true
    } else {
      if (form.requires_auth && form.required_access) {
        const userAccess = user.access as any[] | null
        if (userAccess && Array.isArray(userAccess)) {
          allowedToUpdate = userAccess.some(
            (a) => a.slug === form.required_access && a.super_user === true,
          )
        }
      } else {
        allowedToUpdate = hasUserAccess(user, `form-submission-${form.slug}`, 'update')
      }
    }

    if (!allowedToUpdate) {
      return { success: false, error: 'Unauthorized to update status for this form' }
    }

    await payload.update({
      collection: 'form-submissions',
      id: submissionId,
      data: {
        form_status: newStatus,
      },
      overrideAccess: true,
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating submission status:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Update submission data array items.
 */
export async function updateSubmissionData(
  userId: string,
  submissionId: string,
  updatedData: any[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })

    const user = (await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 1,
      overrideAccess: true,
    })) as User

    if (!user) return { success: false, error: 'User not found' }

    const submission = await payload.findByID({
      collection: 'form-submissions',
      id: submissionId,
      depth: 0,
      overrideAccess: true,
    })

    if (!submission) return { success: false, error: 'Submission not found' }

    const formId =
      typeof submission.form === 'object' && submission.form !== null
        ? submission.form.id
        : submission.form

    if (!formId) return { success: false, error: 'Associated form not found' }

    const form = (await payload.findByID({
      collection: 'forms',
      id: formId as string,
      depth: 0,
      overrideAccess: true,
    })) as Form

    if (!form) return { success: false, error: 'Associated form not found' }

    let allowedToUpdate = false
    if (user.super_user) {
      allowedToUpdate = true
    } else {
      if (form.requires_auth && form.required_access) {
        const userAccess = user.access as any[] | null
        if (userAccess && Array.isArray(userAccess)) {
          allowedToUpdate = userAccess.some(
            (a) => a.slug === form.required_access && a.super_user === true,
          )
        }
      } else {
        allowedToUpdate = hasUserAccess(user, `form-submission-${form.slug}`, 'update')
      }
    }

    if (!allowedToUpdate) {
      return { success: false, error: 'Unauthorized to update this form submission' }
    }

    await payload.update({
      collection: 'form-submissions',
      id: submissionId,
      data: {
        submissionData: updatedData,
      },
      overrideAccess: true,
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating submission data:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Archive or unarchive a submission. Requires delete access on the submission's form.
 */
export async function archiveSubmission(
  userId: string,
  submissionId: string,
  archived: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })

    const user = (await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 1,
      overrideAccess: true,
    })) as User

    if (!user) return { success: false, error: 'User not found' }

    const submission = await payload.findByID({
      collection: 'form-submissions',
      id: submissionId,
      depth: 0,
      overrideAccess: true,
    })

    if (!submission) return { success: false, error: 'Submission not found' }

    const formId =
      typeof submission.form === 'object' && submission.form !== null
        ? submission.form.id
        : submission.form

    if (!formId) return { success: false, error: 'Associated form not found' }

    const form = (await payload.findByID({
      collection: 'forms',
      id: formId as string,
      depth: 0,
      overrideAccess: true,
    })) as Form

    if (!form) return { success: false, error: 'Associated form not found' }

    let allowedToDelete = false
    if (user.super_user) {
      allowedToDelete = true
    } else if (form.requires_auth && form.required_access) {
      const userAccess = user.access as any[] | null
      if (userAccess && Array.isArray(userAccess)) {
        allowedToDelete = userAccess.some(
          (a) => a.slug === form.required_access && a.super_user === true,
        )
      }
    } else {
      allowedToDelete = hasUserAccess(user, `form-submission-${form.slug}`, 'delete')
    }

    if (!allowedToDelete) {
      return {
        success: false,
        error: `Unauthorized to ${archived ? 'archive' : 'unarchive'} this form submission`,
      }
    }

    await payload.update({
      collection: 'form-submissions',
      id: submissionId,
      data: {
        is_archived: archived,
      },
      overrideAccess: true,
    })

    return { success: true }
  } catch (error) {
    console.error('Error archiving submission:', error)
    return { success: false, error: (error as Error).message }
  }
}
