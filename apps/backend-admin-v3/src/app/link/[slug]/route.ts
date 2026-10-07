import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { addAnalyticsAction } from '@/common/actions/analytics'

export const GET = async (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const payload = await getPayload({ config })
  const url = new URL(req.url)
  const source = url.searchParams.get('source') || 'direct'

  try {
    const result = await payload.find({
      collection: 'link-shortener',
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (result.docs.length > 0) {
      const linkDoc = result.docs[0]
      const type = linkDoc.type ?? 'link'

      if (type === 'plain_text') {
        await addAnalyticsAction({
          eventType: 'click',
          path: `/link/${slug}`,
          additionalData: {
            slug,
            source,
            type,
          },
        })

        return new NextResponse(linkDoc.plain_text ?? '', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }

      const targetUrl = linkDoc.link

      if (!targetUrl) {
        return new NextResponse('Link not found', { status: 404 })
      }

      // Log analytic event
      await addAnalyticsAction({
        eventType: 'click',
        path: `/link/${slug}`,
        additionalData: {
          slug,
          targetUrl,
          source,
          type,
        },
      })

      return NextResponse.redirect(targetUrl)
    }

    return new NextResponse('Link not found', { status: 404 })
  } catch (error) {
    payload.logger.error(
      `Error in link redirect for slug ${slug}: ${JSON.stringify(error, null, 4)}`,
    )
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
