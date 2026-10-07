import { SalaryDeductionSetting } from '@/payload-types'
import { Payload } from 'payload'

const INITIAL_SETTINGS: Partial<SalaryDeductionSetting> = {
  workflow_slug: 'salary-deduction-workflow',
}

export const seedSalaryDeductionSettings = async ({
  payload,
}: {
  payload: Payload
}): Promise<void> => {
  console.log('Updating salary deduction settings...')
  await payload.updateGlobal({
    slug: 'salary-deduction-settings',
    data: INITIAL_SETTINGS,
    overrideAccess: true,
  })
  try {
  } catch (error) {
    console.error('Error updating salary deduction settings:', error)
    throw error
  }
}
