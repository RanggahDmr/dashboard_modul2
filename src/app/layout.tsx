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
  title: 'AO Performance Pro - Dashboard Analitik & Simulasi Insentif',
  description: 'Sistem monitoring, pemeringkatan, dan simulasi insentif Account Officer secara real-time berdasarkan bobot 4 KPI utama (SI/CLBK, Service Level, Flowrate, Full Payment).',
  keywords: ['AO Performance', 'KPI Dashboard', 'Next.js', 'Simulasi Insentif', 'Laragon MySQL'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${outfit.variable} dark`}>
      <body className="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white min-h-screen flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
