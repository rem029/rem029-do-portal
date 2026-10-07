'use client'

import { useEffect, useState } from 'react'
import { TripSchedulingRoute, TripSchedulingVehicle, TripSchedulingShuttle } from '@/payload-types'
import { getShuttleSchedules } from '@/collections/trip-scheduling/io/get-shuttle-schedules'

export type ClassificationType = 'All' | 'Manager' | 'Male' | 'Female' | 'General'

export function useShuttleSchedules() {
  const [shuttles, setShuttles] = useState<TripSchedulingShuttle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [directionFilter, setDirectionFilter] = useState('All')
  const [routeFilter, setRouteFilter] = useState('All')
  const [vehicleFilter, setVehicleFilter] = useState('All')
  const [classificationFilter, setClassificationFilter] = useState<ClassificationType>('All')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [routeOptions, setRouteOptions] = useState<TripSchedulingRoute[]>([])
  const [vehicleOptions, setVehicleOptions] = useState<TripSchedulingVehicle[]>([])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Server Action execution pipeline with pagination
  useEffect(() => {
    const fetchScheduleData = async () => {
      setIsLoading(true)
      try {
        const result = await getShuttleSchedules({
          page: currentPage,
          search: debouncedSearch.trim() || undefined,
          direction: directionFilter,
          route: routeFilter,
          vehicle: vehicleFilter,
          classification: classificationFilter,
        })

        if (result.success) {
          if (Array.isArray(result.routes)) setRouteOptions(result.routes)
          if (Array.isArray(result.vehicles)) setVehicleOptions(result.vehicles)

          setShuttles(result.shuttles || [])
          setTotalPages(result.totalPages || 1)
        }
      } catch (e) {
        console.error('Shuttle schedules sync failed', e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchScheduleData()
  }, [
    currentPage,
    debouncedSearch,
    directionFilter,
    routeFilter,
    vehicleFilter,
    classificationFilter,
  ])

  return {
    shuttles,
    isLoading,
    currentPage,
    setCurrentPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    directionFilter,
    setDirectionFilter,
    routeFilter,
    setRouteFilter,
    vehicleFilter,
    setVehicleFilter,
    classificationFilter,
    setClassificationFilter,
    showAdvanced,
    setShowAdvanced,
    routeOptions,
    vehicleOptions,
  }
}
