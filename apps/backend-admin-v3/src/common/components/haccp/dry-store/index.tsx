import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'
import HaccpDryStoreClientView from './client-view'
import { checkIsPicForOutlet, checkIsHicForOutlet } from '../utils/permissions'
import { saveHaccpDocument } from '../utils/actions'
import type { HaccpDryStore, Outlet, User, HaccpOutletSetting } from '@/payload-types'
import type { PayloadRequest } from 'payload'

interface ServerViewParams {
  id?: string
  segments?: string[]
}

interface DryStoreServerViewProps {
  id?: string
  params?: Promise<ServerViewParams> | ServerViewParams
  req: PayloadRequest
}

export default async function HaccpDryStoreServerView({
  id,
  params,
  req,
}: DryStoreServerViewProps) {
  let documentId = id

  if (!documentId && params) {
    const resolvedParams = params instanceof Promise ? await params : params
    documentId = resolvedParams?.id

    if (!documentId && resolvedParams?.segments && Array.isArray(resolvedParams.segments)) {
      const idCandidate = resolvedParams.segments[resolvedParams.segments.length - 1]
      if (idCandidate && idCandidate !== 'create') {
        documentId = idCandidate
      }
    }
  }

  const payload = await getPayload({ config })
  let initialData: HaccpDryStore | null = null

  if (documentId && documentId !== 'create') {
    try {
      initialData = await payload.findByID({
        collection: 'haccp-dry-store',
        id: documentId,
      })

      if (initialData?.outlet && typeof initialData.outlet === 'object') {
        initialData = { ...initialData, outlet: (initialData.outlet as Outlet).id }
      }
    } catch (err: unknown) {
      const error = err as Error
      payload.logger.error(`--- [DRY STORE SERVER VIEW] Error fetching record: ${error.message}`)
    }
  }

  let user = req?.user as User | undefined

  if (!user) {
    try {
      const cookieStore = await cookies()
      const cookieString = cookieStore.toString()

      const incomingHeaders = new Headers({
        cookie: cookieString,
      })

      const authResult = await payload.auth({ headers: incomingHeaders })
      user = authResult?.user as User | undefined
    } catch (authErr: unknown) {
      const error = authErr as Error
      payload.logger.error(`--- [DRY STORE SERVER VIEW] Auth resolution error: ${error.message}`)
    }
  }

  const outletId = initialData?.outlet ? String(initialData.outlet) : undefined

  const typedUser = user as
    | (User & { role?: string; enableAccessToAllCollections?: boolean })
    | undefined
  const isSuperUser =
    typedUser?.role === 'admin' || typedUser?.enableAccessToAllCollections === true

  let isHicUser = await checkIsHicForOutlet(payload, user, outletId)
  let isPicUser = !isHicUser && (await checkIsPicForOutlet(payload, user, outletId))

  if (!outletId && user?.email && !isSuperUser) {
    try {
      const allSettings = await payload.find({
        collection: 'haccp-outlet-settings',
        limit: 100,
        overrideAccess: true,
      })

      const userEmail = user.email.trim().toLowerCase()
      for (const setting of allSettings.docs as HaccpOutletSetting[]) {
        const isHicMatch = setting.hicEmails?.some(
          (item) =>
            item &&
            typeof item === 'object' &&
            'email' in item &&
            typeof item.email === 'string' &&
            item.email.trim().toLowerCase() === userEmail,
        )
        const isPicMatch = setting.picEmails?.some(
          (item) =>
            item &&
            typeof item === 'object' &&
            'email' in item &&
            typeof item.email === 'string' &&
            item.email.trim().toLowerCase() === userEmail,
        )

        if (isHicMatch) {
          isHicUser = true
          break
        }
        if (isPicMatch && !isHicUser) {
          isPicUser = true
          break
        }
      }
    } catch (fallbackErr: unknown) {
      const error = fallbackErr as Error
      payload.logger.error(
        `--- [DRY STORE SERVER VIEW] Fallback permission check error: ${error.message}`,
      )
    }
  }

  payload.logger.info(
    `--- [DRY STORE SERVER VIEW EVAL] User: ${user?.email}, Role: ${typedUser?.role}, OutletId: ${outletId}, isHic: ${isHicUser}, isPic: ${isPicUser} ---`,
  )

  async function handleServerSave(formData: {
    outlet: string
    monthYear: string
    dailyEntries: NonNullable<HaccpDryStore['dailyEntries']>
    status: string
  }) {
    'use server'
    const payloadInstance = await getPayload({ config })
    try {
      const typedStatus = formData.status as HaccpDryStore['status']
      if (documentId && documentId !== 'create') {
        await saveHaccpDocument({
          collection: 'haccp-dry-store',
          documentId,
          formData: {
            ...formData,
            status: typedStatus,
          },
          req,
        })
        return { success: true, docId: documentId }
      } else {
        const newDoc = await payloadInstance.create({
          collection: 'haccp-dry-store',
          data: {
            ...formData,
            status: typedStatus,
          },
          req,
        })
        return { success: true, docId: newDoc.id }
      }
    } catch (error: unknown) {
      const err = error as Error
      payloadInstance.logger.error(`--- [DRY STORE SERVER ACTION] Save error: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  return (
    <HaccpDryStoreClientView
      initialData={initialData ?? undefined}
      documentId={documentId}
      saveAction={handleServerSave}
      isPicUser={isPicUser}
      isHicUser={isHicUser}
      isSuperUser={isSuperUser}
      workflowType="3-step"
    />
  )
}
