import { cn } from '@/utilities/cn'

export interface MenuCardSkeletonProps {
  className?: string
}

export const MenuCardSkeleton = ({ className }: MenuCardSkeletonProps) => {
  return (
    <div
      className={cn(
        'flex flex-row items-stretch bg-menu-background-card border-b-[0.5px] border-menu-neutral/40 rounded-lg overflow-hidden',
        className,
      )}
      style={{ backgroundColor: 'var(--background-card-color, #ffffff)' }}
    >
      <div className="w-28 sm:w-32 aspect-square bg-neutral-200/60 animate-pulse shrink-0" />
      <div className="flex flex-1 flex-col justify-between p-2.5 gap-2">
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-3/4 bg-neutral-200/60 animate-pulse rounded" />
          <div className="h-2.5 w-full bg-neutral-200/60 animate-pulse rounded" />
          <div className="h-2.5 w-4/5 bg-neutral-200/60 animate-pulse rounded" />
        </div>
        <div className="flex flex-row items-center justify-between gap-2 mt-auto">
          <div className="h-3.5 w-14 bg-neutral-200/60 animate-pulse rounded" />
          <div className="h-6 w-20 bg-neutral-200/60 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default MenuCardSkeleton
