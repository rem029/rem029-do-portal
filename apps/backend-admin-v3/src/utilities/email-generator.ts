import { format, isValid, parseISO } from 'date-fns'
import { lexicalToHtml } from './lexical-converter'

export interface EmailField {
  label: string
  value: any
}

export interface EmailActionButton {
  label: string
  url: string
  color?: string
}

export interface ReviewHistoryItem {
  label: string
  reviewer: string
  response: string
  comments?: string
  date?: string
  attachments?: { filename: string; url: string }[]
  customFieldResponses?: { label: string; value: string }[]
}

interface EmailGeneratorOptions {
  title: string
  message: string
  fields?: EmailField[]
  actionButtons?: EmailActionButton[]
  description?: any // RichText or string
  history?: ReviewHistoryItem[]
  docId?: string | number
  hideHistory?: boolean
  hideDetails?: boolean
  hideDescription?: boolean
  hideAttachments?: boolean
  attachments?: { filename: string; url: string }[]
  customText?: string
  latestCustomFieldValues?: { label: string; value: string }[]
}

const THEME = {
  primary: '#072c1b',
  primaryContent: '#eae7dc',
  secondary: '#c8b46e',
  secondaryContent: '#072c1b',
  base100: '#ffffff',
  base200: '#eae7dc',
  success: '#4ade80',
  error: '#6d2e15',
  neutral: '#252120',
  fontHeader: "'Noah', 'Montserrat', 'Century Gothic', AppleGothic, sans-serif",
  fontBody: "'Poppins', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const formatFieldValue = (value: any): string => {
  if (value === undefined || value === null) return 'N/A'

  let workingValue = value

  // Try to parse if it's a JSON string
  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      workingValue = JSON.parse(value)
    } catch (e) {
      // Not valid JSON, keep as is
    }
  }

  if (Array.isArray(workingValue)) {
    return workingValue.map((v) => formatFieldValue(v)).join(', ')
  }

  if (workingValue instanceof Date) {
    return format(workingValue, 'PPP p')
  }

  if (typeof workingValue === 'object' && workingValue !== null) {
    if (workingValue.full_name || workingValue.email) {
      return `${workingValue.full_name || 'No Name'} [${workingValue.email || 'N/A'}]`
    }
    if (workingValue.url && (workingValue.filename || workingValue.alt)) {
      return `<a href="${workingValue.url}" target="_blank" style="color: ${THEME.primary}; font-weight: 600; text-decoration: none; border-bottom: 1px solid ${THEME.primary};">${workingValue.filename || workingValue.alt}</a>`
    }
    try {
      return JSON.stringify(workingValue)
    } catch (e) {
      return '[Object]'
    }
  }

  // Handle ISO date strings
  if (
    typeof workingValue === 'string' &&
    workingValue.length >= 10 &&
    /^\d{4}-\d{2}-\d{2}/.test(workingValue)
  ) {
    const parsedDate = parseISO(workingValue)
    if (isValid(parsedDate)) {
      return format(parsedDate, 'PPP p')
    }
  }

  return String(workingValue)
}

