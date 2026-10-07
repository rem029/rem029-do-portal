import type { Payload } from 'payload'
import { getTripSchedulingEmailFrom } from '@/utilities/trip-scheduling-email'

// Layout copied from trip-scheduling-staff-voice/emails.ts so the OTP email matches the other
// trip-scheduling notifications.
const DO_GOLD = '#DEC37D'
const DO_GREEN = '#143422'

interface BuiltEmail {
  subject: string
  html: string
}

function wrapEmail({ title, body }: { title: string; body: string }): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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

// `code` is always six digits (generated server-side), so it needs no HTML escaping.
export function buildHistoryCodeEmail(code: string): BuiltEmail {
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #4a4a4a;">
      Use this code to open the booking history:
    </p>
    <p style="margin: 0 0 24px 0; text-align: center;">
      <span style="display: inline-block; padding: 14px 28px; background-color: #f4f4f0; border: 1px solid #e2e2dc; border-radius: 6px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: ${DO_GREEN}; font-family: 'Courier New', Courier, monospace;">${code}</span>
    </p>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #4a4a4a;">
      This code expires in <strong>10 minutes</strong>. Emails can take up to a minute to arrive.
    </p>
    <p style="margin: 0; font-size: 14px; color: #4a4a4a;">
      If you didn't request this code, you can safely ignore this email.
    </p>`

  return {
    subject: 'Your booking history access code',
    html: wrapEmail({ title: 'Booking History Access', body }),
  }
}

export async function queueHistoryCodeEmail(payload: Payload, to: string, code: string): Promise<void> {
  const { subject, html } = buildHistoryCodeEmail(code)
  await payload.jobs.queue({
    task: 'send-email',
    input: { to, from: getTripSchedulingEmailFrom(), subject, html },
  })
}
