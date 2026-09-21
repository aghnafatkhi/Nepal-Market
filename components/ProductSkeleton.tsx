import React from 'react';

export const ProductSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div 
      id="product-skeleton-grid" 
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden animate-pulse"
        >
          {/* Skeleton Image */}
          <div className="aspect-square w-full bg-slate-200/80" />

          {/* Skeleton Content */}
          <div className="p-3 sm:p-3.5 space-y-2.5">
            {/* Price */}
            <div className="h-5 w-24 bg-slate-200 rounded" />

            {/* Title (2 lines) */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-full bg-slate-200/70 rounded" />
              <div className="h-3.5 w-2/3 bg-slate-200/70 rounded" />
            </div>

            {/* Footer Location & Time */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="h-3 w-16 bg-slate-200/60 rounded" />
              <div className="h-3 w-10 bg-slate-200/60 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
