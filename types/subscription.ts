/**
 * Subscription Types
 * 
 * Types related to user subscription status and management
 */

/**
 * Subscription status information
 */
export interface SubscriptionStatus {
    charge_provider: string;
    subscription_plan: string;
    subscription_type: string;
    start_date: Date;
    expiry_date: Date;
    is_active: boolean;
    is_canceled: boolean;
    exists: boolean;
    is_low_credits: boolean;
    credit_balance: number;
    credit_limit: number;
    credit_usage: number;
}

/**
 * API response from subscription status endpoint
 */
export interface SubscriptionStatusResponse {
    charge_provider: string;
    subscription_plan: string;
    subscription_type: string;
    start_date: Date;
    expiry_date: Date;
    is_active: boolean;
    is_canceled: boolean;
    exists: boolean;
    is_low_credits: boolean;
    credit_balance: number;
    credit_limit: number;
    credit_usage: number;
}

/**
 * Subscription plan information (for future use)
 */
export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
}

/**
 * User subscription details (for future use)
 */
export interface UserSubscription {
    id: string;
    userId: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    createdAt: Date;
    updatedAt: Date;
}
