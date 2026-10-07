import type { CollectionAfterChangeHook } from 'payload'
import { sendHaccpNotification } from '@/common/components/haccp/utils/notifications'
import { generatePicApprovalEmail } from '../templates/pic-approval-email'
import { generateHicVerificationEmail } from '../templates/hic-verification-email'
import { generateRecordVerifiedEmail } from '../templates/record-verified-email'
import type { Outlet } from '@/payload-types'

export const afterChangeHook: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (!previousDoc || doc.status === previousDoc.status) {
    return doc
  }

  const outletName =
    typeof doc.outlet === 'object' && doc.outlet !== null && 'name' in doc.outlet
      ? (doc.outlet as Outlet).name
      : 'Outlet'

  // 1. Staff submitted to PIC
  if (doc.status === 'pending-pic-approval' && previousDoc.status !== 'pending-pic-approval') {
    const emailContent = generatePicApprovalEmail({
      outletName,
      date: new Date(doc.date).toLocaleDateString(),
      documentId: doc.id,
    })

    await sendHaccpNotification({
      payload: req.payload,
      doc,
      targetRole: 'pic',
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      workflowName: 'Buffet Workflow',
    })
  }

  // 2. PIC submitted to HIC
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
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      workflowName: 'Buffet Workflow',
    })
  }

  // 3. Final Verification (Verified & Locked)
  if (doc.status === 'verified' && previousDoc.status !== 'verified') {
    const emailContent = generateRecordVerifiedEmail({
      outletName,
      date: new Date(doc.date).toLocaleDateString(),
      documentId: doc.id,
      collectionSlug: 'haccp-buffet-temperature',
    })

    await sendHaccpNotification({
      payload: req.payload,
      doc,
      targetRole: 'pic',
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      workflowName: 'Buffet Workflow',
    })
  }

  return doc
}
