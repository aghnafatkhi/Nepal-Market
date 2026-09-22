import React, { cache } from 'react';
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { formatRupiah } from '@/data/products';
import { ProductDetailView } from '@/components/ProductDetailView';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

interface PublicProductMetadata {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: 'new' | 'like_new' | 'used';
  updated_at: string;
  product_images: Array<{ image_url: string; sort_order: number }>;
}

const conditionLabels: Record<PublicProductMetadata['condition'], string> = {
  new: 'Baru',
  like_new: 'Bekas - Seperti Baru',
  used: 'Bekas - Mulus',
};

const getPublicProductMetadata = cache(async (id: string): Promise<PublicProductMetadata | null> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from('products')
    .select('id, title, description, price, condition, updated_at, product_images(image_url, sort_order)')
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  return data as PublicProductMetadata;
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getPublicProductMetadata(id);

  if (!product) {
    return {
      title: 'Barang Tidak Ditemukan - Nepal Market',
      description: 'Detail barang tidak ditemukan di Nepal Market.',
    };
  }

  const description = `${conditionLabels[product.condition]} - ${product.description || 'Barang dijual melalui sistem COD di Nepal Market.'}`.slice(0, 160);
  const images = [...product.product_images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({ url: image.image_url, alt: product.title }));
  const canonical = `/product/${product.id}`;

  return {
    title: `${product.title} (${formatRupiah(product.price)}) - Nepal Market`,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${product.title} - ${formatRupiah(product.price)}`,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} - ${formatRupiah(product.price)}`,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  return <ProductDetailView productId={id} />;
}
