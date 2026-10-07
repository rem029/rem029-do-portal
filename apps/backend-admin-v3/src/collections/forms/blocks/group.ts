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

const GroupedBlock: Block & { label: string } = {
  slug: 'group',
  interfaceName: `FormGroupedBlock`,
  labels: { plural: 'Grouped', singular: 'Grouped' },
  label: 'Grouped',
  fields: [
    ...DEFAULT_FORM_CHILD_FIELDS,
    {
      type: 'blocks',
      name: 'fields',
      blocks: enhanceBlocks(FORM_BLOCKS),
    },
  ],
}

export default GroupedBlock
