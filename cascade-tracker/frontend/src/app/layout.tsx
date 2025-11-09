import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import { AchievementProvider } from '@/providers/AchievementProvider';
import { PolymarketTradingChat } from '@/components/PolymarketTradingChat';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ripple Logic',
  description: 'Ripple Logic — Learn the logic that moves the market.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white min-h-screen relative`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-slate-900/80 text-white px-3 py-1.5 rounded">
          Skip to content
        </a>
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900" />
          <div className="absolute inset-0 bg-radial-faded" />
          <div className="absolute inset-0 bg-radial-cyan" />
          <div className="absolute inset-0 bg-grid-slate bg-grid-16 opacity-[0.02]" />
        </div>
        <div className="noise-overlay" />
        <AchievementProvider>
          <Navigation />
          <main id="main" className="px-4 sm:px-6 md:px-8 lg:px-10 py-6">
            {children}
          </main>
          {/* Global Polymarket Trading Chat */}
          <PolymarketTradingChat />
        </AchievementProvider>
      </body>
    </html>
  );
}
