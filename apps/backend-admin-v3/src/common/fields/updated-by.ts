import { accessCheck } from '@/utilities/access'
import { Field } from 'payload'

const UpdatedByField: Field = {
  name: 'updated_by',
  label: 'Updated By',
  type: 'relationship',
  relationTo: 'users',
  maxDepth: 1,
  access: {
    update: () => false,
    read: () => true,
  },
  admin: {
    readOnly: true,
    position: 'sidebar',
    condition: (data) => Boolean(data?.updated_by),
  },
}

export default UpdatedByField
