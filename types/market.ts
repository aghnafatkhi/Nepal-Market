export type CategorySlug = 
  | 'semua'
  | 'fashion'
  | 'elektronik'
  | 'buku'
  | 'aksesori'
  | 'hobi'
  | 'makanan'
  | 'lainnya';

export type ProductCondition = 
  | 'Baru'
  | 'Bekas - Seperti Baru'
  | 'Bekas - Mulus'
  | 'Bekas - Layak';

export type ConditionFilter = 'semua' | 'baru' | 'seperti-baru' | 'bekas';

export interface Seller {
  id?: string;
  name: string;
  avatar?: string;
  location: string;
  joinedDate?: string;
  activeListingsCount?: number;
  whatsapp?: string;
  instagram?: string;
  isVerified?: boolean;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  category: CategorySlug;
  condition: ProductCondition;
  imageUrl: string;
  images?: string[]; // Galeri foto maksimal 5 foto
  location: string; // Lokasi ketemuan/COD lokal
  postedAt: string;
  seller: Seller;
  description: string;
  isAvailable: boolean;
  isSold?: boolean;
}

export interface CategoryItem {
  slug: CategorySlug;
  label: string;
  iconName: string;
}

export type SortOption = 'terbaru' | 'harga-rendah' | 'harga-tinggi';

export interface SearchFilters {
  q?: string;
  category?: CategorySlug;
  condition?: ConditionFilter;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: SortOption;
}
