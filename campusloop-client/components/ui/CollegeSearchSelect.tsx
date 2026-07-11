'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import type { College } from '@/types';
import toast from 'react-hot-toast';
import Button from './Button';
import Input from './Input';
import SelectDropdown from './SelectDropdown';

export interface StateObj {
  _id: string;
  name: string;
  isUnionTerritory: boolean;
}

export interface DistrictObj {
  _id: string;
  name: string;
  state: string;
}

interface CollegeSearchSelectProps {
  value: string; // Active collegeId
  onChange: (collegeId: string) => void;
  stateId?: string;
  onStateChange?: (stateId: string) => void;
  districtId?: string;
  onDistrictChange?: (districtId: string) => void;
  step?: number;
  error?: string;
  userEmail?: string;
}

export default function CollegeSearchSelect({
  value,
  onChange,
  stateId = '',
  onStateChange,
  districtId = '',
  onDistrictChange,
  step,
  error,
  userEmail = '',
}: CollegeSearchSelectProps) {
  // Cascading lists
  const [states, setStates] = useState<StateObj[]>([]);
  const [districts, setDistricts] = useState<DistrictObj[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);

  // Internal fallback states if parent doesn't provide them (for backward-compatibility)
  const [internalStateId, setInternalStateId] = useState('');
  const [internalDistrictId, setInternalDistrictId] = useState('');

  const activeStateId = onStateChange ? stateId : internalStateId;
  const activeDistrictId = onDistrictChange ? districtId : internalDistrictId;

  const setActiveStateId = (id: string) => {
    if (onStateChange) onStateChange(id);
    else setInternalStateId(id);
  };

  const setActiveDistrictId = (id: string) => {
    if (onDistrictChange) onDistrictChange(id);
    else setInternalDistrictId(id);
  };

  const [selectedCollegeName, setSelectedCollegeName] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  // Autocomplete UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // "Add College" Override Form states
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [customCollegeCity, setCustomCollegeCity] = useState('');
  const [customCollegeUniversity, setCustomCollegeUniversity] = useState('');
  const [customCollegeType, setCustomCollegeType] = useState<'government' | 'private' | 'autonomous' | 'other' | ''>('');
  const [isCreatingCollege, setIsCreatingCollege] = useState(false);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-open dropdown on step 3 transition
  useEffect(() => {
    if (step === 3) {
      setIsDropdownOpen(true);
    }
  }, [step]);

  // 1. Fetch States on mount
  useEffect(() => {
    api.get('/states')
      .then(({ data }) => {
        if (data.success) setStates(data.states || []);
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Districts when State changes
  useEffect(() => {
    if (!activeStateId) {
      setDistricts([]);
      setActiveDistrictId('');
      return;
    }

    api.get(`/districts?stateId=${encodeURIComponent(activeStateId)}`)
      .then(({ data }) => {
        if (data.success) {
          const list = data.districts || [];
          setDistricts(list);
          // Only clear district if the current district is not in the newly fetched list
          const hasCurrentDistrict = list.some((d: DistrictObj) => d._id === activeDistrictId);
          if (!hasCurrentDistrict) {
            setActiveDistrictId('');
          }
        }
      })
      .catch(() => {});
  }, [activeStateId]);

  // 3. Fetch Colleges when State/District changes, or fetch by Query
  const fetchCollegesList = async (stateIdStr: string, distIdStr: string, queryStr = '') => {
    if (!stateIdStr || !distIdStr) {
      setColleges([]);
      return;
    }
    setIsLoadingColleges(true);
    try {
      let endpoint = `/colleges?state=${encodeURIComponent(stateIdStr)}&district=${encodeURIComponent(distIdStr)}`;
      if (queryStr.trim()) {
        endpoint = `/colleges/search?q=${encodeURIComponent(queryStr)}&state=${encodeURIComponent(stateIdStr)}&district=${encodeURIComponent(distIdStr)}`;
      }
      const { data } = await api.get(endpoint);
      if (data.success) {
        setColleges(data.colleges || []);
      }
    } catch {
      // ignore silently
    } finally {
      setIsLoadingColleges(false);
    }
  };

  useEffect(() => {
    if (activeStateId && activeDistrictId) {
      fetchCollegesList(activeStateId, activeDistrictId, searchQuery);
    } else {
      setColleges([]);
    }
  }, [activeStateId, activeDistrictId]);

  // 4. Handle Search input updates
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsDropdownOpen(true);
    if (activeStateId && activeDistrictId) {
      fetchCollegesList(activeStateId, activeDistrictId, query);
    }
  };

  // 5. Detect and sync pre-selection from auto-detect (if parent sets value)
  useEffect(() => {
    if (!value) {
      setSelectedCollege(null);
      setSelectedCollegeName('');
      return;
    }

    // If selectedCollege is already synced with active value, do not overwrite or fetch
    if (selectedCollege && selectedCollege._id === value) {
      return;
    }

    // Check if we already have it in the loaded list
    const found = colleges.find((c) => c._id === value);
    if (found) {
      setSelectedCollege(found);
      setSelectedCollegeName(found.name);
      setSearchQuery(found.name);
      return;
    }

    // Otherwise, query it specifically
    api.get(`/colleges/${encodeURIComponent(value)}`)
      .then(({ data }) => {
        const item = data.college;
        if (item) {
          setSelectedCollege(item);
          setSelectedCollegeName(item.name);
          setSearchQuery(item.name);
        }
      })
      .catch(() => {});
  }, [value]);

  const handleSelectCollege = (college: College) => {
    setSelectedCollege(college);
    setSelectedCollegeName(college.name);
    setSearchQuery(college.name);
    setIsDropdownOpen(false);
    onChange(college._id);
  };

  // 6. Handle Custom College Creation
  const handleAddCustomCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCollegeName.trim() || !customCollegeCity.trim() || !activeStateId || !activeDistrictId) {
      toast.error('Please fill in College Name, City, State and District.');
      return;
    }

    setIsCreatingCollege(true);
    // Infer domain from user email if domain is empty
    let inferredDomain = '';
    if (userEmail && userEmail.includes('@')) {
      inferredDomain = userEmail.split('@')[1] || '';
    }

    try {
      const { data } = await api.post('/colleges', {
        name: customCollegeName,
        state: activeStateId,
        district: activeDistrictId,
        city: customCollegeCity,
        university: customCollegeUniversity,
        emailDomain: inferredDomain,
        type: customCollegeType,
      });

      if (data.success && data.college) {
        toast.success(`Added ${data.college.name}! Selected.`);
        
        // Push college into list and pre-select
        setColleges((prev) => [...prev, data.college]);
        setSelectedCollege(data.college);
        setSelectedCollegeName(data.college.name);
        setSearchQuery(data.college.name);
        
        // Reset custom fields
        setCustomCollegeName('');
        setCustomCollegeCity('');
        setCustomCollegeUniversity('');
        setCustomCollegeType('');
        setIsAddingCustom(false);
        
        onChange(data.college._id);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not add college';
      toast.error(msg);
    } finally {
      setIsCreatingCollege(false);
    }
  };

  const selectedStateName = states.find((s) => s._id === activeStateId)?.name || '';
  const selectedDistrictName = districts.find((d) => d._id === activeDistrictId)?.name || '';

  const renderStateSelect = () => (
    <SelectDropdown
      id="col-state"
      label="College State"
      placeholder="Choose State…"
      value={activeStateId}
      onChange={(val) => {
        setActiveStateId(val);
        setActiveDistrictId('');
        setSearchQuery('');
        onChange('');
      }}
      options={states.map((st) => ({ value: st._id, label: st.name }))}
    />
  );

  const renderDistrictSelect = () => (
    <SelectDropdown
      id="col-district"
      label="College District"
      placeholder={activeStateId ? 'Choose District…' : 'Select State first'}
      value={activeDistrictId}
      disabled={!activeStateId}
      onChange={(val) => {
        setActiveDistrictId(val);
        setSearchQuery('');
        onChange('');
      }}
      options={districts.map((ds) => ({ value: ds._id, label: ds.name }))}
    />
  );

  const renderCollegeSearch = () => {
    if (isAddingCustom) {
      return (
        <div className="p-5 border border-slate-200 bg-slate-55/60 backdrop-blur-md rounded-3xl space-y-4 animate-in zoom-in-95 duration-200 text-slate-900">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 tracking-tight font-heading">
              Add New College
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors"
            >
              ← Back to Search
            </button>
          </div>

          <p className="text-[11px] text-slate-550 leading-relaxed">
            Specify your college details below. State &amp; District are pre-selected as <strong className="text-slate-700">{selectedStateName} &gt; {selectedDistrictName}</strong>.
          </p>

          <div className="space-y-3.5">
            <Input
              id="custom-col-name"
              label="College Name"
              placeholder="e.g. National Institute of Technology, Pune"
              value={customCollegeName}
              onChange={(e) => setCustomCollegeName(e.target.value)}
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="custom-col-city"
                label="City"
                placeholder="e.g. Pune"
                value={customCollegeCity}
                onChange={(e) => setCustomCollegeCity(e.target.value)}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
              />

              <Input
                id="custom-col-uni"
                label="University Affiliation (Optional)"
                placeholder="e.g. SPPU"
                value={customCollegeUniversity}
                onChange={(e) => setCustomCollegeUniversity(e.target.value)}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <SelectDropdown
              id="custom-col-type"
              label="College Type (Optional)"
              placeholder="Select Type…"
              value={customCollegeType}
              onChange={(val) => setCustomCollegeType(val as any)}
              options={[
                { value: 'government', label: 'Government' },
                { value: 'private', label: 'Private' },
                { value: 'autonomous', label: 'Autonomous' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isCreatingCollege}
              onClick={handleAddCustomCollege}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 font-semibold shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-200"
            >
              Add &amp; Select College
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col gap-1.5 w-full" ref={dropdownRef} data-lenis-prevent>
        <label htmlFor="col-search" className="text-xs font-semibold text-slate-500 uppercase tracking-wide font-body">
          College Name
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-slate-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            id="col-search"
            type="text"
            placeholder={
              activeDistrictId
                ? 'Start typing college name…'
                : 'Select State and District first…'
            }
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsDropdownOpen(true)}
            onClick={() => setIsDropdownOpen(true)}
            disabled={!activeDistrictId}
            className="w-full rounded-2xl border px-4 py-3.5 pl-11 text-sm text-slate-900 placeholder:text-slate-400 bg-white border-slate-300 focus:outline-none focus:border-blue-650 focus:ring-2 focus:ring-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 caret-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onChange('');
              }}
              className="absolute right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-600 mt-1 font-medium pl-1">⚠ {error}</p>}

        {activeDistrictId && !isAddingCustom && (
          <p className="text-[11px] text-slate-500 mt-1.5 pl-1 font-medium">
            Can&apos;t find your college?{' '}
            <button
              type="button"
              onClick={() => {
                setIsAddingCustom(true);
                setIsDropdownOpen(false);
              }}
              className="text-blue-600 hover:underline font-bold cursor-pointer"
            >
              Add it manually
            </button>
          </p>
        )}

        {/* Dropdown overlay */}
        {isDropdownOpen && activeDistrictId && (
          <div
            data-lenis-prevent
            className="absolute top-[100%] left-0 right-0 mt-2 z-[9999] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {isLoadingColleges ? (
              <div className="p-4 text-center text-xs text-[#666666] flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Searching colleges...
              </div>
            ) : colleges.length === 0 ? (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-[#666666]">No colleges found in this district.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustom(true);
                    setIsDropdownOpen(false);
                  }}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  ➕ Add your college manually
                </button>
              </div>
            ) : (
              <>
                {colleges.map((col) => {
                  const isSelected = col._id === value;
                  return (
                    <button
                      key={col._id}
                      type="button"
                      onClick={() => handleSelectCollege(col)}
                      className={`w-full text-left px-4 py-3 text-xs transition-colors cursor-pointer flex flex-col gap-0.5 text-slate-900 ${
                        isSelected ? 'bg-blue-50/70 text-blue-700 hover:bg-blue-50/80' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold">{col.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {col.city} · {typeof col.university === 'object' ? (col.university as any)?.name : col.university || 'Affiliated'}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustom(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-xs bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-700 font-semibold flex items-center gap-1.5 border-t border-slate-200"
                >
                  ➕ Can&apos;t find your college? Add it manually
                </button>
              </>
            )}
          </div>
        )}

        {selectedCollege && (
          <div className="mt-4 p-4 border border-blue-100 bg-blue-50/20 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-200 text-slate-900 text-left">
            <div className="flex items-start gap-3">
              <span className="text-xl">🏫</span>
              <div className="space-y-1">
                <h5 className="text-xs font-black text-slate-800 leading-tight">
                  {selectedCollege.name}
                </h5>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-medium animate-in fade-in duration-300">
                  {selectedCollege.university && (
                    <span className="flex items-center gap-1">
                      <span>🎓</span> {typeof selectedCollege.university === 'object' ? (selectedCollege.university as any)?.name : selectedCollege.university}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span>📍</span> {selectedCollege.city}, {selectedStateName || (typeof selectedCollege.state === 'object' ? (selectedCollege.state as any)?.name : selectedCollege.state)}
                  </span>
                  {selectedCollege.type && (
                    <span className="flex items-center gap-1 uppercase tracking-wider font-bold text-blue-600 bg-blue-55 px-1.5 py-0.5 rounded text-[8px]">
                      {selectedCollege.type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-4 font-body" data-lenis-prevent>
      {step === undefined && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderStateSelect()}
            {renderDistrictSelect()}
          </div>
          {renderCollegeSearch()}
        </>
      )}

      {step === 1 && renderStateSelect()}
      {step === 2 && renderDistrictSelect()}
      {step === 3 && renderCollegeSearch()}

      {step === 99 && selectedCollege && (
        <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-200 text-slate-900 text-left">
          <div className="flex items-start gap-3">
            <span className="text-xl">🏫</span>
            <div className="space-y-1">
              <h5 className="text-xs font-black text-slate-800 leading-tight">
                {selectedCollege.name}
              </h5>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-medium animate-in fade-in duration-300">
                {selectedCollege.university && (
                  <span className="flex items-center gap-1">
                    <span>🎓</span> {typeof selectedCollege.university === 'object' ? (selectedCollege.university as any)?.name : selectedCollege.university}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span>📍</span> {selectedCollege.city}, {selectedStateName || (typeof selectedCollege.state === 'object' ? (selectedCollege.state as any)?.name : selectedCollege.state)}
                </span>
                {selectedCollege.type && (
                  <span className="flex items-center gap-1 uppercase tracking-wider font-bold text-blue-600 bg-blue-55 px-1.5 py-0.5 rounded text-[8px]">
                    {selectedCollege.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
