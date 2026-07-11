'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';
import api from '@/lib/api';
import type { Listing, Post } from '@/types';
import ListingCard from '@/components/marketplace/ListingCard';
import PostCard from '@/components/feed/PostCard';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

const SUGGESTIONS = ['MacBook', 'iPad', 'Cycle', 'Books', 'Camera', 'Calculator'];

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Electronics',
  'Civil Engineering',
  'Business',
  'Sciences',
  'Arts',
  'Other',
];

interface StateObj {
  _id: string;
  name: string;
}

interface DistrictObj {
  _id: string;
  name: string;
}

interface CollegeObj {
  _id: string;
  name: string;
  shortName?: string;
  city: string;
}

function SearchContent() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [searchScope, setSearchScope] = useState<'marketplace' | 'feed' | 'students'>('marketplace');

  // Filters State
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Dropdown Lists
  const [states, setStates] = useState<StateObj[]>([]);
  const [districts, setDistricts] = useState<DistrictObj[]>([]);
  const [colleges, setColleges] = useState<CollegeObj[]>([]);

  // Results & Loading
  const [listings, setListings] = useState<Listing[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);

  // Load States
  useEffect(() => {
    api.get('/states')
      .then(({ data }) => {
        if (data.success) setStates(data.states || []);
      })
      .catch(() => {});
  }, []);

  // Load Districts when state changes
  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      setSelectedDistrict('');
      setSelectedCollege('');
      return;
    }
    api.get(`/districts?stateId=${encodeURIComponent(selectedState)}`)
      .then(({ data }) => {
        if (data.success) {
          setDistricts(data.districts || []);
          setSelectedDistrict('');
          setSelectedCollege('');
        }
      })
      .catch(() => {});
  }, [selectedState]);

  // Load Colleges when district changes
  useEffect(() => {
    if (!selectedState || !selectedDistrict) {
      setColleges([]);
      setSelectedCollege('');
      return;
    }
    api.get(`/colleges?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`)
      .then(({ data }) => {
        if (data.success) {
          setColleges(data.colleges || []);
          setSelectedCollege('');
        }
      })
      .catch(() => {});
  }, [selectedState, selectedDistrict]);

  // Execute Search Query
  const fetchResults = async () => {
    setIsLoading(true);
    try {
      // Query marketplace active listings
      const listParams = q.trim() ? { q: q.trim() } : {};
      const { data: listRes } = await api.get('/listings', { params: listParams });
      if (listRes.success) {
        setListings(listRes.listings || []);
      }

      // Query lounge posts
      const { data: postRes } = await api.get('/posts');
      if (postRes.success) {
        setPosts(postRes.posts || []);
      }
    } catch {
      toast.error('Search failed to refresh');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [q]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  const handleSuggestionClick = (val: string) => {
    setQ(val);
  };

  // Start direct chat with student
  const handleStartChat = async (studentId: string) => {
    setIsStartingChat(studentId);
    try {
      const { data } = await api.post('/chat/conversations', { participantId: studentId });
      if (data.success && data.conversation) {
        router.push(`/chat?conversationId=${data.conversation._id}`);
      }
    } catch {
      toast.error('Could not open direct messaging channel');
    } finally {
      setIsStartingChat(null);
    }
  };

  // --- Local Filtering Logic ---
  const filteredListings = listings.filter((l) => {
    const colId = l.college?._id ? l.college._id.toString() : l.college?.toString();
    if (selectedCollege && colId !== selectedCollege) return false;
    if (selectedDepartment && l.seller?.department !== selectedDepartment) return false;
    return true;
  });

  const filteredPosts = posts.filter((p) => {
    // Text search locally
    if (q.trim()) {
      const searchLower = q.toLowerCase().trim();
      const matchContent = p.content.toLowerCase().includes(searchLower);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(searchLower));
      const matchAuthor = p.author?.name.toLowerCase().includes(searchLower);
      if (!matchContent && !matchTags && !matchAuthor) return false;
    }
    const colId = p.college?._id ? p.college._id.toString() : p.college?.toString();
    if (selectedCollege && colId !== selectedCollege) return false;
    if (selectedDepartment && p.author?.department !== selectedDepartment) return false;
    return true;
  });

  const compiledStudents = (() => {
    const studentMap = new Map<string, any>();

    posts.forEach((p) => {
      if (p.author && p.author._id) {
        studentMap.set(p.author._id, {
          ...p.author,
          collegeId: p.college?._id ? p.college._id.toString() : p.college?.toString(),
          collegeObj: p.college,
        });
      }
    });

    listings.forEach((l) => {
      if (l.seller && l.seller._id) {
        studentMap.set(l.seller._id, {
          ...l.seller,
          collegeId: l.college?._id ? l.college._id.toString() : l.college?.toString(),
          collegeObj: l.college,
        });
      }
    });

    return Array.from(studentMap.values()).filter((s) => {
      if (q.trim()) {
        const searchLower = q.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(searchLower);
        const matchDept = s.department?.toLowerCase().includes(searchLower);
        if (!matchName && !matchDept) return false;
      }
      if (selectedCollege && s.collegeId !== selectedCollege) return false;
      if (selectedDepartment && s.department !== selectedDepartment) return false;
      return true;
    });
  })();

  const clearFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedCollege('');
    setSelectedDepartment('');
  };

  const hasActiveFilters = selectedState || selectedDistrict || selectedCollege || selectedDepartment;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } }
      }}
      initial="hidden"
      animate="show"
      className="py-6 max-w-6xl mx-auto space-y-6 px-4 relative z-10 font-body"
    >
      {/* Header */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }}
        className="space-y-1.5"
      >
        <h1 className="text-3xl font-bold text-slate-900">Universal Search</h1>
        <p className="text-xs text-slate-500 font-medium">
          Discover college listings, lounge activities, and connect with peer students.
        </p>
      </motion.div>

      {/* Search Input Shell */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: -5 }, show: { opacity: 1, y: 0 } }}
        className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4"
      >
        <form onSubmit={handleSearchSubmit} className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </span>
          <input
            type="search"
            placeholder={
              searchScope === 'marketplace'
                ? 'Search tech, books, varsity gears...'
                : searchScope === 'feed'
                ? 'Search lounge posts, events, #tags...'
                : 'Search student names or departments...'
            }
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-medium"
            autoFocus
          />
        </form>

        {/* Suggested campus trends */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Trending:</span>
          {SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleSuggestionClick(tag)}
              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Advanced Discovery Filters */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 5 }, show: { opacity: 1, y: 0 } }}
        className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Advanced Campus Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-slate-450 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              ✕ Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* State */}
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border appearance-none outline-none cursor-pointer transition-all ${
                selectedState
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <option value="">Any State</option>
              {states.map((st) => (
                <option key={st._id} value={st._id} className="bg-white text-slate-700">
                  {st.name}
                </option>
              ))}
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-[9px]">▼</span>
          </div>

          {/* District */}
          <div className="relative">
            <select
              value={selectedDistrict}
              disabled={!selectedState}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border appearance-none outline-none cursor-pointer transition-all ${
                selectedDistrict
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100 disabled:opacity-50'
              }`}
            >
              <option value="">Any District</option>
              {districts.map((ds) => (
                <option key={ds._id} value={ds._id} className="bg-white text-slate-700">
                  {ds.name}
                </option>
              ))}
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-[9px]">▼</span>
          </div>

          {/* College */}
          <div className="relative">
            <select
              value={selectedCollege}
              disabled={!selectedDistrict}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border appearance-none outline-none cursor-pointer transition-all ${
                selectedCollege
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100 disabled:opacity-50'
              }`}
            >
              <option value="">Any College</option>
              {colleges.map((c) => (
                <option key={c._id} value={c._id} className="bg-white text-slate-700">
                  {c.shortName || c.name}
                </option>
              ))}
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-[9px]">▼</span>
          </div>

          {/* Department */}
          <div className="relative">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl border appearance-none outline-none cursor-pointer transition-all ${
                selectedDepartment
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <option value="">Any Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept} className="bg-white text-slate-700">
                  {dept}
                </option>
              ))}
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-[9px]">▼</span>
          </div>
        </div>
      </motion.div>

      {/* Scope Selector Tabs */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 5 }, show: { opacity: 1, y: 0 } }}
        className="flex gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl w-fit mx-auto md:mx-0 shadow-sm"
      >
        <button
          onClick={() => setSearchScope('marketplace')}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
            searchScope === 'marketplace'
              ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 border-transparent bg-transparent'
          }`}
        >
          <span>🛒</span> Marketplace
        </button>
        <button
          onClick={() => setSearchScope('feed')}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
            searchScope === 'feed'
              ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 border-transparent bg-transparent'
          }`}
        >
          <span>📢</span> Social Lounge
        </button>
        <button
          onClick={() => setSearchScope('students')}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
            searchScope === 'students'
              ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 border-transparent bg-transparent'
          }`}
        >
          <span>🎓</span> Students
        </button>
      </motion.div>

      {/* Results Section */}
      <div className="pt-2">
        {isLoading ? (
          // Loading Skeletons
          searchScope === 'feed' ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-12 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-pulse h-[300px] p-4 flex flex-col justify-between">
                  <div className="aspect-[4/3] bg-slate-100 rounded-lg w-full" />
                  <div className="space-y-2 mt-3">
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-3.5 bg-slate-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <AnimatePresence mode="wait">
            {searchScope === 'marketplace' && (
              <motion.div
                key="market-res"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {filteredListings.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
                    <span className="material-symbols-outlined text-4xl text-slate-350">search_off</span>
                    <h3 className="text-sm font-semibold text-slate-800 mt-3">No matching marketplace listings</h3>
                    <p className="text-xs text-slate-500 mt-1">No students or items match your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredListings.map((l) => (
                      <ListingCard key={l._id} listing={l} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {searchScope === 'feed' && (
              <motion.div
                key="feed-res"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                {filteredPosts.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
                    <span className="material-symbols-outlined text-4xl text-slate-350">search_off</span>
                    <h3 className="text-sm font-semibold text-slate-800 mt-3">No matching lounge posts</h3>
                    <p className="text-xs text-slate-500 mt-1">No students or items match your search.</p>
                  </div>
                ) : (
                  filteredPosts.map((p) => (
                    <PostCard key={p._id} post={p} />
                  ))
                )}
              </motion.div>
            )}

            {searchScope === 'students' && (
              <motion.div
                key="student-res"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {compiledStudents.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
                    <span className="material-symbols-outlined text-4xl text-slate-350">no_accounts</span>
                    <h3 className="text-sm font-semibold text-slate-800 mt-3">No matching students</h3>
                    <p className="text-xs text-slate-500 mt-1">No students or items match your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {compiledStudents.map((student) => (
                      <div
                        key={student._id}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow transition-all flex flex-col justify-between h-48"
                      >
                        <div className="flex gap-3">
                          <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 flex-shrink-0">
                            {student.avatar ? (
                              <Image src={student.avatar} alt="" width={44} height={44} className="w-full h-full object-cover" />
                            ) : (
                              student.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 leading-tight">
                            <div className="flex items-center gap-1">
                              <h3 className="text-xs font-semibold text-slate-900 truncate">{student.name}</h3>
                              {student.isVerified && <VerifiedBadge size="sm" />}
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                              {student.department || 'Student'}
                            </span>
                            <span className="text-[9px] text-slate-450 font-medium block">
                              {student.year ? `Year ${student.year}` : 'Student'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wide truncate">
                            🏛 {student.collegeObj?.shortName || student.collegeObj?.name || student.collegeName || 'Campus'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleStartChat(student._id)}
                          disabled={isStartingChat === student._id}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-semibold transition-all shadow-sm active-press mt-3 cursor-pointer"
                        >
                          {isStartingChat === student._id ? 'Opening...' : 'Message'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center text-slate-500">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span className="text-xs font-semibold">Loading search module...</span>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
