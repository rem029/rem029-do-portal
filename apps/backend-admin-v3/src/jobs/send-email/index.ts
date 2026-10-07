import { TaskConfig } from 'payload'

import { SEND_EMAIL_TYPE_SURVEY } from './types'

const RETRIES = 3

export const sendEmailJob: TaskConfig<'send-email'> = {
  slug: 'send-email',
  retries: RETRIES,
  inputSchema: [
    {
      name: 'to',
      type: 'text',
      required: true,
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'html',
      type: 'code',
      admin: { language: 'html' },
      required: true,
    },
    {
      // `json`, not `text` — nodemailer's `from` accepts either a plain string
      // (`'Name <addr>'`, used by the existing haccp-hook callers) or a `{ address, name }`
      // object (used by the default-fallback below), so the field must hold either shape.
      name: 'from',
      type: 'json',
    },
    {
      name: 'cc',
      type: 'text',
    },
    {
      name: 'bcc',
      type: 'text',
    },
    {
      name: 'replyTo',
      type: 'text',
    },
    {
      name: 'invitationId',
      type: 'text',
    },
    {
      // Feature discriminator — see `./types.ts` (`SendEmailType`). Only `'survey'`
      // triggers the `survey-invitations` status write-back on final-attempt failure.
      // Omitted / any other value ⇒ generic mail, no write-back.
      name: 'type',
      type: 'text',
    },
  ],
  handler: async ({ req, input, job }) => {
    const { payload } = req
    const { logger } = payload
    const { to, subject, html, from, cc, bcc, replyTo, invitationId, type } = input

    try {
      logger.info(`send-email started for: ${to}`)

      await payload.sendEmail({
        to: to as string,
        subject: subject as string,
        html: html as string,
        // Falls back to the configured adapter default when `from` isn't provided. Can't just
        // omit the key when undefined and let `payload.sendEmail` apply its own default — the
        // nodemailer adapter does `{ from: '<default>', ...message }`, so an explicit
        // `from: undefined` key in `message` still overwrites that default with `undefined`.
        // `from` is a `json` field (generated type `unknown`) since it holds either a plain
        // string or a `{ address, name }` object — the double-cast names the shape it's actually
        // validated to be at runtime (either form nodemailer itself accepts).
        from: (from as unknown as string | { address?: string; name?: string } | undefined) ?? {
          address: payload.email.defaultFromAddress,
          name: payload.email.defaultFromName,
        },
        cc: cc as string | undefined,
        bcc: bcc as string | undefined,
        replyTo: replyTo as string | undefined,
      })

      logger.info(`send-email completed for: ${to}`)
      return { output: { success: true, to } }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      payload.logger.error(`send-email error for ${to}: ${errorMessage}`)

      // Determine whether this is the final attempt allowed by Payload's queue runner.
      // In Payload 3.x queue runner (see node_modules/payload/dist/queues/operations/runJobs/index.js line 99-115,
      // runJob/getRunTaskFunction.js line 65, and errors/handleTaskError.js lines 54, 64):
      // `job.totalTried` is the 0-indexed count of prior attempts already executed and failed.
      // - Attempt 1 (initial run): job.totalTried is 0 (or null/undefined).
      // - Attempt 2 (retry 1): job.totalTried is 1.
      // - Attempt 3 (retry 2): job.totalTried is 2.
      // - Attempt 4 (retry 3, final allowed attempt when RETRIES = 3): job.totalTried is 3.
      // On failure of this attempt, handleTaskError checks `(taskStatus?.totalTried ?? 0) >= maxRetries` (3 >= 3)
      // and sets `hasError: true` without scheduling further retries.
      // Therefore, this attempt is the final retry when `(job.totalTried ?? 0) >= RETRIES`.
      const isFinalAttempt = (job.totalTried ?? 0) >= RETRIES

      // Write the failure back to the `survey-invitations` row only when the caller
      // tagged this as a survey mail (`type === 'survey'`). `send-email` is a shared job
      // used by other features that must not touch survey invitations.
      if (
        isFinalAttempt &&
        type === SEND_EMAIL_TYPE_SURVEY &&
        typeof invitationId === 'string' &&
        invitationId.trim() !== ''
      ) {
        try {
          await payload.update({
            collection: 'survey-invitations',
            id: invitationId,
            data: {
              status: 'error',
              error_message: errorMessage,
            },
            overrideAccess: true,
          })
        } catch (updateError) {
          logger.error(
            `[send-email] Failed to mark invitation ${invitationId} as error: ${updateError}`,
          )
        }
      }

      return {
        output: { success: false, to },
        state: 'failed',
        errorMessage,
      }
    }
  },
}
