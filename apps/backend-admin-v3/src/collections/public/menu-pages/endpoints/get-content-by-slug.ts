import type { Endpoint } from 'payload'
import { accessCheck } from '@/utilities/access'

/**
 * Custom endpoint to fetch menu page content by slug.
 * GET /api/menu-pages/content/:slug
 */
export const getContentBySlug: Endpoint = {
  path: '/content/:slug',
  method: 'get',
  handler: async (req) => {
    const slug = req.routeParams?.slug as string
    const locale = (req.query?.locale as string) || 'en'
    const depth = req.query?.depth ? parseInt(req.query.depth as string, 10) : 0
    const { payload, user } = req
    const { logger } = payload

    try {
      logger.info(
        `Fetching menu content for ${slug} with locale ${locale} and depth ${depth}`,
      )

      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 })
      }

      const hasReadAccess = await accessCheck('menu-pages', 'read', {
        reqOverride: req,
        fallbackAccess: false,
      })

      if (!hasReadAccess) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 })
      }

      if (!slug) {
        return Response.json({ error: 'Slug is required' }, { status: 400 })
      }

      const result = await payload.find({
        collection: 'menu-pages',
        where: {
          ['info.slug']: {
            equals: slug,
          },
        },
        depth,
        locale: locale as any,
        fallbackLocale: 'en',
        limit: 1,
        req,
      })

      if (result.totalDocs === 0) {
        return Response.json({ error: 'Menu not found' }, { status: 404 })
      }

      logger.info(
        `Fetching menu content for ${slug} with locale ${locale} and depth ${depth} successful`,
      )
      return Response.json(result.docs[0])
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      logger.error(
        `Fetching menu content for ${slug} with locale ${locale} and depth ${depth} error: ${errMsg}`,
      )
      return Response.json({ error: errMsg }, { status: 500 })
    }
  },
}
