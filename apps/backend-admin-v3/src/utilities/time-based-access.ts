import { PayloadRequest } from 'payload'
import { Operator, User, Workflow } from '@/payload-types'
import { ApiError } from 'next/dist/server/api-utils'

/**
 * Check if current date is after the monthly cutoff day
 * @param cutoffDay - Day of the month (1-31)
 * @returns true if current day is after cutoff day
 */
export const isAfterCutoff = (cutoffDay: number): boolean => {
  const now = new Date()
  const currentDay = now.getDate()
  return currentDay > cutoffDay
}

/**
 * Check if user is a final approver based on workflow configuration
 * @param req - Payload request object
 * @param workflowSlug - Slug of the workflow to check
 * @param userEmail - Email of the user to check
 * @param currentStatusSlug - Optional: Check if user is final approver for a specific step
 * @returns true if user is in a final approval step
 */
export const isFinalApprover = async (
  req: PayloadRequest,
  workflowSlug: string | null | undefined,
  userEmail: string | null | undefined,
  currentStatusSlug?: string | null,
): Promise<boolean> => {
  if (!workflowSlug || !userEmail) return false

  if (!req.user) return false
  if (!req.user?.operator)
    throw new ApiError(401, 'No operator found on request user. Unauthorized')

  const operator = req.user.operator as Operator
  try {
    const workflows = await req.payload.find({
      collection: 'workflow',
      where: {
        slug: {
          equals: workflowSlug,
        },
        and: [{ operator: { equals: operator.id } }],
      },
      limit: 1,
      overrideAccess: true,
      req,
    })

    if (!workflows.docs || workflows.docs.length === 0) return false

    const workflow = workflows.docs[0] as Workflow

    // Check if user's email is in any step marked as final_approval
    const isFinalApprover = workflow.steps?.some((step) => {
      if (!step.final_approval) return false

      // If currentStatusSlug is provided, only check that specific step
      if (currentStatusSlug && step.slug !== currentStatusSlug) {
        return false
      }

      // Check if the user's email matches the approver
      if ((step as any).approver_type === 'email' && (step as any).approver_email === userEmail) {
        return true
      }

      // For department-based approvers, we'd need to check if the user is the department manager
      // This would require additional logic to fetch user's department and compare
      // For now, we'll skip this check as it's more complex
      return false
    })

    return isFinalApprover || false
  } catch (error) {
    console.error('Error checking final approver status:', error)
    return false
  }
}

/**
 * Check if user can create/update based on time-based restrictions
 * @param req - Payload request object
 * @param settingsSlug - Slug of the settings global (e.g., 'hr-requests-settings')
 * @param workflowSlug - Slug of the workflow to check
 * @returns true if user can perform the action
 */
export const checkTimeBasedAccess = async (
  req: PayloadRequest,
  settingsSlug: string,
  workflowSlug: string | null | undefined,
): Promise<boolean> => {
  const user = req.user as User

  // Super users bypass time restrictions
  if (user?.super_user) return true

  try {
    // Fetch settings to get cutoff day
    const settings = await req.payload.findGlobal({
      slug: settingsSlug as any,
      overrideAccess: true,
      req,
    })

    const cutoffDay = (settings as any)?.cutoff_day || 15

    // If we're before the cutoff, everyone can create/update
    if (!isAfterCutoff(cutoffDay)) {
      return true
    }

    // After cutoff, only final approvers can create/update
    return await isFinalApprover(req, workflowSlug, user?.email)
  } catch (error) {
    console.error('Error checking time-based access:', error)
    return false
  }
}
