import { RequestContext as PayloadRequestContext } from 'payload'

export interface FormContext {
  workflowSlug?: string
  operator?: string
  useWorkflowV2?: boolean
}

export interface RequestContext extends PayloadRequestContext {
  form?: FormContext
  /** Set to true by workflowInstanceAfterChange when syncing status to the source document.
   *  workflowNotification reads this to avoid double-firing V1 notifications for V2 submissions. */
  workflowV2Sync?: boolean
  /** Set to true when saving notification_tokens back to the workflow-instance to avoid re-triggering the afterChange hook. */
  workflowNotificationSync?: boolean
  /** Set to true by workflowV2AfterChange when syncing pending reviews from an updated blueprint.
   *  Prevents workflowInstanceUpdate (before-change) from treating the sync as a reviewer action. */
  workflowBlueprintSync?: boolean
  /** Set to true when appending event log entries to a workflow instance.
   *  Prevents before-change and after-change hooks from treating the update as a reviewer action. */
  appendingEventLog?: boolean
}
