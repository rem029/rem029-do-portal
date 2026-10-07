import type { Payload } from 'payload'
import type { HaccpOutletSetting, Outlet } from '@/payload-types'

interface SendHaccpNotificationParams {
  payload: Payload
  doc: any
  targetRole: 'pic' | 'hic' | 'escalation'
  subject: string
  htmlContent: string
  workflowName?: string
}

export const getHaccpEmailFrom = (): string | undefined => {
  const address = process.env.SMTP_FROM_ADDRESS
  return address ? `"HACCP System" <${address}>` : undefined
}

export async function sendHaccpNotification({
  payload,
  doc,
  targetRole,
  subject,
  htmlContent,
  workflowName = 'HACCP Workflow',
}: SendHaccpNotificationParams) {
  try {
    // 1. Extract outlet ID and Name safely from document
    const outletId =
      typeof doc.outlet === 'object' && doc.outlet !== null ? (doc.outlet as Outlet).id : doc.outlet

    const outletName =
      typeof doc.outlet === 'object' && doc.outlet !== null && 'name' in doc.outlet
        ? (doc.outlet as Outlet).name
        : 'Outlet'

    if (!outletId) {
      payload.logger.warn(
        `[${workflowName}] Missing outlet ID on document. Cannot route notification.`,
      )
      return
    }

    // 2. Fetch the corresponding outlet settings document from the new collection
    const settingsQuery = await payload.find({
      collection: 'haccp-outlet-settings',
      where: {
        outlet: {
          equals: outletId,
        },
      },
      depth: 1,
      limit: 1,
      overrideAccess: true,
    })

    const settings = settingsQuery.docs[0] as HaccpOutletSetting | undefined

    if (!settings) {
      payload.logger.warn(
        `[${workflowName}] No HACCP outlet settings found for outlet ID: ${outletId}`,
      )
      return
    }

    // 3. Resolve target emails based on role from the collection arrays
    let emails: string[] = []

    if (targetRole === 'pic' && settings?.picEmails) {
      emails = settings.picEmails
        .map((item: any) => item?.email)
        .filter((email): email is string => Boolean(email))
    } else if (targetRole === 'hic' && settings?.hicEmails) {
      emails = settings.hicEmails
        .map((item: any) => item?.email)
        .filter((email): email is string => Boolean(email))
    }

    // Clean up and deduplicate email entries
    emails = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)))

    payload.logger.info(
      `[${workflowName}] Resolved ${targetRole.toUpperCase()} target email(s) for ${outletName}: ${emails.join(', ')}`,
    )

    if (emails.length === 0) {
      payload.logger.warn(
        `[${workflowName}] No valid ${targetRole.toUpperCase()} email found for outlet settings.`,
      )
      return
    }

    // 4. Queue payload jobs for each email recipient
    for (const email of emails) {
      await payload.jobs.queue({
        task: 'send-email',
        input: {
          to: email,
          from: getHaccpEmailFrom(),
          subject,
          html: htmlContent,
        },
      })
      payload.logger.info(`[${workflowName}] Queued send-email job for ${email}`)
    }
  } catch (err: any) {
    payload.logger.error(`[${workflowName}] Failed to dispatch notification: ${err.message}`)
  }
}
