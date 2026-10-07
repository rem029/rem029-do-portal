import type { CollectionBeforeDeleteHook } from 'payload'
import type { FnbMenuEvent } from '@/payload-types'

export const deleteEventQRCode: CollectionBeforeDeleteHook = async ({ id, req }) => {
  try {
    const event = (await req.payload.findByID({
      collection: 'fnb-menu-events',
      id,
      depth: 0,
      req,
    })) as unknown as FnbMenuEvent // Structural cast: Payload findByID returns loosely-shaped document

    const qrPng = event?.qr_png
    const qrSvg = event?.qr_svg

    if (qrPng) {
      const pngId = typeof qrPng === 'object' && qrPng !== null ? qrPng.id : qrPng
      await req.payload.delete({
        collection: 'menu-media',
        id: pngId,
        req,
      })
      req.payload.logger.info(`Deleted QR Code PNG with ID: ${pngId}`)
    }

    if (qrSvg) {
      const svgId = typeof qrSvg === 'object' && qrSvg !== null ? qrSvg.id : qrSvg
      await req.payload.delete({
        collection: 'menu-media',
        id: svgId,
        req,
      })
      req.payload.logger.info(`Deleted QR Code SVG with ID: ${svgId}`)
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    req.payload.logger.error(`Failed to delete QR codes: ${message}`)
  }
}
