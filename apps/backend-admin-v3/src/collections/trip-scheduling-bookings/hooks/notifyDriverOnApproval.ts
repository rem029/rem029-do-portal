import { CollectionAfterChangeHook } from 'payload'
import { resolveDriverToken } from '@/utilities/trip-scheduling-approval-token'
import { formatDateOnly } from '@/utilities/helper/datetime-utils'
import { escapeHtml } from '@/utilities/escape-html'
import { toSubjectText } from '@/utilities/email-subject'
import { getZoneLabel } from './notifications'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { getTripSchedulingEmailFrom } from '@/utilities/trip-scheduling-email'

const DO_GOLD = '#DEC37D'
const DO_GREEN = '#143422'

export const notifyDriverOnApproval: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const p = req.payload

  p.logger.info(`[notifyDriverOnApproval DIAGNOSTIC] Hook Triggered for Doc ID: ${doc.id}`)
  p.logger.info(
    `[notifyDriverOnApproval DIAGNOSTIC] doc.status: "${doc.status}", previousDoc.status: "${previousDoc?.status}"`,
  )
  p.logger.info(`[notifyDriverOnApproval DIAGNOSTIC] doc.driver: ${JSON.stringify(doc.driver)}`)

  // 🎯 Expand evaluation to support both 'approved' and 'completed' status transitions
  const isTargetStatus = doc.status === 'approved' || doc.status === 'completed'
  const wasTargetStatus = previousDoc?.status === 'approved' || previousDoc?.status === 'completed'

  const wasApprovedNow = isTargetStatus && !wasTargetStatus

  p.logger.info(`[notifyDriverOnApproval DIAGNOSTIC] wasApprovedNow evaluation: ${wasApprovedNow}`)

  if (!wasApprovedNow) {
    p.logger.warn(
      `[notifyDriverOnApproval DIAGNOSTIC] Exiting: Status condition 'wasApprovedNow' failed. Current: "${doc.status}", Previous: "${previousDoc?.status}"`,
    )
    return
  }

  if (!doc.driver) {
    p.logger.warn(`[notifyDriverOnApproval DIAGNOSTIC] Exiting: No driver assigned on doc.`)
    return
  }

  try {
    const driverId = typeof doc.driver === 'object' ? doc.driver.id : doc.driver

    // Native Payload lookup for driver details
    const driverRecord = await p.findByID({
      collection: 'trip-scheduling-drivers',
      id: driverId,
      depth: 0,
      req,
      overrideAccess: true,
    })

    const driverEmail = driverRecord?.email
    const driverName = driverRecord?.name || 'Driver'

    if (!driverEmail) {
      p.logger.warn(
        `[Booking Driver Dispatch] Skipping notification: No email found for driver ID ${driverId} on booking ${doc.id}`,
      )
      return
    }

    // Resolve Category ID from potential payload structures
    const rawCategoryField = doc.category || doc.tripCategory || doc.categoryName
    const categoryId =
      typeof rawCategoryField === 'object' ? rawCategoryField?.id : rawCategoryField

    // Resolve Vehicle, Operator, Category, and Zone concurrently
    const [vehicle, operator, tripCategoryDoc, zoneLabel] = await Promise.all([
      doc.vehicleNeeded
        ? typeof doc.vehicleNeeded === 'object'
          ? doc.vehicleNeeded
          : p
              .findByID({
                collection: 'trip-scheduling-vehicles',
                id: doc.vehicleNeeded,
                depth: 0,
                req,
              })
              .catch(() => null)
        : null,
      doc.operator
        ? typeof doc.operator === 'object'
          ? doc.operator
          : p
              .findByID({
                collection: 'operators',
                id: doc.operator,
                depth: 0,
                req,
              })
              .catch(() => null)
        : null,
      categoryId
        ? p
            .findByID({
              collection: 'trip-scheduling-categories',
              id: categoryId,
              depth: 0,
              req,
            })
            .catch(() => null)
        : null,
      getZoneLabel(doc.zones, p, req),
    ])

    // Extract display values with fallback handling
    const operatorName =
      (operator as any)?.title || (operator as any)?.name || 'Doha Oasis Business Unit'

    const tripCategory =
      (tripCategoryDoc as any)?.title ||
      (tripCategoryDoc as any)?.name ||
      (typeof rawCategoryField === 'object'
        ? rawCategoryField?.title || rawCategoryField?.name
        : rawCategoryField) ||
      'N/A'

    // The completion link uses the stored driverToken (generated in beforeChange of this same save).
    // Without one, the email still goes out but without the completion button, never with a broken link.
    const driverToken = await resolveDriverToken(p, req, 'trip-scheduling-bookings', doc)
    const basePortalUrl = BACKEND_URL_WITH_BASE
    const completeUrl = driverToken
      ? `${basePortalUrl}/trip-scheduling/booking/${doc.id}/complete?token=${encodeURIComponent(driverToken)}`
      : null
    if (!completeUrl) {
      p.logger.error(
        `[Booking Driver Dispatch] No driver token for booking ${doc.id}; sending the assignment email without the completion button.`,
      )
    }

    const fromEmail = getTripSchedulingEmailFrom()
    const emailSubject = `[Trip Assignment] Route: ${toSubjectText(doc.pickupLocation || 'Start')} to ${toSubjectText(doc.destination || 'End')}`

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
                        TRIP ASSIGNMENT &ndash; DISPATCH NOTICE
                      </h1>
                    </td>
                  </tr>

                  <!-- Card Body -->
                  <tr>
                    <td style="padding: 32px 30px;">
                      
                      <!-- Intro Message -->
                      <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; line-height: 1.5; margin: 0 0 24px 0;">
                        Hello ${escapeHtml(driverName)}, you have been assigned as the driver for a vehicle booking request.
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
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.fullName || doc.requesterName || 'N/A')}</td>
                          </tr>
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">PHONE NUMBER:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.phone || doc.phoneNumber || 'N/A')}</td>
                          </tr>
                        </table>

                        <!-- TRIP DETAILS SUBSECTION -->
                        <div style="color: #85754E; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; border-top: 1px dashed #dcd8cd; padding-top: 14px;">
                          &mdash; TRIP DETAILS:
                        </div>
                        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #222222; border-collapse: collapse;">
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">CATEGORY:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(String(tripCategory))}</td>
                          </tr>
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">OPERATOR:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(String(operatorName))}</td>
                          </tr>
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">PICK-UP LOCATION:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.pickupLocation || 'N/A')}</td>
                          </tr>
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">DESTINATION:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.destination || 'N/A')}</td>
                          </tr>
                          ${
                            zoneLabel
                              ? `
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">ZONE:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(zoneLabel)}</td>
                          </tr>`
                              : ''
                          }
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">TRAVEL DATE:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">
                              ${formatDateOnly(doc.travelDate)}
                            </td>
                          </tr>                          
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">TRAVEL TIME:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.travelTime || 'N/A')}</td>
                          </tr>
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">PASSENGERS:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${doc.passengers || doc.numberOfPassengers || 1}</td>
                          </tr>
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">VEHICLE NEEDED:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${escapeHtml((vehicle as any)?.name || 'Standard Passenger Fleet Unit')}</td>
                          </tr>
                          <tr>
                            <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">REASON FOR TRIP:</td>
                            <td class="dtl-val" style="padding: 4px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.reason || doc.reasonForTrip || 'N/A')}</td>
                          </tr>
                          ${
                            doc.approverNotes
                              ? `
                              <tr>
                                <td class="dtl-label" style="padding: 4px 0; font-weight: 700; color: ${DO_GREEN}; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">SPECIAL NOTES:</td>
                                <td class="dtl-val" style="padding: 4px 0; color: ${DO_GREEN}; font-weight: 700; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.approverNotes)}</td>
                              </tr>
                            `
                              : ''
                          }
                        </table>

                      </div>

                      ${
                        completeUrl
                          ? `
                        <!-- Section Header: ACTIONS REQUIRED -->
                        <div style="color: #85754E; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid #e5e2d9; padding-bottom: 6px;">
                          ACTIONS REQUIRED
                        </div>

                        <!-- Action Button -->
                        <div style="text-align: left; margin-bottom: 10px;">
                          <a href="${completeUrl}" target="_blank"  
                             style="background-color: #143422; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; letter-spacing: 1px; text-transform: uppercase;">
                             MARK TRIP AS COMPLETED
                          </a>
                        </div>
                          `
                          : ''
                      }

                    </td>
                  </tr>

                </table>

                <!-- Email Footer -->
                <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #777777; line-height: 1.6;">
                  This is an automated notification from Doha Oasis Workflow System.<br>
                  Please do not reply directly to this email.<br>
                  &copy; 2026 Doha Oasis
                </div>

              </td>
            </tr>
          </table>

        </body>
      </html>
    `

    // Queue email asynchronously via Payload job processing
    await p.jobs.queue({
      task: 'send-email',
      input: {
        to: driverEmail,
        from: fromEmail,
        subject: emailSubject,
        html: emailHtmlContent,
      },
    })

    p.logger.info(
      `[Booking Driver Dispatch] Successfully queued driver assignment email for ${driverEmail}`,
    )
  } catch (e) {
    p.logger.error(
      `[Booking Driver Dispatch] notifyDriverOnApproval breakdown: ${e instanceof Error ? e.message : String(e)}`,
    )
  }
}
