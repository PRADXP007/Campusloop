'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Post, Comment } from '@/types';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import TiltCard from '@/components/ui/TiltCard';

// ─── Helpers ──────────────────────────────────────────────────────────────

const timeAgo = (dateStr: string) => {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const secs  = Math.floor(diff / 1000);
  const mins  = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (secs  < 60)  return 'just now';
  if (mins  < 60)  return `${mins}m`;
  if (hours < 24)  return `${hours}h`;
  if (days  < 7)   return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const renderContent = (content: string) => {
  return content.split(/(\s)/g).map((word, i) => {
    if (word.startsWith('#')) {
      return <span key={i} className="text-blue-600 font-bold hover:underline cursor-pointer">{word}</span>;
    }
    if (word.startsWith('@')) {
      return <span key={i} className="text-blue-900 font-bold hover:underline cursor-pointer">{word}</span>;
    }
    return word;
  });
};

// ─── Image gallery strip ──────────────────────────────────────────────────

function ImageStrip({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!images.length) return null;

  const layouts: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2',
  };
  const layout = layouts[Math.min(images.length, 4)] ?? 'grid-cols-2';

  return (
    <>
      <div className={`grid ${layout} gap-1.5 rounded-2xl overflow-hidden`}>
        {images.slice(0, 4).map((src, i) => (
          <div
            key={src}
            className={`relative bg-[var(--color-surface-2)] cursor-zoom-in overflow-hidden ${images.length === 3 && i === 0 ? 'row-span-2' : ''}`}
            style={{ aspectRatio: images.length === 1 ? '16/10' : '1/1' }}
            onClick={() => setLightbox(src)}
          >
            <Image src={src} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover hover:scale-105 transition-transform duration-500 ease-out" />
            {i === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center text-white font-bold text-lg">
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={lightbox}
              alt=""
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
            <button
              className="absolute top-4 right-4 w-9 h-9 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full flex items-center justify-center text-[var(--color-text)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              onClick={() => setLightbox(null)}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Comment item ─────────────────────────────────────────────────────────

function CommentItem({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: Comment;
  currentUserId: string;
  onDelete: (id: string) => void;
}) {
  const isOwner = comment.author._id === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex gap-3 group"
    >
      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 flex-shrink-0 overflow-hidden mt-0.5 shadow-sm">
        {comment.author.avatar ? (
          <Image src={comment.author.avatar} alt="" width={32} height={32} className="w-full h-full object-cover" />
        ) : (
          comment.author.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 inline-block max-w-full shadow-sm relative">
          <div className="flex items-center gap-1">
            <p className="text-xs font-bold text-slate-900 leading-tight">{comment.author.name}</p>
            {comment.author.isVerified && <VerifiedBadge size="sm" />}
          </div>
          <p className="text-xs text-slate-800 mt-1 break-words leading-relaxed font-medium">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-2">
          <span className="text-[9px] text-[var(--color-text-muted)] font-bold">{timeAgo(comment.createdAt)}</span>
          {isOwner && (
            <button
              onClick={() => onDelete(comment._id)}
              className="text-[9px] font-extrabold text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main PostCard ─────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onAuthorBlocked?: (authorId: string) => void;
}

export default function PostCard({ post, onDelete, onAuthorBlocked }: PostCardProps) {
  const { user } = useAuthStore();

  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiked,    setIsLiked]    = useState(post.isLiked);
  const [likeAnim,   setLikeAnim]   = useState(false);

  const [showComments,  setShowComments]  = useState(false);
  const [comments,      setComments]      = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [commentText,   setCommentText]   = useState('');
  const [commentHasMore, setCommentHasMore] = useState(false);
  const [commentPage,    setCommentPage]    = useState(1);
  const [isLoadingCmts,  setIsLoadingCmts]  = useState(false);
  const [isPosting,      setIsPosting]      = useState(false);

  const isOwner = user?._id === post.author._id;

  const [showMenu, setShowMenu] = useState(false);

  const handleBlockUser = async () => {
    if (!confirm(`Block ${post.author.name}? You will no longer see their posts, marketplace listings, or messages.`)) return;
    try {
      await api.post(`/users/${post.author._id}/block`);
      toast.success(`${post.author.name} blocked successfully.`);
      setShowMenu(false);
      onAuthorBlocked?.(post.author._id);
    } catch {
      toast.error('Could not block user.');
    }
  };

  const handleReportUser = async () => {
    const reason = prompt(`Why are you reporting ${post.author.name}? (e.g. scammer, inappropriate content, harassment)`);
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Report reason is required.');
      return;
    }

    try {
      await api.post(`/users/${post.author._id}/report`, { reason: reason.trim() });
      toast.success('Report submitted. We will review this account.');
      setShowMenu(false);
    } catch {
      toast.error('Could not submit report.');
    }
  };

  // ── Like ──────────────────────────────────────────────────────────────

  const handleLike = useCallback(async () => {
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
    if (!wasLiked) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 400); }

    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } catch {
      setIsLiked(wasLiked);
      setLikesCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
      toast.error('Could not update like');
    }
  }, [isLiked, post._id]);

  // ── Comments ──────────────────────────────────────────────────────────

  const loadComments = useCallback(async (page = 1) => {
    setIsLoadingCmts(true);
    try {
      const { data } = await api.get(`/posts/${post._id}/comments`, { params: { page, limit: 10 } });
      if (page === 1) setComments(data.comments);
      else setComments((prev) => [...prev, ...data.comments]);
      setCommentHasMore(data.hasMore);
      setCommentPage(page);
    } catch {
      toast.error('Could not load comments');
    } finally {
      setIsLoadingCmts(false);
    }
  }, [post._id]);

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) loadComments(1);
    setShowComments((v) => !v);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isPosting) return;
    setIsPosting(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, { content: commentText.trim() });
      setComments((prev) => [...prev, data.comment]);
      setCommentsCount((c) => c + 1);
      setCommentText('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Could not post comment');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/posts/${post._id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentsCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error('Could not delete comment');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete?.(post._id);
    } catch {
      toast.error('Could not delete post');
    }
  };

  return (
    <TiltCard>
      <motion.article
        variants={{
          hidden: { opacity: 0, y: 30, scale: 0.95 },
          show: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: {
              type: 'spring',
              stiffness: 100,
              damping: 18,
              mass: 0.8
            }
          }
        }}
        whileHover={{ 
          y: -2, 
          boxShadow: "0 10px 25px -5px rgba(15,23,42,0.08), 0 8px 10px -6px rgba(15,23,42,0.08)" 
        }}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 relative group/card shadow-sm"
      >
      {/* Pinned badge */}
      {post.isPinned && (
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-50 border-b border-blue-100 relative z-10">
          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">📌 Pinned Announcement</span>
        </div>
      )}

      {post.author.isSuspicious && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border-b border-red-100 text-red-600 text-xs font-bold relative z-10 animate-pulse">
          <span className="text-sm">⚠️</span>
          <span>Warning: This account has been flagged for suspicious activity.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 flex-shrink-0 overflow-hidden shadow-sm">
            {post.author.avatar ? (
              <Image src={post.author.avatar} alt="" width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              post.author.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-900 leading-none">{post.author.name}</p>
              {post.author.isVerified && <VerifiedBadge size="sm" />}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-none">
              {[post.author.department, post.author.year ? `Year ${post.author.year}` : ''].filter(Boolean).join(' · ')}
              {' · '}
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)]/60 transition-all cursor-pointer flex-shrink-0"
            aria-label="More actions"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 mt-1 w-40 bg-white/95 border border-[var(--color-surface-2)] rounded-2xl shadow-xl z-30 py-1.5 overflow-hidden backdrop-blur-md font-body"
                >
                  {isOwner ? (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDeletePost();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-[var(--color-primary)] hover:bg-rose-500/5 transition-colors cursor-pointer"
                    >
                      🗑️ Delete Post
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleBlockUser}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
                      >
                        🚫 Block User
                      </button>
                      <button
                        onClick={handleReportUser}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-[var(--color-primary)] hover:bg-rose-500/5 transition-colors cursor-pointer"
                      >
                        ⚠️ Report User
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-3.5 pb-2 relative z-10">
        <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap font-medium">
          {renderContent(post.content)}
        </p>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3 relative z-10">
          {post.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100 rounded-lg px-2.5 py-0.5 cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Images */}
      {post.images.length > 0 && (
        <div className="px-5 pb-4 relative z-10">
          <ImageStrip images={post.images} />
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 relative z-10">
        {/* Like */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border ${
            isLiked
              ? 'text-blue-600 bg-blue-50/50 border-blue-200/80 shadow-sm'
              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/30 border-transparent'
          }`}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <motion.span
            animate={likeAnim ? { scale: [1, 1.4, 0.9, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.45 }}
            className="inline-block"
          >
            {isLiked ? (
              <svg className="w-4 h-4 text-blue-600 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </motion.span>
          <span>{likesCount > 0 ? likesCount : 'Like'}</span>
        </motion.button>

        {/* Comment */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border ${
            showComments
              ? 'text-slate-900 bg-slate-100 border-slate-300 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 border-transparent'
          }`}
        >
          <span className="inline-block">
            {showComments ? (
              <svg className="w-4 h-4 text-slate-900 fill-current" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
          </span>
          <span>{commentsCount > 0 ? commentsCount : 'Comment'}</span>
        </motion.button>

        {/* Share */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/feed`);
            toast.success('Link copied to clipboard!');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100/65 transition-all duration-200 cursor-pointer ml-auto border border-transparent"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </motion.button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-[var(--color-border)] px-5 py-4 space-y-4 overflow-hidden relative z-10 bg-white/30"
          >
            {/* Post comment */}
            <form onSubmit={handlePostComment} className="flex gap-3 items-start">
              <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-[var(--color-primary)]/5 to-[var(--color-primary-hover)]/5 border border-[var(--color-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-primary)] flex-shrink-0 mt-0.5 overflow-hidden shadow-sm">
                {user?.avatar ? (
                  <Image src={user.avatar} alt="" width={34} height={34} className="w-full h-full object-cover" />
                ) : (
                  user?.name.charAt(0).toUpperCase() ?? '?'
                )}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  maxLength={300}
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all shadow-sm"
                  disabled={isPosting}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isPosting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                >
                  {isPosting ? '…' : 'Post'}
                </button>
              </div>
            </form>

            {/* Comment list */}
            {isLoadingCmts && comments.length === 0 ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-2)]/60 flex-shrink-0" />
                    <div className="flex-1 h-12 bg-[var(--color-surface-2)]/40 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => (
                  <CommentItem
                    key={c._id}
                    comment={c}
                    currentUserId={user?._id ?? ''}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </div>
            )}

            {/* Load more comments */}
            {commentHasMore && (
              <button
                onClick={() => loadComments(commentPage + 1)}
                disabled={isLoadingCmts}
                className="w-full text-[10px] font-extrabold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] py-2 transition-colors cursor-pointer disabled:opacity-50 tracking-wider"
              >
                {isLoadingCmts ? 'Loading…' : `LOAD MORE COMMENTS`}
              </button>
            )}

            {!isLoadingCmts && comments.length === 0 && (
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] text-center py-2">No comments yet. Write one!</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
    </TiltCard>
  );
}
