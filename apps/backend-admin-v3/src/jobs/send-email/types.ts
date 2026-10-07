/**
 * Discriminator passed as `send-email` job `input.type` so the job's final-attempt
 * failure handler knows which feature queued the mail and whether to write status back.
 *
 * - `'survey'`  → on retry exhaustion, mark the linked `survey-invitations` row as `error`.
 * - `'other'`   → generic caller; no status write-back.
 *
 * Callers that omit `type` are treated as `'other'`.
 */
export const SEND_EMAIL_TYPES = ['survey', 'other'] as const

export type SendEmailType = (typeof SEND_EMAIL_TYPES)[number]

export const SEND_EMAIL_TYPE_SURVEY: SendEmailType = 'survey'
