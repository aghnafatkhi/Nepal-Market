import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'https://nepalmarket.id'),
  title: {
    default: 'Nepal Market - Marketplace Jual Beli Komunitas Lokal',
    template: '%s | Nepal Market',
  },
  description: 'Marketplace C2C lokal untuk jual beli barang antar anggota komunitas dengan kesepakatan tempat serah terima (COD) secara mudah dan aman.',
  applicationName: 'Nepal Market',
  keywords: ['marketplace komunitas', 'jual beli lokal', 'COD sekolah', 'pasar komunitas', 'nepal market'],
  authors: [{ name: 'Komunitas Nepal Market' }],
  creator: 'Nepal Market',
  openGraph: {
    title: 'Nepal Market - Marketplace Jual Beli Komunitas Lokal',
    description: 'Marketplace C2C lokal untuk jual beli barang antar anggota komunitas dengan kesepakatan tempat serah terima (COD) secara mudah dan aman.',
    url: '/',
    siteName: 'Nepal Market',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nepal Market - Marketplace Jual Beli Komunitas Lokal',
    description: 'Marketplace C2C lokal untuk jual beli barang antar anggota komunitas dengan kesepakatan tempat serah terima (COD) secara mudah dan aman.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Nepal Market',
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'All',
    description: 'Marketplace C2C lokal untuk jual beli barang antar anggota komunitas dengan kesepakatan COD.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'IDR',
    },
  };

  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased selection:bg-blue-100 selection:text-blue-900" suppressHydrationWarning>
        <Script
          id="nepal-market-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
