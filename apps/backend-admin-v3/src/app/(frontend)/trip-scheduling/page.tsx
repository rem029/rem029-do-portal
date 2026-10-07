import React from 'react'
import { TRIP_SCHEDULING_LOGO_HEIGHT, TRIP_SCHEDULING_LOGO_SRC } from '@/utilities/trip-scheduling-branding'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import {
  TripSchedulingGatewayCard,
  type TripSchedulingGatewayCardProps,
} from './_components/trip-scheduling-gateway-card'
import { getTripSchedulingPublicSettings } from '@/utilities/trip-scheduling-public-settings'

export const dynamic = 'force-dynamic'

const cards: TripSchedulingGatewayCardProps[] = [
  {
    href: '/pv3/trip-scheduling/booking',
    heading: 'Vehicle Booking Request',
    desc: 'Submit a standard department trip request for executive cars, SUVs, or utility passenger vans.',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 16.5V11l1.6-4.2A2 2 0 0 1 7.5 5.5h9a2 2 0 0 1 1.9 1.3L20 11v5.5" />
        <path d="M4 16.5h16v2.5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.5Z" />
        <circle cx="7.5" cy="14" r="1.1" />
        <circle cx="16.5" cy="14" r="1.1" />
        <path d="M4 11h16" />
      </svg>
    ),
  },
  {
    href: '/pv3/trip-scheduling/adhoc',
    heading: 'Employee Transport Request',
    desc: 'Arrange adhoc logistics transport or bulk shift routing for company employees.',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3.5" y="6" width="17" height="11" rx="2" />
        <path d="M3.5 11h17" />
        <path d="M7 17v1.5M17 17v1.5" />
        <circle cx="7" cy="14" r="0.9" />
        <circle cx="17" cy="14" r="0.9" />
      </svg>
    ),
  },
  {
    // was /pv3/page/daily-shuttle-schedules — fixed to the real branded route
    href: '/pv3/trip-scheduling/shuttle-schedules',
    heading: 'Shuttle Schedules',
    desc: 'View daily fixed shuttle routes, departure times, and stop locations across the oasis.',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 9.5h16" />
        <path d="M8 3v3.5M16 3v3.5" />
        <path d="M8 13h2M14 13h2M8 16.5h2M14 16.5h2" />
      </svg>
    ),
  },
  {
    // was /pv3/page/booking-history — fixed to the real branded route
    href: '/pv3/trip-scheduling/booking-history',
    heading: 'Request Booking History',
    desc: 'Review your past vehicle requests, real-time status updates, and driver assignment logs.',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="13" r="7.5" />
        <path d="M12 9.2V13l2.6 1.6" />
        <path d="M9.5 3h5" />
      </svg>
    ),
  },
  {
    href: '/pv3/trip-scheduling/staff-voice',
    heading: 'Staff Voice',
    desc: 'Share your transport concerns, suggestions, compliments, or service improvement ideas.',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5v-3.5H6.5A2.5 2.5 0 0 1 4 12.5v-6Z" />
        <path d="M8 8.5h8M8 11.5h5" />
      </svg>
    ),
  },
  {
    href: '/pv3/trip-scheduling/faq',
    heading: 'Transport & Logistics FAQ',
    desc: 'Find quick answers regarding vehicle booking lead times, shuttle policies, and baggage rules.',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.25" />
        <path d="M9.6 9.3a2.4 2.4 0 1 1 3.2 2.26c-.7.26-1.3.86-1.3 1.64v.3" />
        <circle cx="11.5" cy="16.2" r="0.15" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

// Root font-size is 18px (styles.css), so lengths use arbitrary values rather than the rem spacing scale.
// `!` marks utilities that must beat the unlayered global h1/p/img rules in styles.css.
const headerClass =
  'relative overflow-hidden text-center rounded-[20px] border border-[rgba(222,195,125,0.32)] bg-cover bg-center bg-fixed p-[clamp(1.5rem,3.5vw,2.5rem)_clamp(1.5rem,6vw,4rem)] min-[901px]:p-[clamp(1.25rem,3.5vh,2.25rem)_clamp(1.5rem,6vw,4rem)]'
const headerGlow =
  "before:content-[''] before:absolute before:top-[-10%] before:left-1/2 before:size-[520px] before:-translate-x-1/2 before:pointer-events-none before:bg-[radial-gradient(circle,rgba(222,195,125,0.3)_0%,rgba(222,195,125,0)_65%)]"
const titleClass =
  'relative m-0! mb-[0.65rem]! min-[901px]:mb-[clamp(0.4rem,1vh,0.65rem)]! font-semibold! text-[clamp(1.7rem,3.8vw,2.6rem)]! min-[901px]:text-[clamp(1.6rem,4vh,2.6rem)]! leading-[1.12] tracking-[-0.01em] text-white'
const subtitleClass =
  'relative my-0! mx-auto! max-w-[46ch] text-[clamp(0.875rem,1.5vw,0.98rem)] min-[901px]:text-[clamp(0.85rem,1.8vh,1rem)] leading-[1.55] text-[rgba(255,255,255,0.72)]'
const gridClass =
  'grid grid-cols-[repeat(3,1fr)] max-[900px]:grid-cols-[repeat(2,1fr)] max-[600px]:grid-cols-[1fr] gap-[1.1rem] mt-8 min-[901px]:gap-[clamp(0.8rem,2vh,1.15rem)] min-[901px]:mt-[clamp(1.5rem,4vh,2.25rem)]'

export default async function TripSchedulingGatewayPage() {
  const { generalBackground, landingHeaderBackground } = await getTripSchedulingPublicSettings()

  return (
    <main
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(20, 52, 34, 0.55), rgba(20, 52, 34, 0.75)), ${generalBackground}`,
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <div className="relative z-10 mx-auto w-full max-w-[1180px]">
        <header
          className={cn(headerClass, headerGlow)}
          style={{
            backgroundImage: `linear-gradient(165deg, rgba(20, 52, 34, 0.6) 0%, rgba(20, 52, 34, 0.88) 100%), ${landingHeaderBackground}`,
          }}
        >
          <div className="flex items-center justify-center mb-[1.1rem]">
            <img
              src={TRIP_SCHEDULING_LOGO_SRC}
              alt="Doha Oasis"
              style={{ height: TRIP_SCHEDULING_LOGO_HEIGHT }}
              className="block w-auto max-w-[200px]! object-contain"
            />
          </div>
          <h1 className={cn(titleClass, noah.className)}>Transport &amp; Logistics</h1>
          <p className={subtitleClass}>
            Book vehicles, arrange employee transport, view shuttle schedules, and access transport
            resources all in one place.
          </p>
        </header>

        <div className={gridClass}>
          {cards.map((card) => (
            <TripSchedulingGatewayCard key={card.href} {...card} />
          ))}
        </div>
      </div>
    </main>
  )
}
