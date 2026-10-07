import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { Block } from 'payload'

const CountryBlock: Block & { label: string } = {
  slug: 'country',
  interfaceName: `CountryBlock`,
  labels: { plural: 'Countries', singular: 'Country' },
  label: 'Country',
  fields: [...DEFAULT_FORM_CHILD_FIELDS],
}

export default CountryBlock
