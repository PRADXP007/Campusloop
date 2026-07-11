'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
}

export default function SelectDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option…',
  disabled = false,
  error,
  id,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full flex flex-col gap-1.5 font-body" ref={containerRef} data-lenis-prevent>
      {/* Label */}
      {label && (
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          flex items-center justify-between w-full
          bg-white border rounded-lg px-3 py-2.5 text-sm text-left
          transition-all duration-200 cursor-pointer
          ${disabled 
            ? 'border-slate-200 text-slate-400 bg-slate-50/50 cursor-not-allowed opacity-50' 
            : error
              ? 'border-red-400/60 focus:ring-2 focus:ring-red-400/20 focus:border-red-400 text-slate-900'
              : 'border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-650'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? 'text-slate-900 font-medium' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        {/* Inline Chevron SVG */}
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <ul
          data-lenis-prevent
          className="
            absolute left-0 right-0 top-full z-50
            bg-white border border-slate-200 rounded-lg
            shadow-lg mt-1 w-full max-h-60 overflow-y-auto
            divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150
          "
          role="listbox"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2.5 text-xs text-slate-400 italic">
              No options available
            </li>
          ) : (
            options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`
                    px-3 py-2 text-sm cursor-pointer transition-colors duration-150
                    ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-800 hover:bg-slate-50'
                    }
                  `}
                >
                  {opt.label}
                </li>
              );
            })
          )}
        </ul>
      )}

      {error && (
        <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5 font-medium pl-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
