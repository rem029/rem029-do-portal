import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

interface DryStorePicApprovalParams {
  outletName: string
  date: string
  documentId: string
}

export function generatePicApprovalEmail({
  outletName,
  date,
  documentId,
}: DryStorePicApprovalParams) {
  const viewUrl = `${BACKEND_URL_WITH_BASE}/admin/collections/haccp-dry-store/${documentId}`

  const subject = `[Action Required] Dry Store Checklist Pending PIC Approval - Outlet: ${outletName}`

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #143422; border-bottom: 2px solid #DEC37D; padding-bottom: 8px; margin-top: 0;">Checklist Pending PIC Approval</h2>
      <p>A new dry store temperature and pest monitoring record for outlet <strong>${outletName}</strong> (${date}) has been submitted by the staff and requires your review.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #eee;">
        <p style="margin: 5px 0;"><strong>Outlet / Location:</strong> ${outletName}</p>
        <p style="margin: 5px 0;"><strong>Period:</strong> ${date}</p>
        <p style="margin: 5px 0; color: #DEC37D; font-weight: bold;">Status: Pending PIC Approval</p>
      </div>

      <p>Please inspect the records and approve them to forward the checklist to the HIC team.</p>

      <div style="margin: 24px 0;">
        <a href="${viewUrl}" style="background: #143422; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Review in Admin Panel
        </a>
      </div>

      <p style="font-size: 12px; color: #777; border-top: 1px solid #e0e0e0; padding-top: 10px; margin-top: 30px;">
        Banyan Tree Doha — Food Safety Management System
      </p>
    </div>
  `

  return { subject, html }
}
