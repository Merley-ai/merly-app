import { NextRequest, NextResponse } from 'next/server';
import { getUser, getAccessToken, withAuth } from '@/lib/auth0';
import { apiFetchService, Stripe as StripeEndpoints } from '@/lib/api';

interface Auth0User {
    sub: string;
    email?: string;
    name?: string;
    [key: string]: unknown;
}

/**
 * API Route: /api/stripe/customer-session
 * 
 * Creates a Stripe Customer Session for authenticated users.
 * This allows the pricing table to link checkouts to existing Stripe customers,
 * preventing duplicate customer records.
 * 
 * Flow:
 * 1. Authenticate user with Auth0
 * 2. Look up or create Stripe customer (via your backend API)
 * 3. Create a Customer Session with Stripe
 * 4. Return the client_secret to the frontend
 * 
 * Note: Customer sessions expire after 30 minutes
 */

/**
 * POST /api/stripe/customer-session
 * 
 * Creates a customer session for the authenticated user
 * 
 * @returns {object} { clientSecret: string } or error
 */
export const POST = withAuth(async (_request: NextRequest) => {
    const user = await getUser();

    if (!user?.sub) {
        throw new Error('User ID not found');
    }

    // Create a Customer Session
    const clientSecret = await getOrCreateStripeCustomer(user);

    if (!clientSecret) {
        throw new Error('Failed to create customer session');
    }

    // Return the client secret
    return NextResponse.json({
        clientSecret: clientSecret,
    });
});

/**
 * Stripe customer session response type
 */
interface StripeCustomerSessionResponse {
    message?: string;
    data: {
        client_secret: string;
    };
}

/**
 * Get or create a Stripe customer for the Auth0 user
 * 
 * This function calls your backend API which:
 * 1. Checks if the user already has a Stripe customer ID in your database
 * 2. If yes, returns it
 * 3. If no, creates a new Stripe customer and stores the ID in your database
 * 
 * @param user - Auth0 user object
 * @returns Stripe customer client secret or null
 */
async function getOrCreateStripeCustomer(user: Auth0User): Promise<string | null> {
    try {
        const accessToken = await getAccessToken();
        const payload = {
            user_id: user.sub,
            email: user.email,
            name: user.name,
        };

        const response = await apiFetchService<StripeCustomerSessionResponse>(
            StripeEndpoints.customerSession(),
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.data?.client_secret) {
            throw new Error('Backend API did not return client_secret');
        }

        return response.data.client_secret;
    } catch (error) {
        console.error('Error calling backend API to get/create Stripe customer:', error);
        throw error;
    }
}
