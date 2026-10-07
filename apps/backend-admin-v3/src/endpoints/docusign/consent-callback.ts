import type { Endpoint } from 'payload'

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderHtmlPage({
  isSuccess,
  title,
  heading,
  message,
  details,
}: {
  isSuccess: boolean
  title: string
  heading: string
  message: string
  details?: string | null
}): string {
  const iconSvg = isSuccess
    ? `<svg class="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
       </svg>`
    : `<svg class="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
       </svg>`

  const detailsHtml = details
    ? `<div class="details">${escapeHtml(details)}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1.5rem;
      color: #1f2937;
    }
    .card {
      background: #ffffff;
      padding: 2.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      max-width: 28rem;
      width: 100%;
      text-align: center;
    }
    .icon {
      width: 3.5rem;
      height: 3.5rem;
      margin: 0 auto 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
    }
    .icon-success {
      background-color: #dcfce7;
      color: #15803d;
    }
    .icon-error {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .icon-svg {
      width: 2rem;
      height: 2rem;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.75rem;
    }
    p {
      color: #4b5563;
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0;
    }
    .details {
      margin-top: 1rem;
      padding: 0.75rem;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.8125rem;
      color: #374151;
      word-break: break-word;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon ${isSuccess ? 'icon-success' : 'icon-error'}">
      ${iconSvg}
    </div>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(message)}</p>
    ${detailsHtml}
  </div>
</body>
</html>`
}

export const docusignConsentCallbackEndpoint: Endpoint = {
  path: '/docusign/consent/callback',
  method: 'get',
  handler: async (req) => {
    const { logger } = req.payload

    try {
      const url = new URL(req.url || '', 'http://localhost')
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')
      const errorDescription = url.searchParams.get('error_description')

      if (error) {
        logger.warn(
          `at /docusign/consent/callback: DocuSign consent authorization denied or failed: ${error}${
            errorDescription ? ` - ${errorDescription}` : ''
          }`,
        )

        const failureMessage = errorDescription
          ? `Authorization was not completed: ${errorDescription}`
          : `Authorization was not completed: ${error}`

        return new Response(
          renderHtmlPage({
            isSuccess: false,
            title: 'DocuSign Authorization Failed',
            heading: 'Authorization Not Completed',
            message: failureMessage,
            details: errorDescription && error !== errorDescription ? `Error code: ${error}` : null,
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
            },
          },
        )
      }

      if (code) {
        logger.info('at /docusign/consent/callback: DocuSign consent successfully authorized')

        return new Response(
          renderHtmlPage({
            isSuccess: true,
            title: 'DocuSign Authorization Successful',
            heading: 'DocuSign Access Authorized',
            message: 'DocuSign access authorized — you can close this tab and return to SharePoint.',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
            },
          },
        )
      }

      logger.warn('at /docusign/consent/callback: Missing code or error query parameters')

      return new Response(
        renderHtmlPage({
          isSuccess: false,
          title: 'DocuSign Authorization',
          heading: 'Invalid Request',
          message: 'No authorization code or error was received from DocuSign.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        },
      )
    } catch (err: unknown) {
      logger.error(
        `Unexpected error in /docusign/consent/callback endpoint: ${
          (err as Error)?.message || 'Unknown'
        }`,
      )

      return new Response(
        renderHtmlPage({
          isSuccess: false,
          title: 'DocuSign Authorization Error',
          heading: 'Authorization Failed',
          message: 'An unexpected error occurred while processing the DocuSign consent callback.',
          details: (err as Error)?.message || null,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        },
      )
    }
  },
}
