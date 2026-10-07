import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { Block } from 'payload'

const RatingBlock: Block & { label: string } = {
  slug: 'rating',
  interfaceName: `RatingBlock`,
  labels: { plural: 'Ratings', singular: 'Rating' },
  label: 'Rating',
  fields: [
    ...DEFAULT_FORM_CHILD_FIELDS,
    {
      type: 'row',
      fields: [
        {
          name: 'point_count',
          type: 'number',
          label: 'Number of Points',
          defaultValue: 5,
          min: 2,
          max: 10,
          admin: {
            description: 'How many points to render (e.g. 5 stars). Ignored when Labels below has rows.',
          },
        },
        {
          name: 'display',
          type: 'select',
          label: 'Display',
          defaultValue: 'stars',
          options: [
            { label: 'Stars', value: 'stars' },
            { label: 'Buttons', value: 'buttons' },
          ],
        },
      ],
    },
    {
      name: 'labels',
      type: 'array',
      label: 'Point Labels',
      admin: {
        description:
          'Optional. Add one row per rating point to label each point (e.g. a Likert scale such as "Poor" / "Excellent"). When present, its row count overrides Number of Points for rendering.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Label',
          localized: true,
          required: true,
        },
      ],
    },
  ],
}

export default RatingBlock
