import { Endpoint } from 'payload'
import { getH2aToken } from '../../../services/h2a-oasys'
import { User } from '@/payload-types'
import { accessCheck } from '@/utilities/access'
import { OasysH2ATokenRequest } from '@/services/h2a-oasys/types'

export const h2aOasysTest: Endpoint = {
  path: '/test',
  method: 'get',
  handler: async (req) => {
    try {
      const { payload, user: _user, query } = req
      const { logger } = payload
      const { config } = query
      const user = _user as User

      if (!config) {
        return Response.json({ message: 'Missing config parameter' }, { status: 400 })
      }

      const hasAdminAccess = await accessCheck('h2a-oasys-settings', 'admin', {
        reqOverride: req,
      })

      if (!hasAdminAccess) {
        logger.warn(
          `User ${user?.email} attempted to access /h2a-oasys-settings/test without proper permissions.`,
        )

        return Response.json({ message: 'Forbidden' }, { status: 403 })
      }

      logger.info(
        `User ${user?.email} is accessing /h2a-oasys-settings/test endpoint to get Oasys H2A token.`,
      )

      const oasysh2aConfig = JSON.parse(config as string) as OasysH2ATokenRequest

      const response = await getH2aToken({
        ...oasysh2aConfig,
      })

      logger.info(
        `User ${user?.email} is accessing /h2a-oasys-settings/test returned token: ${JSON.stringify(
          response,
          null,
          4,
        )}`,
      )

      return Response.json({ response }, { status: 200 })
    } catch (error) {
      return Response.json({ error }, { status: 400 })
    }
  },
}
