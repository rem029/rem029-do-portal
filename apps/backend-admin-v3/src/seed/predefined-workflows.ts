import { Payload } from 'payload'
import { seedForms } from './forms'

export const seedPredefinedWorkflows = async ({ payload }: { payload: Payload }): Promise<void> => {
  const operatorSlug = 'doha-oasis'
  const workflowSlug = 'salary-deduction-workflow'

  try {
    const operators = await payload.find({
      collection: 'operators',
      where: {
        slug: { equals: operatorSlug },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (operators.docs.length === 0) {
      payload.logger.error(
        `Operator "${operatorSlug}" not found during predefined workflow seeding.`,
      )
      return
    }

    const operatorId = operators.docs[0].id

    // get hr department with doha oasis operator slug: doha-oasis-human-resources
    const hrDepartments = await payload.find({
      collection: 'departments',
      where: {
        operator_slug: { equals: 'doha-oasis-human-resources' },
      },
      limit: 1,
      overrideAccess: true,
    })
    const hrDepartmentId = hrDepartments.docs.length > 0 ? hrDepartments.docs[0].id : null

    // get finance department with doha oasis operator slug: doha-oasis-finance
    const financeDepartments = await payload.find({
      collection: 'departments',
      where: {
        operator_slug: { equals: 'doha-oasis-finance' },
      },
      limit: 1,
      overrideAccess: true,
    })
    const financeDepartmentId =
      financeDepartments.docs.length > 0 ? financeDepartments.docs[0].id : null

    payload.logger.info(
      `Updating workflow "${workflowSlug}" for operator "${operatorSlug}" (HR: ${hrDepartmentId}, Finance: ${financeDepartmentId})`,
    )

    const workflows = await payload.find({
      collection: 'workflow',
      where: {
        and: [{ slug: { equals: workflowSlug } }, { operator: { equals: operatorId } }],
      },
      limit: 1,
      overrideAccess: true,
    })

    const workflowData: any = {
      name: 'Salary Deduction Workflow',
      slug: workflowSlug,
      operator: operatorId,
      operator_slug: `${operatorSlug}-${workflowSlug}`,
      notify_on_complete: false,
      notify_on_update: true,
      notify_on_reject: true,
      steps: [
        {
          label: 'HR Review',
          slug: 'doha-oasis-salary-deduction-workflow.hr-review',
          approver_type: 'department',
          department: hrDepartmentId,
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: false,
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          can_acknowledge: true,
          can_approve: false,
          can_reject: false,
          can_attach: false,
          can_generate_wordfile: false,
          enable_comment: true,
          enable_signature: false,
          acknowledge_label: 'Proceed',
          approve_label: 'Proceed',
          reject_label: 'Reject Is Temporary',
          skip_label: 'Skip',
          can_skip: false,
        },
        {
          label: 'CEO Review',
          slug: 'doha-oasis-salary-deduction-workflow.ceo-review',
          approver_type: 'email',
          approver_email: 'ceo@dohaoasis.com',
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: false,
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          can_acknowledge: false,
          can_approve: true,
          can_reject: true,
          can_attach: false,
          can_generate_wordfile: false,
          enable_comment: true,
          enable_signature: true,
          acknowledge_label: 'Acknowledge',
          approve_label: 'Approve',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
        },
        {
          label: 'Finance Review',
          slug: 'doha-oasis-salary-deduction-workflow.finance-review',
          approver_type: 'department',
          department: financeDepartmentId,
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: false,
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          can_acknowledge: false,
          can_approve: true,
          can_reject: true,
          can_attach: false,
          can_generate_wordfile: false,
          enable_comment: true,
          enable_signature: true,
          acknowledge_label: 'Acknowledge',
          approve_label: 'Approve',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
        },
        {
          label: 'Generate Letter',
          slug: 'doha-oasis-salary-deduction-workflow.generate-letter',
          approver_type: 'department',
          department: hrDepartmentId,
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: false,
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          can_acknowledge: false,
          can_approve: true,
          can_reject: false,
          can_attach: true,
          can_generate_wordfile: true,
          enable_comment: true,
          enable_signature: true,
          attachment_label: 'Attach Signed Letter',
          acknowledge_label: 'Acknowledge',
          approve_label: 'Proceed',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
        },
        {
          label: 'Workflow Completed',
          slug: 'doha-oasis-warnings-workflow.workflow-completed',
          approver_type: 'requestor_department',
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: true,
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          custom_email_text: 'This has been completed',
          can_acknowledge: false,
          can_approve: false,
          can_reject: false,
          can_attach: false,
          can_generate_wordfile: false,
          enable_comment: false,
          enable_signature: false,
          acknowledge_label: 'Acknowledge',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
          on_approval_notifications: [
            {
              type: 'employee',
              hide_history: true,
              hide_details: true,
              hide_description: true,
              hide_attachments: false,
              hide_email_actions: true,
              custom_email_text: 'This has been completed. Please check the attachments.',
            },
          ],
        },
      ],
    }

    if (workflows.docs.length > 0) {
      await payload.update({
        collection: 'workflow',
        id: workflows.docs[0].id,
        data: workflowData,
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'workflow',
        data: workflowData,
        overrideAccess: true,
      })
    }

    // 2. Warnings Workflow
    const warningsWorkflowSlug = 'warnings-workflow'
    const warningsWorkflows = await payload.find({
      collection: 'workflow',
      where: {
        and: [{ slug: { equals: warningsWorkflowSlug } }, { operator: { equals: operatorId } }],
      },
      limit: 1,
      overrideAccess: true,
    })

    const warningsWorkflowData: any = {
      name: 'Warnings Workflow',
      slug: warningsWorkflowSlug,
      operator: operatorId,
      operator_slug: `${operatorSlug}-${warningsWorkflowSlug}`,
      notify_on_complete: false,
      notify_on_update: true,
      notify_on_reject: true,
      steps: [
        {
          label: 'HR Review',
          slug: 'hr-review',
          approver_type: 'department',
          department: hrDepartmentId,
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: false,
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          can_acknowledge: true,
          can_approve: false,
          can_reject: false,
          can_attach: false,
          can_generate_wordfile: false,
          enable_comment: true,
          enable_signature: false,
          acknowledge_label: 'Proceed',
          approve_label: 'Approve',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
        },
        {
          label: 'CEO Review',
          slug: 'ceo-review',
          approver_type: 'email',
          approver_email: 'ceo@dohaoasis.com',
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: false,
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          can_acknowledge: false,
          can_approve: true,
          can_reject: true,
          can_attach: false,
          can_generate_wordfile: false,
          enable_comment: true,
          enable_signature: true,
          acknowledge_label: 'Acknowledge',
          approve_label: 'Approve',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
        },
        {
          label: 'Generate Letter',
          slug: 'generate-letter',
          approver_type: 'department',
          department: hrDepartmentId,
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: false,
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          can_acknowledge: false,
          can_approve: true,
          can_reject: false,
          can_attach: true,
          can_generate_wordfile: true,
          enable_comment: true,
          enable_signature: true,
          attachment_label: 'Attach Signed Letter',
          acknowledge_label: 'Acknowledge',
          approve_label: 'Proceed',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
        },
        {
          label: 'Workflow Completed',
          slug: 'doha-oasis-warnings-workflow.workflow-completed',
          approver_type: 'requestor_department',
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: true,
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          custom_email_text: 'This has been completed',
          can_acknowledge: false,
          can_approve: false,
          can_reject: false,
          can_attach: false,
          can_generate_wordfile: false,
          enable_comment: false,
          enable_signature: false,
          acknowledge_label: 'Acknowledge',
          approve_label: 'Acknowledge',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
          on_approval_notifications: [
            {
              type: 'employee',
              hide_history: true,
              hide_details: true,
              hide_description: true,
              hide_attachments: false,
              hide_email_actions: true,
              custom_email_text: 'This has been completed. Please check the attachments.',
            },
          ],
        },
      ],
    }

    if (warningsWorkflows.docs.length > 0) {
      await payload.update({
        collection: 'workflow',
        id: warningsWorkflows.docs[0].id,
        data: warningsWorkflowData,
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'workflow',
        data: warningsWorkflowData,
        overrideAccess: true,
      })
    }

    // 3. Create Vendor Workflow (vendor-registration)
    const vendorWorkflowSlug = 'vendor-registration'
    const oldVendorWorkflowSlug = 'sample-flow'

    const vendorWorkflows = await payload.find({
      collection: 'workflow',
      where: {
        and: [
          {
            or: [
              { slug: { equals: vendorWorkflowSlug } },
              { slug: { equals: oldVendorWorkflowSlug } },
            ],
          },
          { operator: { equals: operatorId } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    const vendorWorkflowData: any = {
      name: 'Vendor Registration Flow',
      slug: vendorWorkflowSlug,
      operator: operatorId,
      operator_slug: `${operatorSlug}-${vendorWorkflowSlug}`,
      notify_on_complete: true,
      notify_on_update: true,
      notify_on_reject: true,
      steps: [
        {
          label: 'Review',
          slug: 'doha-oasis-vendor-registration.review',
          approver_type: 'email',
          approver_email: 'lawrence.ponce@dohaoasis.com',
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: false,
          hide_history: false,
          hide_details: true,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          can_acknowledge: false,
          can_approve: true,
          can_reject: true,
          can_attach: false,
          can_generate_wordfile: false,
          enable_comment: true,
          enable_signature: true,
          acknowledge_label: 'Acknowledge',
          approve_label: 'Approve',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
          on_reaching_notifications: [
            {
              type: 'email',
              email: 'raphael.yabut@dohaoasis.com',
              hide_history: false,
              hide_details: true,
              hide_description: false,
              hide_attachments: false,
              hide_email_actions: false,
            },
          ],
        },
        {
          label: 'Review Gov Relation',
          slug: 'doha-oasis-vendor-registration.review-gov-relation',
          approver_type: 'email',
          approver_email: 'wassim.darwiche@dohaoasis.com',
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: false,
          hide_history: false,
          hide_details: true,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          can_acknowledge: false,
          can_approve: true,
          can_reject: true,
          can_attach: false,
          can_generate_wordfile: false,
          enable_comment: true,
          enable_signature: true,
          acknowledge_label: 'Acknowledge',
          approve_label: 'Approve',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
          on_reaching_notifications: [
            {
              type: 'email',
              email: 'chiheb.zouinkhi@dohaoasis.com',
              hide_history: false,
              hide_details: true,
              hide_description: false,
              hide_attachments: false,
              hide_email_actions: false,
            },
          ],
        },
        {
          label: 'Finance Acknowledgement',
          slug: 'doha-oasis-vendor-registration.finance-acknowledgement',
          approver_type: 'department',
          department: financeDepartmentId,
          rejectionPolicy: 'start',
          final_approval: false,
          auto_complete: false,
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
          can_acknowledge: true,
          can_approve: false,
          can_reject: false,
          can_attach: false,
          can_generate_wordfile: false,
          enable_comment: false,
          enable_signature: false,
          acknowledge_label: 'Acknowledge',
          approve_label: 'Approve',
          reject_label: 'Reject',
          skip_label: 'Skip',
          can_skip: false,
        },
      ],
    }

    if (vendorWorkflows.docs.length > 0) {
      await payload.update({
        collection: 'workflow',
        id: vendorWorkflows.docs[0].id,
        data: vendorWorkflowData,
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'workflow',
        data: vendorWorkflowData,
        overrideAccess: true,
      })
    }
  } catch (error) {
    payload.logger.error(
      `Error in predefined workflow seeding: ${(error as any)?.message || 'Unknown error'}`,
    )
  }
}
