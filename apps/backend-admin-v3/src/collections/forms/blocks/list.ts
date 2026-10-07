import { Block } from 'payload'
import FilesBlock from './files'
import SignatureBlock from './signature'
import { fields } from '@payloadcms/plugin-form-builder'
import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { enhanceBlocks } from '@/utilities/forms-enhanced-fields'
import PhoneBlock from './phone'
import RatingBlock from './rating'
import ScaleBlock from './scale'

const FORM_BLOCKS = [
  FilesBlock,
  SignatureBlock,
  PhoneBlock,
  RatingBlock,
  ScaleBlock,
  ...(
    Object.keys(fields).map((k) => {
      return fields[k]
    }) as Block[]
  ).filter((b): b is Block => typeof b === 'object' && 'slug' in b),
]

const ListBlock: Block & { label: string } = {
  slug: 'list',
  interfaceName: `FormListBlock`,
  labels: { plural: 'Lists', singular: 'List' },
  label: 'List',
  fields: [
    ...DEFAULT_FORM_CHILD_FIELDS,
    {
      type: 'number',
      name: 'max_items',
      label: 'Maximum Items',
      admin: {
        description: 'Optional. If set, limits the number of items that can be added to this list.',
      },
    },
    {
      type: 'blocks',
      name: 'fields',
      blocks: enhanceBlocks(FORM_BLOCKS),
    },
  ],
}

export default ListBlock
