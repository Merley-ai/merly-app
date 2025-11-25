import type { SubscriptionStatus } from "@/types";

export type SubscriptionWarningType = "select_package" | "cancelled" | "lowCredits";

export function getSubscriptionWarningType(
    subscriptionStatus: SubscriptionStatus | null
): SubscriptionWarningType | null {
    if (!subscriptionStatus) {
        return null;
    }

    if (subscriptionStatus.is_active === false || subscriptionStatus.exists === false) {
        return "select_package";
    }

    if (subscriptionStatus.is_canceled) {
        return "cancelled";
    }

    if (subscriptionStatus.is_low_credits) {
        return "lowCredits";
    }

    return null;
}

export function shouldDisableSending(subscriptionStatus: SubscriptionStatus | null): boolean {
    return getSubscriptionWarningType(subscriptionStatus) !== null;
}
