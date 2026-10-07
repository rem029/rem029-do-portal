'use server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import QRCode from 'qrcode'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

export async function generateQRCodeAction(formId: string | number) {
  const payload = await getPayload({ config: configPromise })

  try {
    const form = await payload.findByID({
      collection: 'forms',
      id: formId,
      depth: 0,
    })

    if (!form || !form.slug) {
      throw new Error('Form or slug not found')
    }

    const { slug, title, qr_png, qr_svg } = form as any
    const qrUrl = `${BACKEND_URL_WITH_BASE}/forms/${slug}?src=qr`.replace(/\/\/+/g, '/')

    // Delete existing media if they exist to avoid orphaned files
    if (qr_png) {
      try {
        await payload.delete({
          collection: 'forms-media',
          id: typeof qr_png === 'object' ? qr_png.id : qr_png,
        })
      } catch (e: any) {
        console.error(`Failed to delete old PNG (${qr_png}):`, e.message)
      }
    }
    if (qr_svg) {
      try {
        await payload.delete({
          collection: 'forms-media',
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
      collection: 'forms-media',
      data: {
        alt: `QR Code PNG for ${title || slug}`,
      },
      file: {
        data: qrCodeBufferPNG,
        mimetype: 'image/png',
        name: `qr-${slug}.png`,
        size: qrCodeBufferPNG.length,
      },
    })

    const svg = await payload.create({
      collection: 'forms-media',
      data: {
        alt: `QR Code SVG for ${title || slug}`,
      },
      file: {
        data: qrCodeBufferSVG,
        mimetype: 'image/svg+xml',
        name: `qr-${slug}.svg`,
        size: qrCodeBufferSVG.length,
      },
    })

    // Update the form document with the new media IDs
    await payload.update({
      collection: 'forms',
      id: formId,
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
