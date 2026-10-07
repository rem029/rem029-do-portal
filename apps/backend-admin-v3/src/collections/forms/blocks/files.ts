import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { Block } from 'payload'

const FilesBlock: Block & { label: string } = {
  slug: 'file',
  interfaceName: `FilesBlock`,
  labels: { plural: 'Files', singular: 'File' },
  label: 'File',
  fields: [...DEFAULT_FORM_CHILD_FIELDS],
}

export default FilesBlock
