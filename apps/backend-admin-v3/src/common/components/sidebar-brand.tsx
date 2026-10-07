import React from 'react'
import { BASE_PATH } from '@/utilities/constant'

export const SidebarBrand = () => {
  return (
    <div className="admin-sidebar-brand">
      <img
        src={`${BASE_PATH}/branding/do-text-white.svg`}
        alt="Doha Oasis"
        className="admin-sidebar-brand__wordmark"
      />
    </div>
  )
}
