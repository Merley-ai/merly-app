import type { Metadata } from "next";
import { UserProvider } from "@/components/auth";
import { NewRelicScript } from "@/components/new-relic/NewRelicScript";
import { Toast } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Merley - Create AI Fashion Editorials",
  description: "Create stunning fashion editorials with AI-powered technology. Bring your creative vision to life.",
  openGraph: {
    title: "Merley - Create AI Fashion Editorials",
    description: "Create stunning fashion editorials with AI-powered technology. Bring your creative vision to life.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Merley - Create AI Fashion Editorials",
    description: "Create stunning fashion editorials with AI-powered technology. Bring your creative vision to life.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Serif:ital,opsz,wght@0,8..144,100..900;1,8..144,100..900&family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
        {/* Stripe Pricing Table Script */}
        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
      </head>
      <body className="antialiased">
        {/* New Relic Browser Agent - RUM for client-side monitoring */}
        <NewRelicScript />
        <UserProvider>
          {children}
        </UserProvider>
        {/* Toast notifications container */}
        <Toast />
      </body>
    </html>
  );
}
