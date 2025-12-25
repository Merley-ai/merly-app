'use client'

import { useUser } from '@/lib/auth0/client'
import { LogOut, User } from 'lucide-react'
import Image from 'next/image'
import { shutdown } from '@intercom/messenger-js-sdk'

interface UserMenuProps {
  isCollapsed?: boolean
}

export function UserMenu({ isCollapsed = false }: UserMenuProps) {
  const { user, isLoading, error } = useUser()

  if (isLoading) {
    return (
      <div className={`animate-pulse flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className={`bg-white/10 rounded-full ${isCollapsed ? 'size-[37px]' : 'h-8 w-8'}`} />
        {!isCollapsed && <div className="h-4 w-24 bg-white/10 rounded" />}
      </div>
    )
  }

  if (error) {
    return null
  }

  if (!user) {
    return null
  }

  // Collapsed view - Avatar only (matching album style)
  if (isCollapsed) {
    return (
      <div className="size-[37px] rounded-4xl overflow-hidden flex-shrink-0 relative bg-[#2e2e2e] flex items-center justify-center">
        {user.picture ? (
          <Image
            src={user.picture}
            alt={user.name || user.nickname || 'User'}
            fill
            className="object-cover"
            sizes="37px"
            quality={75}
          />
        ) : (
          <User className="size-[20px] text-white/60" />
        )}
      </div>
    )
  }

  // Expanded view - Full profile info
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="size-[37px] rounded-4xl overflow-hidden flex-shrink-0 relative bg-[#2e2e2e] flex items-center justify-center">
          {user.picture ? (
            <Image
              src={user.picture}
              alt={user.name || user.nickname || 'User'}
              fill
              className="object-cover"
              sizes="37px"
              quality={75}
            />
          ) : (
            <User className="size-[20px] text-white/60" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-['Roboto:Regular',_sans-serif] text-white text-[14px] truncate"
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
            {user.name || user.nickname || 'User'}
          </p>
          <p
            className="font-['Roboto:Regular',_sans-serif] text-neutral-300 text-[12px] truncate"
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
            {user.email}
          </p>
        </div>
      </div>
      <button
        onClick={() => {
          shutdown()
          window.location.href = '/auth/logout'
        }}
        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  )
}

