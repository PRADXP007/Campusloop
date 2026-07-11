import type { Metadata } from 'next';
import { Inter, Epilogue } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import ScrollManager from '@/components/ui/ScrollManager';


const inter = Inter({ subsets: ['latin'], variable: '--font-next-inter' });
const epilogue = Epilogue({ subsets: ['latin'], variable: '--font-next-epilogue' });

export const metadata: Metadata = {
  title: 'CampusLoop — Your Campus Marketplace & Social Network',
  description:
    'Buy, sell, and connect with students at your college. CampusLoop is the all-in-one platform for Indian college students.',
  keywords: 'campus marketplace, college students, buy sell, India, student network',
  openGraph: {
    title: 'CampusLoop',
    description: 'Your campus marketplace & social network',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${epilogue.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] antialiased relative">
        <ScrollManager />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              fontSize: '14px',
              boxShadow: '0 10px 30px -10px rgba(45, 31, 31, 0.08)',
              fontFamily: 'var(--font-inter)',
            },
            success: { iconTheme: { primary: 'var(--color-primary)', secondary: 'var(--color-surface)' } },
            error: { iconTheme: { primary: 'var(--color-error)', secondary: 'var(--color-surface)' } },
          }}
        />
      </body>
    </html>
  );
}
