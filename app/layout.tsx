import type { Metadata, Viewport } from 'next';
import { Chakra_Petch, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter_Tight({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Samir Hasan — Founder & CEO, Luminar Technology',
  description:
    'Samir Hasan is the founder and CEO of Luminar Technology — a family of ventures building the intelligent infrastructure for the next generation of software.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#00030B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
