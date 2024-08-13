/**
 * Defines the root layout component for the application.
 */
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { Analytics } from '@vercel/analytics/react';
import Footer from '@/components/footer';
import Navbar from '@/components/nav-bar';
import { Toaster } from '@/components/ui/toaster';
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
      <body className="flex flex-col bg-gray-100 min-h-screen">
        <Navbar />
        <main className="flex flex-col items-center justify-center flex-grow">
          {children}
        </main>
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
