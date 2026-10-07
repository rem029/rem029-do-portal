import { CollectionAfterChangeHook } from 'payload'
import { createWorkflowInstance } from '@/utilities/workflow-instance'
import { RequestContext } from '@/context-types'

export const workflowV2Init: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation !== 'create') return doc

  const context = req.context as RequestContext
  if (!context.form?.useWorkflowV2 || !context.form?.workflowSlug) return doc

  try {
    await createWorkflowInstance(req, {
      workflowV2Slug: context.form.workflowSlug,
      operatorId: context.form.operator,
      documentCollection: 'form-submissions',
      documentId: String(doc.id),
    })
  } catch (err) {
    req.payload.logger.error(
      `[workflowV2Init] Failed to create workflow instance for submission ${doc.id}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  return doc
}
