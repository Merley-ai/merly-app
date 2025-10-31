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

"https://genai-7448928694171064.us.auth0.com/authorize?scope=openid+profile+email+offline_access&client_id=fw0x01gvo4f37OtvMxQjMrfvzHoFRXP2&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&response_type=code&code_challenge=vB26MvP_q85vbqJLUyIWMfrqz2AmVasS66z2eDs5t38&code_challenge_method=S256&state=9OoB59eIR_4rtZhoqWuuShPJiwF3cOjX8ZDWLfB3Uk4&nonce=z602w7BKb9UHYcOqqKGAzuQcgkGwwoengQlYt57tfHE"