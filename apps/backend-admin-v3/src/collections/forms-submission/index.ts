import { accessCheckResolver, AccessAdmin } from '@/utilities/access'
import { FieldsOverride } from 'node_modules/@payloadcms/plugin-form-builder/dist/types'
import { CollectionConfig, PayloadRequest } from 'payload'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { WorkflowFormsFields } from '@/common/fields/workflow-forms'
import { workflowInit } from '@/common/hooks/workflow-init'
import { workflowUpdate } from '@/common/hooks/workflow-update'
import { workflowNotification } from '@/common/hooks/workflow-notification'
import { formSubmissionWorkflowPrepare } from './hooks/workflow-prepare'
import { notifyCreatorOnSubmit } from './hooks/notify-creator'
import { workflowV2Init } from './hooks/workflow-v2-init'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { generateEmailHtml } from '@/utilities/email-generator'
import { getCollectionConfig } from '@/utilities/collection-meta'
import { mapReviewsToHistory } from '../public/letters/_template'
import { Form, FormSubmission } from '@/payload-types'
import setDefaultFormStatus from './hooks/set-default-form-status'
import { RequestContext, FormContext } from '@/context-types'

const SLUG = 'form-submissions'

/** Resolves the form title from a FormSubmission doc for email notifications. */
async function getFormTitle(doc: FormSubmission, req: PayloadRequest): Promise<string> {
  const formId = typeof doc.form === 'string' ? doc.form : (doc.form as Form)?.id
  if (!formId) return 'Form Submission'
  try {
    const form = (await req.payload.findByID({
      collection: 'forms',
      id: formId,
      overrideAccess: true,
    })) as Form
    return form?.title || 'Form Submission'
  } catch {
    return 'Form Submission'
  }
}

/** Maps form submission data to a flat list of { label, value } for emails. */
async function getSubmissionEmailFields(
  doc: FormSubmission,
  req: PayloadRequest,
): Promise<{ label: string; value: string }[]> {
  const config = getCollectionConfig(SLUG)
  const baseEmailFields = (config?.displayFields || []).map((f) => ({
    label: f.label,
    value: (doc as any)[f.path],
  }))

  const formId = typeof doc.form === 'object' ? (doc.form as Form).id : doc.form
  let form: Form | null = null
  if (formId) {
    try {
      form = (await req.payload.findByID({
        collection: 'forms',
        id: formId,
        depth: 0,
        overrideAccess: true,
      })) as Form
    } catch {
      // ignore
    }
  }

  const formFields: any[] = (form?.fields as any[]) || []

  const findFieldConfig = (fieldsList: any[], fieldName: string): any => {
    for (const field of fieldsList) {
      if (field.blockType === 'group' && field.fields && fieldName.startsWith(`${field.name}.`)) {
        return findFieldConfig(field.fields, fieldName.split('.').slice(1).join('.'))
      }
      if (field.blockType === 'list' && field.fields && fieldName.startsWith(`${field.name}.`)) {
        return findFieldConfig(field.fields, fieldName.split('.').slice(2).join('.'))
      }
      if ('name' in field && field.name === fieldName) return field
    }
    return null
  }

  const findListConfig = (listName: string): any =>
    formFields.find((f) => f.blockType === 'list' && f.name === listName) || null

  const findGroupConfig = (groupName: string): any =>
    formFields.find((f) => f.blockType === 'group' && f.name === groupName) || null

  const seenGroups = new Set<string>()
  const submissionFields: { label: string; value: string }[] = []

  for (const item of doc.submissionData || []) {
    const match = /^([^.]+)\.(\d+)\..+$/.exec(item.field)
    if (match && findListConfig(match[1])) {
      const listName = match[1]
      const index = Number(match[2])
      const groupKey = `list.${listName}.${index}`

      if (!seenGroups.has(groupKey)) {
        seenGroups.add(groupKey)
        const listConfig = findListConfig(listName)
        const listLabel: string = listConfig?.label || listName
        submissionFields.push({
          label: `<span style="font-size: 15px; font-weight: bold;">— ${listLabel} #${index + 1}</span>`,
          value: '',
        })
      }

      const cfg = findFieldConfig(formFields, item.field)
      const fieldLabel = cfg?.label || item.field.split('.').pop() || item.field
      let value = item.value

      if (cfg?.blockType === 'file' && item.value) {
        try {
          const media = (await req.payload.findByID({
            collection: 'forms-media',
            id: item.value,
            overrideAccess: true,
          })) as any
          if (media) value = `<a href="${media.url}" target="_blank">${media.filename}</a>`
        } catch (e) {
          req.payload.logger.error(`Error fetching media for email: ${e}`)
        }
      }

      submissionFields.push({ label: `  ${fieldLabel}`, value })
    } else if (item.field.includes('.')) {
      const groupName = item.field.split('.')[0]
      const groupKey = `group.${groupName}`

      if (!seenGroups.has(groupKey)) {
        seenGroups.add(groupKey)
        const groupConfig = findGroupConfig(groupName)
        const groupLabel: string = groupConfig?.label || groupName
        submissionFields.push({
          label: `<span style="font-size: 15px; font-weight: bold; margin-top: 8px;">— ${groupLabel}</span>`,
          value: '',
        })
      }

      const cfg = findFieldConfig(formFields, item.field)
      const fieldLabel = cfg?.label || item.field.split('.').pop() || item.field
      let value = item.value

      if (cfg?.blockType === 'file' && item.value) {
        try {
          const media = (await req.payload.findByID({
            collection: 'forms-media',
            id: item.value,
            overrideAccess: true,
          })) as any
          if (media) value = `<a href="${media.url}" target="_blank">${media.filename}</a>`
        } catch (e) {
          req.payload.logger.error(`Error fetching media for email: ${e}`)
        }
      }

      submissionFields.push({ label: `  ${fieldLabel}`, value })
    } else {
      const cfg = findFieldConfig(formFields, item.field)
      const label = cfg?.label || item.field
      let value = item.value

      if (cfg?.blockType === 'file' && item.value) {
        try {
          const media = (await req.payload.findByID({
            collection: 'forms-media',
            id: item.value,
            overrideAccess: true,
          })) as any
          if (media) value = `<a href="${media.url}" target="_blank">${media.filename}</a>`
        } catch (e) {
          req.payload.logger.error(`Error fetching media for email: ${e}`)
        }
      }

      submissionFields.push({ label, value })
    }
  }
  return [...baseEmailFields, ...submissionFields]
}

