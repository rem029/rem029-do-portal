import React from 'react'
import { noah } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'
import { lexicalToHtml } from '@/utilities/lexical-converter'

export interface FieldConfig {
  label: string
  path: string
  type: 'text' | 'textarea' | 'date' | 'select' | 'relationship' | 'richText' | 'upload'
  options?: { label: string; value: any }[] // For select fields,
  fullWidth?: boolean
  relationTo?: string // For relationship/upload fields
}

interface ServiceItemDetailsProps {
  doc: any
  fields: FieldConfig[]
}

const ServiceItemDetails: React.FC<ServiceItemDetailsProps> = ({ doc, fields }) => {
  const renderValue = (field: FieldConfig) => {
    const value = doc[field.path]

    if (value === undefined || value === null)
      return <span className="text-base-content/40 italic">N/A</span>

    switch (field.type) {
      case 'date':
        return new Date(value).toLocaleDateString()
      case 'select':
        return field.options?.find((o) => o.value === value)?.label || value
      case 'richText':
        return (
          <div
            className="prose prose-sm max-w-none text-base-content/80"
            dangerouslySetInnerHTML={{ __html: lexicalToHtml(value) }}
          />
        )
      case 'relationship':
      case 'upload':
        const renderUpload = (item: any) => {
          if (typeof item === 'object' && item !== null) {
            // Special handling for User objects
            if ('email' in item || 'full_name' in item || 'name' in item) {
              const name = item.full_name || item.name || 'No Name'
              const email = item.email ? ` [${item.email}]` : ''
              const designation = item.designation ? ` - ${item.designation}` : ''
              return (
                <span key={item.id || item.email}>
                  {name}
                  {email}
                  {designation}
                </span>
              )
            }

            // Handling for Upload objects (attachments)
            if (field.type === 'upload' && item.url) {
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-base-200 hover:bg-base-300 rounded-md text-sm font-medium transition-colors group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-primary group-hover:scale-110 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>{item.filename || 'Download file'}</span>
                </a>
              )
            }

            // Fallback for other objects
            return (
              <span key={item.id}>
                {item.filename || item.title || item.id || 'Unknown Object'}
              </span>
            )
          }
          return <span key={item}>{String(item)}</span>
        }

        if (Array.isArray(value)) {
          return <div className="flex flex-wrap gap-2">{value.map(renderUpload)}</div>
        }
        return renderUpload(value)
      case 'textarea':
        return <p className="whitespace-pre-wrap">{value}</p>
      default:
        return String(value)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {fields.map((field) => (
          <div
            key={field.path}
            className={cn('border-b border-base-200 pb-2', field.fullWidth && 'md:col-span-2')}
          >
            <label
              className={cn(
                'block text-xs font-bold text-primary/70 uppercase tracking-wider mb-1',
                noah.className,
              )}
            >
              {field.label}
            </label>
            <div className="text-sm text-base-content text-wrap break-words min-h-[1.5rem]">
              {renderValue(field)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ServiceItemDetails
