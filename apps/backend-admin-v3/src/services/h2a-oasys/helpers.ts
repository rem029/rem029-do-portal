import { findEmployeeByEmail } from '@/services/h2a-database'
import { OasysH2AEmployeeData } from '@/services/h2a-oasys/types'

export const getH2AInfoByEmail = async (email: string): Promise<OasysH2AEmployeeData | null> => {
  return findEmployeeByEmail(email)
}
