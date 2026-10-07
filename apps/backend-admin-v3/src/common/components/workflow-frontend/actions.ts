'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { getCollectionConfig } from '@/utilities/collection-meta'
import createReport from 'docx-templates'
import libre from 'libreoffice-convert'
import { promisify } from 'util'
import { lexicalToHtml } from '@/utilities/lexical-converter'
import { revalidatePath } from 'next/cache'

const libreConvert = promisify(libre.convert)

export async function getDocxTemplateAction(slug: string, type?: string) {
  try {
    const payload = await getPayload({ config: configPromise })
    const collectionConfig = getCollectionConfig(slug)

    if (!collectionConfig?.settingsSlug) {
      return { success: false, error: `Collection ${slug} not configured for Word generation` }
    }

    const settings = await payload.findGlobal({
      slug: collectionConfig.settingsSlug as any,
      overrideAccess: true,
    })

    let docxTemplate = (settings as any).docx_template

    if (slug === 'notices' && type) {
      if (type === 'salary-deduction') {
        docxTemplate = (settings as any).docx_template_salary_deduction
      } else if (type === 'warnings') {
        docxTemplate = (settings as any).docx_template_warnings
      }
    }

    if (!docxTemplate) {
      return { success: false, error: 'Word template not found in settings' }
    }

    const templateId = typeof docxTemplate === 'object' ? (docxTemplate as any).id : docxTemplate

    const media = await payload.findByID({
      collection: 'internal-media',
      id: templateId,
      overrideAccess: true,
    })

    // In local dev, media.url might be /api/internal-media/file/...
    // We need an absolute URL for the server-side fetch
    const serverURL = process.env.PAYLOAD_PUBLIC_BACKEND_URL || 'http://localhost:3015'
    const templateUrl = media.url?.startsWith('http')
      ? media.url
      : `${serverURL}${media.url || `/api/internal-media/file/${media.filename}`}`

    const response = await fetch(templateUrl)
    if (!response.ok) throw new Error(`Failed to fetch template from ${templateUrl}`)

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return {
      success: true,
      data: {
        base64,
        filename: media.filename,
      },
    }
  } catch (error: any) {
    console.error('getDocxTemplateAction error:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserSignatureAction(email: string) {
  try {
    const payload = await getPayload({ config: configPromise })

    // 1. Find the user by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: email },
      },
      overrideAccess: true,
      limit: 1,
    })

    if (users.totalDocs === 0) {
      return { success: false, error: 'User not found' }
    }

    const userId = users.docs[0].id

    // 2. Find the user-settings for this user
    const settings = await payload.find({
      collection: 'user-settings',
      where: {
        user: { equals: userId },
      },
      overrideAccess: true,
      limit: 1,
    })

    if (settings.totalDocs === 0) {
      return { success: false, error: 'User settings not found' }
    }

    const sigGroup = settings.docs[0].signature_group

    if (!sigGroup?.signature_base64) {
      return { success: false, error: 'Signature not found' }
    }

    return {
      success: true,
      data: {
        signature: sigGroup.signature_base64,
        type: sigGroup.type,
      },
    }
  } catch (error: any) {
    console.error('getUserSignatureAction error:', error)
    return { success: false, error: error.message }
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DocData = {
  employee_name?: string | null
  employee_h2a_id?: string | null
  employee_designation?: string | null
  employee_department_name?: string | null
  subject?: string | null
  description?: any
  createdAt?: string
  employee_email?: string | null
  type?: string | null
  days_deducted?: number | null
  operator_slug?: string | null
}

// ─── altChunk → OOXML Helpers ─────────────────────────────────────────────────

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlRunsToOoxml(html: string): string {
  const runs: string[] = []
  let remaining = html
  const defaultSize = '<w:sz w:val="20"/><w:szCs w:val="20"/>'

  while (remaining.length > 0) {
    // <br>
    const br = /^<br\s*\/?>/i.exec(remaining)
    if (br) {
      runs.push('<w:r><w:br/></w:r>')
      remaining = remaining.slice(br[0].length)
      continue
    }
    // <strong> bold
    const strong = /^<strong>([\s\S]*?)<\/strong>/i.exec(remaining)
    if (strong) {
      const text = strong[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
      runs.push(
        `<w:r><w:rPr><w:b/>${defaultSize}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`,
      )
      remaining = remaining.slice(strong[0].length)
      continue
    }
    // <em> italic
    const em = /^<em>([\s\S]*?)<\/em>/i.exec(remaining)
    if (em) {
      const text = em[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
      runs.push(
        `<w:r><w:rPr><w:i/>${defaultSize}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`,
      )
      remaining = remaining.slice(em[0].length)
      continue
    }
    // <u> underline
    const u = /^<u>([\s\S]*?)<\/u>/i.exec(remaining)
    if (u) {
      const text = u[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
      runs.push(
        `<w:r><w:rPr><w:u w:val="single"/>${defaultSize}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`,
      )
      remaining = remaining.slice(u[0].length)
      continue
    }
    // <strike> strikethrough
    const strike = /^<strike>([\s\S]*?)<\/strike>/i.exec(remaining)
    if (strike) {
      const text = strike[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
      runs.push(
        `<w:r><w:rPr><w:strike/>${defaultSize}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`,
      )
      remaining = remaining.slice(strike[0].length)
      continue
    }
    // skip other tags
    const tag = /^<[^>]+>/.exec(remaining)
    if (tag) {
      remaining = remaining.slice(tag[0].length)
      continue
    }
    // plain text
    const txt = /^[^<]+/.exec(remaining)
    if (txt) {
      const decoded = txt[0]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
      runs.push(
        `<w:r><w:rPr>${defaultSize}</w:rPr><w:t xml:space="preserve">${escapeXml(decoded)}</w:t></w:r>`,
      )
      remaining = remaining.slice(txt[0].length)
      continue
    }
    break
  }
  return runs.join('')
}

function htmlToOoxml(html: string): string {
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)
  const content = bodyMatch ? bodyMatch[1] : html

  const paragraphs: string[] = []
  // Match p, li, h1-h6
  const tagRegex = /<(p|li|h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = tagRegex.exec(content)) !== null) {
    const tag = m[1].toLowerCase()
    const innerHtml = m[2]
    const runs = htmlRunsToOoxml(innerHtml)

    if (tag === 'li') {
      // Basic bulleted list item
      paragraphs.push(`<w:p>
        <w:pPr>
          <w:pStyle w:val="ListParagraph"/>
          <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
        </w:pPr>
        ${runs}
      </w:p>`)
    } else if (tag.startsWith('h')) {
      // Basic heading
      paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Heading${tag[1]}"/></w:pPr>${runs}</w:p>`)
    } else {
      // Standard paragraph
      paragraphs.push(`<w:p><w:pPr><w:spacing w:after="120"/></w:pPr>${runs}</w:p>`)
    }
  }

  // fallback: no tags found → wrap entire content
  if (paragraphs.length === 0 && content.trim()) {
    paragraphs.push(`<w:p>${htmlRunsToOoxml(content)}</w:p>`)
  }

  return paragraphs.join('')
}

/**
 * Replaces altChunk elements (HTML blobs embedded by docx-templates for {HTML ...})
 * with native OOXML paragraphs so LibreOffice can render them during PDF export.
 */
async function resolveAltChunks(docxBuffer: Buffer): Promise<Buffer> {
  const { execSync } = await import('child_process')
  const fs = await import('fs')
  const tmpDir = `/tmp/altchunk-${Date.now()}`
  const inPath = `${tmpDir}/input.docx`
  const extractDir = `${tmpDir}/extracted`
  const outPath = `${tmpDir}/output.docx`

  try {
    fs.mkdirSync(extractDir, { recursive: true })
    fs.writeFileSync(inPath, docxBuffer)
    execSync(`unzip -q "${inPath}" -d "${extractDir}"`)

    const docXmlPath = `${extractDir}/word/document.xml`
    const relsPath = `${extractDir}/word/_rels/document.xml.rels`

    let docXml = fs.readFileSync(docXmlPath, 'utf8')
    let relsXml = fs.readFileSync(relsPath, 'utf8')

    // Build relationship map: rId → target filename
    const relMap: Record<string, string> = {}
    const relRx = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"[^>]*\/?>/g
    let rm: RegExpExecArray | null
    while ((rm = relRx.exec(relsXml)) !== null) relMap[rm[1]] = rm[2]

    // Find and replace each altChunk
    const altRx = /<w:altChunk[^>]+r:id="([^"]+)"[^/]*\/>/g
    let am: RegExpExecArray | null
    while ((am = altRx.exec(docXml)) !== null) {
      const rId = am[1]
      const target = relMap[rId]
      if (!target) continue
      const htmlPath = `${extractDir}/word/${target}`
      if (!fs.existsSync(htmlPath)) continue

      const html = fs.readFileSync(htmlPath, 'utf8')
      const ooxml = htmlToOoxml(html)
      docXml = docXml.replace(am[0], ooxml)
      fs.unlinkSync(htmlPath)
    }

    // Remove altChunk relationships
    relsXml = relsXml.replace(/<Relationship[^>]+aFChunk[^>]*\/?>/g, '')

    fs.writeFileSync(docXmlPath, docXml)
    fs.writeFileSync(relsPath, relsXml)

    // Re-zip preserving the OOXML structure
    execSync(`cd "${extractDir}" && zip -r -q "${outPath}" .`)

    return fs.readFileSync(outPath)
  } finally {
    try {
      const { execSync: rm } = await import('child_process')
      rm(`rm -rf "${tmpDir}"`)
    } catch {}
  }
}

// ─── Server Action: generatePdfAction ────────────────────────────────────────

export async function generatePdfAction({
  slug,
  id,
  docData,
  templateName,
  authorizedEmail,
}: {
  slug: string
  id: string
  docData: DocData
  templateName?: string
  authorizedEmail?: string
}) {
  try {
    const payload = await getPayload({ config: configPromise })
    // 1. Fetch template buffer
    const templateResult = await getDocxTemplateAction(slug, docData.type ?? undefined)
    if (!templateResult.success || !templateResult.data) {
      return { success: false, error: templateResult.error || 'Failed to fetch template' }
    }

    const templateBuffer = Buffer.from(templateResult.data.base64, 'base64')

    // 2. Format date
    const formattedDate = docData.createdAt
      ? new Date(docData.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    // 3. Build template data
    let introHtml = lexicalToHtml(docData.description)
    if (introHtml) {
      introHtml = `
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Poppins', sans-serif; font-size: 10pt; line-height: 1.5; }
        </style>
        <body>${introHtml}</body>`
    }
    const templateData: any = {
      staff_name: docData.employee_name || 'Not provided',
      staff_no: docData.employee_h2a_id || 'Not provided',
      designation: docData.employee_designation || 'Not provided',
      department: docData.employee_department_name || 'Not provided',
      subject: docData.subject || 'Not provided',
      description: introHtml || 'Not provided',
      date: formattedDate,
      email: docData.employee_email || 'Not provided',
      days_deducted: docData.type === 'salary-deduction' ? docData.days_deducted : undefined,
      signature: null,
    }

    // 4. Inject signature
    if (authorizedEmail) {
      const sigResult = await getUserSignatureAction(authorizedEmail)
      if (sigResult.success && sigResult.data?.signature) {
        const sigBase64 = sigResult.data.signature
        const base64Data = sigBase64.includes('base64,') ? sigBase64.split('base64,')[1] : sigBase64
        templateData.signature = {
          data: Buffer.from(base64Data, 'base64'),
          extension: '.png',
          width: 8, // 16:4 ratio
          height: 2,
        }
      } else {
        console.warn('[generatePdfAction] No signature for:', authorizedEmail, sigResult.error)
        // Inject empty transparent PNG
        templateData.signature = {
          data: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'),
          extension: '.png',
          width: 1,
          height: 1,
        }
      }
    } else {
      // No authorizedEmail, inject empty transparent PNG
      templateData.signature = {
        data: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'),
        extension: '.png',
        width: 1,
        height: 1,
      }
    }

    // 5. Generate DOCX buffer
    const docxArrayBuffer = await createReport({
      template: new Uint8Array(templateBuffer),
      data: templateData,
      cmdDelimiter: ['{', '}'],
    })
    const docxBuffer = Buffer.from(docxArrayBuffer)

    // 6. Process altChunks → native OOXML (LibreOffice cannot render altChunk)
    const resolvedDocxBuffer = await resolveAltChunks(docxBuffer)

    // 7. Convert DOCX → PDF using LibreOffice
    const pdfBuffer = await libreConvert(resolvedDocxBuffer, '.pdf', undefined)

    // 8. Auto-attach to document
    let mediaId: string | number | undefined = undefined

    try {
      const nameSlug = (docData.employee_name || 'Staff')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // remove special chars
        .replace(/\s+/g, '-') // replace spaces with dashes

      const filename = `${nameSlug}-${slug}-${id}.pdf`

      // Fetch latest document with depth 0 to get raw IDs
      const doc = await payload.findByID({
        collection: slug as any,
        id,
        depth: 0,
        overrideAccess: true,
      })

      if (doc) {
        const reviews = (doc as any).workflow_reviews || []
        const activeStepSlug = (doc as any)._workflow_status
        const activeReviewIndex = reviews.findIndex((r: any) => r.status_slug === activeStepSlug)

        if (activeReviewIndex !== -1) {
          const activeReview = reviews[activeReviewIndex]
          const stepAttachments = Array.isArray(activeReview.attachments) ? activeReview.attachments : []

          // Check if this specific generation already exists (by filename in internal-media)
          const existingMedia = await payload.find({
            collection: 'internal-media',
            where: {
              alt: { equals: filename },
            },
            limit: 1,
            overrideAccess: true,
          })

          mediaId = existingMedia.docs[0]?.id

          if (!mediaId) {
            // Upload to internal-media
            const mediaResult = await payload.create({
              collection: 'internal-media',
              data: { alt: filename },
              file: {
                data: pdfBuffer,
                name: filename,
                size: pdfBuffer.length,
                mimetype: 'application/pdf',
              },
              overrideAccess: true,
            })
            mediaId = mediaResult.id
          }

          // Safe check: Is it already in this step?
          const isAlreadyInStep = stepAttachments.includes(mediaId)

          if (!isAlreadyInStep) {
            // Update workflow_reviews (always an array for attachments)
            const updatedReviews = [...reviews]
            updatedReviews[activeReviewIndex] = {
              ...activeReview,
              attachments: [...stepAttachments, mediaId],
            }

            // Update top-level attachments (careful: could be single or array)
            const currentTopLevel = (doc as any).attachments
            let updatedTopLevel = currentTopLevel

            if (Array.isArray(currentTopLevel)) {
              if (!currentTopLevel.includes(mediaId)) {
                updatedTopLevel = [...currentTopLevel, mediaId]
              }
            } else if (!currentTopLevel) {
              // Only set if not already set (for single upload fields)
              updatedTopLevel = mediaId
            }

            await payload.update({
              collection: slug as any,
              id,
              data: {
                workflow_reviews: updatedReviews,
                attachments: updatedTopLevel,
              },
              overrideAccess: true,
            })

            revalidatePath(`/letters/${slug}/${id}`)
            revalidatePath(`/forms/submissions/${id}`)
            console.log('[generatePdfAction] Auto-attached:', filename)
          }
        }
      }
    } catch (attachError) {
      console.error('[generatePdfAction] Auto-attachment skipped or failed:', attachError)
    }

    // 9. Return as base64 and media info
    let mediaObj = null
    if (mediaId) {
      try {
        mediaObj = await payload.findByID({
          collection: 'internal-media',
          id: mediaId as string,
          depth: 0,
          overrideAccess: true,
        })
      } catch {}
    }

    return {
      success: true,
      data: {
        pdf: pdfBuffer.toString('base64'),
        media: mediaObj,
      },
    }
  } catch (error: any) {
    console.error('[generatePdfAction] error:', error)
    return { success: false, error: error.message }
  }
}
