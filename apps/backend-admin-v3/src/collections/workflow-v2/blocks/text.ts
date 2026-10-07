import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const TextFieldBlock: Block = {
  slug: 'text',
  interfaceName: 'WorkflowTextFieldBlock',
  labels: { singular: 'Text Field', plural: 'Text Fields' },
  fields: [...WorkflowFieldBaseFields, { name: 'default_value', type: 'text', label: 'Default Value' }],
}

export default TextFieldBlock
