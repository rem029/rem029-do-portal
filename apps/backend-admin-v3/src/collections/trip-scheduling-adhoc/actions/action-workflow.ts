'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { isTokenMatch } from '@/utilities/trip-scheduling-approval-token'

interface WorkflowInput {
  id: string
  token: string
  status: 'approved' | 'declined' | string
  declineReason?: string
  driverId?: string
}

export async function processAdhocWorkflow(input: WorkflowInput) {
  const payload = await getPayload({ config })

  try {
    const { id, token, status, declineReason, driverId } = input

    if (!id || !token || !status) {
      return { success: false, error: 'Missing critical identification parameters.' }
    }

    const adhocRequest = await payload.findByID({
      collection: 'trip-scheduling-adhoc',
      id,
      depth: 0,
    })

    if (!adhocRequest || !isTokenMatch(adhocRequest.approvalToken, token)) {
      return { success: false, error: 'Invalid or expired verification security signature.' }
    }

    if (adhocRequest.status !== 'pending') {
      return { success: false, error: 'This ad-hoc workflow transaction is already finalized.' }
    }

    // A real, active driver record is required to approve; validated centrally in beforeValidate
    // (validateApprovalDriver), which also rejects an unknown or inactive id. This check exists only
    // to fail fast with a clearer message before that hook runs.
    if (status === 'approved' && !driverId) {
      return {
        success: false,
        error: 'Please assign a driver.',
      }
    }

    const updateData: Record<string, any> = { status }

    if (status === 'declined') {
      updateData.declineReason = declineReason
    } else {
      updateData.driver = driverId || null
    }

    await payload.update({
      collection: 'trip-scheduling-adhoc',
      id,
      overrideAccess: true,
      data: updateData,
    })

    return { success: true }
  } catch (err) {
    payload.logger.error(
      `[Public Adhoc Workflow Transaction Crash]: ${err instanceof Error ? err.message : String(err)}`,
    )
    return { success: false, error: 'Internal system engine transactional failure.' }
  }
}
