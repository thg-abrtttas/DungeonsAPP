import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SWRegistration } from '@/components/SWRegistration';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dungeons App — Shared Stories',
  description: 'A D&D companion for creating characters and running sessions together',
  themeColor: '#d4a843',
};

export const viewport: Viewport = {
  themeColor: '#d4a843',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dungeons App" />
        <meta name="theme-color" content="#d4a843" media="(prefers-color-scheme: light)" />
      </head>
      <body className="min-h-screen bg-parchment-50 font-narrative">
        <SWRegistration />
        {children}
      </body>
    </html>
  );
}