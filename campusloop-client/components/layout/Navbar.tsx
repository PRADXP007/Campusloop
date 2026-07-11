'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// ── Inline SVG icon set (no external dependency) ─────────────────────────
const Icons = {
  feed: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h3" />
    </svg>
  ),
  marketplace: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  chat: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  profile: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  plus: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
  logout: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { href: '/feed',        label: 'Feed',        icon: Icons.feed },
  { href: '/marketplace', label: 'Market',      icon: Icons.marketplace },
  { href: '/chat',        label: 'Chat',        icon: Icons.chat },
  { href: '/search',      label: 'Search',      icon: Icons.search },
  { href: '/profile',     label: 'Profile',     icon: Icons.profile },
];

export default function Navbar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuthStore();
  const [hovered, setHovered] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
    router.push('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-40 flex items-center">
      <div className="max-w-6xl w-full mx-auto h-full flex items-center justify-between px-6">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-sm border border-slate-200 bg-slate-50">
            <Image src="/logo.png" alt="CampusLoop" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <span className="font-heading font-extrabold text-[#0F172A] text-base tracking-tight hidden sm:block">
            Campus<span className="text-[#2563EB]">Loop</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1.5 h-full">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onMouseEnter={() => setHovered(href)}
                onMouseLeave={() => setHovered(null)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer h-9 ${
                  active
                    ? 'text-[#2563EB]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {/* Active line indicator */}
                {active && (
                  <motion.div
                    layoutId="desktopNavActiveLine"
                    className="absolute bottom-[-14px] left-3 right-3 h-[2.5px] bg-[#2563EB] rounded-full z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                {/* Hover glow */}
                {hovered === href && !active && (
                  <motion.div
                    layoutId="desktopNavHoverPill"
                    className="absolute inset-0 bg-slate-50 rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex-shrink-0">{icon}</span>
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right — sell button + user avatar */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/marketplace/new"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-sm shadow-blue-500/10 hover:shadow-md hover:shadow-blue-500/20 hover:scale-[1.02] active-press cursor-pointer"
          >
            {Icons.plus}
            <span>Sell</span>
          </Link>

          {user && (
            <div className="relative group">
              <button
                id="navbar-avatar-btn"
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                <motion.div
                  layoutId="userAvatarImageWrapper"
                  className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-bold text-[#2563EB] overflow-hidden"
                >
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.name} width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </motion.div>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50 translate-y-1 group-hover:translate-y-0 p-1.5">
                {/* User info */}
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-[#0F172A] truncate">{user.name}</p>
                  <p className="text-[10px] text-[#64748B] truncate font-medium mt-0.5">{user.email}</p>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] transition-all cursor-pointer"
                  >
                    {Icons.profile}
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/marketplace/my"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] transition-all cursor-pointer"
                  >
                    {Icons.marketplace}
                    <span>My Listings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-error)] hover:bg-red-50/50 transition-all cursor-pointer text-left"
                  >
                    {Icons.logout}
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
