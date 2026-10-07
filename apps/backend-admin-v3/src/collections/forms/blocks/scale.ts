import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { Block } from 'payload'

const ScaleBlock: Block & { label: string } = {
  slug: 'scale',
  interfaceName: `ScaleBlock`,
  labels: { plural: 'Scales', singular: 'Scale' },
  label: 'Scale',
  fields: [
    ...DEFAULT_FORM_CHILD_FIELDS,
    {
      type: 'row',
      fields: [
        {
          name: 'min',
          type: 'number',
          label: 'Minimum',
          defaultValue: 0,
        },
        {
          name: 'max',
          type: 'number',
          label: 'Maximum',
          defaultValue: 10,
        },
        {
          name: 'step',
          type: 'number',
          label: 'Step',
          defaultValue: 1,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'min_label',
          type: 'text',
          label: 'Minimum Label',
          localized: true,
        },
        {
          name: 'max_label',
          type: 'text',
          label: 'Maximum Label',
          localized: true,
        },
      ],
    },
  ],
}

export default ScaleBlock
