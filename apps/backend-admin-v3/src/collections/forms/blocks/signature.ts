import { Block } from 'payload'
import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'

const SignatureBlock: Block & { label: string } = {
  slug: 'signature',
  interfaceName: 'FormSignatureBlock',
  labels: { plural: 'Signatures', singular: 'Signature' },
  label: 'Signature',
  fields: [...DEFAULT_FORM_CHILD_FIELDS],
}

export default SignatureBlock
