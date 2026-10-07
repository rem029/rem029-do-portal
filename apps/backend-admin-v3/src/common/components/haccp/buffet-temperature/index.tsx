import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import BuffetTemperatureClientView from './client-view'
import {
  checkIsPicForOutlet,
  checkIsHicForOutlet,
  isHicpDocumentLocked,
} from '../utils/permissions'
import type { HaccpBuffetTemperature, Outlet } from '@/payload-types'

export default async function BuffetTemperatureServerView({
  id,
  params,
  req,
}: {
  id?: string
  params?: any
  req: any
}) {
  // Capture documentId from top-level `id` prop first, then fallback to `params`
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
  let initialData = null

  if (documentId && documentId !== 'create') {
    try {
      initialData = await payload.findByID({
        collection: 'haccp-buffet-temperature',
        id: documentId,
      })

      if (initialData?.outlet && typeof initialData.outlet === 'object') {
        initialData = { ...initialData, outlet: (initialData.outlet as Outlet).id }
      }
    } catch (err) {
      payload.logger.error(`--- [SERVER VIEW] Error fetching buffet temperature record: ${err}`)
    }
  }

  // Robust Auth Resolution matching Dishwashing
  let user = req?.user
  const incomingHeaders = await nextHeaders()

  if (!user) {
    try {
      const authResult = await payload.auth({ headers: incomingHeaders })
      user = authResult?.user
    } catch (authErr) {
      payload.logger.error(`--- [BUFFET SERVER VIEW] Auth resolution error: ${authErr}`)
    }
  }

  const outletId = initialData?.outlet ? String(initialData.outlet) : undefined

  const isSuperUser = user?.role === 'admin' || (user as any)?.enableAccessToAllCollections === true
  const isHicUser = await checkIsHicForOutlet(payload, user, outletId)
  const isPicUser = await checkIsPicForOutlet(payload, user, outletId)

  const isLocked = isHicpDocumentLocked({
    status: initialData?.status || 'draft',
    isHicUser,
    isPicUser,
    isSuperUser,
  })

  async function handleServerSave(formData: {
    outlet: string
    date: string
    functionType: string
    items: any[]
    status: HaccpBuffetTemperature['status']
  }) {
    'use server'
    const payloadInstance = await getPayload({ config })
    try {
      if (documentId && documentId !== 'create') {
        await payloadInstance.update({
          collection: 'haccp-buffet-temperature',
          id: documentId,
          data: formData,
        })
      } else {
        await payloadInstance.create({
          collection: 'haccp-buffet-temperature',
          data: formData,
        })
      }
      return { success: true }
    } catch (error: any) {
      payloadInstance.logger.error(`--- [SERVER ACTION] Buffet save error: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  return (
    <BuffetTemperatureClientView
      initialData={initialData}
      documentId={documentId}
      saveAction={handleServerSave}
      isPicUser={isPicUser}
      isHicUser={isHicUser}
      isSuperUser={isSuperUser}
    />
  )
}
