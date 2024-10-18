import './globals.css';
import { siteConfig } from '@/site-config/site';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/toasts/toaster';
import Footer from '@/components/site-elements/footer';
import Navbar from '@/components/site-elements/nav-bar';
import type { Metadata } from 'next';

// Define the formatting and contentof the metadata object.
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
  // Navbar -> Main Content -> Footer.
  // Also defines the unseen elements: toaster and vercel analytics handlers.
  return (
    <html lang="en">
      <body
        id="PageLayoutContainer"
        className="flex min-h-screen flex-col bg-gray-100">
        <Navbar />
        <main
          id="PageContent"
          className="flex flex-grow flex-col items-center justify-center">
          {children}
        </main>
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
