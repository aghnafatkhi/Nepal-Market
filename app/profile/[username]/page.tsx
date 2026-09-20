import React from 'react';
import { Metadata } from 'next';
import { PublicSellerProfileView } from '@/components/PublicSellerProfileView';

interface SellerPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username).replace(/^@/, '');

  return {
    title: `@${cleanUsername} - Profil Penjual Nepal Market`,
    description: `Lihat profil dan barang jualan aktif milik @${cleanUsername} di Nepal Market.`,
  };
}

export default async function SellerProfilePage({ params }: SellerPageProps) {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username).replace(/^@/, '');

  return <PublicSellerProfileView username={cleanUsername} />;
}
