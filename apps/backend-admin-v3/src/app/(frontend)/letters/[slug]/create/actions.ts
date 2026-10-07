'use server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { redirect } from 'next/navigation'
import { User } from '@/payload-types'
import { headers as getHeaders } from 'next/headers'

const textToLexical = (text: string) => {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: text,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export async function fetchUsersAction() {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) return []

  const where: any = {}
  if (!(user as User).super_user) {
    if (user.operator) {
      where.operator = {
        equals: typeof user.operator === 'object' ? (user.operator as any).id : user.operator,
      }
    }
    if (user.department) {
      where.department = {
        equals: typeof user.department === 'object' ? (user.department as any).id : user.department,
      }
    }
  }

  const users = await payload.find({
    collection: 'users',
    where,
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  return users.docs.map((u) => ({
    id: u.id,
    name: u.full_name || u.email,
    email: u.email,
  }))
}

import { getCollectionConfig } from '@/utilities/collection-meta'

export async function createLetterAction(slug: string, data: any) {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const collectionConfig = getCollectionConfig(slug)
  if (!collectionConfig) {
    return { success: false, error: 'Invalid collection' }
  }

  try {
    const docData: any = {
      ...data,
      operator: typeof user.operator === 'object' ? (user.operator as any).id : user.operator,
      _workflow_status: 'draft',
      workflow_status: 'draft',
    }

    // Convert richText fields from text to Lexical JSON
    collectionConfig.formFields.forEach((field) => {
      if (field.type === 'richText' && typeof data[field.name] === 'string') {
        docData[field.name] = textToLexical(data[field.name])
      }
    })

    const doc = await payload.create({
      collection: slug as any,
      data: docData,
      overrideAccess: true,
      user,
    })
    return { success: true, id: doc.id }
  } catch (error: any) {
    console.error('Create letter failed:', error)
    return { success: false, error: error.message }
  }
}
