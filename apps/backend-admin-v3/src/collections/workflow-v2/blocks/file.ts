import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const FileFieldBlock: Block = {
  slug: 'file',
  interfaceName: 'WorkflowFileFieldBlock',
  labels: { singular: 'File Field', plural: 'File Fields' },
  fields: [...WorkflowFieldBaseFields],
}

export default FileFieldBlock
