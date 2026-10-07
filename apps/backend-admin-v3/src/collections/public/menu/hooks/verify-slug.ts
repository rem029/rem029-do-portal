import type { CollectionBeforeValidateHook } from 'payload'
import { slugify } from 'payload/shared'

/**
 * Auto-generates a slug from title (and optional prefix) if not already set.
 */
export const fnbVerifySlug =
  (slug: string, title: string, prefix?: string): CollectionBeforeValidateHook =>
  ({ data }) => {
    if (!data) return data

    if (!data[slug] && data[title]) {
      let text = (data[title] as string) || ''
      if (prefix && data[prefix]) {
        text = `${(data[prefix] as string) || ''}-${text}`
      }
      data[slug] = (slugify(text) || '').replace(/^[^a-z0-9]+/, '')
    }

    return data
  }
