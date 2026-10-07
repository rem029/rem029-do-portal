import { Form } from '@/payload-types'
import { APIError, CollectionBeforeChangeHook } from 'payload'
import { RequestContext, FormContext } from '@/context-types'

/**
 * Checks the parent form configuration and, when workflow is enabled,
 * prepares the submission data so that workflowInit is triggered.
 *
 * The workflow slug from the parent form is stored in req.context so that
 * the workflowInit `getWorkflowSlug` callback can retrieve it without
 * needing a separate settings global.
 */
export const formSubmissionWorkflowPrepare: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create') return data

  const formId = typeof data.form === 'string' ? data.form : (data.form as any)?.id
  if (!formId) return data

  const form = (await req.payload.findByID({
    collection: 'forms',
    id: formId,
    overrideAccess: true,
    req,
  })) as Form

  // Applies to every submission, not just workflow ones — anonymous public/survey submitters have
  // no operator of their own, and workflow V2 never writes `operator` back onto the submission.
  if (form?.override_user_operator && form.operator) {
    data.operator = typeof form.operator === 'object' ? form.operator.id : form.operator
  }

  if (!form?.enable_workflow || !form?.workflow_slug) {
    // Explicitly clear workflow status to prevent triggering workflowInit
    data.workflow_status = null
    data._workflow_status = null
    return data
  }

  if (form?.requires_auth && !req.user) {
    throw new APIError('Authentication is required to submit this form.', 401)
  }

  const context = req.context as RequestContext
  if (!context.form) context.form = {} as FormContext

  context.form.workflowSlug = form.workflow_slug

  if (form?.override_user_operator && form.operator) {
    context.form.operator = data.operator
  }

  // V2 path: store flag in context so the afterChange hook calls createWorkflowInstance.
  // Do NOT set workflow_status = 'draft' — that would trigger the V1 workflowInit beforeChange hook.
  if (form?.use_workflow_v2) {
    context.form.useWorkflowV2 = true
    return data
  }

  // V1 path: set workflow_status to 'draft' so that workflowInit picks it up
  data.workflow_status = 'draft'

  return data
}
