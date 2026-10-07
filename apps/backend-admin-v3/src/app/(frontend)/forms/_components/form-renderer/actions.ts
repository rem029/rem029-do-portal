'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { createLocalReq } from 'payload'
import { Form, User, UsersAccess } from '@/payload-types'
import { isSurveyDepartmentSubmissionValid } from '@/utilities/survey-department'

export async function submitFormAction(data: {
  form: string
  submissionData: Array<{ field: string; value: string }>
}) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Retrieve the authenticated user from the request cookies (if any)
    const headersList = await getHeaders()
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    const form = (await payload.findByID({
      collection: 'forms',
      id: data.form,
      overrideAccess: true,
    })) as Form | null

    if (!form) throw new Error('Form not found')

    if (form.is_survey) {
      throw new Error(
        'This form is a survey and cannot be submitted here. Use your survey invitation link.',
      )
    }

    if (form.requires_auth && !user) {
      throw new Error('You must be logged in to submit this form.')
    }

    if (form.required_access && user) {
      const userAccess = user.access as UsersAccess
      const hasPermission =
        user.super_user ||
        userAccess?.access?.some((a) => a.slug === form.required_access && a.read === true)

      if (!hasPermission) {
        throw new Error(`Unauthorized. Required access: ${form.required_access}`)
      }
    }

    if (!(await isSurveyDepartmentSubmissionValid(payload, form, data.submissionData))) {
      throw new Error('Invalid submission.')
    }

    // Build a local request that carries the authenticated user so that
    // workflow hooks (workflowInit) can access req.user
    const req = await createLocalReq(
      { user: user ? { ...user, collection: 'users' } : undefined },
      payload,
    )

    const submission = await payload.create({
      collection: 'form-submissions',
      data: {
        form: data.form,
        submissionData: data.submissionData,
      },
      overrideAccess: true,
      req,
    })

    return { success: true, data: submission }
  } catch (error) {
    console.error('Error submitting form:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Something went wrong while submitting your form. Please contact admin.',
    }
  }
}

export async function resubmitFormAction(data: {
  originalSubmissionId: string
  submissionData: Array<{ field: string; value: string }>
}) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Retrieve the authenticated user from the request cookies (if any)
    const headersList = await getHeaders()
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    // Fetch original submission to get the form id
    const originalDoc = await payload.findByID({
      collection: 'form-submissions',
      id: data.originalSubmissionId,
      overrideAccess: true,
      depth: 1,
    })

    if (!originalDoc) throw new Error('Original submission not found')

    const formId =
      typeof originalDoc.form === 'object' ? (originalDoc.form as any).id : originalDoc.form

    const form = (await payload.findByID({
      collection: 'forms',
      id: formId,
      overrideAccess: true,
    })) as Form | null

    if (!form) throw new Error('Form not found')

    if (form.is_survey) {
      throw new Error(
        'This form is a survey and cannot be resubmitted here. Use your survey invitation link.',
      )
    }

    if (form.requires_auth && !user) {
      throw new Error('You must be logged in to resubmit this form.')
    }

    // Build a local request that carries the authenticated user
    const req = await createLocalReq(
      { user: user ? { ...user, collection: 'users' } : undefined },
      payload,
    )

    const submission = await payload.create({
      collection: 'form-submissions',
      data: {
        form: formId,
        submissionData: data.submissionData,
        previous_submission: data.originalSubmissionId,
      } as any,
      overrideAccess: true,
      req,
    })

    return { success: true, data: submission }
  } catch (error) {
    console.error('Error resubmitting form:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Something went wrong while resubmitting your form. Please contact admin.',
    }
  }
}

export async function uploadFileAction(formData: FormData) {
  try {
    const payload = await getPayload({ config: configPromise })
    const file = formData.get('file') as File
    const alt = formData.get('alt') as string

    if (!file) {
      throw new Error('No file provided')
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const media = await payload.create({
      collection: 'forms-media',
      data: {
        alt: alt || file.name,
      },
      file: {
        data: buffer,
        name: file.name,
        mimetype: file.type,
        size: file.size,
      },
      overrideAccess: true,
    })

    return {
      success: true,
      data: {
        id: media.id,
        url: media.url,
        filename: media.filename,
      },
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error uploading file',
    }
  }
}

export async function getFormAction(id: string, locale: string) {
  try {
    const payload = await getPayload({ config: configPromise })

    const form = await payload.findByID({
      collection: 'forms',
      id,
      locale: locale as any,
      overrideAccess: true,
      depth: 2,
    })

    return { success: true, data: form as Form }
  } catch (error) {
    console.error('Error fetching localized form:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error fetching localized form',
    }
  }
}

export async function getMediaAction(id: string) {
  try {
    const payload = await getPayload({ config: configPromise })
    const media = await payload.findByID({
      collection: 'forms-media',
      id,
      overrideAccess: true,
    })
    return {
      success: true,
      data: {
        url: media.url as string | null,
        filename: media.filename as string | null,
        mimeType: media.mimeType as string | null,
      },
    }
  } catch (error) {
    console.error('Error fetching media:', error)
    return { success: false, data: null }
  }
}
