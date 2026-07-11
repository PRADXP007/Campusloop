'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import type { Listing, Post } from '@/types';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import ListingCard from '@/components/marketplace/ListingCard';
import PostCard from '@/components/feed/PostCard';

const formatYear = (year: string | number) => {
  const y = String(year);
  if (y === '1') return '1st Year';
  if (y === '2') return '2nd Year';
  if (y === '3') return '3rd Year';
  if (y === '4') return '4th Year';
  if (y === 'PG') return 'Postgraduate';
  return y ? `${y} Year` : 'Student';
};

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New tab state and content states
  const [activeTab, setActiveTab] = useState<'listings' | 'saved' | 'posts'>('listings');
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving profile changes…');

    try {
      const { data } = await api.patch('/users/me', {
        name: editName,
        bio: editBio,
        department: editDept,
        year: editYear,
        phone: editPhone,
      });

      if (data.success) {
        setUser(data.user);
        toast.success('Profile updated successfully!', { id: toastId });
        setIsEditModalOpen(false);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to update profile';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchMyListings = useCallback(async () => {
    setIsLoadingListings(true);
    try {
      const { data } = await api.get('/listings/my');
      if (data.success) setListings(data.listings || []);
    } catch {
      // silently fail
    } finally {
      setIsLoadingListings(false);
    }
  }, []);

  const fetchSavedListings = useCallback(async () => {
    setIsLoadingSaved(true);
    try {
      const { data } = await api.get('/listings/saved');
      if (data.success) setSavedListings(data.listings || []);
    } catch {
      // silently fail
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  const fetchMyPosts = useCallback(async () => {
    if (!user?._id) return;
    setIsLoadingPosts(true);
    try {
      const { data } = await api.get(`/posts?author=${user._id}`);
      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingPosts(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchMyListings();
    fetchSavedListings();
    fetchMyPosts();
  }, [fetchMyListings, fetchSavedListings, fetchMyPosts]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Photo must be under 3 MB');
      return;
    }

    setIsUploadingAvatar(true);
    const toastId = toast.loading('Uploading photo…');

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        setUser(data.user);
        toast.success('Profile photo updated!', { id: toastId });
      }
    } catch {
      toast.error('Failed to upload photo. Please try again.', { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!user) return null;

  const trustScore = user.isVerified ? 100 : 72;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08
          }
        }
      }}
      initial="hidden"
      animate="show"
      className="py-6 space-y-6 max-w-6xl mx-auto px-4 font-body"
    >
      {/* ── Profile Header ──────────────────────────────────────────── */}
      <motion.section 
        variants={{
          hidden: { opacity: 0, y: 30 },
          show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 140, damping: 18 } }
        }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Identity Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden relative group">
            {/* Premium Header Gradient Banner */}
            <div className="h-32 md:h-40 bg-gradient-to-r from-blue-500/80 via-blue-600 to-indigo-700 relative">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px]" />
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-blue-900 to-black pointer-events-none" />
              {/* Subtle watermark in banner */}
              <div className="absolute right-6 top-6 opacity-10 select-none pointer-events-none">
                <span className="material-symbols-outlined text-white text-[70px]" style={{ fontVariationSettings: "'FILL' 0" }}>school</span>
              </div>
            </div>

            {/* Content Area */}
            <div className="px-6 md:px-8 pb-8 relative">
              {/* Avatar + Info row (overlapping banner) */}
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-20 mb-6">
                
                {/* Avatar with + upload button */}
                <div className="relative flex-shrink-0">
                  <motion.div 
                    layoutId="userAvatarImageWrapper"
                    className="w-28 h-28 md:w-32 md:h-32 rounded-full ring-4 ring-white shadow-md border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center font-bold text-3xl text-blue-600 relative"
                  >
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.name} fill sizes="(max-width: 768px) 112px, 128px" className="object-cover" />
                    ) : (
                      <span className="select-none">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </motion.div>

                  {/* Upload overlay */}
                  <AnimatePresence>
                    {isUploadingAvatar && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full z-10"
                      >
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* + button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    title="Change profile photo"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer z-20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'wght' 700" }}>add</span>
                  </button>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />

                  {/* Verified badge */}
                  {user.isVerified && (
                    <VerifiedBadge size="sm" className="absolute top-0 right-0 z-20" />
                  )}
                </div>

                {/* Name / bio / actions */}
                <div className="flex-1 min-w-0 md:mb-2 space-y-2">
                  {/* Name row */}
                  <div className="flex flex-wrap items-center gap-2 max-w-full">
                    <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight leading-tight truncate max-w-[240px] sm:max-w-[320px] md:max-w-[450px]" title={user.name}>
                      {user.name}
                    </h1>
                    {user.isVerified && (
                      <VerifiedBadge size="sm" className="flex-shrink-0" />
                    )}
                  </div>

                  {/* Academic badge */}
                  <div className="flex flex-wrap gap-1.5">
                    {user.year && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-100 shrink-0 uppercase tracking-wide">
                        {formatYear(user.year)}
                      </span>
                    )}
                    {user.department && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md border border-slate-200/70 shrink-0 truncate max-w-[160px]">
                        {user.department}
                      </span>
                    )}
                  </div>

                  {user.bio && (
                    <p className="text-slate-500 text-xs md:text-sm max-w-lg leading-relaxed font-medium">
                      {user.bio}
                    </p>
                  )}

                  {user.email && (
                    <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs">{user.email}</p>
                  )}
                </div>

                <div className="shrink-0 md:mb-2">
                  <button
                    onClick={() => {
                      setEditName(user.name || '');
                      setEditBio(user.bio || '');
                      setEditDept(user.department || '');
                      setEditYear(user.year || '');
                      setEditPhone(user.phone || '');
                      setIsEditModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active-press"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    Edit Profile
                  </button>
                </div>

              </div>

              {/* Campus Metadata Badge ID System */}
              <div className="mt-6 pt-6 border-t border-slate-100 relative z-10">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-3">Student Identity</span>
                <div className="flex flex-wrap gap-2 items-center">
                  {/* State */}
                  {user.college?.state && typeof user.college.state === 'string' && user.college.state.length < 40 && (
                    <div className="bg-slate-100 text-slate-700 border border-slate-200/60 rounded-lg px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1">
                      <span className="text-slate-400">📍</span>
                      <span className="truncate max-w-[90px]">{user.college.state}</span>
                    </div>
                  )}
                  {/* College */}
                  <div className="bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1">
                    <span>🎓</span>
                    <span className="truncate max-w-[140px]">{user.college?.name || '—'}</span>
                  </div>
                  {/* Department */}
                  {user.department && (
                    <div className="bg-slate-100 text-slate-700 border border-slate-200/60 rounded-lg px-2.5 py-1 text-[10px] font-semibold">
                      {user.department}
                    </div>
                  )}
                  {/* Joined */}
                  <div className="bg-slate-100 text-slate-600 border border-slate-200/60 rounded-lg px-2.5 py-1 text-[10px] font-semibold ml-auto flex items-center gap-1">
                    <span className="text-slate-400">📅</span>
                    <span>{memberSince || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* end lg:col-span-8 */}

        {/* Trust & Verification Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between h-full min-h-[300px]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-5">Trust &amp; Reliability</h3>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-5 relative">
                {/* Trust score ring */}
                <div className="relative w-20 h-20 mb-3">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="33" fill="none" stroke="currentColor" className="text-slate-100" strokeWidth="7" />
                    <circle
                      cx="40" cy="40" r="33"
                      fill="none"
                      stroke="currentColor"
                      className="text-blue-600 transition-all duration-700"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 33}`}
                      strokeDashoffset={`${2 * Math.PI * 33 * (1 - trustScore / 100)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-lg text-blue-600">{trustScore}%</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-800 mb-0.5">
                  {user.isVerified ? 'Verified Trust Score' : 'Standard Trust Score'}
                </p>
                <p className="text-[10px] text-slate-400 text-center px-4 font-medium leading-relaxed">
                  {user.isVerified ? 'Identity confirmed ✓' : 'Verify your identity to boost score'}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-blue-600" style={{ fontVariationSettings: "'FILL' 0" }}>school</span>
                    <span className="text-xs font-semibold">Edu Verified</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-blue-600" style={{ fontVariationSettings: "'FILL' 0" }}>id_card</span>
                    <span className="text-xs font-semibold">ID Verified</span>
                  </div>
                  {user.isVerified ? (
                    <span className="material-symbols-outlined text-[18px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px] text-slate-300" style={{ fontVariationSettings: "'FILL' 0" }}>cancel</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-blue-600" style={{ fontVariationSettings: "'FILL' 0" }}>account_balance</span>
                    <span className="text-xs font-semibold">Financial History</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Verification Banner (only when not verified) ─────────────── */}
      {!user.isVerified && (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 30 },
            show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 140, damping: 18 } }
          }}
          className="w-full bg-blue-50/30 border border-blue-100/60 rounded-2xl p-6 space-y-3 font-body shadow-sm"
        >
          <div className="flex items-center gap-2 text-blue-600">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
            <p className="text-xs font-bold">
              {user.verificationStatus === 'pending'
                ? 'Documents Under Review'
                : user.verificationStatus === 'rejected'
                ? 'Verification Rejected'
                : 'Complete Student Identity Verification'}
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl font-medium">
            {user.verificationStatus === 'pending'
              ? 'Your uploaded documents are currently being validated. Verification usually takes less than 24 hours.'
              : user.verificationStatus === 'rejected'
              ? 'Your previous student verification attempt was rejected. Please upload clear and valid document photos to re-verify.'
              : 'Upload your Student ID card and selfie to get your verified checkmark and unlock buying & selling.'}
          </p>
          {user.verificationStatus !== 'pending' && (
            <div className="pt-2">
              <Link
                href={`/verify?userId=${user._id}`}
                className="inline-flex items-center justify-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer text-center shadow-sm active-press"
              >
                {user.verificationStatus === 'rejected' ? 'Re-Verify Profile Now 🚀' : 'Verify Profile Now 🚀'}
              </Link>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Profile Tabs (Active Listings | Saved Items | My Posts) ──────── */}
      <div className="flex border-b border-slate-200 gap-6 mt-8 relative">
        {[
          { id: 'listings', label: 'Active Listings' },
          { id: 'saved', label: 'Saved Items' },
          { id: 'posts', label: 'My Posts' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative py-3.5 px-1 -mb-[1px] text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#2563EB] font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className="relative z-10">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="profileTabActiveLine"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2563EB] rounded-full z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Contents ────────────────────────────────────────────── */}
      <div className="mt-6">
        {activeTab === 'listings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Active Listings</h2>
                <p className="text-[11px] text-slate-400 font-medium">Items you have posted in the Campus Market</p>
              </div>
              <Link href="/marketplace" className="text-xs font-semibold text-blue-600 flex items-center gap-1 group hover:underline">
                Browse Market
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingListings ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl h-64 animate-pulse" />
                ))
              ) : listings.length > 0 ? (
                listings.map((l) => {
                  const enrichedListing = {
                    ...l,
                    seller: l.seller && typeof l.seller === 'object' ? l.seller : {
                      _id: user._id,
                      name: user.name,
                      avatar: user.avatar,
                      department: user.department,
                      year: user.year,
                      isVerified: user.isVerified,
                      verificationStatus: user.verificationStatus,
                      isSuspicious: user.isSuspicious,
                    }
                  } as any;
                  return <ListingCard key={l._id} listing={enrichedListing} />;
                })
              ) : (
                <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[260px] shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50/10 to-transparent pointer-events-none" />
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-105 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[28px] text-blue-600" style={{ fontVariationSettings: "'FILL' 0" }}>storefront</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">No active listings yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium mx-auto mb-5">
                    Start selling by listing your textbooks, electronics, or gear directly on the campus market.
                  </p>
                  <Link href="/marketplace" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-200">
                    Go to Marketplace
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Saved Items</h2>
                <p className="text-[11px] text-slate-400 font-medium">Marketplace listings you have bookmarked</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingSaved ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl h-64 animate-pulse" />
                ))
              ) : savedListings.length > 0 ? (
                savedListings.map((l) => (
                  <ListingCard key={l._id} listing={l} />
                ))
              ) : (
                <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[260px] shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50/10 to-transparent pointer-events-none" />
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-105 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[28px] text-blue-600" style={{ fontVariationSettings: "'FILL' 0" }}>bookmark</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">No saved listings</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium mx-auto mb-5">
                    Bookmark interesting items in the marketplace to view them here later.
                  </p>
                  <Link href="/marketplace" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-200">
                    Browse Listings
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-sm font-bold text-slate-900">My Posts</h2>
                <p className="text-[11px] text-slate-400 font-medium">Social posts you have shared with the campus</p>
              </div>
            </div>

            <div className="max-w-2xl space-y-6">
              {isLoadingPosts ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl h-44 animate-pulse" />
                ))
              ) : posts.length > 0 ? (
                posts.map((p) => (
                  <PostCard key={p._id} post={p} onDelete={(id) => setPosts(prev => prev.filter(item => item._id !== id))} />
                ))
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[260px] shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50/10 to-transparent pointer-events-none" />
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-105 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[28px] text-blue-600" style={{ fontVariationSettings: "'FILL' 0" }}>forum</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">No posts yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium mx-auto mb-5">
                    Start sharing updates, academic queries, or events with your campus community.
                  </p>
                  <Link href="/feed" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-200">
                    Go to Feed
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────── */}
      <motion.section 
        variants={{
          hidden: { opacity: 0, y: 30 },
          show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 140, damping: 18 } }
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px] text-blue-650" style={{ fontVariationSettings: "'FILL' 0" }}>storefront</span>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{listings.length}</p>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Listings</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px] text-blue-650" style={{ fontVariationSettings: "'FILL' 0" }}>verified_user</span>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">
              {user.verificationStatus === 'verified'
                ? 'Verified'
                : user.verificationStatus === 'pending'
                ? 'Pending'
                : user.verificationStatus === 'rejected'
                ? 'Rejected'
                : 'Unverified'}
            </p>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">ID Status</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px] text-blue-650" style={{ fontVariationSettings: "'FILL' 0" }}>military_tech</span>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{user.year ? formatYear(user.year) : 'Member'}</p>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Student Level</p>
          </div>
        </div>
      </motion.section>

      {/* ── Logout ──────────────────────────────────────────────────── */}
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 15 },
          show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } }
        }}
        className="pt-2 max-w-xs mx-auto"
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100/70 border border-red-200 text-red-650 text-xs font-bold rounded-2xl transition-all cursor-pointer active-press"
        >
          🚪 Logout from Session
        </button>
      </motion.div>

      {/* ── Edit Profile Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative z-10 w-full max-w-lg bg-white border border-slate-205 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col font-body"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-200 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-bold text-slate-500 hover:text-slate-900">close</span>
              </button>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Profile</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Update your academic and personal information</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name field */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-body"
                      />
                    </div>

                    {/* Department field */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-1">Department / Course</label>
                      <input
                        type="text"
                        value={editDept}
                        onChange={(e) => setEditDept(e.target.value)}
                        placeholder="e.g. Computer Science & Engineering"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-body"
                      />
                    </div>

                    {/* Year select */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-1">Academic Year</label>
                      <select
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%23475569%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_10px_center] bg-no-repeat cursor-pointer font-body"
                      >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="PG">Postgraduate</option>
                      </select>
                    </div>

                    {/* Phone field */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-1">Contact Phone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-body"
                      />
                    </div>

                    {/* Bio textarea */}
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex justify-between pl-1">
                        <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Short Bio</label>
                        <span className="text-[9px] text-slate-450 font-bold">{editBio.length}/200</span>
                      </div>
                      <textarea
                        maxLength={200}
                        rows={3}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Tell campus members a bit about yourself…"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 resize-none text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all leading-relaxed font-body"
                      />
                    </div>
                  </div>

                  {/* Modal Footer Controls */}
                  <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      disabled={isSaving}
                      className="flex-1 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] transition-all cursor-pointer text-center disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {isSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
