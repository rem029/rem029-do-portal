'use client'

import React from 'react'
import { formatPickupTime } from '@/utilities/helper/trip-scheduling-utils'
import {
  useShuttleSchedules,
  type ClassificationType,
} from '@/app/(frontend)/trip-scheduling/_hooks/use-shuttle-schedules'
import { TripSchedulingHeader } from '../_components/trip-scheduling-header'

export function ShuttleSchedulesView({ backgroundImage }: { backgroundImage: string }) {
  const {
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
  } = useShuttleSchedules()

  return (
    <main
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(20, 52, 34, 0.55), rgba(20, 52, 34, 0.75)), ${backgroundImage}`,
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-7xl mx-auto w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative z-10">
        <TripSchedulingHeader title="Employee Transport Schedules" subtitle="Shuttle Timetable" />

        <div className="p-6 sm:p-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <div className="space-y-3 text-slate-700 text-xs">
            {/* ADAPTIVE CONTROL CONTAINER PANEL */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search schedules, routes..."
                    value={searchTerm}
                    className="w-full pl-8 pr-4 py-1.5 bg-white border border-transparent rounded-md outline-none focus:border-[#DEC37D] focus:ring-2 focus:ring-[#DEC37D]/5 transition-all text-xs font-medium text-slate-900"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative min-w-35 sm:min-w-40 flex-1 sm:flex-none">
                    <select
                      className="w-full appearance-none py-1.5 pl-3 pr-8 border border-slate-200 rounded-md outline-none bg-white text-xs font-bold text-[#143422] focus:border-[#DEC37D] transition-all cursor-pointer"
                      value={directionFilter}
                      onChange={(e) => {
                        setDirectionFilter(e.target.value)
                        setCurrentPage(1)
                      }}
                    >
                      <option value="All">All Directions</option>
                      <option value="to-office">Inbound to Oasis</option>
                      <option value="from-office">Outbound to Housing</option>
                    </select>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] text-[#DEC37D]">
                      ▼
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="lg:hidden px-2.5 py-1.5 rounded-md border text-xs bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>⚙️</span>
                    <span>Filters</span>
                  </button>
                </div>
              </div>

              <div
                className={`${showAdvanced ? 'block' : 'hidden lg:block'} pt-1.5 border-t border-slate-200`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full lg:w-auto">
                    <div className="relative w-full lg:min-w-32.5">
                      <select
                        className="w-full appearance-none py-1 pl-2 pr-6 border border-slate-200 rounded-md outline-none bg-white text-[11px] font-semibold focus:border-[#DEC37D] cursor-pointer"
                        value={routeFilter}
                        onChange={(e) => {
                          setRouteFilter(e.target.value)
                          setCurrentPage(1)
                        }}
                      >
                        <option value="All">📍 All Routes</option>
                        {routeOptions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[8px]">
                        ▼
                      </span>
                    </div>

                    <div className="relative w-full lg:min-w-35">
                      <select
                        className="w-full appearance-none py-1 pl-2 pr-6 border border-slate-200 rounded-md outline-none bg-white text-[11px] font-semibold focus:border-[#DEC37D] cursor-pointer"
                        value={vehicleFilter}
                        onChange={(e) => {
                          setVehicleFilter(e.target.value)
                          setCurrentPage(1)
                        }}
                      >
                        <option value="All">🚌 All Vehicles</option>
                        {vehicleOptions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} {v.capacity?.value ? ` — ${v.capacity.value}` : ''}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[8px]">
                        ▼
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 w-full lg:w-auto pt-0.5 lg:pt-0">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 select-none">
                      Classification:
                    </span>
                    <div className="flex flex-wrap gap-1 w-full sm:w-auto">
                      {(['All', 'Manager', 'Male', 'Female', 'General'] as ClassificationType[]).map(
                        (type) => {
                          const isActive = classificationFilter === type
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setClassificationFilter(type)
                                setCurrentPage(1)
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border flex-1 sm:flex-none text-center cursor-pointer ${
                                isActive
                                  ? 'bg-[#510C76] border-[#510C76] text-white shadow-sm'
                                  : 'bg-white border-transparent hover:bg-slate-100'
                              }`}
                            >
                              {type}
                            </button>
                          )
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RENDER DATAGRID RESPONSIVE PANELS */}
            <div className="bg-white rounded-xl border border-slate-200 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 font-bold text-xs text-slate-500 rounded-xl">
                  Syncing Active Timelines...
                </div>
              )}

              {/* DESKTOP LAYOUT TABLE DISPLAY VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#143422] text-white border-b-2 border-[#DEC37D]">
                    <tr>
                      <th className="p-3 uppercase text-[10px] tracking-wider font-extrabold w-[30%] pl-4">
                        Route Information
                      </th>
                      <th className="p-3 uppercase text-[10px] tracking-wider font-extrabold w-[25%]">
                        Company Vehicle
                      </th>
                      <th className="p-3 uppercase text-[10px] tracking-wider font-extrabold text-center w-[30%]">
                        Pickup Windows
                      </th>
                      <th className="p-3 uppercase text-[10px] tracking-wider font-extrabold text-center w-[15%] pr-4">
                        Est. Arrival/Departure
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                    {shuttles.length > 0 ? (
                      shuttles.map((s) => {
                        const routeObj = typeof s.route === 'object' ? s.route : null
                        const vehicleObj = typeof s.vehicle === 'object' ? s.vehicle : null

                        const hasStaggeredWindows = !!(
                          s.pickupManager ||
                          s.pickupMale ||
                          s.pickupFemale
                        )
                        const isOutboundReturnOnly =
                          s.direction === 'from-office' && !hasStaggeredWindows && !s.pickupGeneral

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-3 pl-4">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${s.direction === 'to-office' ? 'bg-[#DEC37D]' : 'bg-[#143422]'}`}
                                />
                                <div className="font-bold text-slate-900 uppercase tracking-tight text-[11px] md:text-xs">
                                  {s.direction === 'to-office'
                                    ? 'Inbound to Oasis'
                                    : 'Outbound to Housing'}
                                </div>
                              </div>
                              <div className="text-[11px] md:text-xs text-slate-600 font-bold mt-0.5 pl-3">
                                {routeObj ? routeObj.name : 'Unassigned Route'}
                              </div>
                            </td>

                            <td className="p-3 text-[11px] md:text-xs text-slate-700 font-semibold">
                              <div className="flex flex-col gap-0.5">
                                <div className="font-bold text-slate-900">
                                  🚌 {vehicleObj ? vehicleObj.name : 'Not Assigned'}
                                </div>
                                {vehicleObj?.description && (
                                  <div className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-wide pl-3">
                                    👤 {vehicleObj.description}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="flex gap-3 justify-center">
                                  {isOutboundReturnOnly ? (
                                    <div className="text-[9px] md:text-xs font-bold text-slate-400 bg-slate-50/50 px-2.5 py-0.5 rounded-md border border-slate-100 italic select-none">
                                      Drop / Return Loop Only
                                    </div>
                                  ) : !hasStaggeredWindows ? (
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-100">
                                      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider text-slate-400">
                                        General:
                                      </span>
                                      <span className="text-xs md:text-sm font-black text-[#143422]">
                                        {formatPickupTime(s.pickupGeneral)}
                                      </span>
                                    </div>
                                  ) : (
                                    [
                                      { lbl: 'Manager', val: s.pickupManager },
                                      { lbl: 'Male', val: s.pickupMale },
                                      { lbl: 'Female', val: s.pickupFemale },
                                    ].map(({ lbl, val }) => {
                                      const formattedTime = formatPickupTime(val)
                                      const isSelectionTarget = classificationFilter === lbl
                                      const isDimmedOut =
                                        classificationFilter !== 'All' && !isSelectionTarget

                                      return (
                                        <div
                                          key={lbl}
                                          className={`flex flex-col items-center transition-all duration-300 ${isDimmedOut ? 'opacity-[0.12] scale-90 blur-[0.2px]' : 'scale-100'}`}
                                        >
                                          <span
                                            className={`text-[7px] md:text-[8px] font-black uppercase tracking-wider mb-0.5 ${isSelectionTarget ? 'text-[#510C76]' : 'text-slate-400'}`}
                                          >
                                            {lbl}
                                          </span>
                                          <span
                                            className={`text-xs md:text-sm font-black px-2 py-1 rounded-md border min-w-13.5 md:min-w-15 text-center tracking-tight transition-all ${
                                              isSelectionTarget
                                                ? 'bg-purple-100 text-[#510C76] border-[#510C76] shadow-md scale-105'
                                                : 'bg-slate-50/80 text-slate-700 border-slate-100'
                                            }`}
                                          >
                                            {formattedTime}
                                          </span>
                                        </div>
                                      )
                                    })
                                  )}
                                </div>

                                {s.publicNote && (
                                  <div className="text-[#510C76] font-extrabold text-[10px] uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded border border-purple-100/60 select-none text-center max-w-60 truncate">
                                    ℹ️ {s.publicNote}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="p-3 text-center pr-4">
                              <span className="text-slate-900 font-black tracking-tight">
                                {s.arrivalTime}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-10 text-center text-xs font-semibold text-slate-400 bg-slate-50/50"
                        >
                          🚫 No transport schedules match your active filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE LAYOUT CARDS */}
              <div className="block md:hidden divide-y divide-slate-100">
                {shuttles.length > 0 ? (
                  shuttles.map((s) => {
                    const routeObj = typeof s.route === 'object' ? s.route : null
                    const vehicleObj = typeof s.vehicle === 'object' ? s.vehicle : null

                    const hasStaggeredWindows = !!(
                      s.pickupManager ||
                      s.pickupMale ||
                      s.pickupFemale
                    )
                    const isOutboundReturnOnly =
                      s.direction === 'from-office' && !hasStaggeredWindows && !s.pickupGeneral

                    return (
                      <div
                        key={s.id}
                        className="p-4 space-y-3 hover:bg-slate-50/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${s.direction === 'to-office' ? 'bg-[#DEC37D]' : 'bg-[#143422]'}`}
                            />
                            <span className="font-bold text-slate-900 uppercase tracking-tight text-[10px]">
                              {s.direction === 'to-office' ? 'Inbound' : 'Outbound'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">
                              Arrival Target
                            </span>
                            <span className="text-slate-900 font-black text-xs">
                              {s.arrivalTime}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-black text-slate-800">
                            {routeObj ? routeObj.name : 'Unassigned Route'}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500">
                            🚌 {vehicleObj ? vehicleObj.name : 'No Asset'}
                          </div>
                          {vehicleObj?.description && (
                            <div className="text-[10px] text-slate-400 font-medium italic pl-1">
                              👤 {vehicleObj.description}
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/60 flex flex-col gap-2">
                          <div className="flex gap-2 justify-center items-center">
                            {isOutboundReturnOnly ? (
                              <span className="text-[10px] font-bold text-slate-400 italic">
                                Drop / Return Loop Only
                              </span>
                            ) : !hasStaggeredWindows ? (
                              <div className="flex items-center gap-2 text-xs font-bold text-[#143422]">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400">
                                  General:
                                </span>
                                <span>{formatPickupTime(s.pickupGeneral)}</span>
                              </div>
                            ) : (
                              [
                                { lbl: 'Mgr', val: s.pickupManager },
                                { lbl: 'Male', val: s.pickupMale },
                                { lbl: 'Fem', val: s.pickupFemale },
                              ].map(({ lbl, val }) => {
                                const normalLabel =
                                  lbl === 'Mgr' ? 'Manager' : lbl === 'Fem' ? 'Female' : 'Male'
                                const isSelectionTarget = classificationFilter === normalLabel
                                const isDimmedOut =
                                  classificationFilter !== 'All' && !isSelectionTarget
                                return (
                                  <div
                                    key={lbl}
                                    className={`flex flex-col items-center flex-1 transition-all ${isDimmedOut ? 'opacity-20 scale-95' : ''}`}
                                  >
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                      {lbl}
                                    </span>
                                    <span
                                      className={`w-full text-center text-xs font-black py-1 rounded border ${
                                        isSelectionTarget
                                          ? 'bg-purple-100 text-[#510C76] border-[#510C76]'
                                          : 'bg-white text-slate-700 border-slate-100'
                                      }`}
                                    >
                                      {formatPickupTime(val)}
                                    </span>
                                  </div>
                                )
                              })
                            )}
                          </div>

                          {s.publicNote && (
                            <div className="text-[#510C76] font-bold text-[10px] uppercase tracking-wide bg-purple-50/70 py-1 px-2 rounded-md border border-purple-100/40 text-center select-none w-full">
                              ℹ️ {s.publicNote}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-8 text-center text-xs font-semibold text-slate-400">
                    🚫 No transport schedules match your filters.
                  </div>
                )}
              </div>

              {/* SYSTEM PAGINATION INTERFACE FOOTER CONTROL */}
              <div className="bg-slate-50 p-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-semibold text-slate-600 rounded-b-xl">
                <div className="pl-1">
                  Page <span className="text-slate-900 font-bold">{currentPage}</span> of{' '}
                  <span className="text-slate-900 font-bold">{totalPages}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="px-2.5 py-1 rounded-md border bg-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages || isLoading}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="px-3 py-1.5 rounded-md border bg-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
