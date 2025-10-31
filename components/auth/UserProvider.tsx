'use client'

import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { ReactNode } from 'react'

/**
 * Auth0 User Provider
 * 
 * Wrap your app with this provider to enable client-side auth state.
 * This is required for the useUser() hook to work.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  return <Auth0Provider>{children}</Auth0Provider>
}