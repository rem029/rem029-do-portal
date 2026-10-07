'use server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import QRCode from 'qrcode'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

export async function generateQRCodeAction(pageId: string | number) {
  const payload = await getPayload({ config: configPromise })

  try {
    const page = await payload.findByID({
      collection: 'site-pages',
      id: pageId,
      depth: 0,
    })

    if (!page) {
      throw new Error('Page not found')
    }

    const slug = (page as any)?.info?.slug
    if (!slug) {
      throw new Error('Page slug not found')
    }

    const { info, qr_png, qr_svg } = page as any
    const title = info?.title || slug
    const qrUrl = `${BACKEND_URL_WITH_BASE}/page/${slug}?src=qr`.replace(/\/\/+/g, '/')

    // Delete existing media if they exist to avoid orphaned files
    if (qr_png) {
      try {
        await payload.delete({
          collection: 'media',
          id: typeof qr_png === 'object' ? qr_png.id : qr_png,
        })
      } catch (e: any) {
        console.error(`Failed to delete old PNG (${qr_png}):`, e.message)
      }
    }
    if (qr_svg) {
      try {
        await payload.delete({
          collection: 'media',
          id: typeof qr_svg === 'object' ? qr_svg.id : qr_svg,
        })
      } catch (e: any) {
        console.error(`Failed to delete old SVG (${qr_svg}):`, e.message)
      }
    }

    // Generate new QR codes
    const qrCodeBufferPNG = await QRCode.toBuffer(qrUrl, {
      type: 'png',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'H',
    })

    const svgString = await QRCode.toString(qrUrl, {
      type: 'svg',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'H',
    })
    const qrCodeBufferSVG = Buffer.from(svgString)

    // Create new media records
    const png = await payload.create({
      collection: 'media',
      data: {
        alt: `QR Code PNG for ${title}`,
      },
      file: {
        data: qrCodeBufferPNG,
        mimetype: 'image/png',
        name: `qr-page-${slug}.png`,
        size: qrCodeBufferPNG.length,
      },
    })

    const svg = await payload.create({
      collection: 'media',
      data: {
        alt: `QR Code SVG for ${title}`,
      },
      file: {
        data: qrCodeBufferSVG,
        mimetype: 'image/svg+xml',
        name: `qr-page-${slug}.svg`,
        size: qrCodeBufferSVG.length,
      },
    })

    // Update the page document with the new media IDs
    await payload.update({
      collection: 'site-pages',
      id: pageId,
      data: {
        qr_png: png.id,
        qr_svg: svg.id,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error in generateQRCodeAction:', error)
    return { success: false, error: error.message }
  }
}
