/**
 * Website Layout
 * 
 * This layout wraps all public-facing website pages (landing, pricing, etc.)
 * It inherits from the root layout and can be extended with website-specific:
 * - Analytics tracking
 * - Marketing providers
 * - Website-specific global components
 */
export default function WebsiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

