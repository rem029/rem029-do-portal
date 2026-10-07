import React from 'react'
import type { Payload } from 'payload'
import { Form, FormSubmission } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'

export async function SubmissionDataItems({
  doc,
  form,
  payload,
}: {
  doc: FormSubmission
  form: Form | null
  payload: Payload
}) {
  if (!doc.submissionData || doc.submissionData.length === 0) return null

  const formFields: any[] = (form?.fields as any[]) || []

  /** Find a field config given a dot-notation path, traversing group, list, and multi-step fields. */
  const findFieldConfig = (fieldsList: any[], fieldName: string): any => {
    for (const field of fieldsList) {
      // Traverse multi-step: search all steps and their fields
      if (field.blockType === 'multi-step' && field.steps) {
        for (const step of field.steps) {
          if (step.fields) {
            const found = findFieldConfig(step.fields, fieldName)
            if (found) return found
          }
        }
      }
      if (field.blockType === 'group' && field.fields && fieldName.startsWith(`${field.name}.`)) {
        return findFieldConfig(field.fields, fieldName.split('.').slice(1).join('.'))
      }
      if (field.blockType === 'list' && field.fields && fieldName.startsWith(`${field.name}.`)) {
        // strip listName.index. prefix then search sub-fields
        const withoutIndex = fieldName.split('.').slice(2).join('.')
        return findFieldConfig(field.fields, withoutIndex)
      }
      if ('name' in field && field.name === fieldName) return field
    }
    return null
  }

  /** Find a list block config by name, traversing multi-step blocks. */
  const findListConfig = (listName: string): any => {
    const search = (fields: any[]): any => {
      for (const f of fields) {
        if (f.blockType === 'list' && f.name === listName) return f
        if (f.blockType === 'multi-step' && f.steps) {
          for (const step of f.steps) {
            if (step.fields) {
              const found = search(step.fields)
              if (found) return found
            }
          }
        }
      }
      return null
    }
    return search(formFields)
  }

  /** Find a group block config by name, traversing multi-step blocks. */
  const findGroupConfig = (groupName: string): any => {
    const search = (fields: any[]): any => {
      for (const f of fields) {
        if (f.blockType === 'group' && f.name === groupName) return f
        if (f.blockType === 'multi-step' && f.steps) {
          for (const step of f.steps) {
            if (step.fields) {
              const found = search(step.fields)
              if (found) return found
            }
          }
        }
      }
      return null
    }
    return search(formFields)
  }

  /** Resolve display value – handles file, signature, and store-department fields. */
  const resolveValue = async (
    item: (typeof doc.submissionData)[number],
    fieldConfig: any,
  ): Promise<React.ReactNode> => {
    if (fieldConfig?.blockType === 'select' && item.value && fieldConfig.options?.length) {
      const match = fieldConfig.options.find((o: any) => o.value === item.value)
      return match?.label ?? item.value
    }

    if (fieldConfig?.blockType === 'select-store-departments' && item.value) {
      try {
        const dept = await payload.findByID({
          collection: 'store-departments',
          id: String(item.value),
          overrideAccess: true,
        })
        return (dept as any)?.title || item.value
      } catch {
        return item.value
      }
    }

    if (fieldConfig?.blockType === 'survey-department' && item.value) {
      try {
        const dept = await payload.findByID({
          collection: 'departments',
          id: String(item.value),
          overrideAccess: true,
          depth: 0,
          select: { title: true },
        })
        return dept.title || item.value
      } catch {
        return item.value
      }
    }

    if (fieldConfig?.blockType === 'select-crm-category' && item.value) {
      try {
        const cat = await payload.findByID({
          collection: 'crm-categories',
          id: String(item.value),
          overrideAccess: true,
        })
        return (cat as any)?.title || item.value
      } catch {
        return item.value
      }
    }

    if (fieldConfig?.blockType === 'signature' && item.value) {
      return (
        <img
          src={item.value}
          alt="Signature"
          className="border border-base-200 rounded bg-white max-h-[100px] w-auto"
        />
      )
    }

    if (fieldConfig?.blockType === 'file' && item.value) {
      try {
        const media = (await payload.findByID({
          collection: 'forms-media',
          id: item.value,
          overrideAccess: true,
        })) as any

        if (media) {
          const fileTargetUrl = media.url || ''
          const isImageFile = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(fileTargetUrl)

          // FIXED SECTION: INLINE IMAGE PREVIEW RENDER WITH 33% WIDTH CONSTRAINT
          if (isImageFile) {
            return (
              <div className="mt-2 block">
                <a
                  href={fileTargetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block transition-opacity hover:opacity-80"
                >
                  <img
                    src={fileTargetUrl}
                    alt={media.filename || 'Uploaded form asset'}
                    style={{
                      maxWidth: '33%', // Bounds image width precisely to 33% of its wrapper
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      border: '1px solid var(--theme-elevation-200, #cbd5e1)',
                      display: 'block',
                    }}
                  />
                </a>
              </div>
            )
          }

          // Fallback standard text link styling if the uploaded asset is a document (PDF, Docx)
          return (
            <a
              href={fileTargetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:underline flex items-center gap-1 font-medium text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 002 0V7a3 3 0 00-3-3z"
                  clipRule="evenodd"
                />
              </svg>
              {media.filename || 'Attached File'}
            </a>
          )
        }
      } catch (e) {
        console.error('Error fetching media for submission field:', e)
      }
    }
    return item.value
  }

  // LIST_RE matches: listName.index.subField
  const LIST_RE = /^([^.]+)\.(\d+)\..+$/

  type RawItem = (typeof doc.submissionData)[number]
  type Classified =
    | { kind: 'flat'; item: RawItem }
    | { kind: 'group'; groupName: string; item: RawItem }
    | { kind: 'list'; listName: string; index: number; item: RawItem }

  const classified: Classified[] = (doc.submissionData || []).map((item) => {
    const match = LIST_RE.exec(item.field)
    if (match && findListConfig(match[1])) {
      return { kind: 'list', listName: match[1], index: Number(match[2]), item }
    }
    if (item.field.includes('.')) {
      return { kind: 'group', groupName: item.field.split('.')[0], item }
    }
    return { kind: 'flat', item }
  })

  // Group items: listName -> index -> items[]
  const listGroups: Record<string, Record<number, RawItem[]>> = {}
  const groupGroups: Record<string, RawItem[]> = {}

  classified.forEach((c) => {
    if (c.kind === 'list') {
      listGroups[c.listName] ??= {}
      listGroups[c.listName][c.index] ??= []
      listGroups[c.listName][c.index].push(c.item)
    } else if (c.kind === 'group') {
      groupGroups[c.groupName] ??= []
      groupGroups[c.groupName].push(c.item)
    }
  })

  // Render sections in original order, deduplicating list groups
  const seenGroups = new Set<string>()
  const sections: React.ReactNode[] = []

  for (const c of classified) {
    if (c.kind === 'flat') {
      const cfg = findFieldConfig(formFields, c.item.field)
      const val = await resolveValue(c.item, cfg)
      sections.push(
        <div key={c.item.id} className="border-b border-base-200 pb-1">
          <label
            className={cn(
              'block text-xs font-bold text-primary/70 uppercase tracking-wider mb-1',
              noah.className,
            )}
          >
            {cfg?.label || c.item.field}
          </label>
          <div className="text-sm text-base-content min-h-6">
            {val || <span className="text-sm text-base-content/40 italic">N/A</span>}
          </div>
        </div>,
      )
    } else if (c.kind === 'group') {
      const groupKey = c.groupName
      if (seenGroups.has(groupKey)) continue
      seenGroups.add(groupKey)

      const groupConfig = findGroupConfig(c.groupName)
      const groupLabel: string = groupConfig?.label || c.groupName
      const groupItems = groupGroups[c.groupName]

      const subNodes = await Promise.all(
        groupItems.map(async (raw) => {
          const cfg = findFieldConfig(formFields, raw.field)
          const val = await resolveValue(raw, cfg)
          return (
            <div key={raw.id} className="border-b border-base-200 pb-1">
              <label
                className={cn(
                  'block text-xs font-bold text-primary/70 uppercase tracking-wider mb-1',
                  noah.className,
                )}
              >
                {cfg?.label || raw.field.split('.').pop()}
              </label>
              <div className="text-sm text-base-content min-h-6">
                {val || <span className="text-sm text-base-content/40 italic">N/A</span>}
              </div>
            </div>
          )
        }),
      )

      sections.push(
        <div
          key={groupKey}
          className="col-span-full border border-base-200 rounded-lg p-3 bg-base-50/50"
        >
          <p className={cn('text-sm font-bold text-secondary mb-2', noah.className)}>
            {groupLabel}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">{subNodes}</div>
        </div>,
      )
    } else {
      const groupKey = `${c.listName}.${c.index}`
      if (seenGroups.has(groupKey)) continue
      seenGroups.add(groupKey)

      const listConfig = findListConfig(c.listName)
      const listLabel: string = listConfig?.label || c.listName
      const groupItems = listGroups[c.listName][c.index]

      const subNodes = await Promise.all(
        groupItems.map(async (raw) => {
          const cfg = findFieldConfig(formFields, raw.field)
          const val = await resolveValue(raw, cfg)
          return (
            <div key={raw.id} className="border-b border-base-200 pb-1">
              <label
                className={cn(
                  'block text-xs font-bold text-primary/70 uppercase tracking-wider mb-1',
                  noah.className,
                )}
              >
                {cfg?.label || raw.field.split('.').pop()}
              </label>
              <div className="text-sm text-base-content min-h-6">
                {val || <span className="text-sm text-base-content/40 italic">N/A</span>}
              </div>
            </div>
          )
        }),
      )

      sections.push(
        <div
          key={groupKey}
          className="col-span-full border border-base-200 rounded-lg p-3 bg-base-50/50"
        >
          <p className={cn('text-sm font-bold text-secondary mb-2', noah.className)}>
            {listLabel} #{c.index + 1}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">{subNodes}</div>
        </div>,
      )
    }
  }

  return (
    <div className="space-y-3 mb-3">
      <h2 className={cn('text-sm font-bold text-primary', noah.className)}>Submitted Responses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">{sections}</div>
    </div>
  )
}
