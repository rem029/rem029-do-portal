import React from 'react'
import clsx from 'clsx'
import MenuCardSkeleton from '@/app/(frontend)/fnb/menu/_components/menu-card-skeleton'

const Skeleton = ({ className }: { className?: string }) => (
  <div className={clsx('animate-pulse bg-neutral-200/60 rounded-md', className)} />
)

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-md min-h-screen bg-neutral-100/80 p-4 flex flex-col gap-3 overflow-hidden">
      {/* Header Pill Skeleton */}
      <div className="w-full h-14 rounded-full bg-white shadow-sm px-4 flex flex-row justify-between items-center gap-2">
        <div className="flex flex-row gap-2.5 items-center min-w-0 flex-1">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <div className="flex flex-row gap-2 items-center shrink-0">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-4 w-8 rounded-full" />
          <Skeleton className="size-5 rounded-full" />
        </div>
      </div>

      {/* Carousel Hero Skeleton */}
      <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-sm">
        <Skeleton className="w-full h-full rounded-2xl" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="w-full flex flex-row items-center gap-2 py-1">
        <div className="flex-1 h-10 rounded-full bg-white shadow-sm px-3 flex items-center gap-3 overflow-hidden">
          <Skeleton className="h-4 w-12 rounded-full shrink-0" />
          <Skeleton className="h-4 w-16 rounded-full shrink-0" />
          <Skeleton className="h-4 w-20 rounded-full shrink-0" />
          <Skeleton className="h-4 w-14 rounded-full shrink-0" />
        </div>
        <div className="size-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
          <Skeleton className="size-5 rounded-full" />
        </div>
      </div>

      {/* Items Skeleton */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex flex-col items-start gap-1">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </div>

        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <MenuCardSkeleton key={i} className="bg-white border-neutral-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
