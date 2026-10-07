import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const WORKFLOW_ID = '312551fb-499c-4f1c-9a43-0819fd2e6ba2'
const HR_DEPT_ID = '27090891-54da-4df9-bb45-878cae7591b6'
const FIN_DEPT_ID = 'fa9ba30e-723a-45af-a018-b675cfed15d0'

async function run() {
    const payload = await getPayload({ config })

    console.log('Fetching workflow...')
    const workflow = await payload.findByID({
        collection: 'workflow',
        id: WORKFLOW_ID,
    })

    if (!workflow) {
        console.error('Workflow not found')
        process.exit(1)
    }

    const steps = [...(workflow.steps || [])]

    // Step 0: HR Approval
    if (steps[0]) {
        console.log('Updating Step 0: HR Approval')
        steps[0].approver_type = 'department'
        steps[0].department = HR_DEPT_ID
    }

    // Step 2: Finance Approval (assuming index 2)
    if (steps[2]) {
        console.log('Updating Step 2: Finance Approval')
        steps[2].approver_type = 'department'
        steps[2].department = FIN_DEPT_ID
    }

    console.log('Saving workflow...')
    await payload.update({
        collection: 'workflow',
        id: WORKFLOW_ID,
        data: {
            steps,
        },
    })

    console.log('Workflow updated successfully!')
    process.exit(0)
}

run().catch((err) => {
    console.error(err)
    process.exit(1)
})
