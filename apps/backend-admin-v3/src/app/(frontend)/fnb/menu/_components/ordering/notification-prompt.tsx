'use client'

import React from 'react'
import { IoClose } from 'react-icons/io5'
import { NotifyPermission } from '@/common/hooks/useBrowserNotifications'
import { useLocalStorage } from '@/common/hooks/use-local-storage'
import { Language, t } from '@/utilities/translations'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'

export interface NotificationPromptProps {
  permission: NotifyPermission
  onEnable: () => void
}

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({
  permission,
  onEnable,
}) => {
  const [dismissed, setDismissed] = useLocalStorage<boolean>(
    'fnb-notify-prompt-dismissed',
    false,
  )
  const { selectedLanguage } = useMenuNav()
  const lang = (selectedLanguage || 'en') as Language

  if (permission !== 'default' || dismissed) {
    return null
  }

  return (
    <div className="rounded-lg bg-menu-background-card text-menu-text shadow-lg border-[0.5px] border-menu-primary/30 p-2.5 flex items-center justify-between gap-2 text-xs">
      <span className="font-semibold truncate">
        {t('Get notified when your order is ready', lang)}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onEnable}
          className="px-2.5 py-1 rounded bg-menu-primary text-menu-primary-contrast font-bold cursor-pointer hover:opacity-90 transition-opacity text-xs"
        >
          {t('Enable', lang)}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-menu-neutral hover:text-menu-text cursor-pointer transition-colors"
          aria-label={t('Dismiss notification prompt', lang)}
        >
          <IoClose className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default NotificationPrompt
