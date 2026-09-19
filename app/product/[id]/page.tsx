import React from 'react';
import { Metadata } from 'next';
import { getProductById, formatRupiah } from '@/data/products';
import { ProductDetailView } from '@/components/ProductDetailView';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return {
      title: 'Barang Tidak Ditemukan - Nepal Market',
      description: 'Detail barang tidak ditemukan di Nepal Market.',
    };
  }

  return {
    title: `${product.title} (${formatRupiah(product.price)}) - Nepal Market`,
    description: `${product.condition} - ${product.description.slice(0, 150)}...`,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  return <ProductDetailView productId={id} />;
}
