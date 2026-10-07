'use client'

import React from 'react'
import { formatTimeDisplay } from '@/utilities/helper/trip-scheduling-utils'
import {
  useBookingHistoryLedger,
  type ModeFilterType,
} from '@/app/(frontend)/trip-scheduling/_hooks/use-booking-history-ledger'
import type { HistoryViewer } from '@/utilities/trip-scheduling-history-session'
import { TripSchedulingHeader } from '../_components/trip-scheduling-header'

const panelClass = 'bg-slate-50 p-5 max-w-md w-full rounded-xl border border-slate-200 space-y-4'
const inputClass =
  'w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-[#DEC37D] bg-white'
const primaryButtonClass =
  'w-full py-2 bg-[#143422] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-md hover:bg-[#143422]/90 shadow-sm cursor-pointer disabled:opacity-40'
const linkButtonClass =
  'text-[10px] font-bold text-[#143422] underline underline-offset-2 cursor-pointer disabled:opacity-40 disabled:no-underline disabled:cursor-default'

function GateHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="text-center">
      <div className="h-9 w-9 bg-[#143422]/5 text-[#143422] rounded-full flex items-center justify-center mx-auto mb-2 text-base">
        🔒
      </div>
      <h2 className="text-sm font-black text-[#143422] uppercase tracking-tight">
        Authorization Gate
      </h2>
      <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  )
}

function GateNotice({ message, tone }: { message: string; tone: 'info' | 'error' }) {
  if (!message) return null
  return tone === 'error' ? (
    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-md text-[10px] font-bold text-center leading-normal">
      ⚠️ {message}
    </div>
  ) : (
    <div className="bg-purple-50/80 border border-purple-100 text-[#510C76] p-2 rounded-md text-[10px] font-bold text-center leading-normal">
      ℹ️ {message}
    </div>
  )
}

