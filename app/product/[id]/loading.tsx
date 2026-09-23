import React from 'react';

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-neutral-900 pb-28 md:pb-16 animate-pulse">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-slate-200" />
              <div className="h-4 w-36 bg-slate-200 rounded" />
            </div>
            <div className="w-8 h-8 rounded-md bg-slate-200" />
          </div>
        </div>
      </header>

      {/* Main Layout Skeleton */}
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Foto Skeleton 1:1 Aspect Square */}
          <div className="lg:col-span-7 flex flex-col gap-2.5">
            <div className="relative aspect-square w-full bg-slate-200/80 rounded-lg border border-slate-200" />
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-square rounded-md bg-slate-200/60 border border-slate-200" />
              ))}
            </div>
          </div>

          {/* Info Skeleton */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 space-y-4">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="h-6 w-3/4 bg-slate-200 rounded" />
            <div className="h-24 w-full bg-slate-100 rounded-md" />
            <div className="h-28 w-full bg-slate-100 rounded-md" />
          </div>
        </div>
      </main>
    </div>
  );
}
