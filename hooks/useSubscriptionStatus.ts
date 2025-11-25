import { useState, useEffect } from "react";
import type { SubscriptionStatus } from "@/types";

interface UseSubscriptionStatusOptions {
    enabled?: boolean;
    refetchInterval?: number;
}

interface UseSubscriptionStatusReturn {
    subscriptionStatus: SubscriptionStatus | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage subscription status
 * 
 * @param options - Configuration options
 * @param options.enabled - Whether to fetch subscription status (default: true)
 * @param options.refetchInterval - Interval in ms to refetch status (optional)
 * @returns Subscription status, loading state, error, and refetch function
 */
export function useSubscriptionStatus(
    options: UseSubscriptionStatusOptions = {}
): UseSubscriptionStatusReturn {
    const { enabled = true, refetchInterval } = options;

    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchSubscriptionStatus = async () => {
        if (!enabled) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/subscription/status");

            if (!response.ok) {
                throw new Error(`Failed to fetch subscription status: ${response.statusText}`);
            }

            const data = await response.json();
            setSubscriptionStatus({
                charge_provider: data.charge_provider,
                subscription_plan: data.subscription_plan,
                subscription_type: data.subscription_type,
                start_date: data.start_date,
                expiry_date: data.expiry_date,
                is_active: data.is_active,
                is_canceled: data.is_canceled,
                exists: data.exists,
                is_low_credits: data.is_low_credits,
                credit_balance: data.credit_balance,
                credit_limit: data.credit_limit,
                credit_usage: data.credit_usage,
            });
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Unknown error occurred");
            setError(error);
            console.error("Error fetching subscription status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionStatus();

        // Set up refetch interval if specified
        if (refetchInterval && refetchInterval > 0) {
            const intervalId = setInterval(fetchSubscriptionStatus, refetchInterval);
            return () => clearInterval(intervalId);
        }
    }, [enabled, refetchInterval]);

    return {
        subscriptionStatus,
        isLoading,
        error,
        refetch: fetchSubscriptionStatus,
    };
}
