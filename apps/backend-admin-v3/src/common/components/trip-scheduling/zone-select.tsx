'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useField, SelectInput as PayloadSelectInput } from '@payloadcms/ui'
import { getZonesAction } from '@/collections/trip-scheduling-zones/actions/get-zones'

type Props = {
  path: string
  label?: string
  required?: boolean
  description?: string
  style?: React.CSSProperties
}

const TripSchedulingZoneSelect: React.FC<Props> = ({
  path,
  label = 'Zone',
  required = false,
  description,
  style,
}) => {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(false)

  const fieldData = useField<string | null>({ path })

  const activeValue = fieldData.value

  const setActiveValue = useCallback(
    (val: string | null) => {
      if (fieldData?.setValue) {
        fieldData.setValue(val)
      }
    },
    [fieldData],
  )

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getZonesAction()

      if (result.success && Array.isArray(result.data)) {
        const opts = result.data.map((d: any) => ({
          label: d.title,
          value: String(d.id),
        }))
        setOptions(opts)
      }
    } catch (e) {
      console.error('Zone directory action fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const getSelectedValue = () => {
    if (!activeValue) return ''
    if (typeof activeValue === 'object') return (activeValue as any).id || ''
    return String(activeValue)
  }

  return (
    <div
      className="field-type"
      style={{
        flex: '1 1 0%',
        minWidth: 0,
        width: '100%',
        ...style,
      }}
    >
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
        description={
          loading ? 'Updating zone matrix indices...' : description || 'Select option.'
        }
      />
    </div>
  )
}

export default TripSchedulingZoneSelect