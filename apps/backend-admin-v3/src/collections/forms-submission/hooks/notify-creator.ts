import { Form, FormSubmission, User } from '@/payload-types'
import { CollectionAfterChangeHook } from 'payload'
import { generateEmailHtml } from '@/utilities/email-generator'

export const notifyCreatorOnSubmit: CollectionAfterChangeHook<FormSubmission> = async ({
  doc,
  req,
  operation,
}) => {
  // Only notify on new submissions
  if (operation !== 'create') return

  const formId = typeof doc.form === 'object' ? (doc.form as Form).id : doc.form
  if (!formId) return

  try {
    const form = (await req.payload.findByID({
      collection: 'forms',
      id: formId,
      depth: 0,
      overrideAccess: true,
      req,
    })) as Form

    if (!form?.notify_creator || !form?.creator_notification_content) return

    const creatorId = typeof doc.created_by === 'object' ? (doc.created_by as User).id : (doc.created_by as string)
    if (!creatorId) return

    const creator = (await req.payload.findByID({
      collection: 'users',
      id: creatorId,
      overrideAccess: true,
      req,
    })) as User

    if (!creator?.email) return

    const subject = `Form Submission: ${form.title}`
    const emailHtml = generateEmailHtml({
      title: subject,
      message: `Your submission for "${form.title}" has been successfully received.`,
      description: form.creator_notification_content,
      docId: doc.id,
    })

    await req.payload.sendEmail({
      to: creator.email,
      subject,
      html: emailHtml,
    })

    req.payload.logger.info(
      `[form-submissions] Notification email sent to creator ${creator.email} for submission ${doc.id}`,
    )
  } catch (error) {
    req.payload.logger.error(
      `[form-submissions] Error sending notification email to creator: ${error}`,
    )
  }
}
