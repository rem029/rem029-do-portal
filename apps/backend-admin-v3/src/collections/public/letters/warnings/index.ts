import { Department, User, Warning as WarningType } from '@/payload-types'
import {
  BoldFeature,
  FixedToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { generateEmailHtml } from '@/utilities/email-generator'
import { getCollectionConfig } from '@/utilities/collection-meta'
import serviceTemplateConfig, { mapReviewsToHistory } from '../_template'
import { APIError } from 'payload'

const COLLECTION_NAME = 'warnings'

const Warnings = serviceTemplateConfig<any>({
  slug: COLLECTION_NAME,
  settingsSlug: 'warnings-settings',
  labels: { plural: 'Warnings', singular: 'Warning' },
  fields: [
    {
      type: 'text',
      name: 'subject',
      label: 'Subject',
      required: true,
      admin: {
        description: 'Subject line for the warning request',
      },
      access: {
        update: ({ data }) => !data?._workflow_status || data?._workflow_status === 'draft',
      },
    },
    {
      type: 'richText',
      name: 'description',
      label: 'Description',
      required: true,
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          OrderedListFeature(),
          UnorderedListFeature(),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          FixedToolbarFeature(),
        ],
      }),
      admin: {
        description: 'Provide a detailed description for the warning request.',
      },
      access: {
        update: ({ data }) => !data?._workflow_status || data?._workflow_status === 'draft',
      },
    },
    {
      type: 'upload',
      name: 'attachments',
      label: 'Attachments',
      relationTo: 'internal-media',
      admin: {
        description: 'Upload relevant documents for the warning request.',
      },
      filterOptions: ({ data, user }) => {
        if (data?.workflow_status && data?.workflow_status !== 'draft') {
          return true
        }

        if (!user) {
          return false
        }
        return {
          created_by: {
            equals: user.id,
          },
        }
      },
      access: {
        update: ({ data }) => !data?._workflow_status || data?._workflow_status === 'draft',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'wants_to_sign',
          type: 'checkbox',
          label: 'I want to sign this document',
          hidden: true,
          defaultValue: false,
          admin: {
            width: '50%',
          },
          access: {
            update: ({ data }) => !data?._workflow_status || data?._workflow_status === 'draft',
          },
        },
        {
          name: 'requestor_signature',
          type: 'text',
          hidden: true,
        },
      ],
    },
  ],
  listSearchableFields: ['subject', 'description'],
  defaultColumns: ['subject'],
  workflowInitArgs: {
    getWorkflowSlug: async (req, _data) => {
      const settings = await req.payload.findGlobal({
        slug: 'warnings-settings',
        req,
        overrideAccess: true,
      })
      const { workflow_slug } = settings
      return workflow_slug as string
    },
    overrideRequestorDepartment: async (req, _data) => {
      const data = _data as WarningType
      if (data?.override_department === true && data?.employee_department) {
        const department = await req.payload.findByID({
          collection: 'departments',
          id: data.employee_department as string,
          req,
          overrideAccess: true,
        })
        return department
      }

      if (data.employee) {
        const employee = await req.payload.findByID({
          collection: 'users',
          id: data.employee as string,
          req,
          overrideAccess: true,
        })

        if (!employee?.department) {
          throw new APIError('Selected employee must have a department', 400)
        }

        const department = await req.payload.findByID({
          collection: 'departments',
          id: (employee?.department as Department)?.id,
          req,
        })
        return department
      }

      throw new APIError('Employee department must be specified', 400)
    },
    setEmployeeApprover: async (req, _data) => {
      const data = _data as WarningType
      if (data?.employee) {
        const employee = await req.payload.findByID({
          collection: 'users',
          id: data.employee as string,
          req,
          overrideAccess: true,
        })
        return employee?.email
      }
      return undefined
    },
  },
  workflowNotificationArgs: {
    onInReview: async (
      req,
      reviewerEmail,
      createdByEmail,
      doc,
      docId,
      additionalRecipients,
      response,
      comments,
      approverType,
      emailSettings,
      attachments,
      latestCustomFieldValues,
    ) => {
      const serverURL = BACKEND_URL_WITH_BASE

      const currentReview = doc.workflow_reviews?.find(
        (r: any) => r.reviewer === reviewerEmail && r.status_slug === doc._workflow_status,
      )
      const token = currentReview?.token

      const frontendUrl = `${serverURL}/letters/${COLLECTION_NAME}/${docId}`
      const accessUrl = token ? `${frontendUrl}?token=${token}` : frontendUrl

      const config = getCollectionConfig(COLLECTION_NAME)
      const emailFields = (config?.displayFields || [])
        .filter((f) => f.path !== 'description')
        .map((f) => ({
          label: f.label,
          value: (doc as any)[f.path],
        }))

      const history = await mapReviewsToHistory(doc.workflow_reviews || [], req, serverURL)
      const actionButtons = emailSettings?.hideEmailActions
        ? []
        : [
            {
              label: 'View Document',
              url: accessUrl,
              color: '#059669',
            },
          ]

      const title = `Warning for ${doc.employee_name} - ${currentReview?.label}`
      const emailHtml = generateEmailHtml({
        title,
        message: `A new warning request requires your review and approval.`,
        fields: emailFields,
        description: doc.description,
        history: history,
        actionButtons,
        docId,
        hideHistory: emailSettings?.hideHistory,
        hideDetails: emailSettings?.hideDetails,
        hideDescription: emailSettings?.hideDescription,
        hideAttachments: emailSettings?.hideAttachments,
        customText: emailSettings?.customText,
        attachments,
        latestCustomFieldValues,
      })

      await req.payload.sendEmail({
        to: reviewerEmail,
        subject: title,
        html: emailHtml,
      })

      if (additionalRecipients) {
        await Promise.all(
          additionalRecipients.map(async (recipient) => {
            const recipientToken = recipient.token
            const recipientUrl = recipientToken
              ? `${frontendUrl}?token=${recipientToken}`
              : frontendUrl
            const recipientHasActions =
              recipient.canApprove || recipient.canReject || recipient.canAcknowledge
            const recipientButtons = recipient.settings?.hideEmailActions
              ? []
              : recipientHasActions
                ? [{ label: 'Review & Respond', url: recipientUrl, color: '#059669' }]
                : actionButtons
            const recipientHtml = generateEmailHtml({
              title,
              message: `A new warning request requires your review and approval.`,
              fields: emailFields,
              description: doc.description,
              history: history,
              actionButtons: recipientButtons,
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
              subject: title,
              html: recipientHtml,
            })
          }),
        )
      }
    },
    onCompleted: async (
      req,
      requestorEmail,
      doc,
      docId,
      additionalRecipients,
      response,
      comments,
      emailSettings,
      attachments,
      latestCustomFieldValues,
    ) => {
      const serverURL = BACKEND_URL_WITH_BASE
      const frontendUrl = `${serverURL}/letters/${COLLECTION_NAME}/${docId}`
      const config = getCollectionConfig(COLLECTION_NAME)
      const emailFields = (config?.displayFields || [])
        .filter((f) => f.path !== 'description')
        .map((f) => ({
          label: f.label,
          value: (doc as any)[f.path],
        }))

      const history = await mapReviewsToHistory(doc.workflow_reviews || [], req, serverURL)
      const title = `Warning for ${doc.employee_name} - Approved`
      const emailHtml = generateEmailHtml({
        title,
        message: `Your warning request has been approved and completed.`,
        fields: emailFields,
        description: doc.description,
        history: history,
        actionButtons: emailSettings?.hideEmailActions
          ? []
          : [{ label: 'View Document', url: frontendUrl, color: '#059669' }],
        docId,
        hideHistory: emailSettings?.hideHistory,
        hideDetails: emailSettings?.hideDetails,
        hideDescription: emailSettings?.hideDescription,
        hideAttachments: emailSettings?.hideAttachments,
        customText: emailSettings?.customText,
        attachments,
        latestCustomFieldValues,
      })

      await req.payload.sendEmail({
        to: requestorEmail,
        subject: title,
        html: emailHtml,
      })

      if (additionalRecipients) {
        await Promise.all(
          additionalRecipients.map(async (recipient) => {
            const recipientHtml = generateEmailHtml({
              title,
              message: `Your warning request has been approved and completed.`,
              fields: emailFields,
              description: doc.description,
              history: history,
              actionButtons: recipient.settings?.hideEmailActions
                ? []
                : [{ label: 'View Document', url: frontendUrl, color: '#059669' }],
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
              subject: title,
              html: recipientHtml,
            })
          }),
        )
      }
    },
    onRejected: async (
      req,
      requestorEmail,
      doc,
      docId,
      additionalRecipients,
      response,
      comments,
      emailSettings,
      attachments,
      latestCustomFieldValues,
    ) => {
      const serverURL = BACKEND_URL_WITH_BASE
      const frontendUrl = `${serverURL}/letters/${COLLECTION_NAME}/${docId}`
      const config = getCollectionConfig(COLLECTION_NAME)
      const emailFields = (config?.displayFields || [])
        .filter((f) => f.path !== 'description')
        .map((f) => ({
          label: f.label,
          value: (doc as any)[f.path],
        }))

      const history = await mapReviewsToHistory(doc.workflow_reviews || [], req, serverURL)
      const title = `Warning for ${doc.employee_name} - Rejected`
      const emailHtml = generateEmailHtml({
        title,
        message: `Your warning request has been rejected.`,
        fields: emailFields,
        description: doc.description,
        history: history,
        actionButtons: emailSettings?.hideEmailActions
          ? []
          : [{ label: 'View Document', url: frontendUrl, color: '#dc2626' }],
        docId,
        hideHistory: emailSettings?.hideHistory,
        hideDetails: emailSettings?.hideDetails,
        hideDescription: emailSettings?.hideDescription,
        hideAttachments: emailSettings?.hideAttachments,
        customText: emailSettings?.customText,
        attachments,
        latestCustomFieldValues,
      })

      await req.payload.sendEmail({
        to: requestorEmail,
        subject: title,
        html: emailHtml,
      })

      if (additionalRecipients) {
        await Promise.all(
          additionalRecipients.map(async (recipient) => {
            const recipientHtml = generateEmailHtml({
              title,
              message: `Your warning request has been rejected.`,
              fields: emailFields,
              description: doc.description,
              history: history,
              actionButtons: recipient.settings?.hideEmailActions
                ? []
                : [{ label: 'View Document', url: frontendUrl, color: '#dc2626' }],
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
              subject: title,
              html: recipientHtml,
            })
          }),
        )
      }
    },
    onAutoComplete: async (
      req,
      stepLabel,
      stepSlug,
      requestorEmail,
      doc,
      docId,
      additionalRecipients,
      emailSettings,
      attachments,
      latestCustomFieldValues,
    ) => {
      const serverURL = BACKEND_URL_WITH_BASE
      const frontendUrl = `${serverURL}/letters/${COLLECTION_NAME}/${docId}`
      const config = getCollectionConfig(COLLECTION_NAME)
      const emailFields = (config?.displayFields || [])
        .filter((f) => f.path !== 'description')
        .map((f) => ({
          label: f.label,
          value: (doc as any)[f.path],
        }))

      const history = await mapReviewsToHistory(doc.workflow_reviews || [], req, serverURL)
      const title = `Warning for ${doc.employee_name} - ${stepLabel} (Auto-Completed)`
      const emailHtml = generateEmailHtml({
        title,
        message: `The workflow step "${stepLabel}" has been automatically completed as per configuration.`,
        fields: emailFields,
        description: doc.description,
        history: history,
        actionButtons: emailSettings?.hideEmailActions
          ? []
          : [{ label: 'View Document', url: frontendUrl, color: '#059669' }],
        docId,
        hideHistory: emailSettings?.hideHistory,
        hideDetails: emailSettings?.hideDetails,
        hideDescription: emailSettings?.hideDescription,
        hideAttachments: emailSettings?.hideAttachments,
        customText: emailSettings?.customText,
        attachments,
        latestCustomFieldValues,
      })

      if (requestorEmail && requestorEmail !== 'NA') {
        await req.payload.sendEmail({
          to: requestorEmail,
          subject: title,
          html: emailHtml,
        })
      }

      if (additionalRecipients) {
        await Promise.all(
          additionalRecipients.map(async (recipient) => {
            const recipientHtml = generateEmailHtml({
              title,
              message: `The workflow step "${stepLabel}" has been automatically completed as per configuration.`,
              fields: emailFields,
              description: doc.description,
              history: history,
              actionButtons: recipient.settings?.hideEmailActions
                ? []
                : [{ label: 'View Document', url: frontendUrl, color: '#059669' }],
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
              subject: title,
              html: recipientHtml,
            })
          }),
        )
      }
    },
  },
})

export default Warnings
