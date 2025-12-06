import { NextRequest, NextResponse } from "next/server";
import { getUser, getAccessToken, withAuth } from "@/lib/auth0";
import { apiFetchService, Stripe as StripeEndpoints } from "@/lib/api";
import type { SubscriptionStatusResponse } from "@/types";

interface SubscriptionPlanResponse {
    message?: string;
    data?: SubscriptionStatusResponse;
}

export const GET = withAuth(async (_request: NextRequest) => {
    const user = await getUser();
    const accessToken = await getAccessToken();

    if (!user?.sub) {
        throw new Error('User ID not found');
    }

    const response = await apiFetchService<SubscriptionPlanResponse>(
        StripeEndpoints.subscriptionPlan(user.sub),
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    const status = response.data ?? {
        isExpired: false,
        isActive: false,
        isLowCredits: false,
    };

    return NextResponse.json(status);
})
