'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { UserSetting } from '@/payload-types'
import { revalidatePath } from 'next/cache'

export type SaveUserSettingsData = Pick<UserSetting, 'signature_group' | 'initials_group'>

export const getUserSettingsAction = async (userId: string) => {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection: 'user-settings',
      where: {
        user: {
          equals: userId,
        },
      },
      limit: 1,
    })

    return { success: true, data: docs[0] || null }
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return { success: false, error: 'Failed to fetch settings' }
  }
}

export const saveUserSettingsAction = async (userId: string, data: SaveUserSettingsData) => {
  const payload = await getPayload({ config })

  try {
    // Check if settings exist
    const { docs } = await payload.find({
      collection: 'user-settings',
      where: {
        user: {
          equals: userId,
        },
      },
      limit: 1,
    })

    if (docs.length > 0) {
      // Update existing record
      const result = await payload.update({
        collection: 'user-settings',
        id: docs[0].id,
        data,
      })
      revalidatePath('/admin', 'layout')
      return { success: true, data: result }
    } else {
      // Create new record
      const result = await payload.create({
        collection: 'user-settings',
        data: {
          user: userId,
          ...(data),
        },
      })
      revalidatePath('/admin', 'layout')
      return { success: true, data: result }
    }
  } catch (error) {
    console.error('Error saving user settings:', error)
    return { success: false, error: 'Failed to save settings' }
  }
}
