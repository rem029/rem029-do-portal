'use client'

import React from 'react'
import type { FnbRevenueBasket } from '../types'
import { formatQar } from './formatters'
import { ReportCard } from './ReportCard'

interface RevenueBasketCardProps {
  data: FnbRevenueBasket
}

export const RevenueBasketCard: React.FC<RevenueBasketCardProps> = ({ data }) => {
  const byRestaurant = data.byRestaurant
    .filter((r) => r.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)

  if (!data.available) {
    return (
      <ReportCard
        title="Revenue & Basket"
        caption="Revenue and basket size for completed orders."
        empty
        emptyLabel="Set the pricing filter to “Priced” to see revenue — some orders in this view are from menus that hide prices."
      />
    )
  }

  return (
    <ReportCard title="Revenue & Basket" caption="Revenue and basket size for completed orders.">
      <div className="flex flex-col">
        <div>
          <div className="text-2xl font-semibold text-(--theme-elevation-900) tabular-nums leading-none">
            {formatQar(data.completedRevenue)}
          </div>
          <div className="text-[11px] text-(--theme-elevation-500) mt-1">completed orders</div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-(--theme-elevation-150)">
          <div>
            <span className="text-[11px] text-(--theme-elevation-500) block">Average order value</span>
            <strong className="text-sm font-semibold text-(--theme-elevation-800) tabular-nums">
              {formatQar(data.averageOrderValue)}
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-(--theme-elevation-500) block">Items per order</span>
            <strong className="text-sm font-semibold text-(--theme-elevation-800) tabular-nums">
              {data.averageItemsPerOrder}
            </strong>
          </div>
        </div>

        {byRestaurant.length > 1 && (
          <div className="mt-4 pt-3 border-t border-(--theme-elevation-150) flex flex-col gap-1">
            {byRestaurant.map((r) => (
              <div key={r.restaurantId} className="flex justify-between text-xs">
                <span className="text-(--theme-elevation-600) truncate mr-2">{r.title}</span>
                <span className="text-(--theme-elevation-800) font-medium tabular-nums shrink-0">
                  {formatQar(r.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ReportCard>
  )
}
