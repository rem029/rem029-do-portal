import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { Form, FormSubmission, WorkflowInstance } from '@/payload-types'
import { Metadata } from 'next'
import { SubmissionReviewV1 } from './_components/submission-review-v1'
import { SubmissionReviewV2 } from './_components/submission-review-v2'

const SLUG = 'form-submissions'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })

  try {
    const doc = (await payload.findByID({
      collection: SLUG,
      id,
      overrideAccess: true,
      depth: 1,
    })) as FormSubmission

    const formTitle =
      doc?.form && typeof doc.form === 'object' ? (doc.form as Form).title : 'Form Submission'

    return {
      title: `Doha Oasis | Form Submission | ${formTitle}`,
    }
  } catch {
    return { title: 'Doha Oasis | Form Submission' }
  }
}

export default async function FormSubmissionReviewPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { token } = await searchParams

  const payload = await getPayload({ config: configPromise })

  // Determine V1 vs V2 by checking for a linked workflow-instance record
  const instanceResult = await payload.find({
    collection: 'workflow-instances',
    where: {
      and: [
        { document_collection: { equals: 'form-submissions' } },
        { document_id: { equals: id } },
      ],
    },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const workflowInstance = (instanceResult.docs[0] as WorkflowInstance) ?? null

  if (workflowInstance) {
    return <SubmissionReviewV2 id={id} token={token} workflowInstance={workflowInstance} />
  }
  return <SubmissionReviewV1 id={id} token={token} />
}
