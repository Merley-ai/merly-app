import Link from 'next/link';
import { DEFAULT_PATHS } from '@/lib/constants/routes';
import { LoginButton } from '@/components/auth/LoginButton';

export function Navigation() {
  return (
    <nav className="flex items-center justify-between px-4 md:px-8 lg:px-[141px] py-6">
      <div className="flex items-center gap-8 md:gap-16">
        <Link
          href="/"
          className="font-['Roboto_Serif'] text-white text-[20px] hover:opacity-80 transition-opacity cursor-pointer"
          style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}
        >
          Merley
        </Link>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <p className="font-['Roboto:Medium',_sans-serif] text-white text-[14px] hidden sm:block" style={{ fontVariationSettings: "'wdth' 100" }}>
          Pricing
        </p>
        <LoginButton
          returnTo={DEFAULT_PATHS.AFTER_LOGIN}
          className="font-['Roboto:Medium',_sans-serif] text-white text-[14px] hidden sm:block hover:opacity-80 transition-opacity cursor-pointer bg-transparent p-0"
        >
          Login
        </LoginButton>
        <LoginButton returnTo={DEFAULT_PATHS.AFTER_LOGIN}>
          Start Creating
        </LoginButton>
      </div>
    </nav>
  );
}

