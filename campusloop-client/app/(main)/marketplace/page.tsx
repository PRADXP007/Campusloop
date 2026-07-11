'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import FilterBar from '@/components/marketplace/FilterBar';
import ListingCard from '@/components/marketplace/ListingCard';
import api from '@/lib/api';
import type { Listing, PaginationMeta } from '@/types';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: '📚 Books', value: 'books' },
  { label: '💻 Electronics', value: 'electronics' },
  { label: '👗 Clothing', value: 'clothing' },
  { label: '🪑 Furniture', value: 'furniture' },
  { label: '🎒 Stationery', value: 'stationery' },
  { label: '🎮 Gaming', value: 'gaming' },
  { label: '🚲 Transport', value: 'transport' },
  { label: '🔧 Tools', value: 'tools' },
  { label: '🎨 Arts', value: 'arts' },
  { label: '📦 Other', value: 'other' },
];

const SKELETON_COUNT = 8;

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const q = searchParams.get('q') || '';
  const page = Number(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || '';

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/listings', {
        params: Object.fromEntries(searchParams.entries()),
      });
      setListings(data.listings || []);
      setPagination(data.pagination || null);
      setTotalCount(data.pagination?.total || data.listings?.length || 0);
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('page', String(p));
    router.push(`/marketplace?${next.toString()}`);
  };

  const setCategory = (cat: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (cat) next.set('category', cat);
    else next.delete('category');
    next.delete('page');
    router.push(`/marketplace?${next.toString()}`);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value.trim();
      const next = new URLSearchParams(searchParams.toString());
      if (val) next.set('q', val);
      else next.delete('q');
      next.delete('page');
      router.push(`/marketplace?${next.toString()}`);
    }
  };

  return (
    <div className="py-6 space-y-6 relative z-10">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 tracking-tight">
            Campus Marketplace
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isLoading ? (
              <span className="inline-block w-28 h-3 bg-slate-200 rounded animate-pulse" />
            ) : (
              <>
                {totalCount > 0 ? (
                  <><span className="font-bold text-slate-700">{totalCount}</span> items listed by students</>
                ) : (
                  'No items listed yet — be the first!'
                )}
              </>
            )}
          </p>
        </div>
        <Link
          href="/marketplace/new"
          className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active-press"
        >
          <span className="material-symbols-outlined text-[17px]">add</span>
          List an Item
        </Link>
      </motion.div>

      {/* ── Search Bar ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative"
      >
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </span>
        <input
          type="search"
          placeholder="Search MacBook, textbooks, camera, jersey…"
          defaultValue={q}
          onKeyDown={handleSearch}
          id="marketplace-search"
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all font-medium outline-none"
        />
        {q && (
          <button
            onClick={() => {
              const n = new URLSearchParams(searchParams.toString());
              n.delete('q');
              router.push(`/marketplace?${n.toString()}`);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        )}
      </motion.div>

      {/* ── Filter Bar (has its own category pills inside) ───────────── */}
      <FilterBar />

      {/* ── Active search/category tags ─────────────────────────────── */}
      {(q || category) && (
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
          {q && (
            <div className="flex items-center gap-2">
              <span>Results for</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-bold">
                &ldquo;{q}&rdquo;
              </span>
              <button
                onClick={() => {
                  const n = new URLSearchParams(searchParams.toString());
                  n.delete('q');
                  router.push(`/marketplace?${n.toString()}`);
                }}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕ Clear
              </button>
            </div>
          )}
          {category && (
            <div className="flex items-center gap-2">
              <span>Category</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-bold capitalize">
                {category}
              </span>
              <button
                onClick={() => {
                  const n = new URLSearchParams(searchParams.toString());
                  n.delete('category');
                  router.push(`/marketplace?${n.toString()}`);
                }}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕ Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(SKELETON_COUNT)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-pulse flex flex-col h-[300px]"
            >
              <div className="aspect-[4/3] bg-slate-100 w-full flex-shrink-0" />
              <div className="p-3 flex-1 space-y-2.5">
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-3.5 bg-slate-200 rounded w-5/6" />
                <div className="h-3 bg-slate-100 rounded w-2/3 mt-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-16 text-center relative overflow-hidden flex flex-col items-center justify-center border border-slate-200 shadow-sm min-h-[400px] md:min-h-[450px]"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-5 z-10"
          >
            <span className="material-symbols-outlined text-blue-600 text-3xl">storefront</span>
          </motion.div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 relative z-10">
            {q ? 'No matching listings found' : 'The marketplace is waiting'}
          </h2>
          <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed font-medium mb-6 relative z-10">
            {q
              ? `We couldn't find any items matching "${q}". Try checking the spelling or using a different keyword.`
              : 'Be the first to list items! Sell textbooks, electronics, or anything you no longer need.'}
          </p>
          <Link
            href="/marketplace/new"
            className="relative z-10 flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active-press"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            List an Item
          </Link>
        </motion.div>
      ) : (
        <>
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.04 },
              },
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
          >
            {listings.map((l) => (
              <motion.div
                key={l._id}
                variants={{
                  hidden: { opacity: 0, scale: 0.94, y: 12 },
                  show: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { type: 'spring' as const, stiffness: 160, damping: 20 },
                  },
                }}
              >
                <ListingCard listing={l} />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed active-press"
              >
                ← Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        p === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed active-press"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="py-6 max-w-6xl mx-auto px-4 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-slate-200 rounded-xl w-52 animate-pulse" />
              <div className="h-3.5 bg-slate-100 rounded w-36 animate-pulse" />
            </div>
            <div className="h-9 bg-slate-200 rounded-xl w-28 animate-pulse" />
          </div>
          <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
