'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORIES, CATEGORY_ICONS, CONDITIONS, type ListingCategory } from '@/types';

export default function FilterBar() {
  const router     = useRouter();
  const params     = useSearchParams();

  const activeCategory  = params.get('category') || 'All';
  const activeCondition = params.get('condition') || '';
  const activeSort      = params.get('sort') || 'newest';
  const minPrice        = params.get('minPrice') || '';
  const maxPrice        = params.get('maxPrice') || '';
  const verifiedSellers = params.get('verifiedSellers') === 'true';

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // reset pagination
    router.push(`/marketplace?${next.toString()}`);
  };

  const clearAll = () => router.push('/marketplace');

  const hasFilters = activeCategory !== 'All' || activeCondition || minPrice || maxPrice || activeSort !== 'newest' || verifiedSellers;

  return (
    <div className="space-y-4">
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide snap-x">
        {['All', ...CATEGORIES].map((cat) => {
          const isAll    = cat === 'All';
          const icon     = isAll ? '✨' : CATEGORY_ICONS[cat as ListingCategory];
          const isActive = cat === activeCategory;

          return (
            <button
              key={cat}
              onClick={() => update('category', isAll ? '' : cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 snap-start cursor-pointer active-press border ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <span>{icon}</span>
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Condition */}
        <div className="relative">
          <select
            value={activeCondition}
            onChange={(e) => update('condition', e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-4 pr-9 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            aria-label="Filter by condition"
          >
            <option value="">Any Condition</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c} className="bg-white text-slate-700">{c}</option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={activeSort}
            onChange={(e) => update('sort', e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-4 pr-9 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            aria-label="Sort listings"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
        </div>

        {/* Price range */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            value={minPrice}
            min={0}
            onChange={(e) => update('minPrice', e.target.value)}
            className="w-24 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 shadow-sm"
          />
          <span className="text-slate-450 text-sm font-semibold">–</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={maxPrice}
            min={0}
            onChange={(e) => update('maxPrice', e.target.value)}
            className="w-24 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {/* Verified Sellers Toggle */}
        <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 hover:border-blue-300 rounded-xl px-4 py-2.5 transition-all text-xs font-semibold text-slate-700 shadow-sm">
          <input
            type="checkbox"
            checked={verifiedSellers}
            onChange={(e) => update('verifiedSellers', e.target.checked ? 'true' : '')}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/25 h-4 w-4 accent-blue-600 cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <span>✨</span> Verified Sellers
          </span>
        </label>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-extrabold text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors flex items-center gap-1 cursor-pointer ml-auto active-press"
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