export const FormSubmissionsOverrides: {
  fields?: FieldsOverride
} & Partial<Omit<CollectionConfig, 'fields'>> = {
  slug: SLUG,
  labels: { plural: 'Submissions', singular: 'Submission' },
  admin: {
    group: 'Forms',
    useAsTitle: 'id',
  },
  fields: ({ defaultFields }) => [
    {
      type: 'ui',
      name: 'frontend_url_preview',
      admin: {
        components: {
          Field: {
            path: '@/common/components/frontend-url-preview',
            clientProps: {
              pathPrefix: '/forms/submissions',
              label: 'Submission Review URL',
              includeCollectionSlug: false,
            },
          },
        },
      },
    },
    ...defaultFields,
    ...WorkflowFormsFields(SLUG as any),
    {
      name: 'form_status',
      type: 'text',
      label: 'Form Status',
      admin: {
        position: 'sidebar',
      },
      access: {
        update: async ({ req, doc, data }) => {
          const user = req.user as any
          if (!user) return false
          if (user.super_user) return true

          const formId = typeof doc?.form === 'object' ? doc?.form?.id : doc?.form || data?.form
          if (!formId) return true

          try {
            const form = await req.payload.findByID({
              collection: 'forms',
              id: formId,
              depth: 0,
              overrideAccess: true,
            })
            if (!form) return true

            if (form.requires_auth && form.required_access) {
              const userAccess = user.access as any[] | null
              if (!userAccess || !Array.isArray(userAccess)) return false
              return userAccess.some(
                (a) => a.slug === form.required_access && a.super_user === true,
              )
            }
            return true
          } catch (e) {
            return false
          }
        },
      },
    },
    {
      name: 'previous_submission',
      type: 'relationship',
      relationTo: SLUG,
      label: 'Previous Submission',
      admin: {
        position: 'sidebar',
        description:
          'If this is a resubmission, the original rejected submission will be linked here.',
        readOnly: true,
        condition: (data) => !!data?.previous_submission,
      },
    },
    {
      name: 'is_archived',
      type: 'checkbox',
      label: 'Archived',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Archived submissions are hidden from the dashboard by default.',
      },
    },
    {
      name: 'survey_code',
      type: 'text',
      label: 'Survey Code',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.survey_code),
      },
    },
    CreatedByField,
    UpdatedByField,
  ],

  access: {
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: false,
    }) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: false,
    }),
    create: accessCheckResolver(SLUG, 'create', {
      fallbackAccess: false,
    }),
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: false,
    }),
    delete: accessCheckResolver(SLUG, 'delete', {
      fallbackAccess: false,
    }),
  },
  hooks: {
    beforeChange: [
      setDefaultFormStatus,
      setUserCreatedOrUpdatedByCollection,
      formSubmissionWorkflowPrepare,
      workflowInit({
        getWorkflowSlug: async (req) => {
          return (req.context as RequestContext).form?.workflowSlug || ''
        },
        getOperator: async (req) => {
          return (req.context as RequestContext).form?.operator
        },
      }),
      workflowUpdate,
    ],
    afterChange: [
      notifyCreatorOnSubmit,
      workflowV2Init,
      workflowNotification<FormSubmission>({
        getWorkflowSlug: async (req, doc) => {
          const formId = typeof doc.form === 'object' ? (doc.form as Form).id : doc.form
          if (!formId) return undefined
          try {
            const form = (await req.payload.findByID({
              collection: 'forms',
              id: formId,
              depth: 0,
              overrideAccess: true,
              req,
            })) as Form
            return form?.workflow_slug || undefined
          } catch {
            return undefined
          }
        },
        onInReview: async (
          req,
          reviewerEmail,
          _createdByEmail,
          doc,
          docId,
          additionalRecipients,
          response,
          comments,
          approverType,
          emailSettings,
          attachments,
          latestCustomFieldValues,
          previousStepSlug,
        ) => {
          const serverURL = BACKEND_URL_WITH_BASE
          const formTitle = await getFormTitle(doc, req)

          const currentReview = doc.workflow_reviews?.find(
            (r: any) => r.reviewer === reviewerEmail && r.status_slug === doc._workflow_status,
          )
          const token = currentReview?.token

          const frontendUrl = `${serverURL}/forms/submissions/${docId}`
          const accessUrl = token ? `${frontendUrl}?token=${token}` : frontendUrl

          const emailFields = await getSubmissionEmailFields(doc, req)
          const history = await mapReviewsToHistory(doc.workflow_reviews || [], req, serverURL)

          const actionButtons = emailSettings?.hideEmailActions
            ? []
            : [
                {
                  label: 'View Submission',
                  url: accessUrl,
                  color: '#059669',
                },
              ]

          const title = `Form Submission: ${formTitle} – ${currentReview?.label}`
          const emailHtml = generateEmailHtml({
            title,
            message: `A new form submission for "${formTitle}" requires your review.`,
            fields: emailFields,
            actionButtons,
            history,
            docId,
            hideHistory: emailSettings?.hideHistory,
            hideDetails: emailSettings?.hideDetails,
            hideDescription: emailSettings?.hideDescription,
            hideAttachments: emailSettings?.hideAttachments,
            customText: emailSettings?.customText,
            attachments,
            latestCustomFieldValues,
          })

          await req.payload.sendEmail({ to: reviewerEmail, subject: title, html: emailHtml })

          if (additionalRecipients) {
            const previousReview = doc.workflow_reviews?.find(
              (r: any) => r.status_slug === previousStepSlug,
            )
            const prevStepLabel = previousReview?.label || previousStepSlug

            await Promise.all(
              additionalRecipients.map(async (recipient) => {
                const recipientTitle =
                  recipient.reason === 'on_reaching'
                    ? `Form Submission: ${formTitle} - Reached step ${currentReview?.label || 'Notification'}`
                    : `Form Submission: ${formTitle} - ${prevStepLabel || ''} - has been approved`

                const recipientButtons = recipient.settings?.hideEmailActions
                  ? []
                  : [{ label: 'View Submission', url: frontendUrl, color: '#059669' }]

                const recipientHtml = generateEmailHtml({
                  title: recipientTitle,
                  message: '',
                  fields: emailFields,
                  actionButtons: recipientButtons,
                  history,
                  docId,
                  hideHistory: recipient.settings?.hideHistory,
                  hideDetails: recipient.settings?.hideDetails,
                  hideDescription: recipient.settings?.hideDescription,
                  hideAttachments: recipient.settings?.hideAttachments,
                  customText: recipient.settings?.customText,
                  attachments,
                  latestCustomFieldValues,
                })
                return req.payload.sendEmail({
                  to: recipient.email,
                  subject: recipientTitle,
                  html: recipientHtml,
                })
              }),
            )
          }

          req.payload.logger.info(
            `[form-submissions] Review notification sent to ${reviewerEmail} for submission ${docId}`,
          )
        },
        onCompleted: async (
          req,
          createdByEmail,
          doc,
          docId,
          additionalRecipients,
          response,
          comments,
          emailSettings,
          attachments,
          latestCustomFieldValues,
          previousStepSlug,
        ) => {
          const serverURL = BACKEND_URL_WITH_BASE
          const formTitle = await getFormTitle(doc, req)

          const frontendUrl = `${serverURL}/forms/submissions/${docId}`
          const history = await mapReviewsToHistory(doc.workflow_reviews || [], req, serverURL)
          const emailFields = await getSubmissionEmailFields(doc, req)

          if (additionalRecipients) {
            const previousReview = doc.workflow_reviews?.find(
              (r: any) => r.status_slug === previousStepSlug,
            )
            const prevStepLabel = previousReview?.label || previousStepSlug
            const recipientTitle = `Form Submission: ${formTitle} - ${prevStepLabel} - has been approved`

            await Promise.all(
              additionalRecipients.map(async (recipient) => {
                const recipientButtons = recipient.settings?.hideEmailActions
                  ? []
                  : [{ label: 'View Submission', url: frontendUrl, color: '#059669' }]

                const recipientHtml = generateEmailHtml({
                  title: recipientTitle,
                  message: '',
                  fields: emailFields,
                  actionButtons: recipientButtons,
                  history,
                  docId,
                  hideHistory: recipient.settings?.hideHistory,
                  hideDetails: recipient.settings?.hideDetails,
                  hideDescription: recipient.settings?.hideDescription,
                  hideAttachments: recipient.settings?.hideAttachments,
                  customText: recipient.settings?.customText,
                  attachments,
                  latestCustomFieldValues,
                })
                return req.payload.sendEmail({
                  to: recipient.email,
                  subject: recipientTitle,
                  html: recipientHtml,
                })
              }),
            )
          }
        },
        onRejected: async (
          req,
          createdByEmail,
          doc,
          docId,
          additionalRecipients,
          response,
          comments,
          emailSettings,
          attachments,
          latestCustomFieldValues,
          previousStepSlug,
        ) => {
          const serverURL = BACKEND_URL_WITH_BASE
          const formTitle = await getFormTitle(doc, req)

          const frontendUrl = `${serverURL}/forms/submissions/${docId}`
          const history = await mapReviewsToHistory(doc.workflow_reviews || [], req, serverURL)
          const emailFields = await getSubmissionEmailFields(doc, req)

          if (additionalRecipients) {
            const previousReview = doc.workflow_reviews?.find(
              (r: any) => r.status_slug === previousStepSlug,
            )
            const prevStepLabel = previousReview?.label || previousStepSlug
            const recipientTitle = `Form Submission: ${formTitle} - ${prevStepLabel} - has been rejected`

            await Promise.all(
              additionalRecipients.map(async (recipient) => {
                const recipientButtons = recipient.settings?.hideEmailActions
                  ? []
                  : [{ label: 'View & Resubmit', url: frontendUrl, color: '#dc2626' }]

                const recipientHtml = generateEmailHtml({
                  title: recipientTitle,
                  message: '',
                  fields: emailFields,
                  actionButtons: recipientButtons,
                  history,
                  docId,
                  hideHistory: recipient.settings?.hideHistory,
                  hideDetails: recipient.settings?.hideDetails,
                  hideDescription: recipient.settings?.hideDescription,
                  hideAttachments: recipient.settings?.hideAttachments,
                  customText: recipient.settings?.customText,
                  attachments,
                  latestCustomFieldValues,
                })
                return req.payload.sendEmail({
                  to: recipient.email,
                  subject: recipientTitle,
                  html: recipientHtml,
                })
              }),
            )
          }
        },
      }),
      auditLogAfterChange(SLUG),
    ],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}
