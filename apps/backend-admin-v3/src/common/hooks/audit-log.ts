import {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionAfterLoginHook,
  CollectionAfterLogoutHook,
  GlobalAfterChangeHook,
} from 'payload'
import { getClientIp } from '@/utilities/get-ip'

/**
 * Hook factory to log creation and updates to the audit-logs collection.
 * @param collectionSlug The slug of the collection being audited.
 */
export const auditLogAfterChange =
  (collectionSlug: string): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, operation, req: { payload, user }, req }) => {
    if (operation === 'create' || operation === 'update') {
      try {
        await payload.create({
          collection: 'audit-logs',
          data: {
            user: user?.id,
            collectionSlug,
            type: 'collection',
            entityId: doc.id,
            operation,
            ip: getClientIp(req),
            data: {
              new: doc,
              old: previousDoc,
            },
          },
          req,
        })
      } catch (err) {
        payload.logger.error(`Error creating audit log for ${collectionSlug}: ${err}`)
      }
    }
    return doc
  }

/**
 * Hook factory to log deletions to the audit-logs collection.
 * @param collectionSlug The slug of the collection being audited.
 */
export const auditLogAfterDelete =
  (collectionSlug: string): CollectionAfterDeleteHook =>
  async ({ doc, req: { payload, user }, req }) => {
    try {
      await payload.create({
        collection: 'audit-logs',
        data: {
          user: user?.id,
          collectionSlug,
          type: 'collection',
          entityId: doc.id,
          operation: 'delete',
          ip: getClientIp(req),
          data: {
            deletedDoc: doc,
          },
        },
        req,
      })
    } catch (err) {
      payload.logger.error(`Error creating audit log for ${collectionSlug}: ${err}`)
    }
  }

/**
 * Hook factory to log updates to Globals.
 * @param globalSlug The slug of the global being audited.
 */
export const auditLogGlobalAfterChange =
  (globalSlug: string): GlobalAfterChangeHook =>
  async ({ doc, previousDoc, req: { payload, user }, req }) => {
    try {
      await payload.create({
        collection: 'audit-logs',
        data: {
          user: user?.id,
          collectionSlug: globalSlug,
          type: 'global',
          entityId: globalSlug,
          operation: 'update',
          ip: getClientIp(req),
          data: {
            new: doc,
            old: previousDoc,
          },
        },
        req,
      })
    } catch (err) {
      payload.logger.error(`Error creating audit log for global ${globalSlug}: ${err}`)
    }
    return doc
  }

/**
 * Hook to log successful logins.
 */
export const auditLogAfterLogin: CollectionAfterLoginHook = async ({
  user,
  req: { payload, context },
  req,
}) => {
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        user: user.id,
        collectionSlug: 'users',
        type: 'collection',
        entityId: user.id,
        operation: 'login',
        ip: getClientIp(req),
        data: {
          method: context.isMicrosoftLogin ? 'microsoft' : 'credentials',
        },
      },
      req,
    })
  } catch (err) {
    payload.logger.error(`Error creating audit log for login: ${err}`)
  }
}

/**
 * Hook to log logouts.
 */
export const auditLogAfterLogout: CollectionAfterLogoutHook = async ({
  req: { payload, user },
  req,
}) => {
  if (user) {
    try {
      await payload.create({
        collection: 'audit-logs',
        data: {
          user: user.id,
          collectionSlug: 'users',
          type: 'collection',
          entityId: user.id,
          operation: 'logout',
          ip: getClientIp(req),
        },
        req,
      })
    } catch (err) {
      payload.logger.error(`Error creating audit log for logout: ${err}`)
    }
  }
}
