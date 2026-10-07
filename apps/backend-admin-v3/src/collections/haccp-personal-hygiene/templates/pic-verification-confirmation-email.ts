import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

export function generatePicVerificationConfirmationEmail({
  outletName,
  date,
  documentId,
}: {
  outletName: string
  date: string
  documentId: string
}) {
  const viewUrl = `${BACKEND_URL_WITH_BASE}/admin/collections/haccp-personal-hygiene/${documentId}`

  return {
    subject: `[Verified] HACCP Personal Hygiene Checklist Verified - Outlet: ${outletName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #143422; border-bottom: 2px solid #DEC37D; padding-bottom: 8px;">Checklist Successfully Verified</h2>
        <p>The personal hygiene checklist for outlet <strong>${outletName}</strong> (Date: ${date}) has been officially verified and locked by the HIC.</p>
        <p>No further edits can be made to this record as it is now securely archived in compliance.</p>
        <div style="margin: 24px 0;">
          <a href="${viewUrl}" style="background: #00CF77; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Verified Record</a>
        </div>
        <p style="font-size: 12px; color: #777;">Banyan Tree Doha — Food Safety Management System</p>
      </div>
    `,
  }
}
