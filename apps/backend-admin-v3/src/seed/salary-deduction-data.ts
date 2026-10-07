import { Payload } from 'payload'
import { v4 as uuidv4 } from 'uuid'
import { Operator, Workflow, User, SalaryDeduction, Department } from '@/payload-types'
import { createUserIfNotExists } from './helpers/create-user'

export const seedSalaryDeductionData = async ({ payload }: { payload: Payload }): Promise<void> => {
  payload.logger.info('Seeding Salary Deduction data...')

  // Fetch Operator
  const operatorResult = await payload.find({
    collection: 'operators',
    where: { slug: { equals: 'doha-oasis' } },
    limit: 1,
    overrideAccess: true,
  })

  const operator = operatorResult.docs[0] as Operator
  if (!operator) {
    payload.logger.error('Operator "doha-oasis" not found. Skipping Salary Deduction data seeding.')
    return
  }

  // Fetch Workflow
  const workflowSlug = `${operator.slug}-salary-deduction-workflow`
  const workflowResult = await payload.find({
    collection: 'workflow',
    where: { operator_slug: { equals: workflowSlug } },
    limit: 1,
    overrideAccess: true,
  })

  const workflow = workflowResult.docs[0] as Workflow
  if (!workflow) {
    payload.logger.error(
      `Workflow "${workflowSlug}" not found. Skipping Salary Deduction data seeding.`,
    )
    return
  }

  const hrStep = workflow.steps?.find((s) => s.slug.endsWith('hr-approval'))
  const empStep = workflow.steps?.find((s) => s.slug.endsWith('employee-acknowledgement'))
  const finStep = workflow.steps?.find((s) => s.slug.endsWith('finance-approval'))

  if (!hrStep || !empStep || !finStep) {
    payload.logger.error(
      'Could not find all workflow steps. Skipping Salary Deduction data seeding.',
    )
    return
  }

  // Fetch Departments
  const getDept = async (slug: string) => {
    const res = await payload.find({
      collection: 'departments',
      where: { operator_slug: { equals: `${operator.slug}-${slug}` } },
      limit: 1,
      overrideAccess: true,
    })
    return res.docs[0] as Department
  }

  const hrDept = await getDept('human-resources')
  const itDept = await getDept('do-it')
  const finDept = await getDept('finance')

  if (!hrDept || !itDept || !finDept) {
    payload.logger.error('Could not find all departments. Skipping Salary Deduction data seeding.')
    return
  }

  // Helper to get or create users
  const getManager = async (dept: Department) => {
    const res = await payload.find({
      collection: 'users',
      where: { email: { equals: dept.manager_email || '' } },
      limit: 1,
      overrideAccess: true,
    })
    return res.docs[0] as User
  }

  const hrManager = await getManager(hrDept)
  const itManager = await getManager(itDept)
  const finManager = await getManager(finDept)

  // Create regular employees for each dept
  const hrEmpEmail = `hr.staff@${operator.slug.replaceAll('-', '')}.com`
  const itEmpEmail = `it.staff@${operator.slug.replaceAll('-', '')}.com`
  const finEmpEmail = `finance.staff@${operator.slug.replaceAll('-', '')}.com`

  await createUserIfNotExists(payload, hrEmpEmail, operator, hrDept, true, false)
  await createUserIfNotExists(payload, itEmpEmail, operator, itDept, true, false)
  await createUserIfNotExists(payload, finEmpEmail, operator, finDept, true, false)

  const getStaff = async (email: string) => {
    const res = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    return res.docs[0] as User
  }

  const hrEmployee = await getStaff(hrEmpEmail)
  const itEmployee = await getStaff(itEmpEmail)
  const finEmployee = await getStaff(finEmpEmail)

  // Default User as overall super user/creator
  const defaultUserResult = await payload.find({
    collection: 'users',
    where: { email: { equals: 'default@payload.com' } },
    limit: 1,
    overrideAccess: true,
  })
  const defaultUser = defaultUserResult.docs[0] as User

  const getLexicalDescription = (text: string) => ({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  })

  // Realistic comments and signatures
  const hrComments = [
    'Verified the employee record and documentation. Everything is in order.',
    'Request matches departmental policy for salary deductions. Approved.',
    'Confirmed with the department manager regarding the late return of equipment.',
  ]

  const empComments = [
    'I acknowledge this deduction and understand the reasons provided.',
    'I confirm that I have been informed about this deduction for the lost equipment.',
    'Acknowledged. Please proceed with the deduction from my next paycheck.',
  ]

  const finComments = [
    'Transaction verified against payroll budget. Approved for processing.',
    'Deduction recorded and approved for the next payroll cycle.',
    'Final review completed. All financial requirements met.',
  ]

  const dummySignature =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABaCAYAAAAAI87fAAAACXBIWXMAAAsTAAALEwEAmpwYAAADcklEQVR4nO2dW04bMRBFS87+V7EDpAgREAnS7p6Z7p86p8pIsP2I7eunIAiCIAiCIAiCIAiCIAiCIAiC4I/y9vY27e3tTeW63W737Ozs58fHx+v09vY2Pzw8vK7X+Xyenp+fn8/Ozn7X6+Pj47S/vz+Vv/7+8fHxur+/P5XL6/X1dVqv1+nrWvevr69pd3d3Kp/X7/O6j46Oplf39/fT09PT9PT0NJ2fn09vHdfX/v7+dH5+Pp2fn0+vr6/T0dHR9Pr+6elp2tvbm8r8fX99fU2Xl5fT5eXl9Ovr6+vL+/r+/j6V/6f7+vLycqr719fXU7m8p9fX16ns7+9Pr6+vU7mur6+vL+/X/f399PT0NL26u7ub6vX67X59fT2V/6f76vHxcSrf7tfLy8u0Wq0mq9WqqT6YarVatezXarVaqg+mXq9XTeU9VatV9+f1+7xuIeeunNfL/KzXdX1XruvpveN6/X6f1985uXfkPJ7zfO+4566c53vX57mre71z78p57ur6+8XLy8uk3m/q777L+X7v/f+/8p7z+jvvXfk7J/f6fV5/573r89zVvXm+mO8X036/X8v7xbS638v7xbS6/98eHh6m73yV+/7z79yv79vJycn079t8/9fve67vffv/8vPz8/Tw8DC9p/v7++nh4WF6T/f399PDw8P0nu7v76eHh4fpPd3f308PDw/Te7q/v58eHh6m93R/fz89PDxM7+n+/n56eHia3jrS6+vrtF6vp/V6na6urr5cr1ar79er1Wq6vry8/HK9Wq2m68vLy9TP9X/p/Pz8y/V6vZ6urz+r9Xqdrq6urq6vP7u/8vX1ZbVaTdXr38qr/i9dXV1dXf9L5+fnX66/qbe3ty/X6/V66vn5eeonX9f9+nreU9UHVV9fT6v7m9Z/X/fU679pfY/X69UHVX1Q9Xp9fXVXV1dXT09P07pPnV/+r9Pr9/q6Pv/9R40/u3v88X9dXf9/X11dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV2p9/fX/7D6fH/f+f66f9/5/rp/37k+z/2967u6Pn+7X9fX/y8/PT1N3/m373yV+/7z99/fOTv36/vz377Pf/ue+/qSIAiCIAiCIAiCIAiCIAiCIAiC4I/yB9mO0Gv1zE+OAAAAAElFTkSuQmCC'

  const hrReviewerEmail = hrDept.manager_email
  const finReviewerEmail = finDept.manager_email

  // Records configuration
  const records: { data: Partial<SalaryDeduction>; creator: User }[] = [
    // 1 Draft - Created by HR Manager for HR Staff
    {
      creator: hrManager,
      data: {
        operator: operator.id,

        employee: hrEmployee.id,
        subject: 'Draft - Salary Deduction for Late Equipment Return',
        description: getLexicalDescription(
          'Draft record: Deduction for the late return of the company laptop assigned for the remote work period.',
        ) as any,
        days_deducted: 1,
        _workflow_status: 'draft',
        workflow_status: 'draft',
      },
    },
    // 2 In Review (at HR Approval) - Created by Department Managers for their staff
    {
      creator: itManager,
      data: {
        operator: operator.id,

        employee: itEmployee.id,
        subject: 'Replacement Cost for Damaged Access Card',
        description: getLexicalDescription(
          'Deduction covering the administrative and replacement costs for a damaged physical access card.',
        ) as any,
        days_deducted: 1,
        _workflow_status: hrStep.slug,
        workflow_status: 'in_review',
        workflow_reviews: [
          {
            label: hrStep.label,
            status_slug: hrStep.slug,
            reviewer: hrReviewerEmail,
            response: 'pending',
            token: uuidv4(),
          },
          {
            label: empStep.label,
            status_slug: empStep.slug,
            reviewer: itEmployee.email,
            response: 'pending',
            token: uuidv4(),
          },
          {
            label: finStep.label,
            status_slug: finStep.slug,
            reviewer: finReviewerEmail,
            response: 'pending',
            token: uuidv4(),
          },
        ],
      },
    },
    {
      creator: finManager,
      data: {
        operator: operator.id,

        employee: finEmployee.id,
        subject: 'Unauthorized Absence - Finance Staff',
        description: getLexicalDescription(
          'Deduction for 2 days of unauthorized absence recorded during the last reporting period.',
        ) as any,
        days_deducted: 2,
        _workflow_status: hrStep.slug,
        workflow_status: 'in_review',
        workflow_reviews: [
          {
            label: hrStep.label,
            status_slug: hrStep.slug,
            reviewer: hrReviewerEmail,
            response: 'pending',
            token: uuidv4(),
          },
          {
            label: empStep.label,
            status_slug: empStep.slug,
            reviewer: finEmployee.email,
            response: 'pending',
            token: uuidv4(),
          },
          {
            label: finStep.label,
            status_slug: finStep.slug,
            reviewer: finReviewerEmail,
            response: 'pending',
            token: uuidv4(),
          },
        ],
      },
    },
    // 2 In Review (at Employee Acknowledgement)
    {
      creator: hrManager,
      data: {
        operator: operator.id,

        employee: hrEmployee.id,
        subject: 'Deduction for Lost Office Key',
        description: getLexicalDescription(
          'Formal request for salary deduction due to a lost master office key that required lock replacement.',
        ) as any,
        days_deducted: 1,
        _workflow_status: empStep.slug,
        workflow_status: 'in_review',
        workflow_reviews: [
          {
            label: hrStep.label,
            status_slug: hrStep.slug,
            reviewer: hrReviewerEmail,
            response: 'approved',
            reviewed_by: hrReviewerEmail,
            reviewed_at: new Date().toISOString(),
            comments: hrComments[0],
            signature: dummySignature,
            token: uuidv4(),
          },
          {
            label: empStep.label,
            status_slug: empStep.slug,
            reviewer: hrEmployee.email,
            response: 'pending',
            token: uuidv4(),
          },
          {
            label: finStep.label,
            status_slug: finStep.slug,
            reviewer: finReviewerEmail,
            response: 'pending',
            token: uuidv4(),
          },
        ],
      },
    },
    {
      creator: itManager,
      data: {
        operator: operator.id,

        employee: itEmployee.id,
        subject: 'IT Support Equipment Damage Deduction',
        description: getLexicalDescription(
          'Deduction for damage to mobile testing device while in employee possession.',
        ) as any,
        days_deducted: 1,
        _workflow_status: empStep.slug,
        workflow_status: 'in_review',
        workflow_reviews: [
          {
            label: hrStep.label,
            status_slug: hrStep.slug,
            reviewer: hrReviewerEmail,
            response: 'approved',
            reviewed_by: hrReviewerEmail,
            reviewed_at: new Date().toISOString(),
            comments: hrComments[1],
            signature: dummySignature,
            token: uuidv4(),
          },
          {
            label: empStep.label,
            status_slug: empStep.slug,
            reviewer: itEmployee.email,
            response: 'pending',
            token: uuidv4(),
          },
          {
            label: finStep.label,
            status_slug: finStep.slug,
            reviewer: finReviewerEmail,
            response: 'pending',
            token: uuidv4(),
          },
        ],
      },
    },
    // 1 In Review (at Finance Approval)
    {
      creator: defaultUser,
      data: {
        operator: operator.id,

        employee: itEmployee.id,
        subject: 'Unreturned Uniform and Safety Gear',
        description: getLexicalDescription(
          'Cost recovery for unreturned high-visibility safety gear and company branded uniform sets.',
        ) as any,
        days_deducted: 3,
        _workflow_status: finStep.slug,
        workflow_status: 'in_review',
        workflow_reviews: [
          {
            label: hrStep.label,
            status_slug: hrStep.slug,
            reviewer: hrReviewerEmail,
            response: 'approved',
            reviewed_by: hrReviewerEmail,
            reviewed_at: new Date().toISOString(),
            comments: hrComments[2],
            signature: dummySignature,
            token: uuidv4(),
          },
          {
            label: empStep.label,
            status_slug: empStep.slug,
            reviewer: itEmployee.email,
            response: 'approved',
            reviewed_by: itEmployee.email,
            reviewed_at: new Date().toISOString(),
            comments: empComments[0],
            signature: dummySignature,
            token: uuidv4(),
          },
          {
            label: finStep.label,
            status_slug: finStep.slug,
            reviewer: finReviewerEmail,
            response: 'pending',
            token: uuidv4(),
          },
        ],
      },
    },
    // 2 Completed
    {
      creator: finManager,
      data: {
        operator: operator.id,

        employee: finEmployee.id,
        subject: 'Final Settlement Deduction - Finance Member',
        description: getLexicalDescription(
          'Deduction from final settlement for outstanding petty cash discrepancy.',
        ) as any,
        days_deducted: 1,
        _workflow_status: 'completed',
        workflow_status: 'completed',
        workflow_reviews: [
          {
            label: hrStep.label,
            status_slug: hrStep.slug,
            reviewer: hrReviewerEmail,
            response: 'approved',
            reviewed_by: hrReviewerEmail,
            reviewed_at: new Date().toISOString(),
            comments: hrComments[0],
            signature: dummySignature,
            token: uuidv4(),
          },
          {
            label: empStep.label,
            status_slug: empStep.slug,
            reviewer: finEmployee.email,
            response: 'approved',
            reviewed_by: finEmployee.email,
            reviewed_at: new Date().toISOString(),
            comments: empComments[1],
            signature: dummySignature,
            token: uuidv4(),
          },
          {
            label: finStep.label,
            status_slug: finStep.slug,
            reviewer: finReviewerEmail,
            response: 'approved',
            reviewed_by: finReviewerEmail,
            reviewed_at: new Date().toISOString(),
            comments: finComments[0],
            signature: dummySignature,
            token: uuidv4(),
          },
        ],
      },
    },
    {
      creator: hrManager,
      data: {
        operator: operator.id,

        employee: hrEmployee.id,
        subject: 'Late Reporting Penalty - HR Internal Policy',
        description: getLexicalDescription(
          'Policy-based deduction for repeated failure to submit weekly reports on time.',
        ) as any,
        days_deducted: 5,
        _workflow_status: 'completed',
        workflow_status: 'completed',
        workflow_reviews: [
          {
            label: hrStep.label,
            status_slug: hrStep.slug,
            reviewer: hrReviewerEmail,
            response: 'approved',
            reviewed_by: hrReviewerEmail,
            reviewed_at: new Date().toISOString(),
            comments: hrComments[1],
            signature: dummySignature,
            token: uuidv4(),
          },
          {
            label: empStep.label,
            status_slug: empStep.slug,
            reviewer: hrEmployee.email,
            response: 'approved',
            reviewed_by: hrEmployee.email,
            reviewed_at: new Date().toISOString(),
            comments: empComments[2],
            signature: dummySignature,
            token: uuidv4(),
          },
          {
            label: finStep.label,
            status_slug: finStep.slug,
            reviewer: finReviewerEmail,
            response: 'approved',
            reviewed_by: finReviewerEmail,
            reviewed_at: new Date().toISOString(),
            comments: finComments[1],
            signature: dummySignature,
            token: uuidv4(),
          },
        ],
      },
    },
    // 2 Rejected (1 at HR, 1 at Finance)
    {
      creator: itManager,
      data: {
        operator: operator.id,

        employee: itEmployee.id,
        subject: 'Rejected: Mobile Device Damage Claim',
        description: getLexicalDescription(
          'Rejected claim for mobile device damage - determined to be normal wear and tear.',
        ) as any,
        days_deducted: 1,
        _workflow_status: 'rejected',
        workflow_status: 'rejected',
        workflow_reviews: [
          {
            label: hrStep.label,
            status_slug: hrStep.slug,
            reviewer: hrReviewerEmail,
            response: 'rejected',
            reviewed_by: hrReviewerEmail,
            reviewed_at: new Date().toISOString(),
            comments:
              'Insufficient justification provided. Damage appears to be normal wear and tear and does not warrant a salary deduction for replacement.',
            signature: dummySignature,
            token: uuidv4(),
          },
        ],
      },
    },
    {
      creator: finManager,
      data: {
        operator: operator.id,

        employee: finEmployee.id,
        subject: 'Rejected: Training Cost Recovery (Finance)',
        description: getLexicalDescription(
          'Attempted deduction for training costs that were later found to be covered by the corporate dev budget.',
        ) as any,
        days_deducted: 2,
        _workflow_status: 'rejected',
        workflow_status: 'rejected',
        workflow_reviews: [
          {
            label: hrStep.label,
            status_slug: hrStep.slug,
            reviewer: hrReviewerEmail,
            response: 'approved',
            reviewed_by: hrReviewerEmail,
            reviewed_at: new Date().toISOString(),
            comments: hrComments[2],
            signature: dummySignature,
            token: uuidv4(),
          },
          {
            label: empStep.label,
            status_slug: empStep.slug,
            reviewer: finEmployee.email,
            response: 'approved',
            reviewed_by: finEmployee.email,
            reviewed_at: new Date().toISOString(),
            comments: empComments[0],
            signature: dummySignature,
            token: uuidv4(),
          },
          {
            label: finStep.label,
            status_slug: finStep.slug,
            reviewer: finReviewerEmail,
            response: 'rejected',
            reviewed_by: finReviewerEmail,
            reviewed_at: new Date().toISOString(),
            comments:
              'Budget allotment for training has already been fully utilized in this quarter. The deduction cannot be processed at this time.',
            signature: dummySignature,
            token: uuidv4(),
          },
        ],
      },
    },
  ]

  for (const record of records) {
    await payload.create({
      collection: 'salary-deduction',
      data: {
        ...record.data,
        created_by: record.creator.id,
      } as any,
      overrideAccess: true,
      req: {
        user: record.creator,
      } as any,
    })
  }

  payload.logger.info(`✓ Successfully seeded ${records.length} Salary Deduction records.`)
}
