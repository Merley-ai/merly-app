'use client'

interface LoginButtonProps {
  className?: string
  children?: React.ReactNode
  returnTo?: string
}

/**
 * Login Button Component
 * 
 * Use <a> tag for Auth0 login as per v4 requirements
 */
export function LoginButton({ 
  className = "bg-white rounded-[25px] px-6 py-2 font-['Roboto:Medium',_sans-serif] text-black text-[14px] cursor-pointer hover:opacity-90 transition-opacity",
  children = "Sign In",
  returnTo
}: LoginButtonProps) {
  const href = returnTo ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}` : '/auth/login'
  
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

