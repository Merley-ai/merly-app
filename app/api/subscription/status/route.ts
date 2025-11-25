import { NextResponse } from "next/server";
import { getUser, getAccessToken } from "@/lib/auth0/server";
import { apiFetchService, Stripe as StripeEndpoints } from "@/lib/api";
import type { SubscriptionStatusResponse } from "@/types";

interface SubscriptionPlanResponse {
    message?: string;
    data?: SubscriptionStatusResponse;
}

export async function GET() {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const accessToken = await getAccessToken();

        const response = await apiFetchService<SubscriptionPlanResponse>(
            StripeEndpoints.subscriptionPlan(user.sub),
            {
                headers: {
                    "Content-Type": "application/json",
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
            }
        );

        const status = response.data ?? {
            isExpired: false,
            isActive: false,
            isLowCredits: false,
        };

        return NextResponse.json(status);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to fetch subscription status:", message);
        return NextResponse.json(
            {
                error: "Failed to fetch subscription status",
                details: message,
            },
            { status: 500 }
        );
    }
}