export const generateEmailHtml = ({
  title,
  message,
  fields = [],
  actionButtons = [],
  description,
  history = [],
  docId,
  hideHistory = false,
  hideDetails = false,
  hideDescription = false,
  hideAttachments = false,
  attachments = [],
  customText,
  latestCustomFieldValues = [],
}: EmailGeneratorOptions): string => {
  // 🧼 CLEANSE FIELDS ARRAY DYNAMICALLY:
  const filteredFields = fields.filter((field) => {
    const isSubmittedBy = field.label?.toLowerCase() === 'submitted by'
    const valueStr = String(field.value || '').trim()

    // If the label is "Submitted By" and the value is completely empty or "N/A", strip it out!
    if (
      isSubmittedBy &&
      (valueStr === 'N/A' || valueStr === '' || valueStr.toLowerCase() === 'n/a')
    ) {
      return false
    }
    return true
  })

  // Update fieldsHtml to map over newly filtered array:
  const fieldsHtml = filteredFields
    .map(
      (field) => `
    <div style="margin-bottom: 12px; border-bottom: 1px solid ${THEME.base200}; padding-bottom: 8px;">
      <span style="font-family: ${THEME.fontHeader}; font-weight: bold; color: ${THEME.primary}; display: inline-block; min-width: 150px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${field.label}:</span>
      <span style="color: ${THEME.neutral}; font-size: 15px;">${formatFieldValue(field.value)}</span>
    </div>
  `,
    )
    .join('')

  // 🎯 GENERIC WORKFLOW INFORMATION LOOP: Only filters out completely empty entries
  const latestCustomFieldsHtml = latestCustomFieldValues
    .filter((field) => {
      const isEmpty =
        !field.value ||
        String(field.value).trim() === '' ||
        String(field.value).toLowerCase() === 'n/a'
      return !isEmpty
    })
    .map(
      (field) => `
    <div style="margin-bottom: 12px; border-bottom: 1px solid ${THEME.base200}; padding-bottom: 8px;">
      <span style="font-family: ${THEME.fontHeader}; font-weight: bold; color: ${THEME.primary}; display: inline-block; min-width: 150px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${field.label}:</span>
      <span style="color: ${THEME.neutral}; font-size: 15px;">${formatFieldValue(field.value)}</span>
    </div>
  `,
    )
    .join('')

  const historyHtml =
    !hideHistory && history.length > 0
      ? `
    <div class="section-title">Review History</div>
    <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px; font-size: 14px; border: 1px solid ${THEME.base200}; border-radius: 12px; overflow: hidden; font-family: ${THEME.fontBody};">
      <thead>
        <tr style="background-color: ${THEME.primary}; color: ${THEME.primaryContent};">
          <th style="font-family: ${THEME.fontHeader}; text-align: left; padding: 14px 16px; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Step</th>
          <th style="font-family: ${THEME.fontHeader}; text-align: left; padding: 14px 16px; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Reviewer</th>
          <th style="font-family: ${THEME.fontHeader}; text-align: left; padding: 14px 16px; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Response</th>
        </tr>
      </thead>
      <tbody>
        ${history
          .map(
            (item) => `
          <!-- Review Details Row -->
          <tr style="background-color: ${THEME.base100};">
            <td style="padding: 16px; color: ${THEME.neutral}; border-bottom: 1px solid ${THEME.base200}; font-weight: 600; font-size: 13px;">${item.label}</td>
            <td style="padding: 16px; color: ${THEME.neutral}; border-bottom: 1px solid ${THEME.base200}; font-size: 13px;">${item.reviewer}</td>
            <td style="padding: 16px; border-bottom: 1px solid ${THEME.base200};">
              <span style="font-family: ${THEME.fontHeader}; color: ${
                item.response === 'approved'
                  ? THEME.success
                  : item.response === 'rejected'
                    ? THEME.error
                    : item.response === 'auto_completed'
                      ? THEME.primary
                      : item.response === 'skipped'
                        ? THEME.neutral
                        : item.response === 'acknowledged'
                          ? THEME.success
                          : THEME.neutral
              }; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
                ${
                  item.response === 'auto_completed'
                    ? 'Auto-Completed'
                    : item.response === 'skipped'
                      ? 'Skipped'
                      : item.response === 'acknowledged'
                        ? 'Acknowledged'
                        : item.response || '-'
                }
              </span>
            </td>
          </tr>
          <!-- Comments & Attachments Row -->
          <tr>
            <td colspan="3" style="padding: 16px 20px; background-color: #fafaf8; border-bottom: 2px solid ${THEME.base200};">
              <div style="font-size: 10px; text-transform: uppercase; color: ${THEME.secondary}; font-weight: 800; margin-bottom: 6px; font-family: ${THEME.fontHeader}; letter-spacing: 1px; opacity: 0.8;">Reviewer's Comments</div>
              <div style="font-style: italic; color: ${THEME.neutral}; line-height: 1.6; font-size: 14px; margin-bottom: ${item.attachments && item.attachments.length > 0 ? '12px' : '0'};">
                ${item.comments || '<span style="opacity: 0.5;">No comments provided.</span>'}
              </div>
              ${
                item.customFieldResponses && item.customFieldResponses.length > 0
                  ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed ${THEME.base200};">
                  <div style="font-size: 10px; text-transform: uppercase; color: ${THEME.secondary}; font-weight: 800; margin-bottom: 6px; font-family: ${THEME.fontHeader}; letter-spacing: 1px; opacity: 0.8;">Action Details</div>
                  ${item.customFieldResponses
                    .map(
                      (cfr) => `
                    <div style="margin-bottom: 4px;">
                      <span style="color: ${THEME.primary}; font-weight: 600; font-size: 12px;">${cfr.label}:</span>
                      <span style="color: ${THEME.neutral}; font-size: 12px;">${formatFieldValue(cfr.value)}</span>
                    </div>
                  `,
                    )
                    .join('')}
                </div>
              `
                  : ''
              }
              ${
                item.attachments && item.attachments.length > 0
                  ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed ${THEME.base200};">
                  <div style="font-size: 10px; text-transform: uppercase; color: ${THEME.secondary}; font-weight: 800; margin-bottom: 6px; font-family: ${THEME.fontHeader}; letter-spacing: 1px; opacity: 0.8;">Step Attachments</div>
                  <ul style="margin: 0; padding: 0; list-style: none;">
                    ${item.attachments
                      .map(
                        (a) => `
                      <li style="margin-bottom: 4px;">
                        <a href="${a.url}" target="_blank" style="color: ${THEME.primary}; font-weight: 600; text-decoration: none; font-size: 12px;">
                          📎 ${a.filename}
                        </a>
                      </li>
                    `,
                      )
                      .join('')}
                  </ul>
                </div>
              `
                  : ''
              }
            </td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  `
      : ''

  const descriptionHtml =
    !hideDescription && description
      ? `
    <div class="section-title">Description</div>
    <div class="description-content" style="background-color: ${THEME.base100}; padding: 20px; border-left: 4px solid ${THEME.secondary}; margin-bottom: 30px; color: ${THEME.neutral}; border-radius: 0 8px 8px 0; border: 1px solid ${THEME.base200}; border-left-width: 4px;">
      ${typeof description === 'string' ? description : lexicalToHtml(description)}
    </div>
    `
      : ''

  const attachmentsHtml =
    !hideAttachments && attachments.length > 0
      ? `
    <div class="section-title">Attachments</div>
    <div style="background-color: ${THEME.base100}; padding: 15px; border-radius: 8px; border: 1px solid ${THEME.base200}; margin-bottom: 30px;">
      <ul style="margin: 0; padding-left: 20px; color: ${THEME.neutral};">
        ${attachments
          .map(
            (a) => `
          <li style="margin-bottom: 8px;">
            <a href="${a.url}" target="_blank" style="color: ${THEME.primary}; font-weight: 600; text-decoration: none; border-bottom: 1px solid ${THEME.primary};">
              ${a.filename}
            </a>
          </li>
        `,
          )
          .join('')}
      </ul>
    </div>
  `
      : ''

  const buttonsHtml = actionButtons
    .map(
      (button) => `
    <a href="${button.url}" 
       style="display: inline-block; 
              padding: 14px 28px; 
              background-color: ${button.color || THEME.primary}; 
              color: ${THEME.primaryContent} !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 10px 12px 10px 0;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 14px;
              letter-spacing: 1px;
              font-family: ${THEME.fontHeader};
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      ${button.label || 'View Document'}
    </a>
  `,
    )
    .join('')

  const customTextHtml = customText
    ? `
    <div style="margin-bottom: 30px; padding: 20px; background-color: ${THEME.base200}; border-radius: 12px; border-left: 4px solid ${THEME.primary}; font-style: italic; color: ${THEME.neutral};">
      ${customText}
    </div>
  `
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: ${THEME.fontBody}; line-height: 1.6; color: ${THEME.neutral}; margin: 0; padding: 0; background-color: ${THEME.base200}; }
        .container { max-width: 650px; margin: 40px auto; background-color: ${THEME.base100}; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid ${THEME.base200}; }
        .header { background-color: ${THEME.primary}; color: ${THEME.primaryContent}; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; font-family: ${THEME.fontHeader}; }
        .content { padding: 40px; }
        .message { font-size: 20px; margin-bottom: 35px; color: ${THEME.primary}; font-weight: 600; font-family: ${THEME.fontHeader}; }
        .section-title { font-weight: 800; color: ${THEME.secondary}; margin: 30px 0 20px 0; border-bottom: 2px solid ${THEME.base200}; padding-bottom: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-family: ${THEME.fontHeader}; }
        .footer { text-align: center; color: ${THEME.neutral}; opacity: 0.6; font-size: 13px; padding: 30px; background-color: ${THEME.base200}; }
        a { color: ${THEME.primary}; font-weight: bold; }
        .description-content h1, .description-content h2, .description-content h3,
        .description-content h4, .description-content h5, .description-content h6 {
          font-family: ${THEME.fontHeader}; color: ${THEME.primary}; font-weight: 700; margin: 20px 0 10px 0;
        }
        .description-content h1 { font-size: 24px; }
        .description-content h2 { font-size: 21px; }
        .description-content h3 { font-size: 18px; }
        .description-content h4, .description-content h5, .description-content h6 { font-size: 16px; }
        .description-content p { margin: 0 0 12px 0; }
        .description-content ul, .description-content ol { margin: 0 0 12px 0; padding-left: 24px; }
        .description-content li { margin-bottom: 6px; }
        .description-content blockquote {
          margin: 0 0 12px 0; padding: 8px 16px; border-left: 3px solid ${THEME.secondary}; color: ${THEME.neutral}; opacity: 0.85;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <div class="message">${message}</div>
          
          ${customTextHtml}

          ${
            !hideDetails && fields.length > 0
              ? `
          <div class="section-title">Document Details</div>
          <div style="margin-bottom: 30px; background-color: ${THEME.base200}; padding: 20px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05);">
            ${
              docId
                ? `<div style="font-size: 11px; opacity: 0.75; margin-bottom: 12px; font-family: ${THEME.fontBody}; text-transform: uppercase; letter-spacing: 1px;">ID: ${docId}</div>`
                : ''
            }
            ${fieldsHtml}
            ${
              latestCustomFieldsHtml
                ? `
              <div style="margin-top: 15px; border-top: 2px dashed ${THEME.base200}; padding-top: 15px;">
                <div style="font-size: 10px; text-transform: uppercase; color: ${THEME.secondary}; font-weight: 800; margin-bottom: 10px; font-family: ${THEME.fontHeader}; letter-spacing: 1.5px;">Workflow Information</div>
                ${latestCustomFieldsHtml}
              </div>
            `
                : ''
            }
          </div>
          `
              : ''
          }

          ${descriptionHtml}
          ${attachmentsHtml}
          ${historyHtml}

          ${
            buttonsHtml.length > 0
              ? `
          <div class="section-title">Actions Required</div>
          <div style="margin-top: 20px;">${buttonsHtml}</div>
          `
              : ''
          }
        </div>
        <div class="footer">
          <p>This is an automated notification from Doha Oasis Workflow System.</p>
          <p>Please do not reply directly to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Doha Oasis</p>
        </div>
      </div>
    </body>
    </html>
  `
}
