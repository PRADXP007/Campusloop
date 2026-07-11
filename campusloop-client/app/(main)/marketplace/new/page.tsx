'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import ImageUploader from '@/components/marketplace/ImageUploader';
import api from '@/lib/api';
import { CATEGORIES, CONDITIONS } from '@/types';

// ─── Schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  price: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid price'),
  priceNegotiable: z.boolean().optional(),
  category: z.string().min(1, 'Select a category'),
  condition: z.string().min(1, 'Select a condition'),
});

type FormData = z.infer<typeof schema>;

// ─── Component ───────────────────────────────────────────────────────────

export default function CreateListingPage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priceNegotiable: false },
  });

  const description = watch('description') || '';

  const onSubmit = async (data: FormData) => {
    if (images.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('priceNegotiable', String(data.priceNegotiable ?? false));
      formData.append('category', data.category);
      formData.append('condition', data.condition);
      images.forEach((img) => formData.append('images', img));

      const { data: res } = await api.post('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Listing created successfully! 🎉');
      router.push(`/marketplace/${res.listing._id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = CATEGORIES.map((c) => ({ value: c, label: c }));
  const conditionOptions = CONDITIONS.map((c) => ({ value: c, label: c }));

  return (
    <div className="py-6 max-w-2xl mx-auto space-y-6 relative z-10">
      {/* Back to Marketplace */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Marketplace
      </button>

      {/* Header */}
      <div>
        <h1 className="font-heading text-display-lg text-3xl font-black text-[var(--color-primary)]">Publish Listing</h1>
        <p className="font-body text-xs text-[var(--color-text-muted)] mt-1">
          Turn your unused textbooks, electronics, or gear into cash across your campus.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card border border-white/60 rounded-[28px] p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute inset-0 rounded-[28px] border border-white pointer-events-none" />
          <ImageUploader
            images={images}
            onImagesChange={setImages}
            maxImages={5}
          />
        </motion.div>

        {/* Basic Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="glass-card border border-white/60 rounded-[28px] p-6 shadow-sm space-y-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 rounded-[28px] border border-white pointer-events-none" />
          <h2 className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest border-b border-[var(--color-border)]/40 pb-2">Item Specifications</h2>

          <Input
            id="listing-title"
            label="Title"
            placeholder="e.g. MacBook Air M1, MTB Cycle, Engineering Physics Book"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="space-y-1.5">
            <label htmlFor="listing-description" className="text-sm font-bold text-[var(--color-text-muted)] font-body">
              Description
            </label>
            <textarea
              id="listing-description"
              rows={4}
              placeholder="Describe the item condition, dimensions, age, or any specifications..."
              className={`w-full rounded-2xl border px-4.5 py-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 bg-white/70 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:bg-white resize-none transition-all duration-200 shadow-sm font-medium ${
                errors.description ? 'border-[var(--color-error)]' : ''
              }`}
              {...register('description')}
            />
            <div className="flex justify-between font-body text-[10px] font-bold">
              {errors.description ? (
                <p className="text-[var(--color-error)]">{errors.description.message}</p>
              ) : (
                <span className="text-[var(--color-text-muted)]/40">Minimum 10 characters</span>
              )}
              <span className="text-[var(--color-text-muted)]/40 ml-auto">{description.length}/1000</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="listing-category"
              label="Category"
              placeholder="Select category…"
              error={errors.category?.message}
              options={categoryOptions}
              {...register('category')}
            />
            <Select
              id="listing-condition"
              label="Condition"
              placeholder="Select condition…"
              error={errors.condition?.message}
              options={conditionOptions}
              {...register('condition')}
            />
          </div>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card border border-white/60 rounded-[28px] p-6 shadow-sm space-y-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 rounded-[28px] border border-white pointer-events-none" />
          <h2 className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest border-b border-[var(--color-border)]/40 pb-2">Pricing Structure</h2>

          <Input
            id="listing-price"
            type="number"
            label="Price (₹)"
            placeholder="0"
            min={0}
            error={errors.price?.message}
            leftIcon={<span className="text-[var(--color-text-muted)]/60 font-semibold text-sm">₹</span>}
            {...register('price')}
          />

          <label className="flex items-center gap-3.5 cursor-pointer group py-1.5 font-body">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                {...register('priceNegotiable')}
                id="listing-negotiable"
              />
              <div className="w-11 h-6 bg-[var(--color-surface-3)] rounded-full peer-checked:bg-[var(--color-primary)] transition-all duration-300" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-5 shadow-sm" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                Price is negotiable
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Allow buyers to make counter offers</p>
            </div>
          </label>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-4.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1 font-bold border-white/60 bg-white/40 hover:bg-white/70"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            fullWidth
            isLoading={isSubmitting}
            className="flex-1 font-bold shadow-md"
          >
            Post Listing ➔
          </Button>
        </div>
      </form>
    </div>
  );
}
