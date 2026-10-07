import type { Endpoint } from 'payload'
import { performBackup } from '@/services/backup'
import { hasUserAccess } from '@/utilities/access'
import { User } from '@/payload-types'

const BACKUP_ACCESS_SLUG = 'payload-backup'

export const backupEndpoint: Endpoint = {
  path: '/backup',
  method: 'get',
  handler: async (req) => {
    const { user } = req
    const { logger } = req.payload

    try {
      // --- Auth / Access Check ---
      if (!user) {
        logger.error('at /backup endpoint: Unauthenticated access')
        return Response.json({ message: 'Unauthenticated' }, { status: 403 })
      }

      // Global super_user OR a users-access entry for 'payload-backup' with super_user: true
      if (!hasUserAccess(user as unknown as User, BACKUP_ACCESS_SLUG, 'super_user')) {
        logger.error(
          `at /backup endpoint: Unauthorized access by user ${(user as unknown as User).email}`,
        )
        return Response.json({ message: 'Unauthorized' }, { status: 403 })
      }

      const dbOnly = req.query?.dbOnly === 'true'
      const { stream, archiveName, contentType } = await performBackup(req, { dbOnly })

      return new Response(stream, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${archiveName}"`,
          'Cache-Control': 'no-cache',
        },
      })
    } catch (error: any) {
      if (logger) {
        logger.error(`Error in /backup endpoint: ${error.message || 'Unknown'}`)
      }
      return Response.json({ error: 'Backup creation failed' }, { status: 500 })
    }
  },
}
