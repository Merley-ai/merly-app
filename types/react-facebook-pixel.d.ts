declare module "react-facebook-pixel" {
    export interface AdvancedMatching {
        em?: string; // Email
        fn?: string; // First name
        ln?: string; // Last name
        ph?: string; // Phone
        ge?: string; // Gender
        db?: string; // Date of birth (YYYYMMDD)
        ct?: string; // City
        st?: string; // State
        zp?: string; // Zip code
        country?: string; // Country
        external_id?: string; // External ID
    }

    export interface Options {
        autoConfig?: boolean;
        debug?: boolean;
    }

    export interface PurchaseData {
        value: number;
        currency: string;
    }

    export interface AddToCartData {
        content_ids?: string[];
        content_name?: string;
        content_type?: string;
        contents?: Array<{ id: string; quantity: number }>;
        currency?: string;
        value?: number;
    }

    export interface InitiateCheckoutData {
        content_category?: string;
        content_ids?: string[];
        contents?: Array<{ id: string; quantity: number }>;
        currency?: string;
        num_items?: number;
        value?: number;
    }

    export interface LeadData {
        content_category?: string;
        content_name?: string;
        currency?: string;
        value?: number;
    }

    export interface CompleteRegistrationData {
        content_name?: string;
        currency?: string;
        status?: string;
        value?: number;
    }

    export interface ViewContentData {
        content_ids?: string[];
        content_name?: string;
        content_type?: string;
        contents?: Array<{ id: string; quantity: number }>;
        currency?: string;
        value?: number;
    }

    export interface SearchData {
        content_category?: string;
        content_ids?: string[];
        contents?: Array<{ id: string; quantity: number }>;
        currency?: string;
        search_string?: string;
        value?: number;
    }

    export type StandardEvent =
        | "AddPaymentInfo"
        | "AddToCart"
        | "AddToWishlist"
        | "CompleteRegistration"
        | "Contact"
        | "CustomizeProduct"
        | "Donate"
        | "FindLocation"
        | "InitiateCheckout"
        | "Lead"
        | "PageView"
        | "Purchase"
        | "Schedule"
        | "Search"
        | "StartTrial"
        | "SubmitApplication"
        | "Subscribe"
        | "ViewContent";

    const ReactPixel: {
        init(
            pixelId: string,
            advancedMatching?: AdvancedMatching,
            options?: Options
        ): void;
        pageView(): void;
        track(
            event: StandardEvent,
            data?: Record<string, unknown>
        ): void;
        trackSingle(
            pixelId: string,
            event: StandardEvent,
            data?: Record<string, unknown>
        ): void;
        trackCustom(
            event: string,
            data?: Record<string, unknown>
        ): void;
        trackSingleCustom(
            pixelId: string,
            event: string,
            data?: Record<string, unknown>
        ): void;
        fbq: (...args: unknown[]) => void;
    };

    export default ReactPixel;
}
