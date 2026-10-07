/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from 'date-fns'
import { Payload } from 'payload'
import { getH2aToken, getH2aInfo } from '@/services/h2a-oasys'
import { OasysH2AInfo } from '@/services/h2a-oasys/types'
import { Operator } from '@/payload-types'
import {
  initH2ADatabase,
  upsertEmployeeInfo,
  upsertEmployeeDoj,
  upsertEmployeeBudget,
  upsertEmployeeProbation,
  upsertEmployeeOnLeave,
  insertEmployeeOnLeaveHistory,
  deleteOnLeaveHistoryByDivision,
} from '@/services/h2a-database'

export const LEAVE_HISTORY_FROM_DATE = '2023-01-01'

export type SeedH2ADatabaseResult = {
  success: boolean
  message: string
  counts?: Record<string, number>
}

export const seedH2ADatabase = async (payload: Payload): Promise<SeedH2ADatabaseResult> => {
  const { logger } = payload

  const settings = await payload.findGlobal({ slug: 'h2a-oasys-settings', overrideAccess: true })
  const { base_url, client_id, secret, divisions_operator } = settings

  if (
    !base_url ||
    !client_id ||
    !secret ||
    !divisions_operator ||
    divisions_operator.length === 0
  ) {
    return {
      success: false,
      message: 'Missing H2A configuration. Please set base_url, client_id, secret, and divisions.',
    }
  }

  const token = await getH2aToken({ baseUrl: base_url, clientId: client_id, secret })
  if (!token?.access_token) {
    return { success: false, message: 'Failed to obtain H2A token.' }
  }

  await initH2ADatabase()

  const counts: Record<string, number> = {
    employee_info: 0,
    employee_doj: 0,
    employee_budget: 0,
    employee_probation: 0,
    employee_on_leave: 0,
    employee_on_leave_history: 0,
  }

  for (const division of divisions_operator) {
    const operator = division as Operator
    if (!operator?.h2a_division_id) continue
    const divisionId = operator.h2a_division_id

    logger.info(`Seeding H2A Database for division ${divisionId}...`)

    const [
      infoResults,
      dojResults,
      budgetResults,
      probationResults,
      leaveResults,
      leaveHistoryResults,
    ] = await Promise.all([
      getH2aInfo({
        baseUrl: base_url,
        divisionId,
        id: OasysH2AInfo.EMPLOYEE_INFO,
        token: token.access_token,
      }),
      getH2aInfo({
        baseUrl: base_url,
        divisionId,
        id: OasysH2AInfo.DOJ_DOL,
        token: token.access_token,
      }),
      getH2aInfo({
        baseUrl: base_url,
        divisionId,
        id: OasysH2AInfo.BUDGET,
        token: token.access_token,
      }),
      getH2aInfo({
        baseUrl: base_url,
        divisionId,
        id: OasysH2AInfo.PROBATION,
        token: token.access_token,
      }),
      getH2aInfo({
        baseUrl: base_url,
        divisionId,
        id: OasysH2AInfo.ON_LEAVE,
        token: token.access_token,
      }),
      getH2aInfo({
        baseUrl: base_url,
        divisionId,
        id: OasysH2AInfo.ON_LEAVE_HISTORY,
        token: token.access_token,
        additionalParams: [
          { name: 'FromDate', value: LEAVE_HISTORY_FROM_DATE },
          { name: 'ToDate', value: format(new Date(), 'yyyy-MM-dd') },
        ],
      }),
    ])

    for (const emp of Array.isArray(infoResults) ? infoResults : []) {
      if (emp['E.N']) {
        await upsertEmployeeInfo(divisionId, emp)
        counts.employee_info++
      }
    }

    for (const emp of Array.isArray(dojResults) ? dojResults : []) {
      if (emp['E.N']) {
        await upsertEmployeeDoj(divisionId, emp)
        counts.employee_doj++
      }
    }

    for (const emp of Array.isArray(budgetResults) ? budgetResults : []) {
      if (emp['E.N']) {
        await upsertEmployeeBudget(divisionId, emp)
        counts.employee_budget++
      }
    }

    for (const emp of Array.isArray(probationResults) ? probationResults : []) {
      if (emp['E.N']) {
        await upsertEmployeeProbation(divisionId, emp)
        counts.employee_probation++
      }
    }

    for (const emp of Array.isArray(leaveResults) ? leaveResults : []) {
      if (emp['E.N']) {
        await upsertEmployeeOnLeave(divisionId, emp)
        counts.employee_on_leave++
      }
    }

    await deleteOnLeaveHistoryByDivision(divisionId)
    for (const emp of Array.isArray(leaveHistoryResults) ? leaveHistoryResults : []) {
      if (emp['E.N']) {
        await insertEmployeeOnLeaveHistory(divisionId, emp)
        counts.employee_on_leave_history++
      }
    }

    logger.info(`Seeded division ${divisionId}: ${JSON.stringify(counts)}`)
  }

  // Update timestamps in global settings
  await payload.updateGlobal({
    slug: 'h2a-oasys-settings',
    data: {
      employee_info_last_updated_at: new Date().toISOString(),
      employee_doj_last_updated_at: new Date().toISOString(),
      employee_budget_last_updated_at: new Date().toISOString(),
      employee_probation_last_updated_at: new Date().toISOString(),
      employee_on_leave_last_updated_at: new Date().toISOString(),
      employee_leave_history_last_updated_at: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  return {
    success: true,
    message: `H2A Database seeded successfully.`,
    counts,
  }
}
