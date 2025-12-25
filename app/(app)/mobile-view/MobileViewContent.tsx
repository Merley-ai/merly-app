'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface MobileViewContentProps {
    email: string | null
    headerImageUrl?: string;
}

// TODO: Remove this component when mobile view is fully implemented
export function MobileViewContent({ email }: MobileViewContentProps) {
    const headerImageUrl = "https://qylfthczyqbnkxjvnzli.supabase.co/storage/v1/object/public/MerleyStorageBucket/PublicAssets/creative-1.png";
    const router = useRouter();

    const handleBackToHome = () => {
        router.push('/');
    };

    const handleSwitchAccount = () => {
        window.location.href = '/auth/logout';
    };

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Header Image */}
            <div className="h-[42vh] w-full relative overflow-hidden">
                {headerImageUrl ? (
                    <Image
                        src={headerImageUrl}
                        alt="Merley"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-neutral-800 to-black" />
                )}
                {/* Soft edge gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-top text-center">

                {/* Title */}
                <h1 className="font-['Roboto_Serif'] text-white text-xl font-normal mb-8 pt-17">
                    <span className="font-['Roboto_Serif'] text-[32px] md:text-[48px]">Merley </span>
                    <span className="font-['Roboto_Serif'] text-[14px] md:text-[20px]">
                        is only available on desktop
                    </span>
                    <p className="font-['Roboto_Serif'] text-[14px] md:text-[20px]">
                        Switch to desktop to continue
                    </p>
                </h1>

                {/* CTA Button */}
                <button
                    onClick={handleBackToHome}
                    className="px-6 py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors"
                >
                    Back to home
                </button>

                {/* User Info Section */}
                {email && (
                    <div className="w-full max-w-xs border-t border-neutral-800 mt-12 pt-12">
                        <p className="text-neutral-400 text-sm">
                            You are signed in as{' '}
                            <span className="text-white font-medium">{email}</span>.
                        </p>
                        <button
                            onClick={handleSwitchAccount}
                            className="text-neutral-400 text-sm hover:text-white transition-colors mt-1"
                        >
                            Try to log in with a different email.
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
