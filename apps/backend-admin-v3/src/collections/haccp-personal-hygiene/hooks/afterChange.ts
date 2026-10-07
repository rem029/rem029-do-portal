import type { CollectionAfterChangeHook } from 'payload'
import { sendHaccpNotification } from '@/common/components/haccp/utils/notifications'
import { generateHicVerificationEmail } from '../templates/hic-verification-email'
import { generateRecordVerifiedEmail } from '../templates/record-verified-email'
import type { Outlet, HaccpPersonalHygiene } from '@/payload-types'

export const afterChangeHook: CollectionAfterChangeHook<HaccpPersonalHygiene> = async ({
  doc,
  previousDoc,
  req,
}) => {
  req.payload.logger.info('--- [PERSONAL HYGIENE HOOK: afterChange] Triggered ---')
  req.payload.logger.info(`Current Status: ${doc.status} | Previous Status: ${previousDoc?.status}`)

  // Only proceed if status actually changed
  if (!previousDoc || doc.status === previousDoc.status) {
    return doc
  }

  const outletName =
    typeof doc.outlet === 'object' && doc.outlet !== null && 'name' in doc.outlet
      ? (doc.outlet as Outlet).name
      : 'Outlet'

  try {
    // 1. TRIGGER: Pending HIC Verification -> Queue Email Job for HIC (PIC Submitted)
    if (
      doc.status === 'pending-hic-verification' &&
      previousDoc.status !== 'pending-hic-verification'
    ) {
      const emailContent = generateHicVerificationEmail({
        outletName,
        date: new Date(doc.date).toLocaleDateString(),
        documentId: doc.id,
      })

      await sendHaccpNotification({
        payload: req.payload,
        doc,
        targetRole: 'hic',
        subject: `[Personal Hygiene Log] ${emailContent.subject}`,
        htmlContent: emailContent.html,
        workflowName: 'Personal Hygiene Workflow',
      })
    }

    // 2. TRIGGER: Verified -> Queue Email Job for PIC (Final Lock Confirmation)
    if (doc.status === 'verified' && previousDoc.status !== 'verified') {
      const emailContent = generateRecordVerifiedEmail({
        outletName,
        date: new Date(doc.date).toLocaleDateString(),
        documentId: doc.id,
        collectionSlug: 'haccp-personal-hygiene',
      })

      await sendHaccpNotification({
        payload: req.payload,
        doc,
        targetRole: 'pic',
        subject: `[Personal Hygiene Log] ${emailContent.subject}`,
        htmlContent: emailContent.html,
        workflowName: 'Personal Hygiene Workflow',
      })
    }
  } catch (err: any) {
    req.payload.logger.error(
      `[Personal Hygiene Workflow] Failed to process notification hook: ${err?.message || err}`,
    )
  }

  return doc
}
