import type { Metadata, Viewport } from 'next';
import {
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import CursorGlow from '@/components/CursorGlow';
import Navigation from '@/components/Navigation';
import ClientShell from '@/components/ClientShell';

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Samir Hasan — Founder, Luminar Technology',
  description:
    'Samir Hasan is the founder and CEO of Luminar Technology — a family of ventures building the intelligent infrastructure for the next generation of software.',
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#070709',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body>
        <SmoothScroll>
          <ClientShell />
          <CursorGlow />
          <Navigation />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
