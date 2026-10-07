import { describe, expect, it } from 'vitest'
import type { PayloadRequest } from 'payload'
import { resolveApproverEmail, type ApproverDef } from '@/utilities/workflow-instance'
import { resolveDynamicReviewerTokenEntry } from '@/collections/workflow-v2/hooks/before-change'

const noopLogger = { info: () => {}, warn: () => {}, error: () => {} }

function fakeReq(storeDepartments: Record<string, { manager: { email: string } | null }>): PayloadRequest {
  return {
    payload: {
      logger: noopLogger,
      findByID: async ({ collection, id }: { collection: string; id: string }) => {
        if (collection !== 'store-departments') throw new Error(`Unexpected collection: ${collection}`)
        const dept = storeDepartments[id]
        if (!dept) throw new Error(`Store department not found: ${id}`)
        return dept
      },
    },
    user: undefined,
  } as unknown as PayloadRequest
}

const baseApprover: ApproverDef = {
  approver_type: 'store_department_field',
  approver_email: null,
  department: null,
  document_department_field_path: null,
  approver_form_field_path: null,
  approver_workflow_field_name: null,
  approver_store_department_field_path: 'affected_store_department',
  approver_custom_field_name: null,
  approver_custom_field_step_slug: null,
}

describe('store_department_field approver — resolution at instance-creation time', () => {
  it('defers instead of throwing when the field is not present on the source document', async () => {
    const req = fakeReq({})
    const sourceDoc = {} // "affected_store_department" is a workflow response field, not a document field

    const email = await resolveApproverEmail(baseApprover, 'store-department-review', req, sourceDoc)

    expect(email).toBe('')
  })

  it('still resolves immediately when the field IS present on the source document (back-compat)', async () => {
    const req = fakeReq({
      'dept-1': { manager: { email: 'fnb-manager@example.com' } },
    })
    const sourceDoc = { affected_store_department: 'dept-1' }

    const email = await resolveApproverEmail(baseApprover, 'store-department-review', req, sourceDoc)

    expect(email).toBe('fnb-manager@example.com')
  })
})

describe('store_department_field approver — re-resolution at step-advancement time', () => {
  it('resolves the manager email from a prior step\'s field_responses when deferred at init', async () => {
    const req = fakeReq({
      'dept-2': { manager: { email: 'security-store-manager@example.com' } },
    })

    const token = {
      email: '', // deferred at init, as produced by the init-time fix above
      token: 'old-token',
      approver_type: 'store_department_field' as const,
      response: 'pending' as const,
      reviewed_by: null,
      reviewed_at: null,
      approver_store_department_field_path: 'affected_store_department',
    }

    const reviews = [
      {
        status_slug: 'security-manager-review',
        response: 'approved',
        field_responses: [
          { name: 'affected_store_department', label: 'Affected Store Department', value: 'dept-2' },
        ],
      },
      {
        status_slug: 'store-department-review',
        response: 'pending',
        reviewer_tokens: [token],
      },
    ] as any[]

    const resolved = await resolveDynamicReviewerTokenEntry(
      token,
      0,
      reviews,
      undefined,
      { workflow_v2: 'unused' } as any,
      req,
      noopLogger,
    )

    expect(resolved.email).toBe('security-store-manager@example.com')
    expect(resolved.token).not.toBe('old-token')
  })

  it('leaves the token unchanged when no prior step answered the field', async () => {
    const req = fakeReq({})

    const token = {
      email: '',
      token: 'old-token',
      approver_type: 'store_department_field' as const,
      response: 'pending' as const,
      reviewed_by: null,
      reviewed_at: null,
      approver_store_department_field_path: 'affected_store_department',
    }

    const reviews = [
      { status_slug: 'security-manager-review', response: 'approved', field_responses: [] },
      { status_slug: 'store-department-review', response: 'pending', reviewer_tokens: [token] },
    ] as any[]

    const resolved = await resolveDynamicReviewerTokenEntry(
      token,
      0,
      reviews,
      undefined,
      { workflow_v2: 'unused' } as any,
      req,
      noopLogger,
    )

    expect(resolved).toEqual(token)
  })
})
