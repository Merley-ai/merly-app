"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Navigation state interface for cross-page data handoff
 * Extensible for future navigation state needs
 */
export interface NavigationState {
    styleId?: string;
}

/**
 * Custom key for storing navigation state in history.state
 * Namespaced to avoid conflicts with Next.js internal state
 */
const NAVIGATION_STATE_KEY = "__merley_nav_state__";

/**
 * Hook to read navigation state from History API
 * State is consumed on first read (one-time pattern)
 * 
 * @returns Navigation state object or null if no state exists
 */
export function useNavigationState<T extends NavigationState = NavigationState>(): T | null {
    const [state, setState] = useState<T | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const historyState = window.history.state;
        const navState = historyState?.[NAVIGATION_STATE_KEY] as T | undefined;

        if (navState) {
            setState(navState);
            // Clear state after reading (one-time consumption)
            const newState = { ...historyState };
            delete newState[NAVIGATION_STATE_KEY];
            window.history.replaceState(newState, "");
        }
    }, []);

    return state;
}

/**
 * Hook providing navigation helper with state support
 * Wraps Next.js router with History API state management
 */
export function useNavigateWithState() {
    const router = useRouter();

    const navigateWithState = useCallback(
        <T extends NavigationState>(url: string, state?: T) => {
            if (state && typeof window !== "undefined") {
                // Store state in a temporary location before navigation
                sessionStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
            }
            router.push(url);
        },
        [router]
    );

    return { navigateWithState };
}

/**
 * Hook to consume navigation state stored before navigation
 * Uses sessionStorage as intermediate storage since history.state
 * is not available until after navigation completes
 */
export function useConsumeNavigationState<T extends NavigationState = NavigationState>(): T | null {
    const [state, setState] = useState<T | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const storedState = sessionStorage.getItem(NAVIGATION_STATE_KEY);
        if (storedState) {
            try {
                const parsedState = JSON.parse(storedState) as T;
                setState(parsedState);
                // Clear after consumption
                sessionStorage.removeItem(NAVIGATION_STATE_KEY);
            } catch {
                sessionStorage.removeItem(NAVIGATION_STATE_KEY);
            }
        }
    }, []);

    return state;
}
