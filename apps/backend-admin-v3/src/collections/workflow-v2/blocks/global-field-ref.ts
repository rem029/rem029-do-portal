import { Block } from 'payload'

const GlobalFieldRefBlock: Block = {
  slug: 'global_field_ref',
  interfaceName: 'WorkflowGlobalFieldRefBlock',
  labels: { singular: 'Global Field Reference', plural: 'Global Field References' },
  fields: [
    {
      name: 'global_field_name',
      type: 'text',
      required: true,
      label: 'Global Field Name',
      admin: { description: 'Must match the "name" of a field defined in Global Custom Fields.' },
    },
  ],
}

export default GlobalFieldRefBlock
