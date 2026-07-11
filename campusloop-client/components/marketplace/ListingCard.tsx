'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { Listing } from '@/types';
import { CONDITION_COLORS, CATEGORY_ICONS } from '@/types';
import { motion } from 'framer-motion';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import TiltCard from '@/components/ui/TiltCard';

interface ListingCardProps {
  listing: Listing;
  onSaveToggle?: (id: string, saved: boolean) => void;
  savedIds?: Set<string>;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function ListingCard({ listing, onSaveToggle, savedIds }: ListingCardProps) {
  const [imgError, setImgError] = useState(false);
  const isSaved = savedIds?.has(listing._id) ?? listing.savedBy?.length > 0;

  const placeholderBg = [
    'from-[var(--color-primary)]/20 to-[var(--color-surface-2)]',
    'from-[var(--color-accent)]/20 to-[var(--color-surface-2)]',
  ][listing._id.charCodeAt(0) % 2];

  return (
    <TiltCard className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full shadow-sm"
      >
      <div>
        {/* Image wrapper */}
        <Link href={`/marketplace/${listing._id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 border-b border-slate-100">
            {listing.images[0] && !imgError ? (
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${placeholderBg} flex items-center justify-center`}>
                <span className="text-5xl opacity-40">
                  {CATEGORY_ICONS[listing.category]}
                </span>
              </div>
            )}

            {/* Status overlay */}
            {listing.status !== 'active' && (
              <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center backdrop-blur-xs">
                <span className="px-3.5 py-1.5 rounded-2xl text-[9px] font-extrabold uppercase tracking-widest bg-slate-950/80 text-white border border-white/10">
                  {listing.status}
                </span>
              </div>
            )}

            {/* Image count badge */}
            {listing.images.length > 1 && (
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-white/95 border border-slate-200 backdrop-blur-md rounded-lg px-2 py-0.5 text-[9px] text-slate-500 font-bold">
                📸 {listing.images.length}
              </div>
            )}
          </div>
        </Link>

        {/* Save button */}
        {onSaveToggle && (
          <button
            onClick={(e) => { e.preventDefault(); onSaveToggle(listing._id, !isSaved); }}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full border flex items-center justify-center text-xs transition-all duration-200 cursor-pointer active-press z-10 ${
              isSaved
                ? 'bg-blue-600 border-blue-600/10 text-white shadow-md shadow-blue-500/15'
                : 'bg-white/90 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-350'
            }`}
            aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
          >
            {isSaved ? '🔖' : '🏷'}
          </button>
        )}

        {/* Info */}
        <div className="p-4 pb-2">
          <Link href={`/marketplace/${listing._id}`}>
            {/* Price row */}
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-base font-bold text-slate-900 tracking-tight">{formatPrice(listing.price)}</span>
              {listing.priceNegotiable && (
                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                  NEGOTIABLE
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
              {listing.title}
            </h3>
          </Link>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {/* Meta row */}
        <div className="flex items-center justify-between">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
            listing.condition === 'New' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
            listing.condition === 'Like New' ? 'text-teal-700 bg-teal-50 border-teal-200' :
            listing.condition === 'Good' ? 'text-blue-700 bg-blue-50 border-blue-200' :
            'text-slate-700 bg-slate-50 border-slate-200'
          }`}>
            {listing.condition.toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <span>{CATEGORY_ICONS[listing.category]}</span>
            <span>{timeAgo(listing.createdAt)}</span>
          </div>
        </div>

        {/* Seller info */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 flex-shrink-0 overflow-hidden">
            {listing.seller?.avatar ? (
              <Image src={listing.seller.avatar} alt="" width={20} height={20} className="w-full h-full object-cover" />
            ) : (
              listing.seller?.name?.charAt(0).toUpperCase() ?? '?'
            )}
          </div>
          <div className="flex flex-col min-w-0 max-w-[65%] leading-tight">
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-slate-900 font-semibold truncate">{listing.seller?.name ?? 'Unknown'}</span>
              {listing.seller?.isVerified && <VerifiedBadge size="sm" />}
            </div>
            <span className="text-[8px] text-slate-400 font-medium truncate">
              {listing.seller?.department ? `${listing.seller.department}` : 'Student'}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 flex items-center gap-0.5 ml-auto flex-shrink-0 font-medium">
            👁 {listing.views}
          </span>
        </div>
      </div>
    </motion.div>
    </TiltCard>
  );
}
