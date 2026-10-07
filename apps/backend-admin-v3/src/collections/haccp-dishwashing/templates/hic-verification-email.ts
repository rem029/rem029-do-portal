import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

interface DishwasherHicEmailParams {
  outletName: string
  unit?: string
  date: string
  documentId: string
}

export function generateHicVerificationEmail({
  outletName,
  unit,
  date,
  documentId,
}: DishwasherHicEmailParams) {
  const viewUrl = `${BACKEND_URL_WITH_BASE}/admin/collections/haccp-dishwashing-temperature/${documentId}`
  const unitLabel = unit ? ` (Unit: ${unit})` : ''

  const subject = `[Action Required] Dishwasher Temperature Log Pending HIC Verification - Outlet: ${outletName}`

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #143422; border-bottom: 2px solid #DEC37D; padding-bottom: 8px; margin-top: 0;">Checklist Pending Verification</h2>
      <p>A monthly dishwasher temperature and cleanliness monitoring record for outlet <strong>${outletName}</strong>${unitLabel} has been reviewed and approved by the Cafeteria In-Charge (PIC) and is now pending your final verification.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #eee;">
        <p style="margin: 5px 0;"><strong>Outlet / Location:</strong> ${outletName}</p>
        ${unit ? `<p style="margin: 5px 0;"><strong>Unit / Machine:</strong> ${unit}</p>` : ''}
        <p style="margin: 5px 0;"><strong>Month / Period:</strong> ${date}</p>
        <p style="margin: 5px 0; color: #DEC37D; font-weight: bold;">Status: Pending HIC Verification</p>
      </div>

      <p>Please review the meal period temperatures (Wash &ge; 55°C, Final Rinse &ge; 82°C), weekly descaling logs, and sign off to lock the record.</p>

      <div style="margin: 24px 0;">
        <a href="${viewUrl}" style="background: #00CF77; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Verify Dishwasher Log
        </a>
      </div>

      <p style="font-size: 12px; color: #777; border-top: 1px solid #e0e0e0; padding-top: 10px; margin-top: 30px;">
        Banyan Tree Doha — Food Safety Management System
      </p>
    </div>
  `

  return { subject, html }
}
