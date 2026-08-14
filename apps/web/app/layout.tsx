import type { Metadata } from 'next';
import { DM_Sans, IBM_Plex_Mono, Inter } from 'next/font/google';
import './globals.css';

/**
 * Three faces, three jobs (docs/DESIGN.md §3).
 *
 * Plex Mono is not interchangeable with the others: it carries every figure in
 * the product, and it is here for `tabular-nums`. See `.numeric` in
 * globals.css.
 */
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-heading' });
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Softmato',
  description: 'Softmato Technology Pvt Ltd',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full antialiased ${inter.variable} ${dmSans.variable} ${plexMono.variable}`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
