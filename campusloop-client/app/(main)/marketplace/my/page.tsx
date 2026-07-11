'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

import ListingCard from '@/components/marketplace/ListingCard';
import api from '@/lib/api';
import type { Listing } from '@/types';

const STATUS_TABS = [
  { value: 'all',    label: 'All'    },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'sold',   label: 'Sold'   },
];

export default function MyListingsPage() {
  const [listings, setListings]   = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'paused' | 'sold'>('all');

  useEffect(() => {
    setIsLoading(true);
    api.get('/listings/my')
      .then(({ data }) => setListings(data.listings || []))
      .catch(() => toast.error('Could not load your listings'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = activeTab === 'all'
    ? listings
    : listings.filter((l) => l.status === activeTab);

  return (
    <div className="py-6 space-y-8 relative z-10 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-display-lg text-3xl font-black text-[var(--color-primary)]">My Listings</h1>
          <p className="font-body text-xs text-[var(--color-text-muted)] mt-1">{listings.length} items published</p>
        </div>
        <Link
          href="/marketplace/new"
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-[var(--color-surface)] text-xs font-bold rounded-full transition-all duration-300 shadow-md active-press"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Listing
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/40 border border-white/60 p-1 rounded-2xl w-fit shadow-sm backdrop-blur-md">
        {STATUS_TABS.map(({ value, label }) => {
          const count = value === 'all' ? listings.length : listings.filter((l) => l.status === value).length;
          return (
            <button
              key={value}
              onClick={() => setActiveTab(value as typeof activeTab)}
              className={`flex items-center gap-2 px-4.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === value
                  ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <span>{label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                activeTab === value ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-3xl overflow-hidden border border-white/50 animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-[28px] p-16 text-center border border-white/60 shadow-[0_15px_35px_-5px_rgba(45,31,31,0.03)] flex flex-col items-center justify-center max-w-xl mx-auto"
        >
          <div className="w-16 h-16 bg-white/80 border border-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-5">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">inventory_2</span>
          </div>
          <h2 className="font-heading text-base font-black text-[var(--color-text)] mb-2">
            {activeTab === 'all' ? "Marketplace is Empty" : `No ${activeTab} items`}
          </h2>
          <p className="text-[var(--color-text-muted)] text-xs max-w-sm leading-relaxed mb-6 font-medium">
            {activeTab === 'all'
              ? "You haven't listed any items for sale yet. Turn your unused textbooks, gadgets, or accessories into cash today."
              : `You do not have any items marked as ${activeTab} at the moment.`}
          </p>
          {activeTab === 'all' && (
            <Link
              href="/marketplace/new"
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold rounded-full transition-all duration-300 shadow-md active-press"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Create First Listing
            </Link>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
        >
          {filtered.map((l) => (
            <ListingCard key={l._id} listing={l} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
