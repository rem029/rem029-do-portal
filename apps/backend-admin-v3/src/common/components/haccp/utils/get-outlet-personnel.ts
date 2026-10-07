import type { Payload } from 'payload'

interface OutletPersonnel {
  pic: string
  hic: string
}

export async function getOutletPersonnel(
  payload: Payload,
  outletId: string | object,
): Promise<OutletPersonnel> {
  try {
    const resolvedOutletId =
      typeof outletId === 'object' && outletId !== null
        ? (outletId as { id?: string }).id || String(outletId)
        : String(outletId)

    if (!resolvedOutletId) {
      return { pic: '', hic: '' }
    }

    // Query the correct haccp-outlet-settings collection
    const settings = await payload.find({
      collection: 'haccp-outlet-settings',
      where: {
        outlet: {
          equals: resolvedOutletId,
        },
      },
      depth: 1,
      limit: 1,
    })

    const settingDoc = settings.docs?.[0]
    if (!settingDoc) {
      return { pic: '', hic: '' }
    }

    // Extract and join emails from the picEmails and hicEmails arrays
    const picEmails =
      (settingDoc as any).picEmails
        ?.map((item: { email?: string }) => item.email)
        .filter(Boolean)
        .join(', ') || ''

    const hicEmails =
      (settingDoc as any).hicEmails
        ?.map((item: { email?: string }) => item.email)
        .filter(Boolean)
        .join(', ') || ''

    return {
      pic: picEmails,
      hic: hicEmails,
    }
  } catch (err) {
    payload.logger.error(`Failed to fetch outlet personnel: ${err}`)
    return { pic: '', hic: '' }
  }
}
