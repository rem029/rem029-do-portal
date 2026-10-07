import { cookies } from 'next/headers'
import React from 'react'
import { getPayload } from 'payload'
import type { PayloadRequest } from 'payload'
import config from '@payload-config'
import PersonalHygieneClientView from './client-view'
import { checkIsPicForOutlet, checkIsHicForOutlet } from '../utils/permissions'
import type { HaccpPersonalHygiene, Outlet, User } from '@/payload-types'

type HygieneEntry = NonNullable<HaccpPersonalHygiene['entries']>[number]

interface PersonalHygieneServerViewProps {
  id?: string
  params?: Promise<{ id?: string; segments?: string[] }> | { id?: string; segments?: string[] }
  req: PayloadRequest
}

export default async function PersonalHygieneServerView({
  id,
  params,
  req,
}: PersonalHygieneServerViewProps) {
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
  let initialData: HaccpPersonalHygiene | null = null

  if (documentId && documentId !== 'create') {
    try {
      initialData = await payload.findByID({
        collection: 'haccp-personal-hygiene',
        id: documentId,
      })

      // Normalize outlet object to string ID for client dropdown consistency
      if (initialData?.outlet && typeof initialData.outlet === 'object') {
        initialData = { ...initialData, outlet: (initialData.outlet as Outlet).id }
      }
    } catch (err: unknown) {
      const error = err as Error
      payload.logger.error(`--- [SERVER VIEW] Error fetching record: ${error.message}`)
    }
  }

  // Safely extract or resolve user from request context or next/headers cookies
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
    } catch (err: unknown) {
      const error = err as Error
      payload.logger.error(`--- [SERVER VIEW] Auth resolution error: ${error.message} ---`)
    }
  }

  const outletId = initialData?.outlet ? String(initialData.outlet) : undefined

  const typedUser = user as
    | (User & { role?: string; enableAccessToAllCollections?: boolean })
    | undefined
  const isSuperUser =
    typedUser?.role === 'admin' || typedUser?.enableAccessToAllCollections === true

  // Calculate roles with explicit precedence for 2-step workflows:
  const isHicUser = await checkIsHicForOutlet(payload, user, outletId)
  const isPicUser = !isHicUser && (await checkIsPicForOutlet(payload, user, outletId))

  // Diagnostic Telemetry Log to inspect exact context values in terminal
  payload.logger.info(
    `--- [PH SERVER VIEW EVAL] User: ${user?.email}, Role: ${typedUser?.role}, OutletId: ${outletId}, isHic: ${isHicUser}, isPic: ${isPicUser} ---`,
  )

  // Server action matching the strict PersonalHygieneClientProps signature
  async function handleServerSave(formData: {
    outlet: string
    date: string
    entries: Omit<HygieneEntry, 'id'>[]
    status: string
  }) {
    'use server'
    const payloadInstance = await getPayload({ config })

    // Cast data with the strict status union type expected by Payload
    const typedData = {
      ...formData,
      status: formData.status as HaccpPersonalHygiene['status'],
    }

    try {
      if (documentId && documentId !== 'create') {
        await payloadInstance.update({
          collection: 'haccp-personal-hygiene',
          id: documentId,
          data: typedData,
          req,
        })
      } else {
        await payloadInstance.create({
          collection: 'haccp-personal-hygiene',
          data: typedData,
          req,
        })
      }
      return { success: true }
    } catch (err: unknown) {
      const error = err as Error
      payloadInstance.logger.error(`--- [SERVER ACTION] Save error: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  return (
    <PersonalHygieneClientView
      initialData={initialData ?? undefined}
      documentId={documentId}
      saveAction={handleServerSave}
      isPicUser={isPicUser}
      isHicUser={isHicUser}
      isSuperUser={isSuperUser}
      workflowType="2-step"
    />
  )
}
