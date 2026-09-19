import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Nepal Market - Marketplace Jual Beli Komunitas Lokal',
  description: 'Marketplace C2C lokal untuk jual beli barang antar anggota komunitas dengan mudah dan aman.',
  openGraph: {
    title: 'Nepal Market - Marketplace Jual Beli Komunitas Lokal',
    description: 'Marketplace C2C lokal untuk jual beli barang antar anggota komunitas dengan mudah dan aman.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nepal Market - Marketplace Jual Beli Komunitas Lokal',
    description: 'Marketplace C2C lokal untuk jual beli barang antar anggota komunitas dengan mudah dan aman.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased selection:bg-blue-100 selection:text-blue-900" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
