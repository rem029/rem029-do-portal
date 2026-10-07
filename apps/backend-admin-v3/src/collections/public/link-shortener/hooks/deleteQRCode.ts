import { CollectionBeforeDeleteHook } from 'payload'

export const deleteQRCode: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { payload } = req
  try {
    const item = await payload.findByID({
      collection: 'link-shortener',
      id,
      depth: 0,
    })

    const qrPngId = item?.qr_png as string
    const qrSvgId = item?.qr_svg as string

    if (qrPngId) {
      await payload.delete({
        collection: 'link-shortener-media',
        id: qrPngId,
      })
      req.payload.logger.info(`Deleted QR Code PNG with ID: ${qrPngId}`)
    }

    if (qrSvgId) {
      await payload.delete({
        collection: 'link-shortener-media',
        id: qrSvgId,
      })
      req.payload.logger.info(`Deleted QR Code SVG with ID: ${qrSvgId}`)
    }
  } catch (error) {
    req.payload.logger.error(`Failed to delete QR codes: ${(error as Error)?.message}`)
  }
}
