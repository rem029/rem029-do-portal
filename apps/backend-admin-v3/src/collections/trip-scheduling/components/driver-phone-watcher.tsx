'use client'
import React, { useEffect, useRef } from 'react'
import { useFormFields, useField } from '@payloadcms/ui'
import { getDriver } from '@/collections/trip-scheduling-drivers/actions/get-driver'

const DriverPhoneWatcher: React.FC = () => {
  const driverField: any = useFormFields(([fields]) => fields.driver)
  const { setValue, value: currentPhone } = useField<string>({ path: 'driverPhone' })

  const prevDriverIdRef = useRef<string | null>(null)

  useEffect(() => {
    const driverId = driverField?.value
    const actualDriverId = driverId && typeof driverId === 'object' ? driverId.id : driverId

    if (actualDriverId && typeof actualDriverId === 'string') {
      if (!currentPhone || actualDriverId !== prevDriverIdRef.current) {
        const fetchDriverPhone = async () => {
          try {
            const res = await getDriver(actualDriverId)
            if (res.success && res.driver?.phone) {
              setValue(res.driver.phone)
              prevDriverIdRef.current = actualDriverId
            }
          } catch (error) {
            console.error('Watcher action error:', error)
          }
        }

        fetchDriverPhone()
      }
    } else if (!actualDriverId) {
      if (currentPhone) setValue(null)
      prevDriverIdRef.current = null
    }
  }, [driverField?.value, setValue, currentPhone])

  return null
}

export default DriverPhoneWatcher
