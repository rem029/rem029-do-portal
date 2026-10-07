'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useField, Button } from '@payloadcms/ui'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { Media } from '@/payload-types'
import { fetchMediaAction, sendEmailAction } from './actions'
import { toPng } from 'html-to-image'

const ContentPreview = () => {
  const { value: content } = useField({ path: 'content' })
  const { value: bgMediaId } = useField({ path: 'bg_media' })
  const { value: staffMediaId } = useField({ path: 'staff_media' })
  const { value: employeeId } = useField({ path: 'employee_id' })
  const { value: title } = useField({ path: 'title' })

  const [bgMedia, setBgMedia] = useState<Media | null>(null)
  const [staffMedia, setStaffMedia] = useState<Media | null>(null)
  const [html, setHtml] = useState<string>('')
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [emailHtml, setEmailHtml] = useState<string>('')
  const [pngDataUrl, setPngDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [sending, setSending] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const convertToHTML = async () => {
      if (!content) {
        setHtml('')
        return
      }

      try {
        setLoading(true)
        const htmlOutput = convertLexicalToHTML({
          data: content as SerializedEditorState,
        })
        setHtml(htmlOutput)
      } catch (error) {
        console.error('Error converting Lexical to HTML:', error)
        setHtml('<p style="color: #dc2626;">Error rendering preview</p>')
      } finally {
        setLoading(false)
      }
    }

    convertToHTML()
  }, [content])

  useEffect(() => {
    const getMedias = async () => {
      if (bgMediaId) {
        const _bgMedia = await fetchMediaAction(bgMediaId as string)
        setBgMedia(_bgMedia)
      } else {
        setBgMedia(null)
      }

      if (staffMediaId) {
        const _staffMedia = await fetchMediaAction(staffMediaId as string)
        setStaffMedia(_staffMedia)
      } else {
        setStaffMedia(null)
      }
    }

    getMedias()
  }, [bgMediaId, staffMediaId])

  // Generate preview HTML for iframe (16:9 ratio: 1920x1080)
  useEffect(() => {
    if (!html && !bgMedia && !staffMedia) {
      setPreviewHtml('')
      return
    }

    const generatePreviewHtml = () => {
      const backgroundUrl = bgMedia?.url || ''
      const staffPhotoUrl = staffMedia?.url || ''

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      width: 1280px;
      height: 720px;
      overflow: hidden;
    }
    
    .email-container {
      width: 100%;
      height: 100%;
      background-color: ${backgroundUrl ? 'transparent' : '#f3f4f6'};
      ${backgroundUrl ? `background-image: url('${backgroundUrl}');` : ''}
      ${backgroundUrl ? 'background-size: cover;' : ''}
      ${backgroundUrl ? 'background-position: center;' : ''}
      ${backgroundUrl ? 'background-repeat: no-repeat;' : ''}
      position: relative;
    }
    
    .overlay {
      ${backgroundUrl ? 'background-color: rgba(0, 0, 0, 0.3);' : ''}
      width: 100%;
      height: 100%;
      padding: 50px 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .staff-photo {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      border: 4px solid #ffffff;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      object-fit: cover;
      margin-bottom: 30px;
    }
    
    .content-wrapper {
      max-width: 900px;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    .content-wrapper h1 {
      font-size: 32px;
      margin-bottom: 16px;
      color: white;
    }
    
    .content-wrapper h2 {
      font-size: 26px;
      margin-bottom: 14px;
      color: white;
    }
    
    .content-wrapper h3 {
      font-size: 22px;
      margin-bottom: 12px;
      color: white;
    }
    
    .content-wrapper h4,
    .content-wrapper h5,
    .content-wrapper h6 {
      margin-bottom: 10px;
      color: white;
    }
    
    .content-wrapper p {
      font-size: 18px;
      margin-bottom: 12px;
      color: white;
    }
    
    .content-wrapper ul,
    .content-wrapper ol {
      font-size: 16px;
      margin-left: 30px;
      margin-bottom: 12px;
      color: white;
    }
    
    .content-wrapper li {
      margin-bottom: 8px;
      color: white;
    }
    
    .content-wrapper a {
      color: #60a5fa;
      text-decoration: underline;
    }
    
    .content-wrapper strong {
      font-weight: 700;
    }
    
    .content-wrapper em {
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="overlay">
      ${staffPhotoUrl ? `<img src="${staffPhotoUrl}" alt="Staff" class="staff-photo" />` : ''}
      ${html ? `<div class="content-wrapper">${html}</div>` : ''}
    </div>
  </div>
</body>
</html>
      `.trim()
    }

    setPreviewHtml(generatePreviewHtml())
  }, [html, bgMedia, staffMedia])

  // Convert iframe to PNG when preview HTML changes
  useEffect(() => {
    if (!previewHtml) {
      setPngDataUrl('')
      setEmailHtml('')
      return
    }

    const convertToPng = async () => {
      // Wait for iframe to load
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (!iframeRef.current?.contentDocument?.body) {
        console.error('Iframe not ready')
        return
      }

      setConverting(true)

      try {
        const iframeBody = iframeRef.current.contentDocument.body

        // Generate PNG with 16:9 resolution (1280x720) - optimized for web
        const dataUrl = await toPng(iframeBody, {
          width: 1280,
          height: 720,
          quality: 0.95,
          pixelRatio: 1,
          cacheBust: true,
        })

        setPngDataUrl(dataUrl)

        // Generate simple email HTML with just the image
        const simpleEmailHtml = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Recognition</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 0;">
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 1080px;">
          <tr>
            <td>
              <img 
                src="${dataUrl}" 
                alt="E-Recognition" 
                width="100%" 
                style="display: block; width: 100%; height: auto; border: 0;" 
              />
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim()

        setEmailHtml(simpleEmailHtml)
      } catch (error) {
        console.error('Error converting to PNG:', error)
        alert('Failed to convert preview to image. Please try again.')
      } finally {
        setConverting(false)
      }
    }

    convertToPng()
  }, [previewHtml])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailHtml)
    alert('Email HTML copied to clipboard!')
  }

  const downloadPng = () => {
    if (!pngDataUrl) return

    const link = document.createElement('a')
    link.download = `e-recognition-${Date.now()}.png`
    link.href = pngDataUrl
    link.click()
  }

  const handleSendEmail = async () => {
    if (!employeeId || !emailHtml || !pngDataUrl) {
      alert('Please select an employee and add content before sending email')
      return
    }

    const confirmed = window.confirm(
      `Send e-recognition email to ${employeeId}?\n\nSubject: ${title || 'E-Recognition'}`,
    )

    if (!confirmed) return

    setSending(true)

    try {
      // Extract plain text from HTML for email metadata
      const plainText = html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()

      const result = await sendEmailAction({
        to: employeeId as string,
        subject: (title as string) || 'E-Recognition',
        html: emailHtml,
        text: plainText || undefined,
        pngDataUrl: pngDataUrl,
        title: (title as string) || undefined,
      })

      if (result.success) {
        alert(
          `Email sent successfully!${result.mediaId ? ` PNG saved to media (ID: ${result.mediaId})` : ''}`,
        )
      } else {
        alert(`Failed to send email: ${result.error}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-5 p-5 rounded">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-base font-semibold">Preview (16:9 - 1280x720)</h3>
        <div className="flex flex-row gap-2">
          {converting && <span className="text-sm text-gray-600">Converting to PNG...</span>}
          {pngDataUrl && (
            <Button onClick={downloadPng} size="small">
              Download PNG
            </Button>
          )}
          {emailHtml && (
            <Button onClick={copyToClipboard} size="small">
              Copy Email HTML
            </Button>
          )}
          {emailHtml && (employeeId as string) && (
            <Button onClick={handleSendEmail} disabled={sending} size="small">
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading preview...</p>
      ) : (
        <>
          {/* Visual Preview - Hidden iframe for conversion */}
          <div style={{ position: 'absolute', left: '-9999px', width: '1280px', height: '720px' }}>
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
              title="Email Preview"
            />
          </div>

          {/* PNG Preview */}
          {pngDataUrl && (
            <div className="rounded w-full bg-gray-100 mb-5">
              <img
                src={pngDataUrl}
                alt="Email Preview PNG"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          )}

          {/* HTML Code Preview */}
          {emailHtml && (
            <details className="mt-5">
              <summary className="cursor-pointer font-semibold mb-2">View Email HTML Code</summary>
              <pre
                data-language="html"
                className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-xs max-h-96"
              >
                <code>{emailHtml}</code>
              </pre>
            </details>
          )}
        </>
      )}
    </div>
  )
}

export default ContentPreview
