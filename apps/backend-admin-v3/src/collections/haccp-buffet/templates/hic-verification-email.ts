import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

interface BuffetHicEmailParams {
  outletName: string
  date: string
  documentId: string
}

export function generateHicVerificationEmail({
  outletName,
  date,
  documentId,
}: BuffetHicEmailParams) {
  const reviewUrl = `${BACKEND_URL_WITH_BASE}/admin/collections/haccp-buffet-temperature/${documentId}`

  const subject = `[Action Required] Buffet Temperature Checklist Pending HIC Verification - Outlet: ${outletName}`

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #143422; border-bottom: 2px solid #DEC37D; padding-bottom: 8px; margin-top: 0;">Checklist Pending Verification</h2>
      <p>A buffet temperature monitoring record for outlet <strong>${outletName}</strong> (${date}) has been reviewed and approved by the PIC and is now pending your final verification.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #eee;">
        <p style="margin: 5px 0;"><strong>Outlet / Location:</strong> ${outletName}</p>
        <p style="margin: 5px 0;"><strong>Period:</strong> ${date}</p>
        <p style="margin: 5px 0; color: #DEC37D; font-weight: bold;">Status: Pending HIC Verification</p>
      </div>

      <p>Please review the temperature logs and sign off to lock the record.</p>

      <div style="margin: 24px 0;">
        <a href="${reviewUrl}" style="background: #00CF77; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Verify Buffet Log
        </a>
      </div>

      <p style="font-size: 12px; color: #777; border-top: 1px solid #e0e0e0; padding-top: 10px; margin-top: 30px;">
        Banyan Tree Doha — Food Safety Management System
      </p>
    </div>
  `

  return { subject, html }
}
