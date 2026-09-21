'use client';

import React from 'react';
import { 
  LayoutGrid, 
  Shirt, 
  Smartphone, 
  BookOpen, 
  Watch, 
  Gamepad2, 
  Utensils, 
  Package 
} from 'lucide-react';
import { CATEGORIES } from '@/data/products';
import { CategorySlug } from '@/types/market';

interface CategoryBarProps {
  selectedCategory: CategorySlug;
  onSelectCategory: (category: CategorySlug) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutGrid: <LayoutGrid className="w-4 h-4" />,
  Shirt: <Shirt className="w-4 h-4" />,
  Smartphone: <Smartphone className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  Watch: <Watch className="w-4 h-4" />,
  Gamepad2: <Gamepad2 className="w-4 h-4" />,
  Utensils: <Utensils className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
};

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <nav 
      id="category-navigation" 
      aria-label="Kategori Barang"
      className="w-full bg-white border-b border-slate-200 relative sm:sticky sm:top-[60px] z-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                id={`cat-btn-${cat.slug}`}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm whitespace-nowrap transition-colors shrink-0 select-none cursor-pointer border-b-2 min-h-[42px] ${
                  isSelected
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium'
                }`}
              >
                <span className={isSelected ? 'text-blue-600' : 'text-slate-400'}>
                  {ICON_MAP[cat.iconName]}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
