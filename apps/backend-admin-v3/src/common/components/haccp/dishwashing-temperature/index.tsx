import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import DishwashingTemperatureClientView from './client-view'
import { checkIsPicForOutlet, checkIsHicForOutlet } from '../utils/permissions'
import { saveHaccpDocument } from '../utils/actions'
import type { HaccpDishwashingTemperature, Outlet } from '@/payload-types'

export default async function DishwashingTemperatureServerView({
  id,
  params,
  req,
}: {
  id?: string
  params?: any
  req: any
}) {
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
  let initialData: HaccpDishwashingTemperature | null = null

  if (documentId && documentId !== 'create') {
    try {
      initialData = await payload.findByID({
        collection: 'haccp-dishwashing-temperature',
        id: documentId,
      })

      if (initialData?.outlet && typeof initialData.outlet === 'object') {
        initialData = { ...initialData, outlet: (initialData.outlet as Outlet).id }
      }
    } catch (err) {
      payload.logger.error(`--- [DISHWASHER SERVER VIEW] Error fetching record: ${err}`)
    }
  }

  // Robust Auth Resolution matching Personal Hygiene fix
  let user = req?.user
  const incomingHeaders = await nextHeaders()

  if (!user) {
    try {
      const authResult = await payload.auth({ headers: incomingHeaders })
      user = authResult?.user
    } catch (authErr) {
      payload.logger.error(`--- [DISHWASHER SERVER VIEW] Auth resolution error: ${authErr}`)
    }
  }

  const outletId = initialData?.outlet ? String(initialData.outlet) : undefined

  const isSuperUser = user?.role === 'admin' || (user as any)?.enableAccessToAllCollections === true
  const isPicUser = await checkIsPicForOutlet(payload, user, outletId)
  const isHicUser = await checkIsHicForOutlet(payload, user, outletId)

  async function handleServerSave(formData: {
    outlet: string
    unit: string
    monthYear: string
    dailyEntries: any[]
    weeklyDescaling: any[]
    correctiveAction: string
    status: any
  }): Promise<{ success: boolean; error?: string; docId?: string | number }> {
    'use server'
    const payloadInstance = await getPayload({ config })
    try {
      const typedStatus = formData.status as HaccpDishwashingTemperature['status']

      if (documentId && documentId !== 'create') {
        await saveHaccpDocument({
          collection: 'haccp-dishwashing-temperature',
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
          collection: 'haccp-dishwashing-temperature',
          data: {
            ...formData,
            status: typedStatus,
          },
          req,
        })
        return { success: true, docId: newDoc.id }
      }
    } catch (error: any) {
      payloadInstance.logger.error(`--- [DISHWASHER SERVER ACTION] Save error: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  return (
    <DishwashingTemperatureClientView
      initialData={initialData}
      documentId={documentId}
      saveAction={handleServerSave}
      isPicUser={isPicUser}
      isHicUser={isHicUser}
      isSuperUser={isSuperUser}
      workflowType="3-step"
    />
  )
}
