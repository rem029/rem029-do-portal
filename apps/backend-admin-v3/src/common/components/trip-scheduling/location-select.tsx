'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useField, SelectInput as PayloadSelectInput } from '@payloadcms/ui'
import { getLocationsAction } from '@/collections/trip-scheduling-locations/actions/get-locations' // Adjust import path as needed

type Props = {
  path: string
  label?: string
  required?: boolean
  description?: string
  style?: React.CSSProperties
  className?: string
}

const TripSchedulingLocationSelect: React.FC<Props> = ({
  path,
  label = 'Location',
  required = false,
  description,
  style,
  className,
}) => {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(false)

  const fieldData = useField<string | null>({ path })
  const routeField = useField<string | { id: string } | null>({ path: 'route' })
  const contextValue = fieldData?.value
  const setContextValue = fieldData?.setValue
  const routeVal = routeField?.value

  const activeValue = contextValue
  const setActiveValue = (val: string | null) => {
    if (setContextValue) {
      setContextValue(val)
    }
  }

  // Sanitize routeId to ensure it's a clean tracking string
  const routeId = routeVal && typeof routeVal === 'object' ? routeVal.id : routeVal

  const fetchOptions = useCallback(async () => {
    if (!routeId) {
      setOptions([])
      return
    }
    setLoading(true)
    try {
      const result = await getLocationsAction(routeId)

      if (result.success && Array.isArray(result.data)) {
        const opts = result.data.map((d: any) => ({
          label: d.title || '(unnamed)',
          value: String(d.id),
        }))

        setOptions(opts)

        const currentValStr =
          activeValue && typeof activeValue === 'object'
            ? (activeValue as any).id
            : String(activeValue || '')
        if (currentValStr && opts.length > 0 && !opts.some((o: any) => o.value === currentValStr)) {
          setActiveValue(null)
        }
      }
    } catch (e) {
      console.error('Location action fetch failed', e)
    } finally {
      setLoading(false)
    }
  }, [routeId, activeValue])

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
          const incomingValue = typeof val === 'string' ? val : (val as any)?.value
          setActiveValue(incomingValue ? String(incomingValue) : null)
        }}
        options={options}
        description={
          loading
            ? 'Updating locations...'
            : !routeId
              ? 'Please select a route first'
              : description || 'Select a location associated with this route.'
        }
      />
    </div>
  )
}

export default TripSchedulingLocationSelect