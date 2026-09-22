export type UserRole = 'user' | 'admin';

export type DbCondition = 'new' | 'like_new' | 'used';
export type DbProductStatus = 'draft' | 'active' | 'sold' | 'hidden' | 'removed';
export type DbReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface DbProfile {
  id: string;
  name: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  instagram: string | null;
  role: UserRole;
  is_suspended?: boolean;
  suspension_reason?: string | null;
  created_at: string;
}

export interface DbProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
}

export interface DbProduct {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: DbCondition;
  location?: string | null;
  status: DbProductStatus;
  created_at: string;
  updated_at: string;
  // Joins
  seller?: DbProfile;
  product_images?: DbProductImage[];
}

export interface DbFavorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  // Joins
  product?: DbProduct;
}

export interface DbReport {
  id: string;
  reporter_id: string;
  product_id: string;
  reason: string;
  description: string | null;
  status: DbReportStatus;
  created_at: string;
  // Joins
  reporter?: DbProfile;
  product?: DbProduct;
}

export type ModerationAction =
  | 'hide_product'
  | 'remove_product'
  | 'restore_product'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'resolve_report'
  | 'review_report'
  | 'dismiss_report'
  | 'create_sponsor'
  | 'update_sponsor'
  | 'delete_sponsor';

export interface DbModerationLog {
  id: string;
  admin_id: string;
  action: ModerationAction;
  target_type: 'product' | 'profile' | 'report';
  target_id: string;
  target_title: string | null;
  reason: string;
  created_at: string;
  // Joins
  admin?: DbProfile;
}

export type DbSponsorBannerStatus = 'draft' | 'active' | 'inactive';

export interface DbSponsorBanner {
  id: string;
  sponsor_name: string;
  desktop_image_url: string;
  mobile_image_url: string;
  target_url: string;
  alt_text: string;
  status: DbSponsorBannerStatus;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

