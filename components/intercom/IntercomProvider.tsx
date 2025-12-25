'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import Intercom, { boot, shutdown, update } from '@intercom/messenger-js-sdk';

const APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

// Routes that should hide the Intercom launcher
// TODO: Add more routes as needed
const HIDDEN_ROUTES = [
    '/onboarding',
    '/checkout',
];

export function IntercomProvider() {
    const pathname = usePathname();
    const { user, isLoading } = useUser();
    const isInitialized = useRef(false);
    const wasLoggedIn = useRef(false);

    // Initialize Intercom SDK once
    useEffect(() => {
        if (!APP_ID || isInitialized.current) return;

        Intercom({ app_id: APP_ID });
        isInitialized.current = true;
    }, []);

    // Handle user auth state changes
    useEffect(() => {
        if (!APP_ID || isLoading || !isInitialized.current) return;

        if (user) {
            // User logged in - shutdown anonymous session first, then boot as user
            if (!wasLoggedIn.current) {
                shutdown();
            }
            boot({
                app_id: APP_ID,
                user_id: user.sub ?? undefined,
                email: user.email ?? undefined,
                name: user.name ?? undefined,
                created_at: user.updated_at
                    ? Math.floor(new Date(user.updated_at as string).getTime() / 1000)
                    : undefined,
            });
            wasLoggedIn.current = true;
        } else {
            // No user - boot as visitor
            if (wasLoggedIn.current) {
                shutdown(); // Clear previous user session
            }
            boot({ app_id: APP_ID });
            wasLoggedIn.current = false;
        }
    }, [user, isLoading]);

    // Update on SPA route changes and handle visibility
    useEffect(() => {
        if (!APP_ID || !isInitialized.current) return;

        const shouldHide = HIDDEN_ROUTES.some(route => pathname.startsWith(route));
        update({ hide_default_launcher: shouldHide });
    }, [pathname]);

    return null;
}
