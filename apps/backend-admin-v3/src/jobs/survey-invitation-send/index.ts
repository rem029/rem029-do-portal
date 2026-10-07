import { createLocalReq, TaskConfig, type PayloadRequest } from 'payload'
import type { Form, User } from '@/payload-types'
import { createUniqueSurveyCode } from '@/utilities/survey-code'
import { SEND_EMAIL_TYPE_SURVEY } from '@/jobs/send-email/types'
import {
  buildInvitationEmailHtml,
  buildInvitationEmailSubject,
} from '@/collections/survey-invitations/utilities/invitation-email'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const surveyInvitationSendJob: TaskConfig<'survey-invitation-send'> = {
  slug: 'survey-invitation-send',
  retries: 2,
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
      name: 'email',
      type: 'text',
      required: true,
    },
    {
      name: 'surveyFormCode',
      type: 'text',
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
    // Lowercased to match the stored form (the `email` field hook lowercases on save).
    const email = (input.email as string).trim().toLowerCase()
    const surveyFormCode = input.surveyFormCode as string
    const resendExisting = input.resendExisting === true
    const departmentId = (input.departmentId as string | undefined)?.trim() || undefined

    if (!EMAIL_REGEX.test(email)) {
      return { output: { status: 'invalid_format' } }
    }

    let invitationId: string | undefined
    let actingReq: PayloadRequest | undefined

    try {
      const user = (await payload
        .findByID({
          collection: 'users',
          id: userId,
          overrideAccess: true,
        })
        .catch(() => null)) as User | null

      if (!user) {
        logger.error(`[survey-invitation-send] Acting user ${userId} not found`)
        return {
          output: { status: 'error' },
          state: 'failed',
          errorMessage: 'Acting user not found',
        }
      }

      actingReq = await createLocalReq({ user: { ...user, collection: 'users' } }, payload)

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

      if (!form) {
        throw new Error(`Form ${formId} not found`)
      }

      const existing = await payload.find({
        collection: 'survey-invitations',
        where: {
          and: [{ form: { equals: formId } }, { email: { equals: email } }],
        },
        sort: '-createdAt',
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      const existingDoc = existing.docs[0]

      // A spent code can never be re-sent, even with `resendExisting`; checked across every row.
      const respondedDoc = existing.docs.find((doc) => doc.status === 'responded')
      if (respondedDoc) {
        return { output: { status: 'already_responded', invitationId: respondedDoc.id } }
      }

      if (existingDoc?.status === 'sent' && !resendExisting) {
        return { output: { status: 'already_invited', invitationId: existingDoc.id } }
      }

      let code: string
      if (existingDoc) {
        // `pending`/`error` means the earlier email never went out (a retry); `sent` here is an
        // opt-in resend. Either way the same row and code are reused.
        invitationId = existingDoc.id
        code = existingDoc.code
        if (departmentId) {
          await payload.update({
            collection: 'survey-invitations',
            id: invitationId,
            data: { department: departmentId },
            overrideAccess: true,
            req: actingReq,
          })
        }
      } else {
        code = await createUniqueSurveyCode(payload, formId, surveyFormCode)
        const invitation = await payload.create({
          collection: 'survey-invitations',
          data: {
            form: formId,
            email,
            code,
            status: 'pending',
            operator: operatorId,
            ...(departmentId ? { department: departmentId } : {}),
          },
          overrideAccess: true,
          req: actingReq,
        })
        invitationId = invitation.id
      }

      const html = buildInvitationEmailHtml({ form, code })
      const subject = buildInvitationEmailSubject(form)

      await payload.jobs.queue({
        task: 'send-email',
        input: {
          to: email,
          subject,
          html,
          invitationId,
          type: SEND_EMAIL_TYPE_SURVEY,
        },
      })

      const markSent = () =>
        payload.update({
          collection: 'survey-invitations',
          id: invitationId!,
          data: { status: 'sent', sent_at: new Date().toISOString(), error_message: null },
          overrideAccess: true,
          req: actingReq,
        })

      try {
        await markSent()
      } catch (updateError) {
        logger.error(
          `[survey-invitation-send] Invitation ${invitationId} queued successfully but failed to mark 'sent': ${updateError}. Retrying once.`,
        )
        try {
          await markSent()
        } catch (retryError) {
          logger.error(
            `[survey-invitation-send] Retry also failed to mark invitation ${invitationId} as 'sent' (left at '${existingDoc?.status ?? 'pending'}'): ${retryError}`,
          )
        }
      }

      return {
        output: {
          status: existingDoc?.status === 'sent' ? 'resent' : 'sent',
          invitationId,
          code,
        },
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error(`[survey-invitation-send] Error for ${email}: ${message}`)

      if (invitationId) {
        try {
          await payload.update({
            collection: 'survey-invitations',
            id: invitationId,
            data: { status: 'error', error_message: message },
            overrideAccess: true,
            ...(actingReq ? { req: actingReq } : {}),
          })
        } catch (updateError) {
          logger.error(
            `[survey-invitation-send] Failed to mark invitation ${invitationId} as error: ${updateError}`,
          )
        }
      }

      return {
        output: { status: 'error' },
        state: 'failed',
        errorMessage: message,
      }
    }
  },
}
