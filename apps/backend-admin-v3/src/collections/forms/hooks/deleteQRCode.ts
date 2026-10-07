import { CollectionBeforeDeleteHook } from 'payload'

export const deleteQRCode: CollectionBeforeDeleteHook = async ({ id, req }) => {
  try {
    const item = await req.payload.findByID({
      collection: 'forms',
      id,
      depth: 0,
      req,
    })

    const qrPngId = item?.qr_png
    const qrSvgId = item?.qr_svg

    if (qrPngId) {
      await req.payload.delete({
        collection: 'forms-media',
        id: typeof qrPngId === 'object' ? (qrPngId as any).id : qrPngId,
        req,
      })
      req.payload.logger.info(`Deleted QR Code PNG with ID: ${qrPngId}`)
    }

    if (qrSvgId) {
      await req.payload.delete({
        collection: 'forms-media',
        id: typeof qrSvgId === 'object' ? (qrSvgId as any).id : qrSvgId,
        req,
      })
      req.payload.logger.info(`Deleted QR Code SVG with ID: ${qrSvgId}`)
    }
  } catch (error: any) {
    req.payload.logger.error(`Failed to delete QR codes: ${error.message}`)
  }
}
