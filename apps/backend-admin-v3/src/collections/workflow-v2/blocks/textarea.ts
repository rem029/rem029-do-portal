import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const TextareaFieldBlock: Block = {
  slug: 'textarea',
  interfaceName: 'WorkflowTextareaFieldBlock',
  labels: { singular: 'Textarea Field', plural: 'Textarea Fields' },
  fields: [...WorkflowFieldBaseFields, { name: 'default_value', type: 'textarea', label: 'Default Value' }],
}

export default TextareaFieldBlock
