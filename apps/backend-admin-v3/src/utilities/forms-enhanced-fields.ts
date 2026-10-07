import type { Block, Field } from 'payload'
import { directionField, fieldVariantField } from './constant'

const PLUGIN_FIELD_SLUGS = [
  'text',
  'email',
  'number',
  'checkbox',
  'select',
  'textarea',
  'radio',
  'date',
]

export function enhanceBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    if (!PLUGIN_FIELD_SLUGS.includes(block?.slug || '')) return block

    const extra: Field[] =
      block.slug === 'radio' ? [directionField, fieldVariantField] : [fieldVariantField]

    return { ...block, fields: [...(block.fields ?? []), ...extra] }
  })
}

export function enhanceFormFields(defaultFields: Field[]): Field[] {
  return defaultFields.map((field) => {
    if (field.type !== 'blocks' || field.name !== 'fields') return field
    return { ...field, blocks: enhanceBlocks(field.blocks) }
  })
}
