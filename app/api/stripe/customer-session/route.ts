import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth0/server';
import Stripe from 'stripe';

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

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

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

        // 2. Get or create Stripe customer ID from backend API
        // This calls your backend API which manages the Auth0 → Stripe customer mapping
        const stripeCustomerId = await getOrCreateStripeCustomer(user);

        if (!stripeCustomerId) {
            return NextResponse.json(
                { error: 'Failed to get Stripe customer from backend API' },
                { status: 500 }
            );
        }

        // 3. Create a Customer Session with Stripe
        const customerSession = await stripe.customerSessions.create({
            customer: stripeCustomerId,
            components: {
                pricing_table: {
                    enabled: true,
                },
            },
        });

        // 4. Return the client secret
        return NextResponse.json({
            clientSecret: customerSession.client_secret,
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
 * Get or create a Stripe customer for the Auth0 user
 * 
 * This function calls your backend API which:
 * 1. Checks if the user already has a Stripe customer ID in your database
 * 2. If yes, returns it
 * 3. If no, creates a new Stripe customer and stores the ID in your database
 * 
 * @param user - Auth0 user object
 * @returns Stripe customer ID or null
 */
async function getOrCreateStripeCustomer(user: any): Promise<string | null> {
    const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Backend API is required
    if (!backendApiUrl) {
        console.error('BACKEND_API_URL environment variable is not configured');
        throw new Error('Backend API URL is not configured. Please set BACKEND_API_URL environment variable.');
    }

    try {
        const response = await fetch(`${backendApiUrl}/api/stripe/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any authentication headers your backend requires
                // Example: 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: user.sub,
                email: user.email,
                name: user.name,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend API error:', response.status, errorText);
            throw new Error(`Backend API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (!data.stripeCustomerId) {
            throw new Error('Backend API did not return stripeCustomerId');
        }

        console.log('Successfully retrieved Stripe customer ID from backend:', data.stripeCustomerId);
        return data.stripeCustomerId;
    } catch (error) {
        console.error('Error calling backend API to get/create Stripe customer:', error);
        throw error;
    }
}