export function BookingHistoryView({
  backgroundImage,
  initialViewer,
}: {
  backgroundImage: string
  initialViewer: HistoryViewer | null
}) {
  const {
    step,
    viewerEmail,
    authLoading,
    authMessage,
    authError,
    emailInput,
    setEmailInput,
    codeInput,
    setCodeInput,
    resendCountdown,
    handleRequestCode,
    handleVerifyCode,
    handleResendCode,
    handleUseDifferentEmail,
    handleSignOut,
    displayLedger,
    tableLoading,
    ledgerError,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedDocs,
    handleExportTrigger,
  } = useBookingHistoryLedger(initialViewer)

  return (
    <main
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(20, 52, 34, 0.55), rgba(20, 52, 34, 0.75)), ${backgroundImage}`,
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-7xl mx-auto w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative z-10">
        <TripSchedulingHeader title="Vehicle Booking History" subtitle="Authorized Access Only" />

        <div className="p-6 sm:p-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {step === 'email' ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className={panelClass}>
                <GateHeader subtitle="Enter your corporate email to receive a one-time access code." />
                <form onSubmit={handleRequestCode} className="space-y-2.5">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@domain.com"
                    value={emailInput}
                    className={inputClass}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <button type="submit" disabled={authLoading} className={primaryButtonClass}>
                    {authLoading ? 'Sending Code...' : 'Send Access Code'}
                  </button>
                </form>
                <GateNotice message={authMessage} tone="info" />
                <GateNotice message={authError} tone="error" />
              </div>
            </div>
          ) : step === 'code' ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className={panelClass}>
                <GateHeader subtitle={`Enter the 6-digit code sent to ${emailInput.trim().toLowerCase()}.`} />
                <form onSubmit={handleVerifyCode} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={codeInput}
                    className={`${inputClass} text-center tracking-[0.5em] font-bold`}
                    onChange={(e) => setCodeInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={authLoading || codeInput.length !== 6}
                    className={primaryButtonClass}
                  >
                    {authLoading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </form>
                <GateNotice message={authMessage} tone="info" />
                <GateNotice message={authError} tone="error" />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={authLoading || resendCountdown > 0}
                    className={linkButtonClass}
                  >
                    {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUseDifferentEmail}
                    disabled={authLoading}
                    className={linkButtonClass}
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-slate-700 text-xs">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>
                  Signed in as <strong className="text-[#143422]">{viewerEmail}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-2.5 py-1 border border-slate-200 rounded-md font-bold text-[10px] uppercase tracking-wider text-[#143422] hover:bg-slate-50 cursor-pointer"
                >
                  Sign out
                </button>
              </div>

              {ledgerError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-md text-[11px] font-bold text-center">
                  ⚠️ {ledgerError}
                </div>
              )}

              {/* FILTER HUB */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                  <div className="relative flex-1 w-full">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Search by personnel name, route details, justification strings, zone, district..."
                      value={searchTerm}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-transparent rounded-md outline-none focus:border-[#DEC37D] text-xs font-medium"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleExportTrigger}
                    disabled={tableLoading || displayLedger.length === 0}
                    className="w-full sm:w-auto px-3 py-1.5 bg-[#DEC37D] text-[#143422] font-black text-[10px] uppercase tracking-wider rounded-md hover:bg-[#DEC37D]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    📥 Download History (CSV)
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 border-t border-slate-200">
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto">
                    {(
                      [
                        { label: 'All Allocations', value: 'All' },
                        { label: '📋 Bookings', value: 'booking' },
                        { label: '⚡ Ad-Hoc Logs', value: 'adhoc' },
                      ] as { label: string; value: ModeFilterType }[]
                    ).map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setTypeFilter(tab.value)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          typeFilter === tab.value
                            ? 'bg-[#143422] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-auto sm:min-w-30">
                    <select
                      className="w-full appearance-none py-1 pl-2 pr-6 border border-slate-200 rounded-md outline-none bg-white text-[11px] font-bold text-slate-600 focus:border-[#DEC37D] cursor-pointer"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="pending">⏳ Pending Review</option>
                      <option value="approved">✅ Approved</option>
                      <option value="rejected">❌ Rejected</option>
                      <option value="cancelled">🚫 Cancelled</option>
                      <option value="completed">🏁 Completed</option>
                      <option value="declined">🛑 Declined</option>
                      <option value="expired">⌛ Expired</option>
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[8px]">
                      ▼
                    </span>
                  </div>
                </div>
              </div>

              {/* MATRIX TABLE / MOBILE CARD LEDGER */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative">
                {tableLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 font-bold text-xs text-slate-500">
                    Syncing Master Registries...
                  </div>
                )}

                {/* DESKTOP TABLE LAYOUT */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#143422] text-white border-b-2 border-[#DEC37D]">
                      <tr>
                        <th className="p-2.5 uppercase text-[10px] tracking-wider font-extrabold pl-4 w-[25%]">
                          Personnel
                        </th>
                        <th className="p-2.5 uppercase text-[10px] tracking-wider font-extrabold w-[38%]">
                          Trip Details
                        </th>
                        <th className="p-2.5 uppercase text-[10px] tracking-wider font-extrabold text-center w-[17%]">
                          Timeline
                        </th>
                        <th className="p-2.5 uppercase text-[10px] tracking-wider font-extrabold text-center w-[12%]">
                          Cost
                        </th>
                        <th className="p-2.5 uppercase text-[10px] tracking-wider font-extrabold text-center pr-4 w-[13%]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] md:text-xs">
                      {paginatedDocs.length > 0 ? (
                        paginatedDocs.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-2.5 pl-4">
                              <div className="font-bold text-slate-900">{row.employeeName}</div>
                              <span
                                className={`inline-block text-[8px] uppercase font-black px-1.5 py-px rounded border tracking-wide mt-0.5 ${
                                  row.originType === 'booking'
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}
                              >
                                {row.originType === 'booking' ? 'Standard Booking' : 'Ad-Hoc Run'}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-800">
                                📍 {row.pickupLocation} ➔ {row.dropoffLocation}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {(row.zoneNumber || row.district) && (
                                  <span className="inline-flex items-center gap-1 bg-[#143422]/5 text-[#143422] px-1.5 py-0.5 rounded text-[9px] font-black border border-[#143422]/10">
                                    🗺️ Zone {row.zoneNumber || '—'}{' '}
                                    {row.district ? `(${row.district})` : ''}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500 font-semibold tracking-tight line-clamp-1">
                                  👉 {row.purpose}
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="font-black text-[#143422]">
                                {formatTimeDisplay(row.requestedTime)}
                              </div>
                              <div className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-tight">
                                {row.requestedDate}
                              </div>
                            </td>
                            <td className="p-2.5 text-center font-black text-[#143422]">
                              {row.tripCost !== undefined &&
                              row.tripCost !== null &&
                              Number(row.tripCost) > 0
                                ? `QAR ${Number(row.tripCost).toFixed(2)}`
                                : '—'}
                            </td>
                            <td className="p-2.5 text-center pr-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                  row.bookingStatus === 'approved' ||
                                  row.bookingStatus === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : row.bookingStatus === 'rejected' ||
                                        row.bookingStatus === 'declined'
                                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                                      : row.bookingStatus === 'cancelled' ||
                                          row.bookingStatus === 'expired'
                                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                                        : 'bg-purple-50 text-[#510C76] border-purple-100'
                                }`}
                              >
                                {row.bookingStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-10 text-center text-xs font-semibold text-slate-400 bg-slate-50/50"
                          >
                            📂 No historical logs match your current parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARD LAYOUT */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {paginatedDocs.length > 0 ? (
                    paginatedDocs.map((row) => (
                      <div
                        key={row.id}
                        className="p-4 space-y-2 hover:bg-slate-50/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {row.employeeName}
                            </div>
                            <span
                              className={`inline-block text-[8px] uppercase font-black px-1.5 py-px rounded border tracking-wide mt-0.5 ${
                                row.originType === 'booking'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}
                            >
                              {row.originType === 'booking' ? 'Standard Booking' : 'Ad-Hoc Run'}
                            </span>
                          </div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                              row.bookingStatus === 'approved' || row.bookingStatus === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : row.bookingStatus === 'rejected' ||
                                    row.bookingStatus === 'declined'
                                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                                  : row.bookingStatus === 'cancelled' ||
                                      row.bookingStatus === 'expired'
                                    ? 'bg-slate-100 text-slate-500 border-slate-200'
                                    : 'bg-purple-50 text-[#510C76] border-purple-100'
                            }`}
                          >
                            {row.bookingStatus}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-slate-800 text-xs">
                            📍 {row.pickupLocation} ➔ {row.dropoffLocation}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {(row.zoneNumber || row.district) && (
                              <span className="inline-flex items-center gap-1 bg-[#143422]/5 text-[#143422] px-1.5 py-0.5 rounded text-[9px] font-black border border-[#143422]/10">
                                🗺️ Zone {row.zoneNumber || '—'}{' '}
                                {row.district ? `(${row.district})` : ''}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-semibold tracking-tight">
                              👉 {row.purpose}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-500">
                          <span>
                            {formatTimeDisplay(row.requestedTime)} · {row.requestedDate}
                          </span>
                          <span className="text-[#143422]">
                            {row.tripCost !== undefined &&
                            row.tripCost !== null &&
                            Number(row.tripCost) > 0
                              ? `QAR ${Number(row.tripCost).toFixed(2)}`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-xs font-semibold text-slate-400 bg-slate-50/50">
                      📂 No historical logs match your current parameters.
                    </div>
                  )}
                </div>

                {/* PAGINATION FOOTER */}
                <div className="bg-slate-50 p-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <div className="pl-2">
                    Showing <span className="text-slate-900">{currentPage}</span> of{' '}
                    <span className="text-slate-900">{totalPages}</span> ledger pages
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1 || tableLoading}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="px-2 py-1 border bg-white rounded shadow-sm disabled:opacity-40 cursor-pointer text-[10px]"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages || tableLoading}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      className="px-2 py-1 border bg-white rounded shadow-sm disabled:opacity-40 cursor-pointer text-[10px]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
