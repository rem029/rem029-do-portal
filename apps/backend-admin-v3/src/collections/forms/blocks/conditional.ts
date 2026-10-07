import { Block } from 'payload'
import FilesBlock from './files'
import { fields } from '@payloadcms/plugin-form-builder'
import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'

import GroupedBlock from './group'
import ListBlock from './list'
import PhoneBlock from './phone'
import SignatureBlock from './signature'
import RatingBlock from './rating'
import ScaleBlock from './scale'

const FORM_BLOCKS = [
  FilesBlock,
  PhoneBlock,
  SignatureBlock,
  RatingBlock,
  ScaleBlock,
  ...(
    Object.keys(fields).map((k) => {
      return fields[k]
    }) as Block[]
  ).filter((b): b is Block => typeof b === 'object' && 'slug' in b),
]

const ConditionalBlock: Block & { label: string } = {
  slug: 'conditional',
  interfaceName: `FormConditionalBlock`,
  labels: { plural: 'Conditionals', singular: 'Conditional' },
  label: 'Conditional',
  fields: [
    ...DEFAULT_FORM_CHILD_FIELDS,
    {
      type: 'row',
      fields: [
        {
          name: 'condition_field',
          type: 'text',
          label: 'Field Name to Watch',
          required: true,
          admin: {
            description: 'The name (slug) of the field to check the value of.',
          },
        },
        {
          name: 'operator',
          type: 'select',
          label: 'Operator',
          defaultValue: 'equal',
          required: true,
          options: [
            { label: 'Equal', value: 'equal' },
            { label: 'Not Equal', value: 'not_equal' },
            { label: 'Contains', value: 'contains' },
            { label: 'Not Contains', value: 'not_contains' },
          ],
        },
      ],
    },
    {
      name: 'value',
      type: 'text',
      label: 'Value to Compare',
      required: true,
      admin: {
        description: 'The value to compare against.',
      },
    },
    {
      type: 'blocks',
      name: 'fields',
      label: 'Nested Fields',
      blocks: [...FORM_BLOCKS, GroupedBlock, ListBlock],
    },
  ],
}

export default ConditionalBlock
