'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const featureCards = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    name: 'Marketplace',
    desc: 'Buy & sell within your campus',
    href: '/marketplace',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h3" />
      </svg>
    ),
    name: 'College Feed',
    desc: 'Share moments & campus events',
    href: '/feed',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    name: 'Secure Chat',
    desc: 'Message verified students safely',
    href: '/chat',
  },
];

const trustBadges = [
  { label: 'Verified Students Only' },
  { label: 'College Email Required' },
  { label: '100% Free to Join' },
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/feed');
      } else {
        setCheckingAuth(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md bg-white">
            <Image src="/logo.png" alt="CampusLoop" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-body relative overflow-x-hidden">
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm z-50 flex items-center"
      >
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 bg-slate-50 shadow-sm">
              <Image src="/logo.png" alt="CampusLoop Logo" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-[#0F172A] tracking-tight text-base font-heading">
              Campus<span className="text-[#2563EB]">Loop</span>
            </span>
          </div>
          <Link
            href="/login"
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-55 px-4 py-2 rounded-xl border border-slate-200 transition-all duration-200 shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </motion.header>

      {/* ── Hero Section ── */}
      <section className="pt-32 pb-16 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 max-w-3xl"
        >
          <span className="inline-flex items-center text-[10px] font-extrabold tracking-widest text-[#2563EB] uppercase bg-blue-50 border border-blue-100 rounded-full px-3.5 py-1.5 shadow-sm">
            ✦ Indian Campus Community Hub
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight font-heading">
            The Social Network + Marketplace <br className="hidden sm:inline" />
            Built for Your <span className="text-[#2563EB]">Campus</span>
          </h1>
          <p className="text-base text-slate-650 max-w-xl mx-auto leading-relaxed">
            Buy, sell, share updates, and connect with verified peers at your college. Built exclusively for Indian university student networks.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-2xl transition-all duration-200 shadow-sm shadow-blue-500/10 hover:shadow-md hover:shadow-blue-500/20 active-press font-heading cursor-pointer"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/marketplace"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-2xl border border-slate-200 transition-all duration-200 shadow-sm active-press cursor-pointer"
            >
              Explore Marketplace
            </Link>
          </div>
        </motion.div>

        {/* ── SaaS Mockup Showcase ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15 }}
          className="mt-12 w-full border border-slate-200 rounded-3xl bg-slate-50/70 p-2.5 shadow-xl"
        >
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-inner bg-white relative aspect-[4/3] sm:aspect-[16/10] w-full">
            <Image src="/hero-preview.png" alt="CampusLoop Dashboard Preview" fill className="object-cover" priority />
          </div>
        </motion.div>
      </section>

      {/* ── Feature Pillars Section ── */}
      <section className="py-16 px-6 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              Everything Your Campus Needs, in One Loop
            </h2>
            <p className="text-sm text-slate-550 leading-relaxed">
              Say goodbye to messy public chat groups and spammy boards. CampusLoop brings all university activities into a structured dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h3" />
                  </svg>
                ),
                title: 'Campus Social Feed',
                desc: 'Stay updated on college life. Share events, raise academic questions, and engage with peers in your specific department.',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: 'College Marketplace',
                desc: 'Declutter and save money. Buy and sell textbooks, course prep materials, electronics, and bicycle gear safely within your verified student network.',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: 'Smart Discovery Filters',
                desc: 'Filter by State, District, College, and Department. Find the exact items or updates you need nearby without browsing noise.',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: 'Real-time Peer Chat',
                desc: 'Connect instantly. Negotiate pricing or arrange a safe pick-up spot on campus using our secure, built-in real-time chat room.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-5 border border-slate-200 rounded-2xl bg-[#F8FAFC] shadow-sm hover:border-slate-300 transition-all duration-200 flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] flex-shrink-0 shadow-sm">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-body">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Stats Strip ── */}
          <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-20 mt-16 pt-8 border-t border-slate-100">
            {[
              { value: '50,000+', label: 'Verified Students' },
              { value: '200+', label: 'Active Colleges' },
              { value: '10,000+', label: 'Social Listings' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action Banner ── */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="bg-[#0F172A] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl flex flex-col items-center">
          {/* Subtle glow blobs */}
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-blue-500/10 blur-[80px]" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-blue-600/10 blur-[80px]" />

          <div className="relative z-10 space-y-6 max-w-xl">
            <h2 className="text-3xl font-black font-heading leading-tight">
              Ready to Join Your Campus Loop?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-body">
              Sign up today with your official college email domain. It takes less than 2 minutes to create a free account and start connecting.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-900 text-sm font-bold rounded-2xl transition-all duration-200 shadow-lg cursor-pointer"
              >
                Create Free Account
              </Link>
            </div>
            <p className="text-[9px] text-slate-400 font-medium">
              * Requires college email verification (e.g. name@college.edu.in)
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center">
        <p className="text-[10px] text-slate-400 font-body tracking-wider">
          CampusLoop © {new Date().getFullYear()} • Exclusive to verified Indian campus domains
        </p>
      </footer>
    </div>
  );
}
