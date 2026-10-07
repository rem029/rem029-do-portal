import type { CollectionAfterChangeHook } from 'payload'
import { resolveApprovalToken } from '@/utilities/trip-scheduling-approval-token'
import { escapeHtml } from '@/utilities/escape-html'
import { toSubjectText } from '@/utilities/email-subject'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { getTripSchedulingEmailFrom } from '@/utilities/trip-scheduling-email'

const DO_GOLD = '#DEC37D'
const DO_GREEN = '#143422'

export const notifyApprovers: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create' || !req) return

  const p = req.payload

  try {
    const transportSettings = await p.findGlobal({ slug: 'trip-scheduling-settings' })

    let approverEmails: string[] =
      (transportSettings as any)?.notificationEmails
        ?.map((item: any) => item.email?.trim())
        ?.filter((email: any): email is string => Boolean(email)) || []

    if (approverEmails.length === 0) {
      p.logger.info('[Staff Voice Hook] Global settings array empty. Engaging fallback lists.')

      const fallback = process.env.BOOKING_APPROVER_EMAILS || process.env.APPROVER_GROUP_EMAIL
      approverEmails =
        fallback
          ?.split(',')
          ?.map((e) => e.trim())
          ?.filter((e): e is string => Boolean(e)) || []
    }

    if (approverEmails.length > 0) {
      const fromEmail = getTripSchedulingEmailFrom()
      const categoryTitle = (doc?.category || 'Feedback').toUpperCase()

      const emailSubject = `[Transport & Logistics Staff Voice] New ${categoryTitle}: ${toSubjectText(doc?.subject || 'Submission Received')}`

      const approvalToken = await resolveApprovalToken(p, req, 'trip-scheduling-staff-voice', doc)
      const basePortalUrl = BACKEND_URL_WITH_BASE
      const reviewUrl = approvalToken
        ? `${basePortalUrl}/trip-scheduling/staff-voice/${doc.id}?token=${approvalToken}`
        : null

      if (!reviewUrl) {
        p.logger.warn(
          `[Staff Voice Hook] No approval token found for doc ${doc.id}; sending the notification without a review link.`,
        )
      }

      const reviewButtonHtml = reviewUrl
        ? `
                <div style="text-align: left; margin-bottom: 10px;">
                  <a href="${reviewUrl}" target="_blank"
                     style="background-color: ${DO_GREEN}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; letter-spacing: 1px; text-transform: uppercase;">
                    Review &amp; Respond
                  </a>
                </div>`
        : ''

      const emailHtmlContent = `
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
            
            <!-- 🟢 SOLID GREEN TOP HEADER BANNER -->
            <tr>
              <td style="background-color: ${DO_GREEN}; padding: 35px 25px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 19px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; line-height: 1.4;">
                  STAFF VOICE SUBMISSION
                </h1>
                <p style="color: ${DO_GOLD}; margin: 6px 0 0 0; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">
                  – ${escapeHtml(categoryTitle)} –
                </p>
              </td>
            </tr>

            <!-- 📄 MAIN BODY CONTAINER -->
            <tr>
              <td style="padding: 30px 25px;">
                <p style="margin: 0 0 16px 0; font-size: 16px; color: #222222;">Hello <strong>Operations Team</strong>,</p>
                <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a4a4a;">
                  A new employee feedback submission has been logged and requires operational review.
                </p>

                <!-- 🟡 GOLD SECTION HEADER -->
                <h3 style="margin: 24px 0 12px 0; color: #85754E; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;">
                  SUBMISSION DETAILS
                </h3>
                <hr style="border: 0; border-top: 1px solid ${DO_GOLD}; margin: 0 0 20px 0;" />

                <!-- 📦 INNER BEIGE CARD CONTAINER -->
                <div style="background-color: #edebe6; border-radius: 8px; padding: 20px 20px 10px 20px; margin-bottom: 25px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 2.1;">
                    <tr>
                      <td class="dtl-label" width="30%" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">FROM:</td>
                      <td class="dtl-val" width="70%" style="color: #111111; font-weight: 600; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc?.fullName || 'N/A')} (${escapeHtml(doc?.email || 'N/A')})</td>
                    </tr>
                    <tr>
                      <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">CATEGORY:</td>
                      <td class="dtl-val" style="color: ${DO_GREEN}; font-weight: 700; text-transform: uppercase; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc?.category || 'N/A')}</td>
                    </tr>
                    <tr>
                      <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">SUBJECT:</td>
                      <td class="dtl-val" style="color: #111111; font-weight: 600; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc?.subject || 'N/A')}</td>
                    </tr>
                  </table>
                </div>

                <!-- 💬 MESSAGE BLOCK -->
                <h3 style="margin: 24px 0 8px 0; color: #85754E; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;">
                  MESSAGE / DETAIL
                </h3>
                <div style="background-color: #f8fafc; border-left: 4px solid ${DO_GREEN}; border-radius: 4px; padding: 15px; margin-bottom: 20px; font-style: italic; color: #475569; white-space: pre-wrap; font-size: 13px;">
                  "${escapeHtml(doc?.message || 'No message content provided.')}"
                </div>
                ${reviewButtonHtml}
              </td>
            </tr>

            <!-- 🔘 FOOTER -->
            <tr>
              <td style="background-color: #f4f4f0; padding: 20px 25px; text-align: center; border-top: 1px solid #e2e2dc;">
                <p style="margin: 0; font-size: 11px; color: #888888; line-height: 1.5;">
                  This is an automated operational pipeline delivery. Please do not reply directly.<br>
                  <strong style="color: #555555;">Doha Oasis Transport & Logistics</strong>
                </p>
              </td>
            </tr>
          </table>
        </div>
          </body>
        </html>
      `

      for (const email of approverEmails) {
        try {
          await p.jobs.queue({
            task: 'send-email',
            input: {
              to: email,
              from: fromEmail,
              subject: emailSubject,
              html: emailHtmlContent,
            },
          })
        } catch (err) {
          p.logger.error(
            `[Staff Voice Notification] Failed to queue email job for ${email}: ${err}`,
          )
        }
      }
    }
  } catch (e) {
    p.logger.error(
      `[Staff Voice Hook] notifyApprovers breakdown: ${e instanceof Error ? e.message : String(e)}`,
    )
  }
}
