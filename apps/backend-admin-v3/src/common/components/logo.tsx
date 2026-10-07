'use client'

import React from 'react'
import { BASE_PATH } from '@/utilities/constant'

interface DiamondMarkProps {
  size?: { width: string; height: string }
}

const DiamondMark = ({ size }: DiamondMarkProps) => {
  return (
    <svg
      width={size ? size.width : '88'}
      height={size ? size.height : '88'}
      viewBox="0 0 372 372"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M270.164 104.754C221.214 182.875 191.939 265.628 186.387 347.345L186.06 347.672L185.733 347.344C180.18 265.627 150.905 182.875 101.94 104.754L186.06 20.6335L270.164 104.754Z"
        stroke="#C8B46E"
        strokeWidth="5.62181"
      />
      <path
        d="M349.572 184.163L192.485 341.25C199.004 263.087 227.405 183.913 274.243 108.835L349.572 184.163Z"
        stroke="#C8B46E"
        strokeWidth="5.62181"
      />
      <path
        d="M97.8618 108.835C144.715 183.913 173.116 263.086 179.635 341.249L22.5327 184.163L97.8618 108.835Z"
        stroke="#C8B46E"
        strokeWidth="5.62181"
      />
    </svg>
  )
}

// Used for Payload's `admin.components.graphics.Icon` slot (the compact mark
// shown in the mobile/collapsed nav header) — the diamond alone, no wordmark.
export const LogoSM = () => {
  return <DiamondMark size={{ width: '22', height: '22' }} />
}

// Used for Payload's `admin.components.graphics.Logo` slot (the login screen
// only) — the wordmark alone, no diamond mark, per request. Swaps gold/white
// by `[data-theme]` since the login page's own background actually changes
// between light and dark (unlike the sidebar, which stays dark in both).
export const Logo = () => {
  return (
    <div className="admin-login-wordmark">
      <img
        src={`${BASE_PATH}/branding/do-text-gold.svg`}
        alt="Doha Oasis"
        className="admin-login-wordmark__gold"
      />
      <img
        src={`${BASE_PATH}/branding/do-text-white.svg`}
        alt="Doha Oasis"
        className="admin-login-wordmark__white"
      />
    </div>
  )
}
