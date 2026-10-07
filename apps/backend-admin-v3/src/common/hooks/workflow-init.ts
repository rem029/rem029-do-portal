import { v4 as uuidv4 } from 'uuid'
import { Department, Operator, WorkflowReviews } from '@/payload-types'
import { APIError, CollectionBeforeChangeHook, PayloadRequest } from 'payload'
import { RequestContext } from '@/context-types'

export interface WorkflowInitArgs<T> {
  getWorkflowSlug: (req: PayloadRequest, data: any) => Promise<string>
  overrideRequestorDepartment?: <T>(req: PayloadRequest, data: T) => Promise<Department>
  setEmployeeApprover?: <T>(req: PayloadRequest, data: T) => Promise<string | undefined>
  getOperator?: (req: PayloadRequest, data: any) => Promise<Operator | string | undefined>
}

export const workflowInit: <T = any>(args: WorkflowInitArgs<T>) => CollectionBeforeChangeHook =
  ({ getWorkflowSlug, overrideRequestorDepartment, setEmployeeApprover, getOperator }) =>
    async ({ data, req }) => {
      const p = req.payload
      const u = req.user
      const logger = p.logger

      logger.info(`workflowInit hook init ${data?.id}`)
      if ((req.context as RequestContext)?.form?.useWorkflowV2) return data
      if (data.workflow_status === 'draft') {
        const workflow_slug = await getWorkflowSlug(req, data)

        if (!workflow_slug) {
          throw new APIError('Workflow slug is not defined in settings.', 400)
        }

        const operatorFromArgs = getOperator ? await getOperator(req, data) : undefined
        const targetOperatorId =
          (typeof operatorFromArgs === 'object' ? operatorFromArgs?.id : operatorFromArgs) ||
          (u?.operator as Operator)?.id
        // remove user check here, we are only dependent on user to get the department and manager.
        if (!u && !targetOperatorId) {
          throw new APIError('User not authenticated', 401)
        }

        if (!targetOperatorId) {
          throw new APIError('No operator assigned to initiate this workflow.', 400)
        }

        const workflows = await p.find({
          collection: 'workflow',
          where: {
            slug: { equals: workflow_slug },
            and: [{ operator: { equals: targetOperatorId } }],
          },
          req,
          limit: 1,
          overrideAccess: true,
        })

        if (workflows.totalDocs === 0) {
          throw new APIError(`No workflow configuration found with slug: ${workflow_slug}`, 404)
        }

        const workflow = workflows.docs[0]
        const workflowReviews: WorkflowReviews = []

        for (const step of workflow?.steps || []) {
          try {
            let emailApproved = ''
            const currentReview: NonNullable<WorkflowReviews>[number] = {
              label: step.label,
              status_slug: step.slug,
              response: 'pending',
              token: uuidv4(),
              approver_type: (step as any).approver_type,
              can_acknowledge: (step as any).can_acknowledge,
              can_approve: (step as any).can_approve,
              can_reject: (step as any).can_reject,
              can_attach: (step as any).can_attach,
              can_skip: (step as any).can_skip,
              can_generate_wordfile: (step as any).can_generate_wordfile,
              enable_comment: (step as any).enable_comment,
              enable_signature: (step as any).enable_signature,
              attachment_label: (step as any).attachment_label,
              acknowledge_label: (step as any).acknowledge_label,
              approve_label: (step as any).approve_label,
              reject_label: (step as any).reject_label,
              skip_label: (step as any).skip_label,
              auto_complete: (step as any).auto_complete,
              hide_history: (step as any).hide_history,
              hide_details: (step as any).hide_details,
              hide_description: (step as any).hide_description,
              hide_attachments: (step as any).hide_attachments,
              hide_email_actions: (step as any).hide_email_actions,
              custom_email_text: (step as any).custom_email_text,
              custom_fields_definition: [
                ...((workflow as any).global_custom_fields || [])
                  .filter((gf: any) =>
                    ((step as any).selected_global_fields || []).some(
                      (sgf: any) => sgf.field_name === gf.name,
                    ),
                  )
                  .map((gf: any) => ({ ...gf })),
                ...((step as any).custom_fields || []),
              ],
              skip_condition: (step as any).skip_condition || null,
            } as any

            switch ((step as any).approver_type) {
              case 'department':
                logger.info(`Department step: ${JSON.stringify(step?.department, null, 4)}`)

                if (!step?.department || !(step?.department as Department)?.manager_email) {
                  throw new APIError(
                    `No department or department manager defined in workflow: ${step.slug}`,
                    500,
                  )
                }

                const dept = step?.department as Department
                currentReview.reviewer = dept.manager_email || ''
                workflowReviews?.push(currentReview)
                break
              case 'email':
                if (!(step as any)?.approver_email) {
                  throw new APIError(`No approver email defined in workflow: ${step.slug}`, 500)
                }

                emailApproved = (step as any)?.approver_email || ''
                currentReview.reviewer = emailApproved
                workflowReviews?.push(currentReview)
                break
              case 'requestor_department':
                logger.info(`Requestor Department step: ${JSON.stringify(u?.department, null, 4)}`)

                if (!u || !u.department || !(u.department as Department)?.manager_email) {
                  throw new APIError(
                    'User does not have department or manager assigned to initiate this workflow.',
                    400,
                  )
                }

                let userDept = u?.department as Department

                if (overrideRequestorDepartment) {
                  logger.warn(`Overriding requestor department as per hook configuration.`)
                  userDept = await overrideRequestorDepartment(req, data)
                  logger.warn(
                    `After overriding requestor department. ${JSON.stringify(userDept, null, 4)}`,
                  )
                }

                currentReview.reviewer = userDept.manager_email || ''
                workflowReviews?.push(currentReview)
                break
              case 'employee':
                if (!setEmployeeApprover) {
                  throw new APIError(
                    'Employee approver hook is not defined for this collection.',
                    500,
                  )
                }

                const employeeEmail = await setEmployeeApprover(req, data)

                if (!employeeEmail) {
                  throw new APIError('No employee email found to initiate this workflow step.', 400)
                }

                currentReview.reviewer = employeeEmail
                workflowReviews?.push(currentReview)
                break
              default:
                throw new APIError(`Invalid approver type in workflow: ${step.slug}`, 500)
            }
          } catch (innerError) {
            // If a specific step loop fails, we might still want to fail the whole request
            // or log specific warning. Usually failing safe is better.
            throw new APIError(
              `Error processing workflow step ${step.label}: ${innerError instanceof Error ? innerError.message : 'Unknown'}`,
              500,
            )
          }
        }

        data.workflow_reviews = workflowReviews
        data._workflow_status =
          workflow?.steps && workflow?.steps?.length > 0 ? workflow?.steps[0].slug : 'draft'
        data.operator = targetOperatorId
        data.workflow_status = 'in_review'
      }

      logger.info(`workflowInit hook end ${data?.id}`)
      return data
    }
