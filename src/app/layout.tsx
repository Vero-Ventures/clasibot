import './globals.css';

import type { Metadata } from 'next';

import { Analytics } from '@vercel/analytics/react';

import { Toaster } from '@/components/ui/toasts/toaster';

import { Footer, Navbar } from '@/components/site-elements/index';

import { siteConfig } from '@/site-config/site';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

// The root layout component that wraps the entire application using React.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Navbar -> Main Content -> Footer.
  // Also defines two  unseen elements: the toaster and vercel analytics handlers.
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
