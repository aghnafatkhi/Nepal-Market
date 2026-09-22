'use client';

import React, { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { CATEGORIES } from '@/data/products';
import { CategorySlug, ConditionFilter, SortOption } from '@/types/market';

interface SearchFiltersState {
  q: string;
  category: CategorySlug;
  condition: ConditionFilter;
  minPrice: string;
  maxPrice: string;
  sortBy: SortOption;
}

interface SearchFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFiltersState;
  onApply: (newFilters: SearchFiltersState) => void;
  onReset: () => void;
  totalResultsCount: number;
}

const SearchFilterSheetContent: React.FC<SearchFilterSheetProps> = ({
  onClose,
  filters,
  onApply,
  onReset,
  totalResultsCount,
}) => {
  const [localCategory, setLocalCategory] = useState<CategorySlug>(filters.category);
  const [localCondition, setLocalCondition] = useState<ConditionFilter>(filters.condition);
  const [localMinPrice, setLocalMinPrice] = useState<string>(filters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(filters.maxPrice);
  const [localSortBy, setLocalSortBy] = useState<SortOption>(filters.sortBy);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleApplyClick = () => {
    onApply({
      ...filters,
      category: localCategory,
      condition: localCondition,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      sortBy: localSortBy,
    });
    onClose();
  };

  const handleResetClick = () => {
    setLocalCategory('semua');
    setLocalCondition('semua');
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setLocalSortBy('terbaru');
    onReset();
    onClose();
  };

  return (
    <div 
      id="search-filter-bottomsheet-portal"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 transition-opacity"
      onClick={onClose}
    >
      <div
        id="search-filter-bottomsheet-content"
        className="w-full max-h-[85vh] bg-white rounded-t-xl border-t border-slate-200 flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Sheet */}
        <div className="pt-2.5 pb-2 px-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Filter</h2>
          <button
            id="btn-close-filter-sheet"
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup panel filter"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-slate-800">
          
          {/* 1. Urutkan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Urutkan
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'terbaru', label: 'Terbaru' },
                { id: 'harga-rendah', label: 'Harga Terendah' },
                { id: 'harga-tinggi', label: 'Harga Tertinggi' },
              ].map((item) => {
                const isActive = localSortBy === item.id;
                return (
                  <button
                    key={item.id}
                    id={`filter-sort-${item.id}`}
                    type="button"
                    onClick={() => setLocalSortBy(item.id as SortOption)}
                    className={`px-2.5 py-2 text-xs font-medium rounded-md border transition-colors min-h-[38px] flex items-center justify-center text-center cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Kondisi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Kondisi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'semua', label: 'Semua kondisi' },
                { id: 'baru', label: 'Baru' },
                { id: 'seperti-baru', label: 'Seperti Baru' },
                { id: 'bekas', label: 'Bekas' },
              ].map((cond) => {
                const isActive = localCondition === cond.id;
                return (
                  <button
                    key={cond.id}
                    id={`filter-cond-${cond.id}`}
                    type="button"
                    onClick={() => setLocalCondition(cond.id as ConditionFilter)}
                    className={`px-2.5 py-2 rounded-md text-xs font-medium border transition-colors min-h-[38px] flex items-center justify-center text-center cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {cond.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Kategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Kategori
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isActive = localCategory === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    id={`filter-cat-${cat.slug}`}
                    type="button"
                    onClick={() => setLocalCategory(cat.slug)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors min-h-[36px] inline-flex items-center cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Harga */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Harga
            </label>
            <div className="grid grid-cols-2 gap-2.5 items-center">
              <div>
                <span className="text-[11px] text-slate-500 mb-1 block">Minimum</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400 pointer-events-none">
                    Rp
                  </span>
                  <input
                    id="filter-min-price-input"
                    type="number"
                    inputMode="numeric"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[38px]"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 mb-1 block">Maksimum</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400 pointer-events-none">
                    Rp
                  </span>
                  <input
                    id="filter-max-price-input"
                    type="number"
                    inputMode="numeric"
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                    placeholder="Tanpa batas"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[38px]"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Actions Bar */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center gap-2.5">
          <button
            id="btn-reset-filter-sheet"
            type="button"
            onClick={handleResetClick}
            className="flex-1 py-2 px-3 rounded-md border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
          <button
            id="btn-apply-filter-sheet"
            type="button"
            onClick={handleApplyClick}
            className="flex-[2] py-2 px-3 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center min-h-[40px] cursor-pointer"
          >
            Terapkan Filter ({totalResultsCount})
          </button>
        </div>

      </div>
    </div>
  );
};

export const SearchFilterSheet: React.FC<SearchFilterSheetProps> = (props) => {
  if (!props.isOpen) return null;
  return <SearchFilterSheetContent {...props} />;
};
