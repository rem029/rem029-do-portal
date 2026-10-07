'use client'

import React from 'react'
import { useAuth } from '@payloadcms/ui'
import type { User } from '@/payload-types'

export const SidebarProfileCard = () => {
  const { user } = useAuth<User>()

  if (!user) return null

  const name = user.full_name || user.email
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="admin-sidebar-profile">
      <div className="admin-sidebar-profile__avatar">{initial}</div>
      <div className="admin-sidebar-profile__meta">
        <div className="admin-sidebar-profile__name">{name}</div>
        {user.designation && (
          <div className="admin-sidebar-profile__role">{user.designation}</div>
        )}
      </div>
    </div>
  )
}
