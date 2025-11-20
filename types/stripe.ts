/**
 * Stripe Pricing Table Type Definitions
 * 
 * Type definitions for the Stripe pricing table web component
 * and related Stripe types used throughout the application.
 */

import { ReactNode } from 'react';

/**
 * Props for the stripe-pricing-table web component
 */
export interface StripePricingTableProps {
    /**
     * The ID of the pricing table created in the Stripe Dashboard
     */
    'pricing-table-id': string;

    /**
     * Your Stripe publishable API key
     */
    'publishable-key': string;

    /**
     * Optional: Pre-fill the customer's email address in the checkout flow
     */
    'customer-email'?: string;

    /**
     * Optional: Client secret from a Customer Session for authenticated users
     * This links the checkout to an existing Stripe customer
     */
    'customer-session-client-secret'?: string;

    /**
     * Optional: A reference ID to help reconcile the checkout session with your internal system
     * Can be an authenticated user ID or similar string (max 200 characters)
     */
    'client-reference-id'?: string;
}

/**
 * Extend JSX IntrinsicElements to include the stripe-pricing-table web component
 */
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'stripe-pricing-table': StripePricingTableProps & {
                children?: ReactNode;
            };
        }
    }
}

/**
 * Stripe Customer Session response
 */
export interface StripeCustomerSession {
    /**
     * The client secret used to authenticate the customer session
     */
    client_secret: string;

    /**
     * The customer ID this session is for
     */
    customer: string;

    /**
     * When the session expires (Unix timestamp)
     */
    expires_at: number;
}

/**
 * Stripe Checkout Session data from webhook
 */
export interface StripeCheckoutSession {
    id: string;
    object: 'checkout.session';
    customer: string | null;
    customer_email: string | null;
    client_reference_id: string | null;
    subscription: string | null;
    payment_status: 'paid' | 'unpaid' | 'no_payment_required';
    status: 'complete' | 'expired' | 'open';
    mode: 'payment' | 'setup' | 'subscription';
    amount_total: number | null;
    currency: string | null;
    metadata: Record<string, string>;
}

export { };
