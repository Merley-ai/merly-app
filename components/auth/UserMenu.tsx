'use client'

import { useUser } from '@/lib/auth0/client'
import { LogOut } from 'lucide-react'

export function UserMenu() {
  const { user, isLoading, error } = useUser()

  if (isLoading) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <div className="h-8 w-8 bg-white/10 rounded-full" />
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
    )
  }

  if (error) {
    console.error('Auth error:', error)
    return null
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-2">
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
      <a
        href="/auth/logout"
        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
      </a>
    </div>
  )
}

