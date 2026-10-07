'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Department, InternalMedia } from '@/payload-types'

export const fetchSettingsAndMediaAction = async (): Promise<{
  headerImageBase64: string
  footerImageBase64: string
  headerImageUrl: string
  footerImageUrl: string
  docxTemplateUrl: string
}> => {
  try {
    const payload = await getPayload({ config: configPromise })

    // Fetch settings
    console.log('[Actions] Fetching salary-deduction-settings...')
    const settings = await payload.findGlobal({
      slug: 'salary-deduction-settings',
      overrideAccess: true,
    })
    console.log('[Actions] Settings fetched:', {
      hasHeaderImage: !!settings?.header_image,
      hasFooterImage: !!settings?.footer_image,
      hasDocxTemplate: !!settings?.docx_template,
    })

    // Fetch header image
    let headerImageBase64 = ''
    let headerImageUrl = ''
    if (settings?.header_image) {
      console.log('[Actions] Processing header image...')
      const headerId =
        typeof settings.header_image === 'object' ? settings.header_image.id : settings.header_image
      console.log('[Actions] Header image ID:', headerId)

      const headerMedia = (await payload.findByID({
        collection: 'internal-media',
        id: headerId,
      })) as InternalMedia
      console.log('[Actions] Header media fetched:', {
        url: headerMedia?.url,
        mimeType: headerMedia?.mimeType,
      })

      if (headerMedia?.url) {
        const serverURL = process.env.PAYLOAD_PUBLIC_BACKEND_URL || 'http://localhost:3015'
        // Check if URL is already absolute
        const imageUrl = headerMedia.url.startsWith('http')
          ? headerMedia.url
          : `${serverURL}${headerMedia.url}`
        headerImageUrl = imageUrl
        console.log('[Actions] Fetching header image from:', imageUrl)
        const response = await fetch(imageUrl)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        // Determine mime type from file extension or default to png
        const mimeType = headerMedia.mimeType || 'image/png'
        headerImageBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`
        console.log('[Actions] Header image base64 created, length:', headerImageBase64.length)
      }
    } else {
      console.log('[Actions] No header image in settings')
    }

    // Fetch footer image
    let footerImageBase64 = ''
    let footerImageUrl = ''
    if (settings?.footer_image) {
      console.log('[Actions] Processing footer image...')
      const footerId =
        typeof settings.footer_image === 'object' ? settings.footer_image.id : settings.footer_image
      console.log('[Actions] Footer image ID:', footerId)

      const footerMedia = (await payload.findByID({
        collection: 'internal-media',
        id: footerId,
      })) as InternalMedia
      console.log('[Actions] Footer media fetched:', {
        url: footerMedia?.url,
        mimeType: footerMedia?.mimeType,
      })

      if (footerMedia?.url) {
        const serverURL = process.env.PAYLOAD_PUBLIC_BACKEND_URL || 'http://localhost:3015'
        // Check if URL is already absolute
        const imageUrl = footerMedia.url.startsWith('http')
          ? footerMedia.url
          : `${serverURL}${footerMedia.url}`
        footerImageUrl = imageUrl
        console.log('[Actions] Fetching footer image from:', imageUrl)
        const response = await fetch(imageUrl)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        // Determine mime type from file extension or default to png
        const mimeType = footerMedia.mimeType || 'image/png'
        footerImageBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`
        console.log('[Actions] Footer image base64 created, length:', footerImageBase64.length)
      }
    } else {
      console.log('[Actions] No footer image in settings')
    }

    // Fetch docx template
    let docxTemplateUrl = ''
    if (settings?.docx_template) {
      console.log('[Actions] Processing docx template...')
      const templateId =
        typeof settings.docx_template === 'object'
          ? settings.docx_template.id
          : settings.docx_template
      console.log('[Actions] Template ID:', templateId)

      const templateMedia = (await payload.findByID({
        collection: 'internal-media',
        id: templateId,
      })) as InternalMedia
      console.log('[Actions] Template media fetched:', {
        url: templateMedia?.url,
        mimeType: templateMedia?.mimeType,
      })

      if (templateMedia?.url) {
        const serverURL = process.env.PAYLOAD_PUBLIC_BACKEND_URL || 'http://localhost:3015'
        // Check if URL is already absolute
        docxTemplateUrl = templateMedia.url.startsWith('http')
          ? templateMedia.url
          : `${serverURL}${templateMedia.url}`
        console.log('[Actions] Template URL:', docxTemplateUrl)
      }
    } else {
      console.log('[Actions] No docx template in settings')
    }

    console.log('[Actions] Returning data:', {
      hasHeaderImageBase64: !!headerImageBase64,
      hasFooterImageBase64: !!footerImageBase64,
      hasHeaderImageUrl: !!headerImageUrl,
      hasFooterImageUrl: !!footerImageUrl,
      hasDocxTemplateUrl: !!docxTemplateUrl,
    })

    return {
      headerImageBase64,
      footerImageBase64,
      headerImageUrl,
      footerImageUrl,
      docxTemplateUrl,
    }
  } catch (error) {
    console.error('Error fetching settings and media:', error)
    return {
      headerImageBase64: '',
      footerImageBase64: '',
      headerImageUrl: '',
      footerImageUrl: '',
      docxTemplateUrl: '',
    }
  }
}
