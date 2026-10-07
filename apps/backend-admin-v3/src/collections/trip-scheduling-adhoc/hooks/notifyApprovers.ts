import type { CollectionAfterChangeHook } from 'payload'
import { TripSchedulingAdhoc } from '@/payload-types'
import { getRelationshipName } from './notifications'
import { formatDateOnly } from '@/utilities/helper/datetime-utils'
import { escapeHtml } from '@/utilities/escape-html'
import { toSubjectText } from '@/utilities/email-subject'
import { resolveApprovalToken } from '@/utilities/trip-scheduling-approval-token'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { getTripSchedulingEmailFrom } from '@/utilities/trip-scheduling-email'

const DO_GOLD = '#DEC37D'
const DO_GREEN = '#143422'

export const notifyApprovers: CollectionAfterChangeHook<TripSchedulingAdhoc> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || !req) return

  const p = req.payload

  try {
    const transportSettings = await p.findGlobal({
      slug: 'trip-scheduling-settings',
    })

    const settingsRecord = transportSettings as unknown as Record<string, unknown>
    const rawNotificationEmails = settingsRecord?.notificationEmails as
      Array<Record<string, unknown>> | undefined

    let approverEmails: string[] =
      rawNotificationEmails
        ?.map((item) => (typeof item.email === 'string' ? item.email.trim() : ''))
        .filter((email): email is string => Boolean(email)) || []

    if (approverEmails.length === 0) {
      p.logger.info(
        '[Adhoc Hook] Global settings array empty. Engaging system environment fallback lists.',
      )

      approverEmails =
        process.env.ADHOC_APPROVER_EMAILS?.split(',')
          ?.map((e) => e.trim())
          ?.filter((e): e is string => Boolean(e)) || []
    }

    if (approverEmails.length > 0) {
      const vehicleName = await getRelationshipName(
        doc?.vehicleNeeded,
        'trip-scheduling-vehicles',
        p,
      )
      const operatorName = await getRelationshipName(doc?.operator, 'operators', p)

      const basePortalUrl = BACKEND_URL_WITH_BASE
      const approvalToken = await resolveApprovalToken(p, req, 'trip-scheduling-adhoc', doc)
      const secureApprovalUrl = `${basePortalUrl}/trip-scheduling/adhoc/${doc.id}?token=${approvalToken}`

      const dateStr = formatDateOnly(doc.travelDate)
      const pickupTimeStr = doc.pickupTime || 'N/A'
      const originStr = doc.origin || 'Not specified'

      // Fallback default to 1 if empty
      const totalPassengers = doc.passengers || 1

      const fromEmail = getTripSchedulingEmailFrom()
      const emailSubject = `[Action Required] New Employee Transport Request by ${toSubjectText(String(doc.fullName))} for ${dateStr}`
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
          <body style="margin: 0; padding: 40px 10px; background-color: #e9e7e1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
            
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center">
                  <!-- Main Card Container -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: left;">
                    
                    <!-- Dark Green Header Banner -->
                    <tr>
                      <td style="background-color: ${DO_GREEN}; padding: 36px 25px; text-align: center; border-bottom: 3px solid ${DO_GOLD};">
                        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.3;">
                          EMPLOYEE TRANSPORT REQUEST<br>
                          <span style="font-size: 13px; color: ${DO_GOLD}; font-weight: 600; letter-spacing: 2px;">&ndash; PENDING REVIEW &ndash;</span>
                        </h1>
                      </td>
                    </tr>

                    <!-- Card Body -->
                    <tr>
                      <td style="padding: 32px 30px;">
                        
                        <!-- Intro Message -->
                        <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; line-height: 1.5; margin: 0 0 24px 0;">
                          A new employee transit request has been submitted and is awaiting your operational review within the 48-hour window.
                        </p>

                        <!-- Section Header: TRIP & REQUEST DETAILS -->
                        <div style="color: #85754E; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #e5e2d9; padding-bottom: 6px;">
                          TRIP & REQUEST DETAILS
                        </div>

                        <!-- Inner Beige Details Card -->
                        <div style="background-color: #f2efe9; border-radius: 12px; padding: 20px 22px; margin-bottom: 28px;">
                          
                          <!-- REQUESTER INFO SUBSECTION -->
                          <div style="color: #85754E; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                            &mdash; REQUESTER INFO:
                          </div>
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #222222; border-collapse: collapse; margin-bottom: 18px;">
                            <tr>
                              <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">FULL NAME:</td>
                              <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.fullName || 'N/A')} (${escapeHtml(doc.email || 'N/A')})</td>
                            </tr>
                            <tr>
                              <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">PHONE NUMBER:</td>
                              <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.phone || 'N/A')}</td>
                            </tr>
                            <tr>
                              <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">TOTAL PASSENGERS:</td>
                              <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${totalPassengers} Person(s)</td>
                            </tr>
                          </table>

                          <!-- TRIP DETAILS SUBSECTION -->
                          <div style="color: #85754E; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; border-top: 1px dashed #dcd8cd; padding-top: 14px;">
                            &mdash; TRIP DETAILS:
                          </div>
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #222222; border-collapse: collapse;">
                            <tr>
                              <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">OPERATOR:</td>
                              <td class="dtl-val" style="padding: 4px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(operatorName)}</td>
                            </tr>
                            <tr>
                              <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">PICK-UP LOCATION:</td>
                              <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(originStr)}</td>
                            </tr>
                            <tr>
                              <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">DESTINATION:</td>
                              <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.destination || 'N/A')}</td>
                            </tr>
                            <tr>
                              <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">TRAVEL DATE:</td>
                              <td class="dtl-val" style="padding: 4px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${dateStr}</td>
                            </tr> 
                            <tr>
                              <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">TRAVEL TIME:</td>
                              <td class="dtl-val" style="padding: 4px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(pickupTimeStr)}</td>
                            </tr>
                            <tr>
                              <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">VEHICLE REQUESTED:</td>
                              <td class="dtl-val" style="padding: 4px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(vehicleName)}</td>
                            </tr>
                            <tr>
                              <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">PURPOSE STATEMENT:</td>
                              <td class="dtl-val" style="padding: 4px 0; color: #666666; font-style: italic; word-break: break-word; overflow-wrap: break-word;">"${escapeHtml(doc.reason || 'No specific purpose declared.')}"</td>
                            </tr>
                          </table>

                        </div>

                        <!-- Section Header: ACTIONS REQUIRED -->
                        <div style="color: #85754E; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid #e5e2d9; padding-bottom: 6px;">
                          ACTIONS REQUIRED
                        </div>

                        <!-- Action Button -->
                        <div style="text-align: left; margin-bottom: 10px;">
                          <a href="${secureApprovalUrl}" target="_blank" 
                             style="background-color: ${DO_GREEN}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; letter-spacing: 1px; text-transform: uppercase; border: 1px solid ${DO_GOLD};">
                            Review & Take Action
                          </a>
                        </div>

                      </td>
                    </tr>

                  </table>

                  <!-- Email Footer -->
                  <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #777777; line-height: 1.6;">
                    This is an automated operational pipeline delivery. Please do not reply directly.<br>
                    Doha Oasis Transport & Logistics
                  </div>

                </td>
              </tr>
            </table>

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
          const message = err instanceof Error ? err.message : String(err)
          p.logger.error(
            `[Adhoc Notification Failure] Failed to queue email job for ${email}: ${message}`,
          )
        }
      }
      p.logger.info(`[Adhoc Hook] Approver dispatch loop finalized for request ${doc.id}`)
    } else {
      p.logger.error(
        '[Adhoc Hook] Notification aborted: No valid approver emails found in either Global Settings or ADHOC_APPROVER_EMAILS environment rows.',
      )
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    p.logger.error(`[Adhoc Hook] notifyApprovers execution breakdown: ${message}`)
  }
}
