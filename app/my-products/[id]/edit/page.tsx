import React from 'react';
import { Metadata } from 'next';
import { EditProductClient } from '@/components/EditProductClient';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Iklan Barang #${id.slice(0, 8)} - Nepal Market`,
    description: 'Edit detail barang, harga, foto, dan status ketersediaan barangmu di Nepal Market.',
  };
}

export default async function EditProductPage({ params }: EditPageProps) {
  const { id } = await params;
  return <EditProductClient productId={id} />;
}
