import { TaskConfig } from 'payload'
import type { Form, User } from '@/payload-types'

export const surveyBulkSendJob: TaskConfig<'survey-bulk-send'> = {
  slug: 'survey-bulk-send',
  retries: 0,
  inputSchema: [
    {
      name: 'formId',
      type: 'text',
      required: true,
    },
    {
      name: 'operatorId',
      type: 'text',
      required: true,
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
    },
    {
      name: 'emails',
      type: 'json',
      required: true,
    },
    {
      name: 'resendExisting',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'departmentId',
      type: 'text',
      required: false,
    },
  ],
  handler: async ({ req, input }) => {
    const { payload } = req
    const { logger } = payload
    const formId = input.formId as string
    const operatorId = input.operatorId as string
    const userId = input.userId as string
    // JSON fields in Payload have generated type `unknown`, so double-casting is required to read as string[]
    const emails = (input.emails as unknown as string[]) || []
    const resendExisting = input.resendExisting === true
    const departmentId = input.departmentId as string | undefined

    try {
      const user = (await payload
        .findByID({
          collection: 'users',
          id: userId,
          overrideAccess: true,
        })
        .catch(() => null)) as User | null

      if (!user) {
        logger.error(`[survey-bulk-send] Acting user ${userId} not found`)
        return {
          output: { queued: 0 },
          state: 'failed',
          errorMessage: 'Acting user not found',
        }
      }

      let form: Form | null = null
      try {
        form = (await payload.findByID({
          collection: 'forms',
          id: formId,
          depth: 0,
          overrideAccess: true,
        })) as Form | null
      } catch {
        form = null
      }

      if (!form || !form.is_survey) {
        logger.error(`[survey-bulk-send] Form ${formId} not found or not marked as survey`)
        return {
          output: { queued: 0 },
          state: 'failed',
          errorMessage: 'Form not found or is not a survey form',
        }
      }

      const surveyFormCode = typeof form.survey_code === 'string' ? form.survey_code.trim() : ''
      if (!surveyFormCode) {
        logger.error(`[survey-bulk-send] Survey form ${formId} has no survey code assigned`)
        return {
          output: { queued: 0 },
          state: 'failed',
          errorMessage: 'Survey form has no survey code assigned',
        }
      }

      for (const email of emails) {
        await payload.jobs.queue({
          task: 'survey-invitation-send',
          input: {
            formId,
            operatorId,
            userId,
            email,
            surveyFormCode,
            resendExisting,
            ...(departmentId ? { departmentId } : {}),
          },
        })
      }

      logger.info(
        `[survey-bulk-send] ${user.email} queued ${emails.length} invitations for form ${formId}.`,
      )

      return {
        output: {
          queued: emails.length,
        },
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error(`[survey-bulk-send] Unhandled error: ${message}`)
      return {
        output: { queued: 0 },
        state: 'failed',
        errorMessage: message,
      }
    }
  },
}
