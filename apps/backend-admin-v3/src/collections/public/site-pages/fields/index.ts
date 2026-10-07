import type { Field, Where } from 'payload'
import type { User } from '@/payload-types'

type FieldTypes =
  | 'label'
  | 'js'
  | 'css'
  | 'className'
  | 'html'
  | 'link'
  | 'variant'
  | 'image'
  | 'title'
  | 'slug'
  | 'description'
  | 'size'
  | 'element'
  | 'colors'
  | 'is_sticky'
  | 'top_pos'
  | 'title_size'
  | 'title_variant'
  | 'description_size'
  | 'description_variant'

const fieldsMap: Record<FieldTypes, Field> = {
  className: {
    type: 'text',
    name: 'className',
    label: 'Class Name',
    localized: true,
  },
  css: {
    type: 'code',
    name: 'css',
    label: 'CSS',
    localized: true,
    admin: { language: 'css' },
  },
  html: {
    type: 'code',
    name: 'html',
    label: 'HTML',
    localized: true,
    admin: { language: 'html' },
  },
  js: {
    type: 'code',
    name: 'js',
    label: 'JavaScript',
    localized: true,
    admin: { language: 'javascript', hidden: true },
  },
  label: { type: 'text', name: 'label', label: 'Label', localized: true },
  link: { type: 'text', name: 'link', label: 'Link', localized: true },
  image: {
    type: 'upload',
    name: 'image',
    label: 'Image',
    relationTo: 'media',
    localized: true,
  },
  title: { type: 'text', name: 'title', label: 'Title', localized: true },
  description: {
    type: 'textarea',
    name: 'description',
    label: 'Description',
    localized: true,
  },
  slug: {
    type: 'text',
    name: 'slug',
    label: 'Slug',
    unique: true,
    required: true,
  },
  size: {
    type: 'select',
    name: 'size',
    label: 'Size',
    localized: true,
    options: [
      { label: 'XX Large', value: '2xl' },
      { label: 'X Large', value: 'xl' },
      { label: 'Large', value: 'lg' },
      { label: 'Medium', value: 'md' },
      { label: 'Small', value: 'sm' },
      { label: 'Extra Small', value: 'xs' },
      { label: 'Tiny', value: '2xs' },
    ],
  },
  variant: {
    type: 'select',
    name: 'variant',
    label: 'Variant',
    localized: true,
    options: [
      { label: 'Primary', value: 'primary' },
      { label: 'Secondary', value: 'secondary' },
      { label: 'Accent', value: 'accent' },
      { label: 'Neutral', value: 'neutral' },
      { label: 'Ghost', value: 'ghost' },
      { label: 'Link', value: 'link' },
      { label: 'Outline', value: 'outline' },
    ],
  },
  element: {
    type: 'select',
    name: 'element',
    label: 'Element',
    localized: true,
    options: [
      { label: 'H1', value: 'h1' },
      { label: 'H2', value: 'h2' },
      { label: 'H3', value: 'h3' },
      { label: 'H4', value: 'h4' },
      { label: 'H5', value: 'h5' },
      { label: 'H6', value: 'h6' },
      { label: 'Paragraph', value: 'paragraph' },
    ],
  },
  is_sticky: {
    type: 'checkbox',
    name: 'is_sticky',
    label: 'Is Sticky?',
    defaultValue: false,
  },
  top_pos: {
    type: 'number',
    name: 'top_pos',
    label: 'Top Position',
    defaultValue: 0,
  },
  colors: {
    type: 'text',
    name: 'colors',
    label: 'Color',
    localized: true,
    admin: {
      components: {
        Field: '@/common/components/color-picker',
      },
    },
  },
  title_size: {
    type: 'select',
    name: 'title_size',
    label: 'Title Size',
    localized: true,
    options: [
      { label: 'XX Large', value: '2xl' },
      { label: 'X Large', value: 'xl' },
      { label: 'Large', value: 'lg' },
      { label: 'Medium', value: 'md' },
      { label: 'Small', value: 'sm' },
      { label: 'Extra Small', value: 'xs' },
    ],
  },
  title_variant: {
    type: 'select',
    name: 'title_variant',
    label: 'Title Variant',
    localized: true,
    options: [
      { label: 'Primary', value: 'primary' },
      { label: 'Secondary', value: 'secondary' },
      { label: 'Accent', value: 'accent' },
      { label: 'Neutral', value: 'neutral' },
      { label: 'Base Content', value: 'base-content' },
    ],
  },
  description_size: {
    type: 'select',
    name: 'description_size',
    label: 'Description Size',
    localized: true,
    options: [
      { label: 'Large', value: 'lg' },
      { label: 'Medium', value: 'md' },
      { label: 'Small', value: 'sm' },
      { label: 'Extra Small', value: 'xs' },
    ],
  },
  description_variant: {
    type: 'select',
    name: 'description_variant',
    label: 'Description Variant',
    localized: true,
    options: [
      { label: 'Primary', value: 'primary' },
      { label: 'Secondary', value: 'secondary' },
      { label: 'Accent', value: 'accent' },
      { label: 'Neutral', value: 'neutral' },
      { label: 'Base Content', value: 'base-content' },
    ],
  },
}

/**
 * Deep merge utility for field overrides.
 */
const deepMerge = <T extends object>(target: T, source?: Partial<T>): T => {
  if (!source) return target
  const output = { ...target } as any
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceVal = (source as any)[key]
      const targetVal = (target as any)[key]
      if (
        sourceVal &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        output[key] = deepMerge(targetVal, sourceVal)
      } else {
        output[key] = sourceVal
      }
    }
  }
  return output
}

/**
 * Builds an array of Payload 3 Field objects from a list of field type + override pairs.
 */
const getFields = (fields: { type: FieldTypes; override?: Partial<Field> }[]): Field[] => {
  const _fields: Field[] = []

  for (const { type, override } of fields) {
    const foundField = fieldsMap[type]
    const field = deepMerge(foundField, override)
    _fields.push(field)
  }

  return _fields
}

/**
 * Creates an operator relationship field (optional for site-pages).
 */
export const getOperatorField = (): Field => ({
  type: 'relationship',
  name: 'operator',
  label: 'Operator',
  required: false,
  relationTo: 'operators',
  defaultValue: ({ user }: { user: any }) => {
    const operator = user?.operator
    if (operator) {
      return typeof operator === 'object' ? operator.id : operator
    }
    return undefined
  },
  filterOptions: ({ user }) => {
    const u = user as unknown as User
    if (!u) return true

    const isSuperUser = u?.super_user || (u?.access as any)?.access?.some((a: any) => a.super_user)

    if (isSuperUser) return true

    const operatorId = typeof u?.operator === 'object' ? u?.operator?.id : u?.operator

    if (operatorId) {
      return { id: { equals: operatorId } } as Where
    }

    return false
  },
  access: {
    create: ({ req: { user } }) => {
      const u = user as unknown as User
      const isSuperUser =
        u?.super_user || (u?.access as any)?.access?.some((a: any) => a.super_user)
      return !!isSuperUser
    },
    update: ({ req: { user } }) => {
      const u = user as unknown as User
      const isSuperUser =
        u?.super_user || (u?.access as any)?.access?.some((a: any) => a.super_user)
      return !!isSuperUser
    },
  },
  admin: {
    position: 'sidebar',
    description: 'Optional: Associate this page with a specific operator.',
  },
})

export default getFields
