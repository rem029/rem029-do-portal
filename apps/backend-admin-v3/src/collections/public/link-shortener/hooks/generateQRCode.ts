import { LinkShortener, LinkShortenerMedia } from '@/payload-types'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { BeforeChangeHook } from 'node_modules/payload/dist/collections/config/types'
import QRCode from 'qrcode'

export const generateQRCode: BeforeChangeHook<LinkShortener> = async ({ req, operation, data }) => {
  if (operation === 'create' || operation === 'update') {
    const { slug, type, plain_text } = data
    const qrContent =
      type === 'plain_text' ? (plain_text ?? '') : `${BACKEND_URL_WITH_BASE}/link/${slug}?source=qr`

    try {
      const qrCodeBufferPNG = await QRCode.toBuffer(qrContent, {
        type: 'png',
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#143422',
          light: '#FFFFFF',
        },
      })
      const svgString = await QRCode.toString(qrContent, {
        type: 'svg',
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#143422',
          light: '#FFFFFF',
        },
      })
      const qrCodeBufferSVG = Buffer.from(svgString)

      req.payload.logger.info(`QR Code: Get buffer from SVG...`)

      let png: LinkShortenerMedia
      let svg: LinkShortenerMedia

      if (!data?.qr_png) {
        png = await req.payload.create({
          collection: 'link-shortener-media',
          data: { alt: ` ${slug}-qr` },
          file: {
            data: qrCodeBufferPNG,
            mimetype: 'image/png',
            name: `${slug}.png`,
            size: qrCodeBufferPNG.length,
          },
          overrideAccess: true,
          overwriteExistingFiles: true,
          req,
        })
      } else {
        png = await req.payload.update({
          collection: 'link-shortener-media',
          id: data.qr_png as string,
          data: {},
          file: {
            data: qrCodeBufferPNG,
            mimetype: 'image/png',
            name: `${slug}.png`,
            size: qrCodeBufferPNG.length,
          },
          overrideAccess: true,
          overwriteExistingFiles: true,
          req,
        })
      }

      if (!data?.qr_svg) {
        svg = await req.payload.create({
          collection: 'link-shortener-media',
          data: { alt: ` ${slug}-qr` },
          file: {
            data: qrCodeBufferSVG,
            mimetype: 'image/svg+xml',
            name: `${slug}.svg`,
            size: qrCodeBufferSVG.length,
          },
          overrideAccess: true,
          overwriteExistingFiles: true,
          req,
        })
      } else {
        svg = await req.payload.update({
          collection: 'link-shortener-media',
          id: data.qr_svg as string,
          data: {},
          file: {
            data: qrCodeBufferSVG,
            mimetype: 'image/svg+xml',
            name: `${slug}.svg`,
            size: qrCodeBufferSVG.length,
          },
          overrideAccess: true,
          overwriteExistingFiles: true,
          req,
        })
      }

      req.payload.logger.info(`QR Code PNG: ${png.id}`)
      req.payload.logger.info(`QR Code SVG: ${svg.id}`)

      data.qr_png = png.id
      data.qr_svg = svg.id
    } catch (error) {
      req.payload.logger.error(
        `Failed to generate QR code: ${(error as Error)?.message || 'Unknown error'}`,
      )
      // Don't throw error to prevent document creation failure
    }
  }

  return data
}
