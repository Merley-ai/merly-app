/**
 * Application Layout
 * 
 * This layout wraps all application pages (dashboard, settings, etc.)
 * It inherits from the root layout and can be extended with app-specific:
 * - Authentication checks
 * - App-specific providers
 * - App-specific global components
 */
export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

