import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { getTableOrderingUrlAction } from '@/app/(frontend)/fnb/menu/_actions/orders'

interface UseTableQrOptions {
  width?: number
  // Prefer this event's own ordering page over the restaurant's standalone menu page -
  // see getTableOrderingUrlAction. Only set by event-scoped callers (the fnb-menu-events
  // Tables tab); the native tables collection UI doesn't pass one.
  eventSlug?: string
}

export const useTableQr = (tableId: string | number | undefined, options?: UseTableQrOptions) => {
  const width = options?.width ?? 256
  const eventSlug = options?.eventSlug
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [orderingUrl, setOrderingUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tableId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const run = async () => {
      const result = await getTableOrderingUrlAction(String(tableId), eventSlug)

      if (cancelled) return

      if (!result.success) {
        setLoading(false)
        setError(result.error)
        return
      }

      try {
        const qr = await QRCode.toDataURL(result.data.url, {
          width,
          margin: 2,
          errorCorrectionLevel: 'H',
        })

        if (cancelled) return

        setOrderingUrl(result.data.url)
        setDataUrl(qr)
      } catch (err) {
        console.error('Error generating QR code:', err)
        setError('Failed to render QR code')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [tableId, width, eventSlug])

  return { dataUrl, orderingUrl, loading, error }
}
