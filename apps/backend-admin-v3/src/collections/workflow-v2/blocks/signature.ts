import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const SignatureFieldBlock: Block = {
  slug: 'signature',
  interfaceName: 'WorkflowSignatureFieldBlock',
  labels: { singular: 'Signature Field', plural: 'Signature Fields' },
  fields: [...WorkflowFieldBaseFields],
}

export default SignatureFieldBlock
