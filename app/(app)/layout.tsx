import { requireAuth } from '@/lib/auth0/server'

/**
 * Application Layout
 * 
 * This layout wraps all application pages (dashboard, settings, etc.)
 * It inherits from the root layout and can be extended with app-specific:
 * - Authentication checks (required for all app routes)
 * - App-specific providers
 * - App-specific global components
 * 
 * All routes under this layout require authentication.
 * Unauthenticated users will be redirected to login.
 */
export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Require authentication for all app routes
    // This will redirect to login if not authenticated
    await requireAuth()

    return <>{children}</>;
}

