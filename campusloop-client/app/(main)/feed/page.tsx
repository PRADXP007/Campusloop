'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import type { Post } from '@/types';
import PostCard from '@/components/feed/PostCard';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import TiltCard from '@/components/ui/TiltCard';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

const formatYear = (year: string | number) => {
  const y = String(year);
  if (y === '1') return '1st Year';
  if (y === '2') return '2nd Year';
  if (y === '3') return '3rd Year';
  if (y === '4') return '4th Year';
  if (y === 'PG') return 'Postgraduate';
  return y ? `${y} Year` : 'Student';
};

export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Post creation state
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isCreatorFocused, setIsCreatorFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sidebar stats — not real data, will show dashes
  const followers = 0;
  const following = 0;

  // Fetch initial feed
  const fetchFeed = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const { data } = await api.get('/posts');
      if (data.success) {
        setPosts(data.posts || []);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      }
    } catch {
      toast.error('Could not load college feed');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  // Load more posts
  const handleLoadMore = async () => {
    if (isMoreLoading || !nextCursor || !hasMore) return;
    setIsMoreLoading(true);
    try {
      const { data } = await api.get('/posts', { params: { before: nextCursor } });
      if (data.success) {
        setPosts((prev) => [...prev, ...(data.posts || [])]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      }
    } catch {
      toast.error('Could not load older posts');
    } finally {
      setIsMoreLoading(false);
    }
  };

  // Image selection helpers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - selectedImages.length;
    const toAdd = files.slice(0, remaining);

    if (files.length > remaining) {
      toast.error('You can upload up to 4 images for a post');
    }

    const newPreviews = toAdd.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setSelectedImages((prev) => [...prev, ...toAdd]);
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && selectedImages.length === 0) return;
    setIsPosting(true);

    const formData = new FormData();
    formData.append('content', postContent.trim());
    selectedImages.forEach((img) => {
      formData.append('images', img);
    });

    try {
      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success && data.post) {
        toast.success('Post shared successfully!');
        setPostContent('');
        setSelectedImages([]);
        setImagePreviews([]);
        setPosts((prev) => [data.post, ...prev]);
        setIsCreatorFocused(false);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Could not share post';
      toast.error(errorMsg);
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostDeleted = (id: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== id));
    toast.success('Post deleted');
  };

  const handleAuthorBlocked = (authorId: string) => {
    setPosts((prev) => prev.filter((p) => p.author._id !== authorId));
  };

  return (
    <div className="py-6 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 relative z-10">
      {/* LEFT & CENTER — Post Creator + Feed Stream */}
      <div className="lg:col-span-2 space-y-6">
        {/* Welcome Greeting Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl bg-blue-50/50 border border-blue-100/85 p-5 shadow-sm"
        >
          <div className="relative z-10 space-y-1">
            <h1 className="text-lg font-bold text-slate-900">
              Hey, {user?.name.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Welcome to the campus lounge. Share events, ask questions, or connect with peers in{' '}
              <span className="text-blue-650 font-bold">
                {user?.college?.name || 'your college'}
              </span>
              .
            </p>
          </div>
        </motion.div>

        {/* Post Creator Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{
            opacity: 1,
            y: 0,
            borderColor: isCreatorFocused ? '#2563EB' : '#CBD5E1',
            boxShadow: isCreatorFocused
              ? '0 10px 25px -5px rgba(37,99,235,0.08), 0 8px 10px -6px rgba(37,99,235,0.08)'
              : '0 1px 3px 0 rgba(0,0,0,0.05)'
          }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl p-5 border relative overflow-hidden transition-all duration-200"
        >
          <div className="flex gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 flex-shrink-0 overflow-hidden shadow-sm">
              {user?.avatar ? (
                <Image src={user.avatar} alt="" width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0).toUpperCase()
              )}
            </div>

            <form onSubmit={handleCreatePost} className="flex-1 space-y-4">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                onFocus={() => setIsCreatorFocused(true)}
                onBlur={(e) => {
                  if (!e.currentTarget.form?.contains(e.relatedTarget)) {
                    setIsCreatorFocused(false);
                  }
                }}
                placeholder="What's happening on campus today? Use #hashtags..."
                maxLength={500}
                rows={isCreatorFocused || postContent.trim() ? 4 : 2}
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 border-none outline-none focus:ring-0 text-sm leading-relaxed resize-none pt-2 font-medium transition-all duration-300"
                disabled={isPosting}
              />

              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {imagePreviews.map((src, idx) => (
                    <div key={src} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                      <Image src={src} alt="Upload Preview" fill unoptimized className="object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer active-press"
                      >
                        <span className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-transform">✕</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    multiple
                    accept="image/*"
                    className="hidden"
                    disabled={isPosting || selectedImages.length >= 4}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPosting || selectedImages.length >= 4}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active-press"
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate-500">image</span>
                    <span>Add Image ({selectedImages.length}/4)</span>
                  </button>

                  {user?.department && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm pointer-events-none select-none">
                      <span className="material-symbols-outlined text-[16px] text-slate-500">tag</span>
                      <span>{user.department}</span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isPosting}
                  disabled={!postContent.trim() && selectedImages.length === 0}
                  className="font-semibold shadow-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1.5 text-xs transition-colors"
                >
                  Post
                </Button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Posts Feed Stream */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 space-y-4 border border-slate-200 relative overflow-hidden animate-pulse shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="space-y-2.5 pt-2">
                    <div className="h-3.5 bg-slate-200 rounded w-full" />
                    <div className="h-3.5 bg-slate-200 rounded w-5/6" />
                  </div>
                  <div className="h-9 bg-slate-100 rounded-lg w-1/2 mt-4" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-12 text-center relative overflow-hidden flex flex-col items-center justify-center border border-slate-200 shadow-sm"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-50/50 rounded-full blur-2xl pointer-events-none" />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-5 z-10"
              >
                <span className="material-symbols-outlined text-blue-600 text-3xl">campaign</span>
              </motion.div>

              <h2 className="text-lg font-bold text-slate-900 mb-2 relative z-10">Campus Lounge is Quiet</h2>
              <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed font-medium mb-6 relative z-10">
                Be the spark! No posts have been shared in your college feed yet. Share events, ask questions, or connect with peers today.
              </p>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                  const textarea = document.querySelector('textarea');
                  if (textarea) textarea.focus();
                }}
                className="relative z-10 active-press font-semibold shadow-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs"
              >
                Write the First Post
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08
                  }
                }
              }}
              className="space-y-6"
            >
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onDelete={handlePostDeleted}
                  onAuthorBlocked={handleAuthorBlocked}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="secondary"
                    size="md"
                    isLoading={isMoreLoading}
                    onClick={handleLoadMore}
                    className="font-bold border-white/60 bg-white/40 hover:bg-white/70"
                  >
                    Load Older Posts
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* RIGHT — User Profile Sticky Card + Navigation links + Footer (Hidden on mobile/tablet) */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="space-y-5 lg:sticky lg:top-24">
          {/* Profile Card */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 animate-pulse">
              <div className="h-16 bg-slate-100 rounded-xl w-full" />
              <div className="flex flex-col items-center -mt-10 space-y-2.5">
                <div className="w-16 h-16 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
              <div className="border-t border-b border-slate-100 py-3.5 flex justify-around">
                <div className="w-10 h-7 bg-slate-100 rounded" />
                <div className="w-10 h-7 bg-slate-100 rounded" />
              </div>
              <div className="h-8 bg-slate-200 rounded-xl w-full" />
            </div>
          ) : (
            <TiltCard>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                {/* Mini banner */}
                <div className="h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:12px_12px]" />
                </div>
                <div className="flex flex-col items-center text-center relative z-10 px-5 pb-5 -mt-8">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-md mb-3 bg-slate-50 flex items-center justify-center font-bold text-xl text-blue-600 ring-2 ring-blue-100">
                    {user?.avatar ? (
                      <Image src={user.avatar} alt={user.name} width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      user?.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 mb-0.5 flex items-center justify-center gap-1.5 max-w-full">
                    <span className="truncate max-w-[130px]">{user?.name}</span>
                    {user?.isVerified && (
                      <VerifiedBadge size="sm" className="flex-shrink-0" />
                    )}
                  </h2>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 truncate max-w-full px-2">
                    {user?.year ? formatYear(user.year) : 'Student'}
                  </p>
                  <p className="text-slate-400 text-[10px] font-medium mb-4 truncate w-full max-w-[180px] text-center px-1" title={user?.college?.name}>
                    {user?.college?.shortName || user?.college?.name || 'Campus'}
                  </p>

                  <div className="flex justify-around w-full border-t border-b border-slate-100 py-3 mb-4">
                    <div className="text-center">
                      <span className="block text-sm font-bold text-blue-600">{followers}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Followers</span>
                    </div>
                    <div className="w-px bg-slate-100" />
                    <div className="text-center">
                      <span className="block text-sm font-bold text-blue-600">{following}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Following</span>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors text-center shadow-sm active-press"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </TiltCard>
          )}

          {/* Quick Navigation Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Navigation
            </h3>
             <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/marketplace"
                className="p-3 bg-slate-50/60 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-xl text-slate-600 hover:text-blue-600 transition-all duration-300 flex items-center gap-2.5 font-bold text-xs cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Shop</span>
              </Link>
              <Link
                href="/chat"
                className="p-3 bg-slate-50/60 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-xl text-slate-600 hover:text-blue-600 transition-all duration-300 flex items-center gap-2.5 font-bold text-xs cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chats</span>
              </Link>
              <div className="p-3 bg-slate-50/20 border border-slate-100 rounded-xl text-slate-350 font-bold opacity-60 flex items-center gap-2.5 text-xs cursor-not-allowed">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Events</span>
              </div>
              <div className="p-3 bg-slate-50/20 border border-slate-100 rounded-xl text-slate-350 font-bold opacity-60 flex items-center gap-2.5 text-xs cursor-not-allowed">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Notes</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 text-[10px] font-semibold text-slate-400 tracking-wide leading-relaxed space-y-1">
            <p>© 2026 CampusLoop Systems. All rights reserved.</p>
            <div className="flex gap-2">
              <span className="hover:underline cursor-pointer">Privacy Policy</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Terms</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Help</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
