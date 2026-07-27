import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ 
  subsets: ['latin'], 
  variable: '--font-outfit',
  display: 'swap',
  fallback: ['system-ui', 'arial', 'sans-serif']
});

export const metadata: Metadata = {
  title: 'AO Account Assignment Performance Score Dashboard',
  description: 'AO Account Assignment Performance Score Dashboard - PNM Mekaar',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${outfit.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
