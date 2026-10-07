import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const EmailFieldBlock: Block = {
  slug: 'email',
  interfaceName: 'WorkflowEmailFieldBlock',
  labels: { singular: 'Email Field', plural: 'Email Fields' },
  fields: [...WorkflowFieldBaseFields, { name: 'default_value', type: 'email', label: 'Default Value' }],
}

export default EmailFieldBlock
