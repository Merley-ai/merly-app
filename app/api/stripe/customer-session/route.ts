import { NextResponse } from 'next/server';
import { getUser, getAccessToken } from '@/lib/auth0/server';
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
export async function POST() {
    try {
        // 1. Authenticate user with Auth0
        const user = await getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // 2. Create a Customer Session
        const clientSecret = await getOrCreateStripeCustomer(user);

        if (!clientSecret) {
            return NextResponse.json(
                { error: 'Failed to create customer session' },
                { status: 500 }
            );
        }

        console.log('💸.Customer session created:', clientSecret);

        // 4. Return the client secret
        return NextResponse.json({
            clientSecret: clientSecret,
        });
    } catch (error) {
        console.error('Error creating customer session:', error);

        // Provide specific error message if backend API is not configured
        if (error instanceof Error && error.message.includes('Backend API URL is not configured')) {
            return NextResponse.json(
                {
                    error: 'Backend API not configured',
                    details: 'BACKEND_API_URL environment variable must be set'
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                error: 'Failed to create customer session',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

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
        console.log('Creating Stripe customer session for user:', user.sub);

        // Get Auth0 access token for backend authentication
        const accessToken = await getAccessToken();
        const payload = {
            user_id: user.sub,
            email: user.email,
            name: user.name,
        };
        console.log('Backend API payload:', payload);

        // Use apiFetchService for consistency with other routes
        const response = await apiFetchService<StripeCustomerSessionResponse>(
            StripeEndpoints.customerSession(),
            {
                method: 'POST',
                headers: {
                    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
                },
                body: JSON.stringify(payload),
            }
        );

        console.log('Successfully retrieved Stripe customer session from backend');

        if (!response.data?.client_secret) {
            throw new Error('Backend API did not return client_secret');
        }

        return response.data.client_secret;
    } catch (error) {
        console.error('Error calling backend API to get/create Stripe customer:', error);
        throw error;
    }
}
