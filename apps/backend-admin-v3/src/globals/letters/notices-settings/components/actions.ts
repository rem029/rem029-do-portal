'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { seedSalaryDeductionData } from '@/seed/salary-deduction-data'

export const seedSalaryDeductionDataAction = async () => {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Seeding is only available in development mode.')
    }

    await seedSalaryDeductionData({ payload })
    return { success: true, message: 'Successfully seeded 10 salary deduction records.' }
  } catch (error: any) {
    console.error('[Actions] Error seeding data:', error)
    return { success: false, message: error.message || 'Failed to seed data.' }
  }
}
