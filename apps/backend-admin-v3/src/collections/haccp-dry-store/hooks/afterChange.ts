import type { CollectionAfterChangeHook } from 'payload'
import { sendHaccpNotification } from '@/common/components/haccp/utils/notifications'
import { generatePicApprovalEmail } from '../templates/pic-approval-email'
import { generateHicVerificationEmail } from '../templates/hic-verification-email'
import { generateRecordVerifiedEmail } from '../templates/record-verified-email'
import type { Outlet } from '@/payload-types'

export const afterChangeHook: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  req.payload.logger.info('--- [DRY STORE HOOK: afterChange] Triggered ---')
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
    // 1. Staff submitted to PIC (Pending PIC Approval)
    if (doc.status === 'pending-pic-approval' && previousDoc.status !== 'pending-pic-approval') {
      const emailContent = generatePicApprovalEmail({
        outletName,
        date: `Month/Year: ${doc.monthYear}`,
        documentId: doc.id,
      })

      await sendHaccpNotification({
        payload: req.payload,
        doc,
        targetRole: 'pic',
        subject: `[Dry Store Log] ${emailContent.subject}`,
        htmlContent: emailContent.html,
        workflowName: 'Dry Store Workflow',
      })
    }

    // 2. PIC submitted to HIC (Pending HIC Verification)
    if (
      doc.status === 'pending-hic-verification' &&
      previousDoc.status !== 'pending-hic-verification'
    ) {
      const emailContent = generateHicVerificationEmail({
        outletName,
        date: `Month/Year: ${doc.monthYear}`,
        documentId: doc.id,
      })

      await sendHaccpNotification({
        payload: req.payload,
        doc,
        targetRole: 'hic',
        subject: `[Dry Store Log] ${emailContent.subject}`,
        htmlContent: emailContent.html,
        workflowName: 'Dry Store Workflow',
      })
    }

    // 3. Final Verification (Verified -> Notification to PIC)
    if (doc.status === 'verified' && previousDoc.status !== 'verified') {
      const emailContent = generateRecordVerifiedEmail({
        outletName,
        date: `Month/Year: ${doc.monthYear}`,
        documentId: doc.id,
        collectionSlug: 'haccp-dry-store',
      })

      await sendHaccpNotification({
        payload: req.payload,
        doc,
        targetRole: 'pic',
        subject: `[Dry Store Log] ${emailContent.subject}`,
        htmlContent: emailContent.html,
        workflowName: 'Dry Store Workflow',
      })
    }
  } catch (err: any) {
    req.payload.logger.error(
      `[Dry Store Workflow] Failed to process notification hook: ${err?.message || err}`,
    )
  }

  return doc
}
