'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import ImageUploader from '@/components/marketplace/ImageUploader';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { CATEGORIES, CONDITIONS } from '@/types';
import type { Listing } from '@/types';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  price: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid price'),
  priceNegotiable: z.boolean().optional(),
  category: z.string().min(1, 'Select a category'),
  condition: z.string().min(1, 'Select a condition'),
});

type FormData = z.infer<typeof schema>;

export default function EditListingPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuthStore();

  const [listing, setListing]           = useState<Listing | null>(null);
  const [newImages, setNewImages]       = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const description = watch('description') || '';

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(({ data }) => {
        const l: Listing = data.listing;

        // Guard — only owner can edit
        if (l.seller._id !== user?._id) {
          toast.error('Not authorized');
          router.replace('/marketplace');
          return;
        }

        setListing(l);
        reset({
          title:           l.title,
          description:     l.description,
          price:           String(l.price),
          priceNegotiable: l.priceNegotiable,
          category:        l.category,
          condition:       l.condition,
        });
      })
      .catch(() => { toast.error('Listing not found'); router.replace('/marketplace'); })
      .finally(() => setIsLoading(false));
  }, [id, user, router, reset]);

  const handleRemoveExisting = (url: string) => {
    setRemovedImages((prev) => [...prev, url]);
    setListing((prev) => prev ? { ...prev, images: prev.images.filter((i) => i !== url) } : prev);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('priceNegotiable', String(data.priceNegotiable ?? false));
      formData.append('category', data.category);
      formData.append('condition', data.condition);
      newImages.forEach((img) => formData.append('images', img));
      if (removedImages.length > 0) {
        formData.append('removeImages', JSON.stringify(removedImages));
      }

      await api.patch(`/listings/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Listing updated!');
      router.push(`/marketplace/${id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-6 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-slate-800 rounded w-48" />
        <div className="h-48 bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!listing) return null;

  const categoryOptions = CATEGORIES.map((c) => ({ value: c, label: c }));
  const conditionOptions = CONDITIONS.map((c) => ({ value: c, label: c }));
  const existingImages = listing.images.filter((img) => !removedImages.includes(img));

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Edit Listing</h1>
        <p className="text-slate-400 text-sm mt-1">Update your listing details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <ImageUploader
            images={newImages}
            existingImages={existingImages}
            onImagesChange={setNewImages}
            onRemoveExisting={handleRemoveExisting}
            maxImages={5}
          />
        </div>

        {/* Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Item Details</h2>

          <Input
            id="edit-title"
            label="Title"
            placeholder="Item title"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="space-y-1.5">
            <label htmlFor="edit-description" className="text-sm font-medium text-slate-300">Description</label>
            <textarea
              id="edit-description"
              rows={4}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 bg-slate-800/60 border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 resize-none transition-all ${
                errors.description ? 'border-red-500' : ''
              }`}
              {...register('description')}
            />
            <div className="flex justify-between">
              {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
              <span className="text-xs text-slate-600 ml-auto">{description.length}/1000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select id="edit-category" label="Category" options={categoryOptions} error={errors.category?.message} {...register('category')} />
            <Select id="edit-condition" label="Condition" options={conditionOptions} error={errors.condition?.message} {...register('condition')} />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Pricing</h2>
          <Input
            id="edit-price"
            type="number"
            label="Price (₹)"
            min={0}
            error={errors.price?.message}
            leftIcon={<span className="text-slate-400 font-semibold text-sm">₹</span>}
            {...register('price')}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" id="edit-negotiable" {...register('priceNegotiable')} />
              <div className="w-10 h-5 bg-slate-700 rounded-full peer-checked:bg-indigo-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm font-medium text-slate-300">Price is negotiable</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
            {isSubmitting ? 'Saving…' : '✅ Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
