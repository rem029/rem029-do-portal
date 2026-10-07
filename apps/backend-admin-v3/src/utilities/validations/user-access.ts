import { UsersAccess } from '@/payload-types'
import { ArrayFieldValidation } from 'payload'

export const validateAccessSlugs: ArrayFieldValidation = (_access) => {
  const access = _access as UsersAccess['access']
  if (!access || access.length === 0) return 'At least one access entry is required.'

  const slugs = access.map((a) => a.slug)
  const hasDuplicates = new Set(slugs).size !== slugs.length

  if (hasDuplicates) return 'Access slugs must be unique.'

  return true
}
