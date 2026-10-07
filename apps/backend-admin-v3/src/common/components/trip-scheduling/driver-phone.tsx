'use client'

import React, { useEffect, useState } from 'react'
import { useField, TextInput as PayloadTextInput } from '@payloadcms/ui'
import { getDriver } from '@/collections/trip-scheduling-drivers/actions/get-driver'

const TripSchedulingDriverPhone: React.FC<{ path: string }> = ({ path }) => {
  const [loading, setLoading] = useState(false)

  const phoneField = useField<string | null>({ path })
  const driverField = useField<string | { id: string } | null>({ path: 'driver' })
  const contextPhoneValue = phoneField?.value
  const setContextPhoneValue = phoneField?.setValue
  const contextDriverId = driverField?.value

  const activePhoneValue = contextPhoneValue
  const setActivePhoneValue = (val: string) => {
    if (setContextPhoneValue) {
      setContextPhoneValue(val)
    }
  }

  const driverId =
    contextDriverId && typeof contextDriverId === 'object' ? contextDriverId.id : contextDriverId

  // Primary Side-Effect Engine: Listens to driver changes and pulls the matching phone logs
  useEffect(() => {
    let cancelled = false

    const fetchPhone = async () => {
      if (!driverId) {
        if (!cancelled) setActivePhoneValue('')
        return
      }

      setLoading(true)
      try {
        const res = await getDriver(driverId)

        if (!res.success || !res.driver) {
          if (!cancelled) setActivePhoneValue('')
          return
        }

        const phone = res.driver.phone || ''

        if (!cancelled) setActivePhoneValue(phone)
      } catch (err) {
        console.error('Failed to fetch driver phone:', err)
        if (!cancelled) setActivePhoneValue('')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPhone()

    return () => {
      cancelled = true
    }
  }, [driverId])

  return (
    <div className="field-type">
      <PayloadTextInput
        path={path}
        label="Driver Phone"
        value={activePhoneValue || ''}
        readOnly={true}
        description={loading ? 'Fetching driver details...' : 'Auto-filled from selected driver'}
        placeholder="Auto"
      />
    </div>
  )
}

export default TripSchedulingDriverPhone
