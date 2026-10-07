import React from 'react'
import { TRIP_SCHEDULING_LOGO_HEIGHT, TRIP_SCHEDULING_LOGO_SRC } from '@/utilities/trip-scheduling-branding'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'

interface TripSchedulingHeaderProps {
  title: string
  subtitle?: React.ReactNode
  className?: string
}

export const TripSchedulingHeader: React.FC<TripSchedulingHeaderProps> = ({ title, subtitle, className }) => (
  <div
    className={cn(
      'bg-[#143422] px-6 py-4 lg:pt-[12px] text-center border-b-4 border-[#DEC37D]',
      subtitle ? 'lg:pb-[16px]' : 'lg:pb-0',
      className,
    )}
  >
    <div className="flex justify-center items-center h-10 lg:h-6">
      <img
        src={TRIP_SCHEDULING_LOGO_SRC}
        alt="Doha Oasis"
        style={{ height: TRIP_SCHEDULING_LOGO_HEIGHT, width: 'auto', objectFit: 'contain' }}
        className="mx-auto"
      />
    </div>
    {/* `!` beats the unlayered global h1 margin in styles.css */}
    <h1
      className={cn('text-white text-2xl my-[20px]! lg:mt-[12px]!', subtitle ? 'lg:mb-[4px]!' : 'lg:mb-[16px]!', noah.className)}
      style={{ fontSize: '1.5rem' }}
    >
      {title}
    </h1>
    {subtitle && (
      <p className="text-[#DEC37D] text-[10px] font-semibold tracking-wide uppercase lg:leading-4">{subtitle}</p>
    )}
  </div>
)
