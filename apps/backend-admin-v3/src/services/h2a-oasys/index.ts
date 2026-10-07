/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto'
import { Payload, PayloadRequest } from 'payload'
import {
  OasysH2AInfo,
  OasysH2ATokenRequest,
  OasysH2ATokenResponse,
  OasysH2AInfoParam,
  OasysH2AEmployeeData,
} from './types'
import { slugify } from 'payload/shared'
import { createCollectionIfNotExists } from '@/utilities/helper/create-if-not-exists'
import { ENV } from '@/utilities/constant'
import {
  findEmployeeById,
  findEmployeeByEmail,
  findEmployeesByDivision,
} from '@/services/h2a-database/queries'
import { seedH2ADatabase } from '@/services/h2a-database/seed'
import { Operator } from '@/payload-types'

/**
 * Divisions to sync are configured on the `h2a-oasys-settings` global (`divisions_operator`),
 * not derived by scanning every operator with an `h2a_division_id`.
 */
const getConfiguredOperators = async (
  payload: Payload,
  req?: PayloadRequest,
): Promise<Operator[]> => {
  const settings = await payload.findGlobal({
    slug: 'h2a-oasys-settings',
    overrideAccess: true,
    req,
  })

  const divisionsOperator = settings?.divisions_operator || []

  return divisionsOperator.filter(
    (division): division is Operator =>
      typeof division === 'object' && !!division?.h2a_division_id,
  )
}

const getHeaders = (token: string): Headers => {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')
  headers.append('Accept', 'application/json')
  headers.append('Authorization', `Bearer ${token}`)
  return headers
}

const getRequestBody = (id: OasysH2AInfo, divisionId: string, additionalParams?: any): string => {
  const jsonString = JSON.stringify({
    id,
    parameters: [
      {
        name: 'DivisionID',
        value: divisionId,
      },
      ...(additionalParams ? [...additionalParams] : []),
    ],
  })

  return jsonString
}

export const getH2aToken = async (
  req: OasysH2ATokenRequest,
): Promise<OasysH2ATokenResponse | undefined> => {
  try {
    const { clientId, secret, baseUrl } = req
    const headers = new Headers()
    headers.append('Content-Type', 'application/x-www-form-urlencoded')
    headers.append('Accept', 'application/json')

    const urlEncoded = new URLSearchParams()
    urlEncoded.append('client_id', clientId)
    urlEncoded.append('client_secret', secret)
    urlEncoded.append('grant_type', 'client_credentials')

    const requestConfig: RequestInit = {
      method: 'POST',
      headers: headers,
      body: urlEncoded,
      redirect: 'follow',
    }

    const response = await fetch(`${baseUrl}/identity/connect/token`, requestConfig)

    const result = await response.json()
    return result as OasysH2ATokenResponse
  } catch (error) {
    console.error('Error fetching Oasys H2A token:', error)
    return
  }
}

export const getH2aInfo = async (param: OasysH2AInfoParam): Promise<any> => {
  try {
    const token = param.token
    const baseUrl = param.baseUrl
    const divisionId = param.divisionId
    const id = param.id

    if (!token || !baseUrl || !divisionId)
      throw new Error('Token, Base URL and Division Id are required.')

    const headers = getHeaders(token)

    const body = getRequestBody(id, divisionId, param?.additionalParams || undefined)
    const opt: RequestInit = {
      method: 'POST',
      headers,
      body,
    }

    const response = await fetch(`${baseUrl}/prod/api/employee/addinfo`, opt)

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error fetching Oasys H2A Info:', 'params', param, error)
    return {}
  }
}

export const refreshH2aOasysData = async (payload: Payload): Promise<boolean> => {
  const result = await seedH2ADatabase(payload)
  return result.success
}

