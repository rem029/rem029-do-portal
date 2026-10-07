'use client'

import React, { useEffect, useState } from 'react'
import { useField, SelectInput as PayloadSelectInput } from '@payloadcms/ui'
import { getRoutesAction } from '@/collections/trip-scheduling-routes/actions/get-routes' // Adjust path if needed

type Props = {
  path: string
  label?: string
  required?: boolean
  description?: string
  style?: React.CSSProperties
  className?: string
}

const TripSchedulingRouteSelect: React.FC<Props> = ({ 
  path, 
  label = 'Route', 
  required = true, 
  description, 
  style 
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

  // Fetch primary list of active routes via Server Action
  useEffect(() => {
    let cancelled = false

    const fetchRoutes = async () => {
      setLoading(true)
      try {
        const result = await getRoutesAction()

        if (result.success && Array.isArray(result.data)) {
          const opts = result.data.map((r: any) => ({
            label: r.title,
            value: String(r.id),
          }))
          if (!cancelled) setOptions(opts)
        }
      } catch (e) {
        console.error('Route action fetch failed', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRoutes()
    return () => {
      cancelled = true
    }
  }, [])

  // Extract ID for the value prop to ensure the label matches correctly
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
        description={loading ? 'Loading routes...' : description || 'Select a standardized route.'}
      />
    </div>
  )
}

export default TripSchedulingRouteSelect