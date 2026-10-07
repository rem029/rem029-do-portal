// Server-only: the "trip settled" approver notification sent when a trip is settled, by the driver
// (completeTrip action) or automatically (recipients, subject, HTML, per-recipient queueing). Not 'use server'.
import type { Payload } from 'payload'
import type { TripCompletionSlug, TripCompletionView } from './complete-trip-load'
import { escapeHtml } from '@/utilities/escape-html'
import { toSubjectText } from '@/utilities/email-subject'
import { getTripSchedulingEmailFrom } from '@/utilities/trip-scheduling-email'

const DO_GOLD = '#DEC37D'
const DO_GREEN = '#143422'

const SLUG_COPY: Record<
  TripCompletionSlug,
  { subjectPrefix: string; headerTitle: string; runLabel: string }
> = {
  'trip-scheduling-bookings': {
    subjectPrefix: '[Trip Log Settled]',
    headerTitle: 'TRIP COMPLETION &ndash; DISPATCH ALERT',
    runLabel: 'transit run assignment',
  },
  'trip-scheduling-adhoc': {
    subjectPrefix: '[Adhoc Trip Settled]',
    headerTitle: 'ADHOC TRIP COMPLETION &ndash; DISPATCH ALERT',
    runLabel: 'ad-hoc transit run assignment',
  },
}

async function getApproverEmails(payload: Payload): Promise<string[]> {
  try {
    const settings = await payload.findGlobal({ slug: 'trip-scheduling-settings', depth: 0 })
    const emails = (settings.notificationEmails ?? []).map((item) => item?.email).filter(Boolean)
    return Array.from(new Set(emails))
  } catch (err) {
    payload.logger.error(`[Complete Trip] Error fetching global settings: ${err}`)
    return []
  }
}

export type TripSettledSource = 'driver' | 'auto'

function buildTripSettledEmail(
  slug: TripCompletionSlug,
  trip: TripCompletionView,
  source: TripSettledSource,
) {
  const copy = SLUG_COPY[slug]
  const passengerName = trip.requesterName || 'N/A'
  const routeStr = trip.pickup || 'Specified Location'
  const destinationStr = trip.destination || 'N/A'
  const assignedDriverName = trip.driverName || 'Assigned Driver'
  // Empty when there's no zone (always for adhoc), so that email stays unchanged.
  const zoneRow = trip.zone
    ? `
                          <tr>
                            <td class="dtl-label" style="padding: 6px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">ZONE:</td>
                            <td class="dtl-val" style="padding: 6px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(trip.zone)}</td>
                          </tr>`
    : ''

  const completedTag = `<strong style="color: ${DO_GREEN};">COMPLETED</strong>`
  const completionClause =
    source === 'auto'
      ? `was automatically marked as ${completedTag} after the driver completion window closed. The driver did not confirm this trip:`
      : `has been logged as ${completedTag} by the field driver:`

  const subject = `${copy.subjectPrefix} Completed: ${toSubjectText(passengerName)}${source === 'auto' ? ' (auto-completed)' : ''}`
  const html = `
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
                        ${copy.headerTitle}
                      </h1>
                    </td>
                  </tr>

                  <!-- Card Body -->
                  <tr>
                    <td style="padding: 32px 30px;">

                      <!-- Intro Message -->
                      <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; line-height: 1.5; margin: 0 0 24px 0;">
                        The following ${copy.runLabel} ${completionClause}
                      </p>

                      <!-- Section Header: TRIP & REQUEST DETAILS -->
                      <div style="color: #85754E; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #e5e2d9; padding-bottom: 6px;">
                        TRIP & REQUEST DETAILS
                      </div>

                      <!-- Inner Beige Details Card -->
                      <div style="background-color: #f2efe9; border-radius: 12px; padding: 20px 22px; margin-bottom: 28px;">

                        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #222222; border-collapse: collapse;">
                          <tr>
                            <td class="dtl-label" style="padding: 6px 0; font-weight: 700; color: #333333; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">LEAD PASSENGER:</td>
                            <td class="dtl-val" style="padding: 6px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(passengerName)}</td>
                          </tr>
                          <tr>
                            <td class="dtl-label" style="padding: 6px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">ASSIGNED DRIVER:</td>
                            <td class="dtl-val" style="padding: 6px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(assignedDriverName)}</td>
                          </tr>
                          <tr>
                            <td class="dtl-label" style="padding: 6px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">TRANSIT ROUTE:</td>
                            <td class="dtl-val" style="padding: 6px 0; color: #111111; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(routeStr)} &rarr; ${escapeHtml(destinationStr)}</td>
                          </tr>${zoneRow}
                          <tr>
                            <td class="dtl-label" style="padding: 6px 0; font-weight: 700; color: #333333; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">COMPLETION TIME:</td>
                            <td class="dtl-val" style="padding: 6px 0; color: #111111; font-weight: 600; word-break: break-word; overflow-wrap: break-word;">${new Date().toLocaleString('en-US', { timeZone: 'Asia/Qatar' })}</td>
                          </tr>
                        </table>

                      </div>

                      <!-- Outro Note -->
                      <p style="font-size: 13px; color: #555555; line-height: 1.5; margin: 0;">
                        The assigned vehicle and driver are now available for new assignments.
                      </p>

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

  return { subject, html }
}

export async function queueTripSettledEmails(
  payload: Payload,
  slug: TripCompletionSlug,
  id: string,
  trip: TripCompletionView,
  source: TripSettledSource,
): Promise<void> {
  const approverEmails = await getApproverEmails(payload)

  // No fallback recipient: with no approvers configured the notification is skipped.
  if (approverEmails.length === 0) {
    payload.logger.warn(
      `[Complete Trip] No approver emails configured in trip-scheduling-settings; skipping dispatch notification for ${slug}/${id}.`,
    )
    return
  }

  const { subject, html } = buildTripSettledEmail(slug, trip, source)

  for (const recipientEmail of approverEmails) {
    try {
      await payload.jobs.queue({
        task: 'send-email',
        input: {
          to: recipientEmail,
          from: getTripSchedulingEmailFrom(),
          subject,
          html,
        },
      })
    } catch (err) {
      payload.logger.error(`[Complete Trip] Failed to queue email job for ${recipientEmail}: ${err}`)
    }
  }
}
