import type { Payload } from 'payload'
import type { TripSchedulingStaffVoice } from '@/payload-types'
import { escapeHtml } from '@/utilities/escape-html'
import { toSubjectText } from '@/utilities/email-subject'
import { getTripSchedulingEmailFrom } from '@/utilities/trip-scheduling-email'

const DO_GOLD = '#DEC37D'
const DO_GREEN = '#143422'
const DO_BANYAN = '#85754E'

export const CATEGORY_LABELS: Record<TripSchedulingStaffVoice['category'], string> = {
  suggestion: 'Suggestion / Idea',
  concern: 'Service / Route Concern',
  compliment: 'Compliment / Praise',
  inquiry: 'General Inquiry',
}

type StaffVoiceEmailDoc = Pick<
  TripSchedulingStaffVoice,
  'id' | 'fullName' | 'email' | 'category' | 'subject' | 'message'
>

interface BuiltEmail {
  subject: string
  html: string
}

function referenceId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

function categoryLabel(category: TripSchedulingStaffVoice['category']): string {
  return CATEGORY_LABELS[category] ?? category
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td class="dtl-label" width="30%" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">${label}:</td>
      <td class="dtl-val" width="70%" style="color: #111111; font-weight: 600; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${value}</td>
    </tr>`
}

function detailsCard(rows: Array<[label: string, escapedValue: string]>): string {
  return `
    <div style="background-color: #edebe6; border-radius: 8px; padding: 20px 20px 10px 20px; margin-bottom: 25px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 2.1;">
        ${rows.map(([label, value]) => detailRow(label, value)).join('')}
      </table>
    </div>`
}

function sectionHeading(text: string): string {
  return `
    <h3 style="margin: 24px 0 8px 0; color: ${DO_BANYAN}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;">
      ${text}
    </h3>`
}

function quoteBlock(escapedText: string): string {
  return `
    <div style="background-color: #f8fafc; border-left: 4px solid ${DO_GREEN}; border-radius: 4px; padding: 15px; margin-bottom: 20px; color: #475569; white-space: pre-wrap; font-size: 13px;">${escapedText}</div>`
}

function wrapEmail({ title, body }: { title: string; body: string }): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media only screen and (max-width: 480px) {
            .dtl-label, .dtl-val { display: block !important; width: 100% !important; }
            .dtl-label { padding-bottom: 2px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0;">
    <div style="background-color: #e8e8e3; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.6;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color: ${DO_GREEN}; padding: 35px 25px; text-align: center; border-bottom: 3px solid ${DO_GOLD};">
            <h1 style="color: #ffffff; margin: 0; font-size: 19px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; line-height: 1.4;">
              ${title}
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px 25px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background-color: #f4f4f0; padding: 20px 25px; text-align: center; border-top: 1px solid #e2e2dc;">
            <p style="margin: 0; font-size: 11px; color: #888888; line-height: 1.5;">
              This is an automated message. Please do not reply directly.<br>
              <strong style="color: #555555;">Doha Oasis Transport &amp; Logistics</strong>
            </p>
          </td>
        </tr>
      </table>
    </div>
      </body>
    </html>`
}

export function buildConfirmationEmail(doc: StaffVoiceEmailDoc): BuiltEmail {
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #222222;">Hello <strong>${escapeHtml(doc.fullName)}</strong>,</p>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a4a4a;">
      Thank you for sharing your feedback. We have received it, and the Transport &amp; Logistics team will review it.
    </p>
    ${sectionHeading('Your Submission')}
    ${detailsCard([
      ['Category', escapeHtml(categoryLabel(doc.category))],
      ['Subject', escapeHtml(doc.subject)],
      ['Reference', referenceId(doc.id)],
    ])}
    ${sectionHeading('Your Message')}
    ${quoteBlock(escapeHtml(doc.message))}`

  return {
    subject: `[Staff Voice] We received your feedback: ${toSubjectText(doc.subject)}`,
    html: wrapEmail({ title: 'Feedback Received', body }),
  }
}

export function buildResponseEmail(doc: StaffVoiceEmailDoc, note: string): BuiltEmail {
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #222222;">Hello <strong>${escapeHtml(doc.fullName)}</strong>,</p>
    <p style="margin: 0 0 8px 0; font-size: 15px; color: #4a4a4a;">
      The Transport &amp; Logistics team has responded to your feedback:
    </p>
    ${quoteBlock(escapeHtml(note))}
    ${sectionHeading('Your Original Feedback')}
    ${detailsCard([
      ['Category', escapeHtml(categoryLabel(doc.category))],
      ['Subject', escapeHtml(doc.subject)],
      ['Reference', referenceId(doc.id)],
    ])}
    ${quoteBlock(escapeHtml(doc.message))}`

  return {
    subject: `[Staff Voice] Response to your feedback: ${toSubjectText(doc.subject)}`,
    html: wrapEmail({ title: 'Response To Your Feedback', body }),
  }
}

export async function queueStaffVoiceEmail(
  payload: Payload,
  { to, subject, html }: { to: string; subject: string; html: string },
): Promise<void> {
  await payload.jobs.queue({
    task: 'send-email',
    input: { to, from: getTripSchedulingEmailFrom(), subject, html },
  })
}
