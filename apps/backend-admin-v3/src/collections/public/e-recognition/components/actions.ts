'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Media } from '@/payload-types'
import { OasysH2AEmployeeData } from '@/services/h2a-oasys/types'
import { findAllEmployees } from '@/services/h2a-database'

export const fetchMediaAction = async (id: string): Promise<Media | null> => {
  if (!id) return null

  try {
    const payload = await getPayload({ config: configPromise })
    const media = await payload.findByID({
      collection: 'media',
      id,
    })
    return media
  } catch (error) {
    console.error('Error fetching media:', error)
    return null
  }
}

export async function fetchEmployeesAction(): Promise<OasysH2AEmployeeData[]> {
  try {
    return await findAllEmployees()
  } catch (error) {
    console.error('Error fetching employees:', error)
    return []
  }
}

export async function postMediaAction(data: {
  dataUrl: string
  filename: string
  alt?: string
}): Promise<{ success: boolean; media?: Media; error?: string }> {
  try {
    const payload = await getPayload({ config: configPromise })

    // Convert data URL to buffer
    const base64Data = data.dataUrl.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    // Create media document
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: data.alt || data.filename,
      },
      file: {
        data: buffer,
        mimetype: 'image/png',
        name: data.filename,
        size: buffer.length,
      },
    })

    return { success: true, media }
  } catch (error) {
    console.error('Error creating media:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function sendEmailAction(data: {
  to: string
  subject: string
  html: string
  text?: string
  pngDataUrl?: string
  title?: string
}): Promise<{ success: boolean; mediaId?: string; error?: string }> {
  try {
    const payload = await getPayload({ config: configPromise })

    let mediaId: string | undefined

    // Save PNG to media collection if provided
    if (data.pngDataUrl) {
      const timestamp = Date.now()
      const filename = `e-recognition-${data.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'untitled'}-${timestamp}.png`

      const mediaResult = await postMediaAction({
        dataUrl: data.pngDataUrl,
        filename,
        alt: `E-Recognition: ${data.title || 'Untitled'}`,
      })

      if (mediaResult.success && mediaResult.media) {
        mediaId = mediaResult.media.id as string

        // Replace data URL with media URL in email HTML
        const updatedHtml = data.html.replace(data.pngDataUrl, mediaResult.media.url as string)

        await payload.sendEmail({
          to: data.to,
          subject: data.subject,
          html: updatedHtml,
          text: data.text,
        })
      } else {
        // Fallback: send with data URL if media creation failed
        await payload.sendEmail({
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        })
      }
    } else {
      await payload.sendEmail({
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      })
    }

    return { success: true, mediaId }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
