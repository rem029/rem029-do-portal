'use client'

import React, { useEffect, useState } from 'react'
import { useField, SelectInput as PayloadSelectInput } from '@payloadcms/ui'
import { getDrivers } from '@/collections/trip-scheduling-drivers/actions/get-drivers'
import { getDriver } from '@/collections/trip-scheduling-drivers/actions/get-driver'

type Props = {
  path: string
  label?: string
  description?: string
  includeOnlyActive?: boolean
  required?: boolean
}

const TripSchedulingDriverSelect: React.FC<Props> = ({
  path,
  label = 'Driver',
  description,
  includeOnlyActive = true,
  required = false,
}) => {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(true)

  const fieldData = useField<string | null>({ path })
  const contextValue = fieldData?.value
  const setContextValue = fieldData?.setValue

  const activeValue = contextValue
  const setActiveValue = (val: string | null) => {
    if (setContextValue) {
      setContextValue(val)
    }
  }

  // Primary Fetch (Filtered list via Server Action)
  useEffect(() => {
    let cancelled = false
    const fetchDriversList = async () => {
      setLoading(true)
      try {
        const res = await getDrivers(includeOnlyActive)

        const opts = (res.docs || []).map((d: any) => ({
          label: `${d?.name ?? 'Unnamed'}${d?.phone ? ` — ${d.phone}` : ''}`,
          value: String(d?.id),
        }))

        if (!cancelled) setOptions(opts)
      } catch (e) {
        console.error('Driver fetch failed', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDriversList()
    return () => {
      cancelled = true
    }
  }, [includeOnlyActive])

  // Label Safety Net - Ensures the driver name shows up even if they are now inactive
  useEffect(() => {
    const stringId =
      activeValue && typeof activeValue === 'object' ? (activeValue as any).id : activeValue

    if (!stringId) return

    const exists = options.some((opt) => opt.value === String(stringId))
    if (!exists && options.length > 0) {
      getDriver(String(stringId))
        .then((res) => {
          if (res.success && res.driver) {
            const d = res.driver
            setOptions((prev) => {
              if (prev.some((opt) => opt.value === String(d.id))) return prev
              return [
                ...prev,
                {
                  label: `${d?.name ?? 'Unnamed'}${d?.phone ? ` — ${d.phone}` : ''}`,
                  value: String(d.id),
                },
              ]
            })
          }
        })
        .catch(() => {})
    }
  }, [activeValue, options.length])

  // Safe ID extraction for display execution
  const getSelectedValue = () => {
    if (!activeValue) return ''
    if (typeof activeValue === 'object') return (activeValue as any).id || ''
    return String(activeValue)
  }

  return (
    <div style={{ width: '32%', marginBottom: '1.5rem' }}>
      <PayloadSelectInput
        path={path}
        name={path}
        label={label}
        required={required}
        value={getSelectedValue()}
        onChange={(val: any) => {
          const incomingValue = val && typeof val === 'object' ? (val as any).value : val
          setActiveValue(incomingValue ? String(incomingValue) : null)
        }}
        options={options}
        description={loading ? 'Loading drivers...' : description}
      />
    </div>
  )
}

export default TripSchedulingDriverSelect
