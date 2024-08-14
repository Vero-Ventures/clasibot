/**
 * Defines the root layout component for the application.
 */
import type { Metadata } from 'next';
import { siteConfig } from '@/site-config/site';
import { Analytics } from '@vercel/analytics/react';
import Footer from '@/components/site-elements/footer';
import Navbar from '@/components/site-elements/nav-bar';
import { Toaster } from '@/components/ui/toasts/toaster';
import './globals.css';

// Define the metadata for the site.
export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

// The root layout component that wraps the entire application using React children.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-gray-100">
        <Navbar />
        <main className="flex flex-grow flex-col items-center justify-center">
          {children}
        </main>
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
