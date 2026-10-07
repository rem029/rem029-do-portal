'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/(frontend)/forms/login/actions'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'

interface UserHeaderProps {
  user: {
    email: string
    full_name?: string | null
  }
  theme?: string
}

export const UserHeader: React.FC<UserHeaderProps> = ({ user, theme }) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLogout = async () => {
    startTransition(async () => {
      await logoutAction()
      router.refresh()
    })
  }

  return (
    <div
      data-theme={theme}
      id="form-user-header"
      className="w-full h-fit flex justify-center items-center py-1 box-content"
    >
      {/* <div className="w-full max-w-lg flex flex-row items-end py-2 px-4 box-content bg-base-100 shadow-sm rounded-[var(--radius-box)]">
        <div className="flex-1 flex flex-col justify-between items-start gap-1">
          <p className={cn('!my-0', 'text-sm font-semibold text-primary', noah.className)}>
            {user.full_name || user.email.split('@')[0]}
          </p>
          <p className="!my-0 text-xs text-base-content lowercase tracking-wider">{user.email}</p>
        </div>
        <div className="flex-1 flex flex-col justify-between items-end gap-1">
          <button
            onClick={handleLogout}
            disabled={isPending}
            className={cn(
              'btn btn-active btn-primary btn-link',
              isPending && 'btn-disabled cursor-not-allowed',
            )}
          >
            Logout
          </button>
        </div>
      </div> */}

      <div className="w-full max-w-2xl navbar ">
        <div className="flex-1">
          <p
            className={cn('my-0!', 'text-sm font-semibold text-primary uppercase', noah.className)}
          >
            {user.full_name || user.email.split('@')[0]}
          </p>
          <p className="my-0! text-xs text-base-content lowercase tracking-wider">{user.email}</p>
        </div>
        <div className="flex-none">
          <button
            onClick={handleLogout}
            disabled={isPending}
            className={cn(
              'btn btn-active btn-primary btn-link',
              isPending && 'btn-disabled cursor-not-allowed',
            )}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
