import { Block } from 'payload'
import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'

const PhoneBlock: Block & { label: string } = {
  slug: 'phone',
  interfaceName: 'FormPhoneBlock',
  labels: { plural: 'Phone Numbers', singular: 'Phone Number' },
  label: 'Phone Number',
  fields: [...DEFAULT_FORM_CHILD_FIELDS],
}

export default PhoneBlock
