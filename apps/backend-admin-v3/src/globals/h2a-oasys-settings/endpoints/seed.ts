import { Endpoint } from 'payload'
import { User } from '@/payload-types'
import { accessCheck } from '@/utilities/access'
import { seedH2ADatabase } from '@/services/h2a-database'

export const h2aOasysSeed: Endpoint = {
  path: '/seed',
  method: 'post',
  handler: async (req) => {
    try {
      const { payload, user: _user } = req
      const { logger } = payload
      const user = _user as User

      const hasAdminAccess = await accessCheck('h2a-oasys-settings', 'admin', {
        reqOverride: req,
      })

      if (!hasAdminAccess) {
        logger.warn(
          `User ${user?.email} attempted to access /h2a-oasys-settings/seed without proper permissions.`,
        )
        return Response.json({ message: 'Forbidden' }, { status: 403 })
      }

      logger.info(`User ${user?.email} triggered Seed H2A Database.`)

      const result = await seedH2ADatabase(payload)

      if (!result.success) {
        return Response.json({ message: result.message }, { status: 400 })
      }

      return Response.json({ message: result.message, counts: result.counts }, { status: 200 })
    } catch (error) {
      return Response.json({ error: (error as Error)?.message || 'Unknown error' }, { status: 400 })
    }
  },
}

