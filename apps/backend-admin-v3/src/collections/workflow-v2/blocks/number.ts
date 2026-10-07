import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const NumberFieldBlock: Block = {
  slug: 'number',
  interfaceName: 'WorkflowNumberFieldBlock',
  labels: { singular: 'Number Field', plural: 'Number Fields' },
  fields: [...WorkflowFieldBaseFields, { name: 'default_value', type: 'number', label: 'Default Value' }],
}

export default NumberFieldBlock
