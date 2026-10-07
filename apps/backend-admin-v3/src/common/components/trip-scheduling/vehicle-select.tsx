'use client'

import React, { useEffect, useState } from 'react'
import { useField, useDocumentInfo, SelectInput as PayloadSelectInput } from '@payloadcms/ui'
import { getVehiclesAction } from '@/collections/trip-scheduling-vehicles/actions/get-vehicles'

export type VehicleFilterMode = 'employee-only' | 'exclude-employee' | 'all'

type Props = {
  path: string
  label?: string
  description?: string
  mode?: VehicleFilterMode
  addAll?: boolean
  selectedItems?: string[]
  includeOnlyAvailable?: boolean
  required?: boolean
  style?: React.CSSProperties
  className?: string
}

const TripSchedulingVehicleSelect: React.FC<Props> = ({
  path,
  label = 'Vehicle Needed',
  description,
  mode: manualMode,
  includeOnlyAvailable = true,
  required = true,
  style,
  className,
}) => {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(true)

  const fieldData = useField<string | null>({ path })
  const docInfo = useDocumentInfo()
  const contextValue = fieldData?.value
  const setContextValue = fieldData?.setValue
  const collectionSlug = docInfo?.collectionSlug || ''

  const activeValue = contextValue
  const setActiveValue = (val: string | null) => {
    if (setContextValue) {
      setContextValue(val)
    }
  }

  // Robust mode resolution supporting partial slug matching
  const resolvedMode: VehicleFilterMode =
    manualMode ||
    (collectionSlug.includes('adhoc') || collectionSlug.includes('shuttles') || collectionSlug.includes('employee')
      ? 'employee-only'
      : 'exclude-employee')

  // Primary Fetch Engine via Server Action
  useEffect(() => {
    let cancelled = false

    const fetchVehicles = async () => {
      setLoading(true)
      try {
        const result = await getVehiclesAction({
          filterMode: resolvedMode,
          addAll: true,
        })

        if (result.success && Array.isArray(result.data)) {
          const opts = result.data.map((v: any) => ({
            label: v.title,
            value: String(v.id),
          }))
          if (!cancelled) setOptions(opts)
        }
      } catch (e) {
        console.error('Vehicle Action Fetch Error:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchVehicles()
    return () => {
      cancelled = true
    }
  }, [resolvedMode])

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
          const incomingValue = typeof val === 'string' ? val : (val as any)?.value
          setActiveValue(incomingValue ? String(incomingValue) : null)
        }}
        options={options}
        description={
          loading
            ? 'Loading available vehicles...'
            : resolvedMode === 'employee-only'
              ? 'Showing only Employee Transport vehicles.'
              : description
        }
      />
    </div>
  )
}

export default TripSchedulingVehicleSelect