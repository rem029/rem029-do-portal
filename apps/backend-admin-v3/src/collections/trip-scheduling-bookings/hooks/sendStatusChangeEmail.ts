import type { CollectionAfterChangeHook, Payload } from 'payload'
import { TripSchedulingDriver, Operator } from '@/payload-types'
import { formatDateOnly } from '@/utilities/helper/datetime-utils'
import { escapeHtml } from '@/utilities/escape-html'
import { getZoneLabel } from './notifications'
import { getTripSchedulingEmailFrom } from '@/utilities/trip-scheduling-email'

const DO_GOLD = '#DEC37D'
const DO_GREEN = '#143422'
const PH_RED = '#ED1C24'

// Helper function to resolve relationship display names safely
async function getRelationshipName(
  relationshipId: any,
  collectionSlug: string,
  payload: Payload,
): Promise<string> {
  if (!relationshipId) return 'N/A'
  const id = typeof relationshipId === 'object' ? relationshipId?.id : relationshipId
  if (!id) return 'N/A'
  try {
    const targetDoc = await payload.findByID({
      collection: collectionSlug as any,
      id,
      depth: 0,
    })
    return (targetDoc as any)?.name || (targetDoc as any)?.title || id
  } catch {
    return 'Asset Unit'
  }
}

export const sendStatusChangeEmail: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (!req || !doc) return

  // 🛡️ PLUG IN CONTEXT BARRICADE: Prevent duplicate delivery executions in the same request thread
  const contextKey = `sent_email_${doc.id}_${doc.status}`
  if (req.context[contextKey]) return

  const docRecord = doc as unknown as Record<string, unknown>
  const submissionArray = (docRecord.submission_data || docRecord.submissionData || []) as Array<
    Record<string, unknown>
  >

  // 🎯 LIFEJACKET: Extract email from top-level OR form submission array
  let recipientEmail =
    doc.email ||
    doc.requesterEmail ||
    (Array.isArray(submissionArray)
      ? (submissionArray.find((f: any) => f.field === 'email' || f.field === 'requesterEmail')
          ?.value as string)
      : null)

  if (recipientEmail) {
    recipientEmail = recipientEmail.trim()
  }

  if (!recipientEmail || recipientEmail === 'NA') {
    req.payload.logger.warn(
      `[Booking Hook] Skipped status change email: No valid email address found on doc ID ${doc.id}`,
    )
    return
  }

  // 🎯 LIFEJACKET: Extract fullName from top-level OR form submission array
  const recipientName =
    doc.fullName ||
    doc.requesterName ||
    doc.name ||
    (Array.isArray(submissionArray)
      ? (submissionArray.find((f: any) => f.field === 'fullName' || f.field === 'name')
          ?.value as string)
      : 'Valued Guest')

  const isCreate = operation === 'create'

  const docStatus = (doc.status || 'pending').toLowerCase()
  const prevStatus = (previousDoc?.status || 'pending').toLowerCase()
  const isStatusChanged = previousDoc && docStatus !== prevStatus

  if (docStatus === 'pending' && operation === 'update') return
  if (!isCreate && !isStatusChanged) return

  const p = req.payload
  const isDeclined = docStatus === 'declined' || docStatus === 'rejected'
  const isApproved = docStatus === 'approved'
  const isCompleted = docStatus === 'completed'

  let statusLabel = docStatus.toUpperCase()
  if (isApproved) statusLabel = 'APPROVED'
  else if (isDeclined) statusLabel = 'DECLINED'
  else if (isCompleted) statusLabel = 'COMPLETED'
  else if (docStatus === 'pending') statusLabel = 'PENDING REVIEW'

  // 🎯 CLEAN SUBJECT LINE (No long ugly UUIDs!)
  const dynamicSubject = isCreate
    ? `[Vehicle Booking Request] Received: Pending Review`
    : `[Vehicle Booking Request] Update: ${statusLabel}`

  try {
    req.context[contextKey] = true

    const rawCategoryField =
      doc.tripCategory ||
      doc.trip_category ||
      (Array.isArray(submissionArray)
        ? submissionArray.find(
            (f: any) =>
              f.field === 'tripCategory' || f.field === 'trip_category' || f.field === 'category',
          )?.value
        : null)

    const categoryId =
      typeof rawCategoryField === 'object' && rawCategoryField !== null
        ? (rawCategoryField as any).id
        : rawCategoryField

    // Resolve relationship strings concurrently
    const [vehicleName, operatorDocResult, tripCategoryDoc, zoneLabel] = await Promise.all([
      getRelationshipName(doc?.vehicleNeeded, 'trip-scheduling-vehicles', p),
      doc.operator
        ? p.findByID({
            collection: 'operators',
            id:
              typeof doc.operator === 'object' && doc.operator !== null
                ? doc.operator.id
                : (doc.operator as string),
            depth: 0,
          })
        : null,
      categoryId
        ? p
            .findByID({
              collection: 'trip-scheduling-categories',
              id: categoryId as string,
              depth: 0,
            })
            .catch(() => null)
        : null,
      getZoneLabel(doc?.zones, p),
    ])

    const operatorDoc = operatorDocResult as unknown as Operator | null
    const operatorName = operatorDoc?.title || 'Doha Oasis Business Unit'

    const tripCategory =
      (tripCategoryDoc as any)?.title ||
      (tripCategoryDoc as any)?.name ||
      (typeof rawCategoryField === 'object' && rawCategoryField !== null
        ? (rawCategoryField as any).title || (rawCategoryField as any).name
        : rawCategoryField) ||
      'N/A'

    // Resolve Driver specifications if approved state is triggered
    let driverDetailsString = 'Pending Assignment'
    if (isApproved && doc.driver) {
      if (typeof doc.driver === 'object' && doc.driver !== null) {
        const embeddedDriver = doc.driver as unknown as TripSchedulingDriver
        const dName = embeddedDriver.name || 'Assigned Driver'
        const dPhone = embeddedDriver.phone || ''
        driverDetailsString = dPhone
          ? `${escapeHtml(dName)} (${escapeHtml(dPhone)})`
          : escapeHtml(dName)
      } else {
        try {
          const driverDoc = (await p.findByID({
            collection: 'trip-scheduling-drivers',
            id: doc.driver as string,
            depth: 0,
          })) as unknown as TripSchedulingDriver

          if (driverDoc) {
            const dPhone = driverDoc.phone || ''
            driverDetailsString = dPhone
              ? `${escapeHtml(driverDoc.name)} (${escapeHtml(dPhone)})`
              : escapeHtml(driverDoc.name)
          }
        } catch {
          driverDetailsString = 'Assigned (Details unavailable)'
        }
      }
    }

    const declineReasonBlock =
      isDeclined && doc.declineReason
        ? `
      <div style="margin: 0 0 24px 0; padding: 15px; background-color: #fff5f5; border-left: 4px solid ${PH_RED}; border-radius: 4px;">
        <strong style="color: ${PH_RED}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Reason for Decline:</strong>
        <p style="margin: 5px 0 0 0; color: #333333; font-style: italic; font-size: 13px;">"${escapeHtml(doc.declineReason)}"</p>
      </div>`
        : ''

    const formattedDate = formatDateOnly(doc.travelDate)

    const fromEmail = getTripSchedulingEmailFrom()

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
                VEHICLE BOOKING REQUEST
              </h1>
              <p style="color: ${DO_GOLD}; margin: 6px 0 0 0; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">
                – ${statusLabel} –
              </p>
            </td>
          </tr>

          <!-- 📄 MAIN BODY CONTAINER -->
          <tr>
            <td style="padding: 30px 25px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #222222;">Hello <strong>${escapeHtml(String(recipientName))}</strong>,</p>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a4a4a;">
                ${isCreate ? 'Your vehicle booking request has been received and is currently under operational review.' : `Your vehicle booking request status has been updated to <strong style="color: ${isDeclined ? PH_RED : DO_GREEN}; text-transform: uppercase;">${statusLabel}</strong>.`}
              </p>

              ${declineReasonBlock}

              <!-- 🟡 GOLD SECTION HEADER -->
              <h3 style="margin: 24px 0 12px 0; color: #85754E; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;">
                TRIP DETAILS
              </h3>
              <hr style="border: 0; border-top: 1px solid ${DO_GOLD}; margin: 0 0 20px 0;" />

              <!-- 📦 INNER BEIGE CARD CONTAINER -->
              <div style="background-color: #edebe6; border-radius: 8px; padding: 20px 20px 10px 20px; margin-bottom: 25px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 2.1;">
                  <tr>
                    <td class="dtl-label" width="38%" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">OPERATOR:</td>
                    <td class="dtl-val" width="62%" style="color: #111111; font-weight: 600; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(operatorName)}</td>
                  </tr>
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">REQUESTER NAME:</td>
                    <td class="dtl-val" style="color: #111111; font-weight: 600; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(String(recipientName))}</td>
                  </tr>
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">TRIP CATEGORY:</td>
                    <td class="dtl-val" style="color: #111111; font-weight: 600; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(String(tripCategory))}</td>
                  </tr>
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">TOTAL PASSENGERS:</td>
                    <td class="dtl-val" style="color: #111111; font-weight: 600; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${doc.passengers || 1} Person(s)</td>
                  </tr>
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">VEHICLE REQUESTED:</td>
                    <td class="dtl-val" style="color: #111111; font-weight: 600; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(vehicleName)}</td>
                  </tr>
                  ${
                    isApproved
                      ? `
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">ASSIGNED DRIVER:</td>
                    <td class="dtl-val" style="color: ${DO_GREEN}; font-weight: 700; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${driverDetailsString}</td>
                  </tr>`
                      : ''
                  }
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">PICK-UP LOCATION:</td>
                    <td class="dtl-val" style="color: ${DO_GREEN}; font-weight: 700; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.pickupLocation || 'N/A')}</td>
                  </tr>
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">DESTINATION:</td>
                    <td class="dtl-val" style="color: ${DO_GREEN}; font-weight: 700; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.destination || 'N/A')}</td>
                  </tr>
                  ${
                    zoneLabel
                      ? `
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">ZONE:</td>
                    <td class="dtl-val" style="color: ${DO_GREEN}; font-weight: 700; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(zoneLabel)}</td>
                  </tr>`
                      : ''
                  }
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">TRAVEL DATE:</td>
                    <td class="dtl-val" style="color: #111111; font-weight: 600; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">TRAVEL TIME:</td>
                    <td class="dtl-val" style="color: #111111; font-weight: 600; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(doc.travelTime || 'N/A')}</td>
                  </tr>
                  <tr>
                    <td class="dtl-label" style="color: #555555; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding: 3px 0;">PURPOSE STATEMENT:</td>
                    <td class="dtl-val" style="color: #444444; font-weight: 500; font-style: italic; padding: 3px 0; word-break: break-word; overflow-wrap: break-word;">"${escapeHtml(doc.reason || 'No specific purpose declared.')}"</td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0; font-size: 13px; color: #666666;">
                ${isCreate ? 'Our logistics team is reviewing your request. An update will be sent as soon as it is processed.' : 'You can reference this update for your transportation records.'}
              </p>
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

    await p.jobs.queue({
      task: 'send-email',
      input: {
        to: recipientEmail,
        from: fromEmail,
        subject: dynamicSubject,
        html: emailHtmlContent,
      },
    })

    p.logger.info(
      `[Booking Hook] Status update job queued for ${recipientEmail} (State: ${docStatus})`,
    )
  } catch (err) {
    delete req.context[contextKey]
    const message = err instanceof Error ? err.message : String(err)
    p.logger.error(`[Booking Hook] Queueing Status Change Email Failed: ${message}`)
  }
}
