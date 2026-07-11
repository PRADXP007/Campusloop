'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';

import FloatingInput from '@/components/ui/FloatingInput';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

// ─── Validation schema ────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken, user } = response.data;

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
      router.push('/feed');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <h2 className="text-2xl font-black text-white tracking-tight font-heading">
          Welcome Back
        </h2>
        <p className="text-xs text-white/65 font-medium font-body">
          Sign in to access your campus community
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-body" noValidate>
        <FloatingInput
          id="login-email"
          type="email"
          label="College Email"
          autoComplete="email"
          error={errors.email?.message}
          leftIcon={
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          }
          {...register('email')}
        />

        <div className="relative">
          <FloatingInput
            id="login-password"
            type="password"
            label="Password"
            autoComplete="current-password"
            error={errors.password?.message}
            leftIcon={
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
            {...register('password')}
          />
          <div className="absolute right-10 top-3.5 z-20">
            <Link
              href="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                toast.success('Password reset link sent to your college email!');
              }}
              className="text-[10px] font-bold text-[var(--color-primary)] hover:text-blue-700 hover:underline transition-colors"
            >
              Forgot?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          fullWidth
          size="md"
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 font-semibold"
        >
          Sign In
        </Button>
      </form>

      {/* Sign up link */}
      <p className="text-center text-xs text-white/65 font-medium font-body">
        New to the loop?{' '}
        <Link href="/register" className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-colors">
          Create account free
        </Link>
      </p>
    </motion.div>
  );
}
