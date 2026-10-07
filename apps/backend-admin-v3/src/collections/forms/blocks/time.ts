import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { Block } from 'payload'

const TimeBlock: Block & { label: string } = {
  slug: 'time',
  interfaceName: `TimeBlock`,
  labels: { plural: 'Times', singular: 'Time' },
  label: 'Time',
  fields: [...DEFAULT_FORM_CHILD_FIELDS],
}

export default TimeBlock
