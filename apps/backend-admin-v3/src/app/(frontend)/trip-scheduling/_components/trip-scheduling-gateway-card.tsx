import React from 'react'
import { cn } from '@/utilities/cn'

export interface TripSchedulingGatewayCardProps {
  href: string
  heading: string
  desc: string
  icon: React.ReactNode
}

// Root font-size is 18px (styles.css), so lengths use arbitrary values rather than the rem spacing scale.
const cardBase =
  'group relative flex flex-col gap-[0.9rem] no-underline bg-white rounded-[14px] p-[1.6rem_1.5rem_1.5rem] border border-[#e2e8f0] border-l-[3px] border-l-transparent shadow-[0_6px_20px_-12px_rgba(20,52,34,0.25)]'
const cardMotion =
  'transition-[border-color,translate,box-shadow] duration-200 ease-[ease] motion-reduce:transition-none'
const cardActive =
  'hover:border-l-[#DEC37D] hover:-translate-y-[3px] hover:shadow-[0_14px_28px_-18px_rgba(20,52,34,0.45)] focus-visible:border-l-[#DEC37D] focus-visible:-translate-y-[3px] focus-visible:shadow-[0_14px_28px_-18px_rgba(20,52,34,0.45)]'
// `!` because the unlayered global `a:focus { opacity: 0.8; outline: none }` in styles.css beats layered utilities.
const cardFocusRing =
  'focus-visible:opacity-100! focus-visible:outline-2! focus-visible:outline-[#DEC37D]! focus-visible:outline-offset-[3px]'

const svgStroke =
  '[&_svg]:stroke-current [&_svg]:fill-none [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]'
const iconClass =
  'flex size-[38px] shrink-0 items-center justify-center rounded-[50%] bg-[#f8fafc] border border-[rgba(222,195,125,0.35)] text-[#143422] [&_svg]:size-[18px] [&_svg]:stroke-[1.6]'
const arrowClass =
  'absolute top-[1.5rem] right-[1.4rem] text-[#e2e8f0] opacity-0 translate-x-[-4px] translate-y-[4px] transition-[opacity,translate,color] duration-200 ease-[ease] motion-reduce:transition-none group-hover:opacity-100 group-hover:translate-0 group-hover:text-[#143422] group-focus-visible:opacity-100 group-focus-visible:translate-0 group-focus-visible:text-[#143422] [&_svg]:size-[16px] [&_svg]:stroke-[1.8]'

export const TripSchedulingGatewayCard: React.FC<TripSchedulingGatewayCardProps> = ({
  href,
  heading,
  desc,
  icon,
}) => (
  <a
    href={href}
    className={cn(cardBase, cardMotion, cardActive, cardFocusRing)}
    target="_blank"
    rel="noreferrer"
  >
    <div className="flex items-center gap-[0.7rem]">
      <div className={cn(iconClass, svgStroke)} aria-hidden="true">
        {icon}
      </div>
    </div>
    <div>
      <h2 className="m-0 text-[1.02rem] font-semibold text-[#143422]">{heading}</h2>
      {/* `!` beats the unlayered global `p` margin rule in styles.css */}
      <p className="m-0! text-[0.875rem] leading-[1.55] text-[#64748b]">{desc}</p>
    </div>
    <span className={cn(arrowClass, svgStroke)} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M7 17 17 7" />
        <path d="M9 7h8v8" />
      </svg>
    </span>
  </a>
)
