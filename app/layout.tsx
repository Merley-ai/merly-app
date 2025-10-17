import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Serif:ital,wght@0,400;0,500;1,400;1,500&family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
