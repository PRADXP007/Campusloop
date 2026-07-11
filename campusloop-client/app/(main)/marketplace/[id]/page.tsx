'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Listing } from '@/types';
import { CONDITION_COLORS, CATEGORY_ICONS } from '@/types';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

const formatPrice = (p: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const days  = Math.floor(diff / 86400000);
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
};

function ImageGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-[4/3] bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] rounded-[28px] flex items-center justify-center text-5xl text-[var(--color-text-muted)]">
        📷
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] rounded-[28px] overflow-hidden shadow-sm">
        <Image
          src={images[active]}
          alt="Listing"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              disabled={active === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-[var(--color-surface)]/90 backdrop-blur-sm border border-[var(--color-border)] rounded-full flex items-center justify-center text-[var(--color-text)] disabled:opacity-30 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
            >‹</button>
            <button
              onClick={() => setActive((a) => Math.min(images.length - 1, a + 1))}
              disabled={active === images.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-[var(--color-surface)]/90 backdrop-blur-sm border border-[var(--color-border)] rounded-full flex items-center justify-center text-[var(--color-text)] disabled:opacity-30 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
            >›</button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === active ? 'bg-[var(--color-primary)] w-5' : 'bg-[var(--color-text-muted)]/30'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-hide">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                i === active ? 'border-[var(--color-accent)] shadow-md' : 'border-[var(--color-border)] opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={src} alt="" width={64} height={64} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ListingDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { user }  = useAuthStore();

  const [listing, setListing]         = useState<Listing | null>(null);
  const [isSaved, setIsSaved]         = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleBlockSeller = async () => {
    if (!listing) return;
    if (!confirm(`Block ${listing.seller.name}? You will no longer see their posts, marketplace listings, or messages.`)) return;
    try {
      await api.post(`/users/${listing.seller._id}/block`);
      toast.success(`${listing.seller.name} blocked successfully.`);
      router.push('/marketplace');
    } catch {
      toast.error('Could not block user.');
    }
  };

  const handleReportSeller = async () => {
    if (!listing) return;
    const reason = prompt(`Why are you reporting ${listing.seller.name}? (e.g. scammer, inappropriate content, harassment)`);
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Report reason is required.');
      return;
    }

    try {
      await api.post(`/users/${listing.seller._id}/report`, { reason: reason.trim() });
      toast.success('Report submitted. We will review this account.');
    } catch {
      toast.error('Could not submit report.');
    }
  };

  const handleContactSeller = async () => {
    if (!listing) return;
    setIsStartingChat(true);
    try {
      const { data } = await api.post('/chat/conversations', {
        participantId: listing.seller._id,
      });
      if (data.success && data.conversation) {
        router.push(`/chat?conversationId=${data.conversation._id}`);
      } else {
        toast.error('Could not start conversation');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Could not start conversation';
      toast.error(errorMsg);
    } finally {
      setIsStartingChat(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    api.get(`/listings/${id}`)
      .then(({ data }) => { setListing(data.listing); setIsSaved(data.isSaved); })
      .catch(() => toast.error('Could not load listing'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSave = async () => {
    try {
      const { data } = await api.post(`/listings/${id}/save`);
      setIsSaved(data.isSaved);
      toast.success(data.isSaved ? 'Saved!' : 'Removed from saved');
    } catch { toast.error('Could not save listing'); }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await api.delete(`/listings/${id}`);
      toast.success('Listing deleted');
      router.push('/marketplace');
    } catch { toast.error('Could not delete listing'); }
    finally { setIsDeleting(false); }
  };

  const handleStatusChange = async (status: string) => {
    setStatusUpdating(true);
    try {
      const { data } = await api.patch(`/listings/${id}/status`, { status });
      setListing(data.listing);
      toast.success(`Marked as ${status}`);
    } catch { toast.error('Could not update status'); }
    finally { setStatusUpdating(false); }
  };

  if (isLoading) {
    return (
      <div className="py-6 animate-pulse space-y-6">
        <div className="aspect-[4/3] bg-[var(--color-surface-2)] rounded-[28px]" />
        <div className="h-8 bg-[var(--color-surface-2)] rounded-lg w-3/4" />
        <div className="h-6 bg-[var(--color-surface-2)] rounded-lg w-1/3" />
        <div className="h-24 bg-[var(--color-surface-2)] rounded-[24px]" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="text-5xl">🔍</div>
        <h2 className="text-base font-black text-[var(--color-text)]">Listing Not Found</h2>
        <Link href="/marketplace" className="text-[var(--color-primary)] font-bold text-sm hover:underline inline-block">
          ← Back to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = user?._id === listing.seller._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="py-6"
    >
      {/* Back */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-6 transition-colors"
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — images */}
        <ImageGallery images={listing.images} />

        {/* Right — info */}
        <div className="space-y-6">
          {/* Status banner */}
          {listing.status !== 'active' && (
            <div className={`px-4.5 py-3 rounded-2xl text-xs font-bold text-center border ${
              listing.status === 'sold'
                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]'
            }`}>
              {listing.status === 'sold' ? '🔴 This item has been sold' : '⏸ This listing is currently paused'}
            </div>
          )}

          {/* Suspicious Warning */}
          {listing.seller.isSuspicious && (
            <div className="px-4.5 py-3 rounded-2xl text-xs font-bold text-center border bg-[#B76E79]/10 text-[var(--color-primary)] border-[#B76E79]/20 flex items-center justify-center gap-2 animate-pulse">
              <span>⚠️ Warning: This seller has been flagged for suspicious activity.</span>
            </div>
          )}

          {/* Price + title */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-[var(--color-primary)] tracking-tight">{formatPrice(listing.price)}</span>
              {listing.priceNegotiable && (
                <span className="text-[10px] font-extrabold text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2.5 py-0.5 rounded-lg border border-[var(--color-accent)]/10">
                  NEGOTIABLE
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[var(--color-text)] leading-tight">{listing.title}</h1>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
              listing.condition === 'New' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/10' :
              listing.condition === 'Like New' ? 'text-teal-600 bg-teal-500/10 border-teal-500/10' :
              listing.condition === 'Good' ? 'text-indigo-600 bg-indigo-500/10 border-indigo-500/10' :
              'text-[var(--color-accent)] bg-[var(--color-accent)]/10 border-[var(--color-accent)]/10'
            }`}>
              {listing.condition.toUpperCase()}
            </span>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[var(--color-surface-2)]/60 text-[var(--color-text-muted)] border border-[var(--color-border)] flex items-center gap-1.5">
              {CATEGORY_ICONS[listing.category]} {listing.category}
            </span>
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] flex items-center gap-1 ml-auto">
              👁 {listing.views} views
            </span>
          </div>

          {/* Description */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[26px] p-5 shadow-sm space-y-2">
            <h3 className="text-xs font-black text-[var(--color-text)] uppercase tracking-wider">Description</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap font-medium">{listing.description}</p>
          </div>

          {/* Seller card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[26px] p-5 shadow-sm">
            <h3 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-4">Seller Details</h3>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[var(--color-primary-light)] border border-[var(--color-primary)]/15 flex items-center justify-center text-lg font-bold text-[var(--color-primary)] overflow-hidden flex-shrink-0">
                {listing.seller.avatar ? (
                  <Image src={listing.seller.avatar} alt="" width={44} height={44} className="w-full h-full object-cover" />
                ) : (
                  listing.seller.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-[var(--color-text)] text-sm">{listing.seller.name}</p>
                  {listing.seller.isVerified && <VerifiedBadge size="sm" showLabel />}
                </div>
                <p className="text-xs text-[var(--color-text-muted)] font-semibold mt-0.5">
                  {listing.seller.department && `${listing.seller.department} · `}
                  {listing.seller.year && `Year ${listing.seller.year} · `}
                  Joined {new Date(listing.seller.createdAt).getFullYear()}
                </p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-[var(--color-text-muted)]/70 mt-4">Listed {timeAgo(listing.createdAt)}</p>

            {/* Block / Report Actions */}
            {!isOwner && (
              <div className="flex gap-2 pt-3 mt-4 border-t border-[var(--color-border)] border-dashed">
                <button
                  onClick={handleBlockSeller}
                  className="flex-1 py-1.5 bg-[var(--color-surface)]/75 hover:bg-[var(--color-surface-2)]/50 border border-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                >
                  🚫 Block Seller
                </button>
                <button
                  onClick={handleReportSeller}
                  className="flex-1 py-1.5 bg-[var(--color-surface)]/75 hover:bg-rose-500/10 border border-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                >
                  ⚠️ Report Seller
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          {isOwner ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Link
                  href={`/marketplace/${id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]/60 border border-[var(--color-border)] text-[var(--color-text)] text-xs font-bold rounded-2xl transition-all duration-200 active-press"
                >
                  ✏️ Edit Listing
                </Link>
                <Button
                  variant="danger"
                  size="md"
                  isLoading={isDeleting}
                  onClick={handleDelete}
                  className="flex-1"
                >
                  🗑 Delete
                </Button>
              </div>

              {/* Quick status controls */}
              <div className="flex gap-2">
                {listing.status !== 'sold' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={statusUpdating}
                    onClick={() => handleStatusChange('sold')}
                    className="flex-1 text-red-500 border-red-500/20 hover:border-red-500"
                  >
                    Mark as Sold
                  </Button>
                )}
                {listing.status === 'active' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={statusUpdating}
                    onClick={() => handleStatusChange('paused')}
                    className="flex-1"
                  >
                    Pause
                  </Button>
                )}
                {listing.status === 'paused' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={statusUpdating}
                    onClick={() => handleStatusChange('active')}
                    className="flex-1 text-emerald-600 border-emerald-500/20 hover:border-emerald-500"
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleSave}
                className="flex-shrink-0"
              >
                {isSaved ? '🔖 Saved' : '🏷 Save'}
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isStartingChat}
                onClick={handleContactSeller}
              >
                💬 Contact Seller
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
