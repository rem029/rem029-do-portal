import type { Field } from 'payload'
import type { SlugFieldProps } from '@/common/components/slug'

/**
 * Creates a slug field + override checkbox pair for menu collections.
 * Uses the V3 shared slug component.
 */
export const getSlugField = (
  slugName: string,
  titleFieldPath: string,
  prefixFieldPath?: string,
  unique: boolean = true,
): Field[] => {
  const slugProps: SlugFieldProps = {
    watchPath: titleFieldPath,
    ...(prefixFieldPath ? { watchPrefix: prefixFieldPath } : {}),
  }

  return [
    {
      type: 'text',
      name: slugName,
      label: 'Slug',
      required: true,
      unique,
      admin: {
        components: {
          Field: {
            path: '@/common/components/slug',
            clientProps: { slugProps },
          },
        },
        description: 'Auto-generated unique identifier.',
      },
    },
    {
      type: 'checkbox',
      name: `${slugName}_override`,
      label: 'Override Slug?',
    },
  ]
}
