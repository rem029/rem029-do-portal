import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

export function generateHicVerificationEmail({
  outletName,
  date,
  documentId,
}: {
  outletName: string
  date: string
  documentId: string
}) {
  const reviewUrl = `${BACKEND_URL_WITH_BASE}/admin/collections/haccp-dry-store/${documentId}`

  return {
    subject: `[Action Required] HACCP Dry Store Checklist Pending Verification - Outlet: ${outletName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #143422; border-bottom: 2px solid #DEC37D; padding-bottom: 8px;">Dry Store Checklist Pending</h2>
        <p>A new dry store temperature and humidity log for outlet <strong>${outletName}</strong> (${date}) has been submitted by the PIC.</p>
        <p>It is currently awaiting your final review and verification.</p>
        <div style="margin: 24px 0;">
          <a href="${reviewUrl}" style="background: #143422; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review in Admin Panel</a>
        </div>
        <p style="font-size: 12px; color: #777;">Banyan Tree Doha — Food Safety Management System</p>
      </div>
    `,
  }
}
