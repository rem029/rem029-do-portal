'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getH2AEmployeeInfoByDivision } from '@/services/h2a-oasys'
import { OasysH2AEmployeeData } from '@/services/h2a-oasys/types'

export async function getH2AEmployeeInfoAction({
  divisionId: _divisionId,
  email,
  employeeId,
}: {
  divisionId?: string
  email: string
  employeeId?: string
}): Promise<OasysH2AEmployeeData[]> {
  try {
    const match = await getH2AEmployeeInfoByDivision({ email, employeeId })
    return match ? [match] : []
  } catch (error) {
    console.error('Error in getH2AEmployeeInfoAction:', error)
    return []
  }
}
