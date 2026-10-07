'use client'

import React, { useEffect, useState } from 'react'
import { useAuth, useModal } from '@payloadcms/ui'
import { UserSettingsModal, modalSlug } from './modal'
import { getUserSettingsAction } from './actions'
import { User } from '@/payload-types'

export const UserSettingsLink = () => {
  const { user } = useAuth<User>()
  const { toggleModal, isModalOpen } = useModal()
  const isOpen = isModalOpen(modalSlug)
  const [settings, setSettings] = useState<{
    signature_group?: { type?: 'draw' | 'upload'; signature_base64?: string | null } | null
    initials_group?: { type?: 'draw' | 'upload'; signature_base64?: string | null } | null
  } | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      const fetchSettings = async () => {
        try {
          const result = await getUserSettingsAction(user.id)
          if (result.success && result.data) {
            setSettings(result.data as any)
          }
        } catch (error) {
          console.error('Error fetching user settings:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchSettings()
    }
  }, [user?.id, isOpen]) // Re-fetch on modal open to stay synced

  if (!user || loading) return null

  return (
    <>
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--theme-elevation-150)',
          marginTop: '10px',
        }}
      >
        <button
          type="button"
          onClick={() => toggleModal(modalSlug)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--theme-elevation-600)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: '500',
            transition: 'all 0.2s',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            width: '100%',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = 'var(--theme-primary-500)'
            e.currentTarget.style.textDecoration = 'underline'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--theme-elevation-600)'
            e.currentTarget.style.textDecoration = 'none'
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Update My Settings & Signature
        </button>
      </div>

      <UserSettingsModal
        user={{ id: user.id, email: user.email }}
        initialData={settings || undefined}
      />
    </>
  )
}
