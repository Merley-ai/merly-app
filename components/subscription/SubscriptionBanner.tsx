"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { SubscriptionStatus } from "@/types";
import { getSubscriptionWarningType } from "./subscriptionUtils";

interface SubscriptionBannerProps {
    subscriptionStatus: SubscriptionStatus | null;
    onDismiss?: () => void;
    lowCreditsDismissOnly?: boolean;
}

/**
 * SubscriptionBanner Component
 * 
 * Displays a warning banner above the input area when user's subscription is inactive.
 * Shows different messages based on subscription status (expired, cancelled, or inactive).
 */
export function SubscriptionBanner({
    subscriptionStatus,
    onDismiss,
    lowCreditsDismissOnly = true,
}: SubscriptionBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed || !subscriptionStatus) {
        return null;
    }

    const handleDismiss = () => {
        setIsDismissed(true);
        onDismiss?.();
    };

    // Determine message based on subscription status
    const messages = {
        select_package: "You don’t have an active subscription. Activate your account to continue using Merley.",
        cancelled: "Your subscription has ended. Reactivate your account to keep using Merley.",
        lowCredits: "You’re running low on credits. Add more credits to continue enjoying Merley.",
    }

    const warningType = getSubscriptionWarningType(subscriptionStatus);
    const message = warningType ? messages[warningType] : null;

    if (!message) {
        return null;
    }

    const canDismiss = !lowCreditsDismissOnly || warningType === "lowCredits";

    return (
        <div className="px-4 pb-2">
            <div className="bg-gradient-to-r from-[#D97706] to-[#B45309] rounded-lg px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
                {/* Warning Icon & Message */}
                <div className="flex items-center gap-3 flex-1">
                    {/* Warning Triangle Icon
                    <div className="flex-shrink-0">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-white"
                        >
                            <path
                                d="M12 2L2 20h20L12 2z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                            <path
                                d="M12 9v4M12 17h.01"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div> */}

                    {/* Message Text */}
                    <p
                        className="font-['Roboto:Regular',_sans-serif] text-white text-[14px] leading-[1.4]"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                    >
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Purchase Link */}
                    <Link
                        href="/accounts"
                        className="font-['Roboto:Medium',_sans-serif] text-white text-[14px] underline hover:no-underline transition-all"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                    >
                        Activate
                    </Link>

                    {/* Dismiss Button */}
                    {canDismiss && (
                        <button
                            onClick={handleDismiss}
                            className="text-white hover:bg-white/10 rounded p-1 transition-colors"
                            aria-label="Dismiss banner"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
