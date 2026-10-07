'use client'

import React, { useMemo, useState } from 'react'
import type { FnbItemRanking, FnbItemRankingRow } from '../types'
import { formatQar } from './formatters'
import { CaretIcon } from './icons'
import { ReportCard } from './ReportCard'
import { Segmented } from './Segmented'

type SortColumn = 'title' | 'units' | 'ordersContaining' | 'revenue' | 'pctOfUnits'

interface ItemRankingCardProps {
  data: FnbItemRanking
  hideRevenue?: boolean
}

export const ItemRankingCard: React.FC<ItemRankingCardProps> = ({ data, hideRevenue }) => {
  const [sortCol, setSortCol] = useState<SortColumn>('units')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleHeaderClick = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir(col === 'title' ? 'asc' : 'desc')
    }
  }

  const sortedRows = useMemo(() => {
    const activeCol = hideRevenue && sortCol === 'revenue' ? 'units' : sortCol
    return [...data.rows].sort((a: FnbItemRankingRow, b: FnbItemRankingRow) => {
      const comp =
        activeCol === 'title' ? a.title.localeCompare(b.title) : a[activeCol] - b[activeCol]
      return sortDir === 'asc' ? comp : -comp
    })
  }, [data.rows, hideRevenue, sortCol, sortDir])

  const rankView = sortCol === 'units' && sortDir === 'asc' ? 'least' : 'top'

  const header = (col: SortColumn, label: string, align: 'left' | 'right') => (
    <th
      scope="col"
      className={`py-2 ${align === 'left' ? 'pr-2 text-left' : 'px-2 text-right'} font-semibold`}
      aria-sort={sortCol === col ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => handleHeaderClick(col)}
        className={`inline-flex items-center gap-1 bg-transparent border-0 p-0 font-semibold text-inherit cursor-pointer hover:text-(--theme-elevation-900) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--theme-success-500) ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        {label}
        {sortCol === col && (
          <CaretIcon direction={sortDir === 'asc' ? 'up' : 'down'} size={11} />
        )}
      </button>
    </th>
  )

  return (
    <ReportCard
      title="Item Order Ranking"
      caption="Best and weakest sellers by units."
      empty={data.rows.length === 0}
      emptyLabel="No items ordered in this range."
      headerRight={
        <Segmented
          ariaLabel="Ranking order"
          value={rankView}
          onChange={(v) => {
            setSortCol('units')
            setSortDir(v === 'least' ? 'asc' : 'desc')
          }}
          options={[
            { value: 'top', label: 'Top' },
            { value: 'least', label: 'Least', title: 'Never-ordered items are not listed yet' },
          ]}
        />
      }
    >
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-(--theme-elevation-0) z-1 text-(--theme-elevation-500) border-b border-(--theme-elevation-200)">
              <tr>
                {header('title', 'Item', 'left')}
                {header('units', 'Units', 'right')}
                {header('ordersContaining', 'Orders', 'right')}
                {!hideRevenue && header('revenue', 'Revenue', 'right')}
                {header('pctOfUnits', 'Share', 'right')}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--theme-elevation-100)">
              {sortedRows.map((row) => (
                <tr key={row.itemId} className="text-(--theme-elevation-700)">
                  <td className="py-1.5 pr-2 font-medium text-(--theme-elevation-900) truncate max-w-[150px]">
                    {row.title}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums font-semibold text-(--theme-elevation-900)">
                    {row.units.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums">
                    {row.ordersContaining.toLocaleString()}
                  </td>
                  {!hideRevenue && (
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {data.revenueAvailable ? formatQar(row.revenue) : '—'}
                    </td>
                  )}
                  <td className="py-1.5 pl-2 text-right tabular-nums text-(--theme-elevation-500)">
                    {row.pctOfUnits}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ReportCard>
  )
}
