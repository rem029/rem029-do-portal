import { describe, it, expect } from 'vitest'
import { hasUserAccess } from '@/utilities/access'
import { User } from '@/payload-types'

const BACKUP_ACCESS_SLUG = 'payload-backup'

// Minimal user shapes for exercising hasUserAccess in isolation — the full
// User type carries many unrelated required fields we don't need here.
const asUser = (data: unknown) => data as unknown as User

describe('hasUserAccess for the payload-backup endpoint', () => {
  it('grants access when user.super_user is true, regardless of the access array', () => {
    const user = asUser({ super_user: true, access: null })
    expect(hasUserAccess(user, BACKUP_ACCESS_SLUG, 'super_user')).toBe(true)
  })

  it('global super_user supersedes a payload-backup entry explicitly set to false', () => {
    const user = asUser({
      super_user: true,
      access: { access: [{ slug: BACKUP_ACCESS_SLUG, super_user: false }] },
    })
    expect(hasUserAccess(user, BACKUP_ACCESS_SLUG, 'super_user')).toBe(true)
  })

  it('grants access via a payload-backup users-access entry when not a global super_user', () => {
    const user = asUser({
      super_user: false,
      access: { access: [{ slug: BACKUP_ACCESS_SLUG, super_user: true }] },
    })
    expect(hasUserAccess(user, BACKUP_ACCESS_SLUG, 'super_user')).toBe(true)
  })

  it('denies access when the payload-backup entry has super_user false', () => {
    const user = asUser({
      super_user: false,
      access: { access: [{ slug: BACKUP_ACCESS_SLUG, super_user: false }] },
    })
    expect(hasUserAccess(user, BACKUP_ACCESS_SLUG, 'super_user')).toBe(false)
  })

  it('denies access when there is no matching access entry', () => {
    const user = asUser({
      super_user: false,
      access: { access: [{ slug: 'some-other-slug', super_user: true }] },
    })
    expect(hasUserAccess(user, BACKUP_ACCESS_SLUG, 'super_user')).toBe(false)
  })

  it('denies access when there is no user', () => {
    expect(hasUserAccess(null, BACKUP_ACCESS_SLUG, 'super_user')).toBe(false)
  })
})
