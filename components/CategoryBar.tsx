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
      className="w-full bg-white border-b border-slate-200/80 sticky top-[61px] sm:top-[69px] z-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                id={`cat-btn-${cat.slug}`}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200 min-h-[44px] min-w-[44px] shrink-0 select-none ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                <span className={isSelected ? 'text-white' : 'text-slate-500'}>
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
