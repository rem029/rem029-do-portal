import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

interface PersonalHygieneHicParams {
  outletName: string
  date: string
  documentId: string
}

export function generateHicVerificationEmail({
  outletName,
  date,
  documentId,
}: PersonalHygieneHicParams) {
  const reviewUrl = `${BACKEND_URL_WITH_BASE}/admin/collections/haccp-personal-hygiene/${documentId}`

  const subject = `[Action Required] HACCP Personal Hygiene Checklist Pending Verification - Outlet: ${outletName}`

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #143422; border-bottom: 2px solid #DEC37D; padding-bottom: 8px; margin-top: 0;">Personal Hygiene Checklist Pending</h2>
      <p>A new personal hygiene checklist for outlet <strong>${outletName}</strong> (Date: ${date}) has been submitted by the PIC and is currently awaiting your final review and verification.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #eee;">
        <p style="margin: 5px 0;"><strong>Outlet / Location:</strong> ${outletName}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 5px 0; color: #85754E; font-weight: bold;">Status: Pending HIC Verification</p>
      </div>

      <p>Please review the checklist details and sign off to lock the record.</p>

      <div style="margin: 24px 0;">
        <a href="${reviewUrl}" style="background: #143422; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
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
