import type { Field } from 'payload'

type FieldTypes =
  | 'label'
  | 'js'
  | 'css'
  | 'className'
  | 'elementId'
  | 'html'
  | 'link'
  | 'image'
  | 'title'
  | 'description'
  | 'colors'
  | 'size'
  | 'variant'

const fieldsMap: Record<FieldTypes, Field> = {
  className: {
    type: 'text',
    name: 'className',
    label: 'Class Name',
    localized: true,
  },
  elementId: {
    type: 'text',
    name: 'elementId',
    label: 'Element ID',
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
    relationTo: 'forms-media',
    localized: true,
  },
  title: { type: 'text', name: 'title', label: 'Title', localized: true },
  description: {
    type: 'textarea',
    name: 'description',
    label: 'Description',
    localized: true,
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

export default getFields
