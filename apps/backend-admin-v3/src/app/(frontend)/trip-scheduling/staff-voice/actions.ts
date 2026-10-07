'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { TripSchedulingStaffVoice } from '@/payload-types'

export interface StaffVoiceSubmissionInput {
  fullName: string
  email: string
  // '' while the form's "Please select..." placeholder is still showing
  category: TripSchedulingStaffVoice['category'] | ''
  subject: string
  message: string
}

export type StaffVoiceSubmissionResult =
  | { success: true; docId: string }
  | { success: false; error: string }

// The collection sets no length limits and this form is public, so cap the free-text fields here.
// Keep in sync with the maxLength attributes in staff-voice-form.tsx.
const LIMITS = [
  { key: 'fullName', label: 'Full Name', max: 150 },
  { key: 'email', label: 'Email', max: 254 },
  { key: 'subject', label: 'Subject', max: 200 },
  { key: 'message', label: 'Message', max: 5000 },
] as const

interface FieldError {
  message?: string
}

// Payload's ValidationError keeps the useful per-field text (e.g. the email-domain rule) in
// err.data.errors; err.message only says "The following field is invalid: ...".
function getFieldErrorMessages(err: unknown): string[] {
  if (typeof err !== 'object' || err === null || !('data' in err)) return []

  const { data } = err as { data?: { errors?: FieldError[] } }

  return (data?.errors ?? [])
    .map((fieldError) => fieldError.message)
    .filter((message): message is string => Boolean(message))
}

export async function submitStaffVoice(
  input: StaffVoiceSubmissionInput,
): Promise<StaffVoiceSubmissionResult> {
  const payload = await getPayload({ config })

  try {
    const fullName = input.fullName?.trim()
    const email = input.email?.trim()
    const category = input.category
    const subject = input.subject?.trim()
    const message = input.message?.trim()

    // Basic structural guard
    if (!fullName || !email || !category || !subject || !message) {
      return {
        success: false,
        error: 'Please fill out all required fields marked with an asterisk (*).',
      }
    }

    const values = { fullName, email, subject, message }
    const overLimit = LIMITS.find(({ key, max }) => values[key].length > max)

    if (overLimit) {
      return {
        success: false,
        error: `${overLimit.label} must be ${overLimit.max} characters or fewer.`,
      }
    }

    // Create the document via Payload Local API. This fires the collection hooks: the email-domain
    // validation, created_by stamping, and the approver notification.
    const newDoc = await payload.create({
      collection: 'trip-scheduling-staff-voice',
      data: { fullName, email, category, subject, message, status: 'pending' },
    })

    return { success: true, docId: newDoc.id }
  } catch (err: unknown) {
    const fieldMessages = getFieldErrorMessages(err)
    const errorMsg =
      fieldMessages.length > 0
        ? fieldMessages.join(' ')
        : err instanceof Error
          ? err.message
          : 'An unexpected system error occurred during submission.'

    payload.logger.error(`[Staff Voice Form Submission Error]: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}
