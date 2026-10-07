import { generateEmailHtml } from '@/utilities/email-generator'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import type { Form } from '@/payload-types'

type InvitationFormShape = Pick<Form, 'title' | 'slug'>

interface BuildInvitationEmailArgs {
  form: InvitationFormShape
  code: string
}

/** Where the recipient lands: the code-gated survey route, prefilled via `?scode=`. */
export const buildSurveyInvitationLink = (form: InvitationFormShape, code: string): string =>
  `${BACKEND_URL_WITH_BASE}/forms/${form.slug}?scode=${code}`

export const buildInvitationEmailSubject = (form: InvitationFormShape): string =>
  `You're invited to complete: ${form.title}`

/**
 * Builds the invitation email HTML via the shared `generateEmailHtml` template. The access
 * code is shown prominently (large, letter-spaced) since it's the only credential the recipient
 * needs, and the action button links straight to the code-gated survey with `?scode=` prefilled.
 */
export const buildInvitationEmailHtml = ({ form, code }: BuildInvitationEmailArgs): string => {
  const link = buildSurveyInvitationLink(form, code)

  return generateEmailHtml({
    title: 'Survey Invitation',
    message: `You have been invited to complete "${form.title}".`,
    customText: `
      <div style="text-align: center;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; margin-bottom: 8px;">Your access code</div>
        <div style="font-size: 30px; font-weight: 800; letter-spacing: 6px; font-family: monospace;">${code}</div>
      </div>
    `,
    actionButtons: [{ label: 'Start Survey', url: link }],
    hideDetails: true,
    hideDescription: true,
    hideHistory: true,
    hideAttachments: true,
  })
}
