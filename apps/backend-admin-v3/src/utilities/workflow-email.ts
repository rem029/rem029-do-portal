import { PayloadRequest } from 'payload'
import { Department, User, WorkflowV2 } from '@/payload-types'

type NotificationRecipient = NonNullable<WorkflowV2['approval_notifications']>[number]

// Helper: read a nested value from an object using dot-notation
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc != null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

/**
 * Resolves an array of NotificationRecipient configs into an array of distinct email strings.
 */
export async function resolveNotificationEmails(
  req: PayloadRequest,
  recipients: NotificationRecipient[],
  sourceDoc: Record<string, unknown>
): Promise<string[]> {
  const emails = new Set<string>()

  for (const recipient of recipients) {
    switch (recipient.type) {
      case 'email':
        if (recipient.email) emails.add(recipient.email)
        break

      case 'form_email':
        // Typically a direct 'email' field on the document
        if (typeof sourceDoc.email === 'string' && sourceDoc.email.includes('@')) {
          emails.add(sourceDoc.email)
        }
        break

      case 'department': {
        const deptId = typeof recipient.department === 'object' ? recipient.department?.id : recipient.department
        if (deptId) {
          const dept = await req.payload.findByID({
            collection: 'departments',
            id: String(deptId),
            depth: 0,
            overrideAccess: true,
            req
          }) as Department
          if (dept.manager_email) emails.add(dept.manager_email)
        }
        break
      }

      case 'requestor_department': {
        const u = req.user as User
        if (u && typeof u.department === 'object' && (u.department as Department).manager_email) {
          emails.add((u.department as Department).manager_email!)
        } else if (u && typeof u.department === 'string') {
          const dept = await req.payload.findByID({
            collection: 'departments',
            id: String(u.department),
            depth: 0,
            overrideAccess: true,
            req
          }) as Department
          if (dept.manager_email) emails.add(dept.manager_email)
        }
        break
      }

      case 'created_by': {
        // Check source doc owner
        const createdById = typeof sourceDoc.created_by === 'object' ? (sourceDoc.created_by as User)?.id : sourceDoc.created_by
        if (createdById) {
          const creator = await req.payload.findByID({
            collection: 'users',
            id: String(createdById),
            overrideAccess: true,
            req
          }) as User
          if (creator.email) emails.add(creator.email)
        } else if (req.user?.email) {
          emails.add(req.user.email)
        }
        break
      }

      case 'employee': {
        // Usually an 'employee' relationship on the source doc
        const employeeId = typeof sourceDoc.employee === 'object' ? (sourceDoc.employee as Record<string, unknown>)?.id : sourceDoc.employee
        if (employeeId) {
           const emp = await req.payload.findByID({
             collection: 'users',
             id: String(employeeId),
             overrideAccess: true,
             req
           }) as User
           if (emp.email) emails.add(emp.email)
        }
        break
      }

      case 'document_field': {
        const path = recipient.document_field_path
        if (path) {
          let val = getValueByPath(sourceDoc, path)
          if (val == null) {
            // Form submissions store answers in submissionData [{field, value}] —
            // fall back to matching the path against a submission field name.
            const submissionData = sourceDoc.submissionData as
              | Array<{ field: string; value: unknown }>
              | undefined
            const match = submissionData?.find((item) => item.field === path)
            val = match?.value
          }
          if (typeof val === 'string' && val.includes('@')) {
            emails.add(val)
          } else if (val && typeof val === 'object' && (val as User).email) {
            emails.add((val as User).email)
          }
        }
        break
      }
    }
  }

  return Array.from(emails)
}

/**
 * Resolves dynamic emails and dispatches payload.sendEmail for each.
 */
export async function dispatchWorkflowNotifications(
  req: PayloadRequest,
  recipients: NotificationRecipient[],
  sourceDoc: Record<string, unknown>,
  subject: string,
  htmlContext: string
) {
  if (!recipients || recipients.length === 0) return

  const emails = await resolveNotificationEmails(req, recipients, sourceDoc)
  if (emails.length === 0) return

  // Check if there is a custom email override among the recipients
  const customText = recipients.find(r => r.custom_email_text)?.custom_email_text
  
  const finalHtml = customText 
    ? `<p>${customText}</p><hr/><p>${htmlContext}</p>` 
    : `<p>${htmlContext}</p>`

  for (const email of emails) {
    try {
      await req.payload.sendEmail({
        to: email,
        subject,
        html: finalHtml,
      })
      req.payload.logger.info(`[Workflow Notifications] Sent "${subject}" to ${email}`)
    } catch (err) {
      req.payload.logger.error(`[Workflow Notifications] Failed to send to ${email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}
