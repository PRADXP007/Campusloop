'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface ImageUploaderProps {
  images: File[];
  existingImages?: string[];
  onImagesChange: (files: File[]) => void;
  onRemoveExisting?: (url: string) => void;
  maxImages?: number;
}

export default function ImageUploader({
  images,
  existingImages = [],
  onImagesChange,
  onRemoveExisting,
  maxImages = 5,
}: ImageUploaderProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const totalCount = existingImages.length + images.length;
  const canAdd = totalCount < maxImages;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = maxImages - totalCount;
      const toAdd = acceptedFiles.slice(0, remaining);
      const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...newPreviews]);
      onImagesChange([...images, ...toAdd]);
    },
    [images, maxImages, onImagesChange, totalCount]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    disabled: !canAdd,
    maxFiles: maxImages,
  });

  const removeNew = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newFiles    = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    onImagesChange(newFiles);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-[var(--color-text-muted)]">
        Photos <span className="text-[var(--color-text-muted)]/60 font-medium">({totalCount}/{maxImages})</span>
      </label>

      {/* Existing images */}
      <div className="flex flex-wrap gap-2.5">
        {existingImages.map((url) => (
          <div key={url} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-[var(--color-border)] flex-shrink-0 bg-[var(--color-surface-2)]">
            <Image src={url} alt="Listing" fill sizes="96px" className="object-cover" />
            {onRemoveExisting && (
              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              >
                <span className="w-7 h-7 bg-[var(--color-error)] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md hover:scale-105 transition-transform">✕</span>
              </button>
            )}
            <div className="absolute bottom-1 left-1 text-[9px] font-extrabold uppercase tracking-wider bg-slate-950/75 px-1.5 py-0.5 rounded text-white">saved</div>
          </div>
        ))}

        {/* New image previews */}
        {previews.map((src, i) => (
          <div key={src} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-[var(--color-primary)]/30 flex-shrink-0 bg-[var(--color-surface-2)]">
            <Image src={src} alt="Preview" fill unoptimized sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeNew(i)}
              className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
            >
              <span className="w-7 h-7 bg-[var(--color-error)] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md hover:scale-105 transition-transform">✕</span>
            </button>
            <div className="absolute bottom-1 left-1 text-[9px] font-extrabold uppercase tracking-wider bg-[var(--color-primary)]/80 px-1.5 py-0.5 rounded text-white">new</div>
          </div>
        ))}

        {/* Dropzone */}
        {canAdd && (
          <div
            {...getRootProps()}
            className={`w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 flex-shrink-0 bg-white/40 ${
              isDragActive
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 scale-102'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-2)]/30'
            }`}
          >
            <input {...getInputProps()} />
            <span className="text-xl text-[var(--color-text-muted)] font-black">+</span>
            <span className="text-[9px] text-[var(--color-text-muted)] font-extrabold uppercase tracking-wider text-center leading-tight px-1.5">
              {isDragActive ? 'Drop!' : 'Add Photo'}
            </span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)]/50 font-bold uppercase tracking-wider">JPG, PNG, WebP · Max 5MB each · {maxImages} photos total</p>
    </div>
  );
}
