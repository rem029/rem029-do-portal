import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

interface DishwasherPicApprovalParams {
  outletName: string
  unit?: string
  date: string
  documentId: string
}

export function generatePicApprovalEmail({
  outletName,
  unit,
  date,
  documentId,
}: DishwasherPicApprovalParams) {
  const viewUrl = `${BACKEND_URL_WITH_BASE}/admin/collections/haccp-dishwashing-temperature/${documentId}`
  const unitLabel = unit ? ` (Unit: ${unit})` : ''

  const subject = `[Verified] Dishwasher Temperature Log Verified & Locked - Outlet: ${outletName}`

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #143422; border-bottom: 2px solid #DEC37D; padding-bottom: 8px; margin-top: 0;">Checklist Successfully Verified</h2>
      <p>The dishwasher temperature and cleanliness monitoring record for outlet <strong>${outletName}</strong>${unitLabel} (Period: ${date}) has been officially verified and locked by the HIC.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #eee;">
        <p style="margin: 5px 0;"><strong>Outlet / Location:</strong> ${outletName}</p>
        ${unit ? `<p style="margin: 5px 0;"><strong>Unit / Machine:</strong> ${unit}</p>` : ''}
        <p style="margin: 5px 0;"><strong>Month / Period:</strong> ${date}</p>
        <p style="margin: 5px 0; color: #00CF77; font-weight: bold;">Status: Verified & Locked</p>
      </div>

      <p>No further edits can be made to this record as it is now securely archived in compliance with HACCP standards.</p>

      <div style="margin: 24px 0;">
        <a href="${viewUrl}" style="background: #00CF77; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          View Verified Record
        </a>
      </div>

      <p style="font-size: 12px; color: #777; border-top: 1px solid #e0e0e0; padding-top: 10px; margin-top: 30px;">
        Banyan Tree Doha — Food Safety Management System
      </p>
    </div>
  `

  return { subject, html }
}