export const syncH2ADepartment = async ({ payload }: { payload: Payload }): Promise<boolean> => {
  const { logger } = payload

  const operators = await getConfiguredOperators(payload)

  const isProd = process.env.NODE_ENV === 'production'

  for (const operator of operators) {
    if (!operator.h2a_division_id) continue
    const divisionId = operator.h2a_division_id
    const currentDivisionEmpInfo = await findEmployeesByDivision(divisionId)

    const departments: Record<
      string,
      { title: string; slug: string; manager_name?: string; manager_email?: string }
    > = {}

    for (const emp of currentDivisionEmpInfo) {
      const departmentName = emp['Sub Department'] || 'NA'
      const deptSlug = slugify(departmentName) || ''
      const operatorDeptSlug = `${operator.slug}-${deptSlug}`

      if (departmentName.includes('Cross Charge')) continue

      if (!departments[operatorDeptSlug]) {
        departments[operatorDeptSlug] = {
          title: departmentName,
          slug: deptSlug,
        }
      }

      // CEO (Ammar Albeik) Direct Reports are Head of Departments (except for DO Padel)
      const isReportingToCEO = emp['REPORTING MANAGER']?.trim().toLowerCase() === 'ammar albeik'
      if (
        isReportingToCEO &&
        !departmentName.includes('DO Padel') &&
        !departmentName.includes('Corporate Office')
      ) {
        departments[operatorDeptSlug].manager_name = emp.NAME
        departments[operatorDeptSlug].manager_email = (
          emp['COMPANY EMAIL'] ||
          emp['PERSONAL EMAIL'] ||
          'na'
        )?.toLowerCase()
      }
    }

    logger.info(
      `Found ${Object.keys(departments).length} unique departments for operator ${operator.slug} to sync.`,
    )
    logger.info(`Department to syncing for ${operator.slug}...`)
    for (const operatorDeptSlug in departments) {
      const dept = departments[operatorDeptSlug]

      const newDept = await createCollectionIfNotExists({
        payload,
        collection: 'departments',
        where: {
          operator_slug: {
            equals: operatorDeptSlug,
          },
        },
        data: {
          title: dept.title,
          slug: dept.slug,
          operator: operator.id,
          operator_slug: operatorDeptSlug,
          manager_name: isProd ? dept.manager_name : `${dept.slug}@${operator.slug}.com`,
          manager_email: isProd ? dept.manager_email : `${dept.slug}@${operator.slug}.com`,
        },
        overrideAccess: true,
      })

      if (!isProd) {
        let defaultManagerAccessId: string | undefined = undefined
        const defaultManagerAccess = await payload.find({
          collection: 'users-access',
          where: { name: { equals: 'Default Non Admin Manager Access' } },
          limit: 1,
          overrideAccess: true,
        })
        if (defaultManagerAccess.totalDocs > 0) {
          defaultManagerAccessId = defaultManagerAccess.docs[0].id
        }
        const email = `${dept.slug}@${operator.slug}.com`
        await createCollectionIfNotExists({
          payload,
          collection: 'users',
          where: { email: { equals: `${dept.slug}@${operator.slug}.com` } },
          data: {
            email,
            password: email,
            full_name: `${dept.title} Manager`,
            operator: operator.id,
            department: newDept.id,
            auth_method: 'credentials',
            access: defaultManagerAccessId,
            _verified: true,
          },
          overrideAccess: true,
          disableVerificationEmail: true,
          disableVerificationTransaction: true,
        })
      }
    }
    logger.info(`Department to syncing for ${operator.slug} done`)
  }

  return true
}

