import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const DateFieldBlock: Block = {
  slug: 'date',
  interfaceName: 'WorkflowDateFieldBlock',
  labels: { singular: 'Date Field', plural: 'Date Fields' },
  fields: [...WorkflowFieldBaseFields, { name: 'default_value', type: 'date', label: 'Default Value' }],
}

export default DateFieldBlock
