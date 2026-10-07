'use client'

import React from 'react'
import type { FnbPriceMode, FnbReportContext, FnbReportFilters } from './types'
import { dohaDate, dohaStartOfMonth } from './reports/formatters'
import { CloseIcon, PrinterIcon } from './reports/icons'
import { Segmented } from './reports/Segmented'

export interface FnbReportToolbarProps {
  context: FnbReportContext
  filters: FnbReportFilters
  items: { id: string; title: string }[]
  loadingItems: boolean
  onChange: (next: Partial<FnbReportFilters>) => void
  onPrint: () => void
  reportType?: 'restaurant' | 'event'
}

const field =
  'h-7 px-2 border border-(--theme-elevation-200) rounded-xs text-xs bg-(--theme-elevation-0) text-(--theme-elevation-800) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--theme-success-500)'

export const FnbReportToolbar: React.FC<FnbReportToolbarProps> = ({
  context,
  filters,
  items,
  loadingItems,
  onChange,
  onPrint,
  reportType = 'restaurant',
}) => {
  const isEvent = reportType === 'event'
  const presets = [
    { label: 'Today', from: dohaDate(0), to: dohaDate(0) },
    { label: 'Yesterday', from: dohaDate(1), to: dohaDate(1) },
    { label: '7 days', from: dohaDate(6), to: dohaDate(0) },
    { label: '30 days', from: dohaDate(29), to: dohaDate(0) },
    { label: 'This month', from: dohaStartOfMonth(), to: dohaDate(0) },
    { label: 'All time', from: '', to: '' },
  ]

  const activePreset = (from: string, to: string) =>
    (filters.from || '') === from && (filters.to || '') === to

  const hasRestaurant = Boolean(filters.restaurantId)

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2 items-center mb-4">
      {context.mode === 'all' ? (
        <select
          value={filters.restaurantId || ''}
          onChange={(e) => onChange({ restaurantId: e.target.value, itemId: '' })}
          aria-label={isEvent ? 'Filter by event' : 'Filter by restaurant'}
          className={`${field} cursor-pointer`}
        >
          <option value="">{isEvent ? 'All events' : 'All restaurants'}</option>
          {context.restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      ) : context.mode === 'locked' ? (
        <span className="h-7 inline-flex items-center px-2 rounded-xs text-xs font-medium bg-(--theme-elevation-100) text-(--theme-elevation-700) border border-(--theme-elevation-200)">
          {context.restaurants[0]?.title || (isEvent ? 'Assigned event' : 'Assigned restaurant')}
        </span>
      ) : null}

      <select
        value={filters.itemId || ''}
        onChange={(e) => onChange({ itemId: e.target.value })}
        disabled={!hasRestaurant || loadingItems}
        aria-label="Filter by menu item"
        title={!hasRestaurant ? (isEvent ? 'Pick an event first' : 'Pick a restaurant first') : undefined}
        className={`${field} cursor-pointer max-w-[190px] disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <option value="">
          {loadingItems
            ? 'Loading items…'
            : !hasRestaurant
              ? isEvent
                ? 'Pick an event first'
                : 'Pick a restaurant first'
              : 'All items'}
        </option>
        {hasRestaurant &&
          !loadingItems &&
          items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.title}
            </option>
          ))}
      </select>

      <Segmented
        ariaLabel="Order pricing"
        value={filters.priceMode ?? 'all'}
        onChange={(v: FnbPriceMode) => onChange({ priceMode: v })}
        options={[
          { value: 'all', label: 'All orders' },
          { value: 'priced', label: 'Priced', title: 'Only orders from menus that showed prices' },
          { value: 'event', label: 'Event', title: 'Only orders from event menus with prices hidden' },
        ]}
      />

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={filters.from || ''}
          max={filters.to || undefined}
          onChange={(e) => onChange({ from: e.target.value })}
          aria-label="From date"
          className={field}
        />
        <span className="text-[11px] text-(--theme-elevation-400)">to</span>
        <input
          type="date"
          value={filters.to || ''}
          min={filters.from || undefined}
          onChange={(e) => onChange({ to: e.target.value })}
          aria-label="To date"
          className={field}
        />
        {(filters.from || filters.to) && (
          <button
            type="button"
            onClick={() => onChange({ from: '', to: '' })}
            aria-label="Clear date range"
            title="Clear date range"
            className="h-7 w-7 inline-flex items-center justify-center rounded-xs text-(--theme-elevation-500) hover:text-(--theme-elevation-900) hover:bg-(--theme-elevation-100) cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--theme-success-500)"
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {presets.map((p) => {
          const active = activePreset(p.from, p.to)
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ from: p.from, to: p.to })}
              className={`h-7 px-2 text-[11px] font-medium rounded-xs border cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--theme-success-500) ${
                active
                  ? 'bg-(--theme-elevation-800) text-(--theme-elevation-0) border-(--theme-elevation-800)'
                  : 'bg-(--theme-elevation-0) hover:bg-(--theme-elevation-100) text-(--theme-elevation-600) border-(--theme-elevation-200)'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onPrint}
        className="ml-auto h-7 inline-flex items-center gap-1.5 px-2.5 rounded-xs text-xs font-medium bg-(--theme-elevation-0) hover:bg-(--theme-elevation-100) text-(--theme-elevation-700) border border-(--theme-elevation-200) cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--theme-success-500)"
      >
        <PrinterIcon />
        Print
      </button>
    </div>
  )
}