export const syncH2AUser = async ({
  payload,
  operation,
  req,
}: {
  payload: Payload
  operation?: 'create' | 'update'
  req?: PayloadRequest
}): Promise<boolean> => {
  operation = operation || 'create'
  const logger = payload.logger

  logger.info(`syncH2AUser started with operation: ${operation}`)
  logger.info(`syncH2AUser checking operators`)
  const operators = await getConfiguredOperators(payload, req)

  logger.info(`syncH2AUser fetching default access level`)
  const defaultAccess = await payload.find({
    collection: 'users-access',
    where: { name: { equals: 'Default Non Admin Access' } },
    limit: 1,
    overrideAccess: true,
    req,
  })

  const defaultAccessId = defaultAccess.totalDocs > 0 ? defaultAccess.docs[0].id : undefined

  logger.info(`${operators.length} operator(s) found...`)
  for (const operator of operators) {
    if (!operator.h2a_division_id) {
      logger.warn(`${operator.slug} missing h2a_division_id. Skipping...`)
      continue
    }
    const divisionId = operator.h2a_division_id
    const currentDivisionEmpInfo = await findEmployeesByDivision(divisionId)
    const totalEmployees = currentDivisionEmpInfo.length

    logger.info(
      `${operator.slug}: found ${totalEmployees} employee(s) to ${operation} for division ${divisionId}`,
    )

    for (const [empIndex, emp] of currentDivisionEmpInfo.entries()) {
      const progress = `${empIndex + 1}/${totalEmployees}`
      const empId = emp['E.N'] || 'unknown'
      const departmentName = emp['Sub Department'] || 'NA'
      if (departmentName.includes('Cross Charge')) {
        logger.info(`[${operator.slug} ${progress}] Skipping user ${empId}: Cross Charge department`)
        continue
      }

      const email = (emp['COMPANY EMAIL'] || emp['PERSONAL EMAIL'] || '').trim().toLowerCase()
      if (!email || email === 'na') {
        logger.warn(`[${operator.slug} ${progress}] Skipping user ${empId}: missing/invalid email`)
        continue
      }

      logger.info(`[${operator.slug} ${progress}] Processing user ${empId} <${email}> (${operation})`)

      const deptSlug = slugify(departmentName) || ''
      const operatorDeptSlug = `${operator.slug}-${deptSlug}`

      // Find department ID
      const depts = await payload.find({
        collection: 'departments',
        where: { operator_slug: { equals: operatorDeptSlug } },
        limit: 1,
        overrideAccess: true,
        req,
      })
      const departmentId = depts.totalDocs > 0 ? depts.docs[0].id : undefined

      if (operation === 'create') {
        await createCollectionIfNotExists({
          payload,
          collection: 'users',
          where: { email: { equals: email } },
          data: {
            email,
            full_name: emp.NAME,
            designation: emp.DESIGNATION,
            h2a_oasys_emp_id: emp['E.N'] || '',
            operator: operator.id,
            department: departmentId,
            doj: emp['DOJ'],
            _verified: ENV === 'development' ? true : false,
            access: defaultAccessId,
            password: ENV === 'development' ? 'password' : crypto.randomBytes(32).toString('hex'),
          },
          overrideAccess: true,
          disableVerificationEmail: true,
        })
      } else {
        const existingUsers = await payload.find({
          collection: 'users',
          where: { email: { equals: email } },
          limit: 1,
          overrideAccess: true,
          req,
        })

        if (existingUsers.totalDocs > 0) {
          await payload.update({
            collection: 'users',
            id: existingUsers.docs[0].id,
            data: {
              full_name: emp.NAME,
              designation: emp.DESIGNATION,
              h2a_oasys_emp_id: emp['E.N'] || '',
              operator: operator.id,
              department: departmentId,
              doj: emp['DOJ'],
              _verified: ENV === 'development' ? true : existingUsers.docs[0]?._verified,
            },
            overrideAccess: true,
          })
        }
      }
    }
  }

  return true
}

export const getH2AEmployeeInfoByDivision = async ({
  email,
  employeeId,
}: {
  email: string
  employeeId?: string
}): Promise<OasysH2AEmployeeData | undefined> => {
  if (employeeId) {
    const emp = await findEmployeeById(employeeId)
    return emp ?? undefined
  }
  if (email) {
    const emp = await findEmployeeByEmail(email)
    return emp ?? undefined
  }
  return undefined
}
