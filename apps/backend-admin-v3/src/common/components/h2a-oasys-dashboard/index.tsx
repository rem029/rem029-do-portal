'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { useAuth } from '@payloadcms/ui'
import { OasysH2AEmployeeData } from '@/services/h2a-oasys/types'
import { Department, User } from '@/payload-types'
import { getH2AEmployeeInfoAction } from './actions'
import { getHomeDashboardBackgroundImageUrlAction } from '@/globals/home-dashboard-settings/actions'
import {
  getHomeDashboardTilesAction,
  HomeDashboardTile,
} from '@/common/components/home-dashboard/actions'
import externalLinkIcon from './assets/external-link-square.svg'
import '@/common/components/embla-carousel/index.css'

const H2aOasysDashboard = () => {
  const [employeeMatches, setEmployeeMatches] = useState<OasysH2AEmployeeData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null)
  const [tiles, setTiles] = useState<HomeDashboardTile[]>([])
  const [showNewDashboard, setShowNewDashboard] = useState<boolean | null>(null)
  const { user, fetchFullUser } = useAuth<User>()
  const [tilesRef] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' })

  // Initial effect: Ensure user is fully loaded
  useEffect(() => {
    fetchFullUser()
  }, [fetchFullUser])

  useEffect(() => {
    getHomeDashboardBackgroundImageUrlAction().then(setBackgroundImageUrl)
  }, [])

  // Access-driven quick-link tiles + the show_new_dashboard toggle (docs/NO_TICKET-home-employee-info/phases/phase-2-tile-resolution.md, phase-4-wire-up.md)
  useEffect(() => {
    getHomeDashboardTilesAction().then(({ showNewDashboard, tiles }) => {
      setShowNewDashboard(showNewDashboard)
      setTiles(tiles)
    })
  }, [])

  // Fetch employee info based on user email
  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      const email = user?.email
      if (!email) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const matches = await getH2AEmployeeInfoAction({ email })

        if (matches && matches.length > 0) {
          setEmployeeMatches(matches)
          setCurrentIndex(0)
        } else {
          // No H2A Oasys match — fall back to the user collection's own fields, not an error.
          setEmployeeMatches([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeInfo()
  }, [user?.email])

  const currentEmployee = employeeMatches[currentIndex] || null

  if (showNewDashboard !== true) return null

  return (
    <div
      className="relative w-full min-h-[288px] rounded-[16px] overflow-hidden bg-[#072c1b]"
      style={{ fontFamily: 'var(--admin-font-sans)' }}
    >
      {backgroundImageUrl && (
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-[rgba(7,44,27,0.5)]" />
        </div>
      )}

      <div className="absolute inset-0 flex flex-col gap-2 p-2 rounded-[16px] backdrop-blur-[4px] bg-white/[0.02]">
        <div className="w-full h-10 flex items-center">
          <p
            className="pl-2 text-white text-2xl truncate"
            style={{ fontFamily: 'var(--admin-font-primary)' }}
          >
            {loading
              ? 'Loading...'
              : `Hello ${currentEmployee?.NAME ? `,${currentEmployee.NAME}` : user?.full_name || ''}`}
          </p>
        </div>

        {error ? (
          <p className="pl-2 text-sm text-white/70">{error}</p>
        ) : (
          <div className="w-full flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1 py-1">
            <span
              className="order-1 px-2 py-0.5 text-[12px] break-words sm:order-none sm:py-1 sm:text-[16px]"
              style={{ color: 'var(--admin-color-secondary)', fontWeight: 300 }}
            >
              {currentEmployee?.['E.N'] || user?.h2a_oasys_emp_id || ''}
            </span>
            <div
              className="hidden w-[2px] h-4 shrink-0 sm:block"
              style={{ background: 'var(--admin-color-secondary)' }}
            />
            <span
              className="order-3 px-2 py-0.5 text-[12px] break-words sm:order-none sm:py-1 sm:text-[16px]"
              style={{ color: 'var(--admin-color-secondary)', fontWeight: 300 }}
            >
              {currentEmployee?.DESIGNATION || user?.designation || ''}
            </span>
            <div
              className="hidden w-[2px] h-4 shrink-0 sm:block"
              style={{ background: 'var(--admin-color-secondary)' }}
            />
            <span
              className="order-2 px-2 py-0.5 text-[12px] break-words sm:order-none sm:py-1 sm:text-[16px]"
              style={{ color: 'var(--admin-color-secondary)', fontWeight: 300 }}
            >
              {currentEmployee?.['Sub Department'] || (user?.department as Department)?.title || ''}
            </span>
          </div>
        )}

        <div className="flex-1 min-h-0" />

        <div
          className="embla w-full"
          style={{ '--slide-size': '33.3333%', '--slide-spacing': '8px' } as React.CSSProperties}
        >
          <div className="embla__viewport" ref={tilesRef}>
            <div className="embla__container">
              {tiles.map((tile) => (
                <div key={tile.slug} className="embla__slide md:max-w-[240px]">
                  <Link
                    href={tile.url}
                    className="h-full flex flex-col justify-between gap-5 px-2 py-4 rounded-[16px] border border-white bg-white/10 hover:bg-white/20 transition-colors no-underline"
                  >
                    <span
                      className="sm:text-[16px] text-[12px] text-white"
                      style={{ fontFamily: 'var(--admin-font-primary)' }}
                    >
                      {tile.label}
                    </span>
                    <div className="w-full flex justify-end">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={externalLinkIcon.src} alt="" width={20} height={20} />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full h-4 shrink-0 flex items-center justify-center gap-2">
          {Array.from({ length: Math.max(employeeMatches.length, 1) }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show employee record ${index + 1}`}
              disabled={employeeMatches.length <= 1}
              onClick={() => setCurrentIndex(index)}
              className={`size-2 rounded-full border border-white backdrop-blur-[8px] ${
                index === currentIndex ? 'bg-white' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default H2aOasysDashboard
