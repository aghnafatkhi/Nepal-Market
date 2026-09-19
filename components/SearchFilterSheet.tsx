'use client';

import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
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

export const SearchFilterSheet: React.FC<SearchFilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  totalResultsCount,
}) => {
  // Temporary state for the bottom sheet initialized from props
  const [localCategory, setLocalCategory] = useState<CategorySlug>(filters.category);
  const [localCondition, setLocalCondition] = useState<ConditionFilter>(filters.condition);
  const [localMinPrice, setLocalMinPrice] = useState<string>(filters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(filters.maxPrice);
  const [localSortBy, setLocalSortBy] = useState<SortOption>(filters.sortBy);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
      className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        id="search-filter-bottomsheet-content"
        className="w-full max-h-[90vh] bg-white rounded-t-2xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Grab Handle & Header */}
        <div className="pt-3 pb-2 px-5 border-b border-slate-100 flex flex-col">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Filter & Urutan</h2>
            </div>
            <button
              id="btn-close-filter-sheet"
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Tutup panel filter"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Filters Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* 1. Urutkan Berdasarkan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2.5 uppercase tracking-wider">
              Urutan
            </label>
            <div className="grid grid-cols-3 gap-2">
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
                    className={`px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors min-h-[44px] flex items-center justify-center text-center ${
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

          {/* 2. Kategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2.5 uppercase tracking-wider">
              Kategori
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = localCategory === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    id={`filter-cat-${cat.slug}`}
                    type="button"
                    onClick={() => setLocalCategory(cat.slug)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors min-h-[44px] inline-flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5" />}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Kondisi Barang */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2.5 uppercase tracking-wider">
              Kondisi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'semua', label: 'Semua Kondisi' },
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
                    className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors min-h-[44px] flex items-center justify-center text-center ${
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

          {/* 4. Rentang Harga */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2.5 uppercase tracking-wider">
              Rentang Harga (Rp)
            </label>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-[11px] text-slate-500 mb-1 block">Harga Minimum</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                    Rp
                  </span>
                  <input
                    id="filter-min-price-input"
                    type="number"
                    inputMode="numeric"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 mb-1 block">Harga Maksimum</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                    Rp
                  </span>
                  <input
                    id="filter-max-price-input"
                    type="number"
                    inputMode="numeric"
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                    placeholder="Tanpa batas"
                    className="w-full pl-8 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
          <button
            id="btn-reset-filter-sheet"
            type="button"
            onClick={handleResetClick}
            className="flex-1 py-3 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset</span>
          </button>
          <button
            id="btn-apply-filter-sheet"
            type="button"
            onClick={handleApplyClick}
            className="flex-[2] py-3 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs flex items-center justify-center min-h-[44px]"
          >
            Terapkan Filter ({totalResultsCount})
          </button>
        </div>

      </div>
    </div>
  );
};
