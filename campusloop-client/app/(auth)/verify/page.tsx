'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Image from 'next/image';

// ─── OTP Input Component ──────────────────────────────────────────────────
interface OTPInputProps {
  onComplete: (otp: string) => void;
  disabled?: boolean;
}

function OTPInput({ onComplete, disabled = false }: OTPInputProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const full = newDigits.join('');
    if (full.length === 6) onComplete(full);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      onComplete(text);
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="
            w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold
            bg-white/50 border-2 border-[var(--color-border)] rounded-2xl
            text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5
            transition-all duration-200 disabled:opacity-50
            caret-[var(--color-primary)] font-body
          "
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── File Upload Dropzone Component ───────────────────────────────────────
interface FileUploaderProps {
  label: string;
  description: string;
  icon: string;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  id: string;
}

function FileUploader({ label, description, icon, onFileSelect, selectedFile, id }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      } else {
        toast.error('Please upload an image file.');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`
        relative rounded-[24px] border-2 border-dashed p-6 text-center cursor-pointer
        transition-all duration-300 backdrop-blur-md bg-white/40 group
        ${isDragActive ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 scale-[1.02]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'}
      `}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        id={id}
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {previewUrl ? (
        <div className="space-y-4">
          <div className="relative w-full aspect-[1.6/1] rounded-2xl overflow-hidden border border-[var(--color-border)]">
            <Image src={previewUrl} alt="Preview" fill unoptimized className="object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold bg-[var(--color-primary)]/90 px-4 py-2 rounded-full shadow-md">Replace Photo</span>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] font-bold truncate max-w-[240px] mx-auto">
            📎 {selectedFile?.name}
          </p>
        </div>
      ) : (
        <div className="space-y-4 py-4">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto group-hover:scale-115 transition-transform duration-300">
            <span className="material-symbols-outlined text-[24px] text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
          </div>
          <div>
            <p className="text-sm font-black text-[var(--color-text)] font-heading">{label}</p>
            <p className="text-xs text-[var(--color-text-muted)]/75 mt-1 leading-relaxed">{description}</p>
          </div>
          <div className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-2 rounded-xl border border-[var(--color-accent)]/20 shadow-sm">
            Browse File
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard Logic ────────────────────────────────────────────────────
function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, user, setUser } = useAuthStore();

  const queryUserId = searchParams.get('userId');
  const queryDevOtp = searchParams.get('devOtp');
  const [currentStep, setCurrentStep] = useState<3 | 4 | 5 | 6>(3);
  const [activeDevOtp, setActiveDevOtp] = useState<string | null>(queryDevOtp);

  // Files state
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  // Loading flags
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [isResendingOTP, setIsResendingOTP] = useState(false);

  // OTP resend countdown
  const [countdown, setCountdown] = useState(60);

  // Target user ID derived from query or active store user
  const targetUserId = queryUserId || user?._id;

  useEffect(() => {
    if (!targetUserId) {
      router.replace('/register');
    }
  }, [targetUserId, router]);

  useEffect(() => {
    if (user) {
      if (user.isVerified || user.verificationStatus === 'verified' || user.verificationStatus === 'pending') {
        setCurrentStep(6);
      } else if (user.isEmailVerified && currentStep === 3) {
        setCurrentStep(4);
      }
    }
  }, [user, currentStep]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle OTP Submission (Step 3)
  const handleOTPComplete = async (otp: string) => {
    if (!targetUserId) return;
    setIsVerifyingOTP(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { userId: targetUserId, otp });
      setAuth(data.user, data.accessToken);
      toast.success("Email verified! Let's secure your profile.");
      setCurrentStep(4); // Advance to ID upload
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (!targetUserId || countdown > 0) return;
    setIsResendingOTP(true);
    try {
      const { data } = await api.post('/auth/resend-otp', { userId: targetUserId });
      toast.success('New OTP sent to your email!');
      setCountdown(60);
      if (data.devOtp) {
        setActiveDevOtp(data.devOtp);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsResendingOTP(false);
    }
  };

  // Skip or fallback verification for local development
  const handleMockVerification = async () => {
    setIsSubmittingDoc(true);
    try {
      const { data } = await api.post('/users/me/verification', {
        idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
        selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
      });
      setUser(data.user);
      toast.success('Mock verification successful! Account approved.');
      setCurrentStep(6);
    } catch {
      toast.error('Mock verification failed. Please try actual files.');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // Submit actual files for verification (Step 4 & 5 combo)
  const handleSubmitVerification = async () => {
    if (!idCardFile || !selfieFile) {
      toast.error('Please upload both your Student ID card and a Selfie.');
      return;
    }

    setIsSubmittingDoc(true);
    const formData = new FormData();
    formData.append('idCard', idCardFile);
    formData.append('selfie', selfieFile);

    try {
      const { data } = await api.post('/users/me/verification', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser(data.user);
      toast.success('Verification submitted successfully! ✨');
      setCurrentStep(6);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Upload failed.';
      toast.error(errMsg);
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  return (
    <main className="w-full">
      <div className="w-full space-y-4">
        {/* Onboarding Card title */}
        <div className="text-center mb-4">
          <h2 className="font-heading text-lg font-black text-[var(--color-primary)] tracking-tight">Verify Your Account</h2>
          <p className="text-[9px] font-bold text-[var(--color-text-muted)]/60 tracking-widest uppercase mt-0.5">Exclusive Academic Network</p>
        </div>

        {/* Onboarding Card */}
        <div className="glass-card rounded-[28px] p-5 sm:p-7 shadow-2xl relative border border-white/60">
          {/* Progress Stepper */}
          {currentStep < 6 && (
            <div className="flex items-center justify-between mb-6 relative">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[var(--color-surface-2)] -z-10 -translate-y-1/2" />
              <div
                className="absolute top-1/2 left-0 h-[2px] bg-[var(--color-primary)] -z-10 -translate-y-1/2 transition-all duration-500"
                style={{ width: currentStep === 3 ? '0%' : currentStep === 4 ? '50%' : '100%' }}
              />
              
              {/* Stepper Dot 1 */}
              <div className="flex flex-col items-center gap-2 cursor-pointer z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep === 3
                    ? 'bg-[var(--color-primary)] text-[var(--color-surface)] ring-4 ring-[var(--color-primary-light)]'
                    : 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                }`}>
                  {currentStep > 3 ? (
                    <span className="material-symbols-outlined text-sm font-bold">done</span>
                  ) : (
                    '1'
                  )}
                </div>
                <span className={`text-[10px] font-bold tracking-tight ${currentStep === 3 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]/50'}`}>Email OTP</span>
              </div>

              {/* Stepper Dot 2 */}
              <div className="flex flex-col items-center gap-2 cursor-pointer z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep === 4
                    ? 'bg-[var(--color-primary)] text-[var(--color-surface)] ring-4 ring-[var(--color-primary-light)]'
                    : currentStep > 4
                    ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]/40'
                }`}>
                  {currentStep > 4 ? (
                    <span className="material-symbols-outlined text-sm font-bold">done</span>
                  ) : (
                    '2'
                  )}
                </div>
                <span className={`text-[10px] font-bold tracking-tight ${currentStep === 4 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]/40'}`}>Student ID</span>
              </div>

              {/* Stepper Dot 3 */}
              <div className="flex flex-col items-center gap-2 cursor-pointer z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep === 5
                    ? 'bg-[var(--color-primary)] text-[var(--color-surface)] ring-4 ring-[var(--color-primary-light)]'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]/40'
                }`}>
                  3
                </div>
                <span className={`text-[10px] font-bold tracking-tight ${currentStep === 5 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]/40'}`}>Selfie Check</span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 3: OTP Check */}
            {currentStep === 3 && (
              <motion.section
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-[24px]">mail</span>
                  </div>
                  <h2 className="font-heading text-lg font-black text-[var(--color-text)]">Check your email</h2>
                  <p className="text-[var(--color-text-muted)] text-xs leading-relaxed max-w-sm mx-auto font-medium">
                    We sent a 6-digit verification code to your college email domain. Enter it below to secure your credentials.
                  </p>
                </div>
                {activeDevOtp && (
                  <div className="
                    p-4 rounded-2xl border border-blue-100/50
                    bg-blue-50/10 backdrop-blur-md text-center space-y-2
                    shadow-[0_8px_32px_0_rgba(37,99,235,0.05)] mb-4
                  ">
                    <div className="flex items-center justify-center gap-2 text-blue-600 font-heading text-xs font-black uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[16px] animate-pulse">terminal</span>
                      <span>Development Sandbox</span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                      SMTP email delivery is simulated. Use the generated verification code below to proceed:
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-1">
                      <span className="font-heading text-lg font-black tracking-widest text-blue-600 bg-white/10 px-4 py-1.5 rounded-xl border border-slate-700/50 select-all shadow-inner">
                        {activeDevOtp}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOTPComplete(activeDevOtp)}
                        className="
                          px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700
                          text-white font-bold text-xs shadow-md shadow-blue-500/10
                          hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer
                         font-body"
                      >
                        Auto-verify
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <OTPInput onComplete={handleOTPComplete} disabled={isVerifyingOTP} />
                  {isVerifyingOTP && (
                    <div className="flex items-center justify-center gap-2 text-[var(--color-primary)] text-xs font-bold animate-pulse">
                      <svg className="animate-spin w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Verifying code…</span>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-2 pt-2 border-t border-[var(--color-border)]/40 font-body">
                  <p className="text-xs text-[var(--color-text-muted)] font-medium">Didn&apos;t receive the code?</p>
                  <button
                    onClick={handleResend}
                    disabled={countdown > 0 || isResendingOTP}
                    className="text-[var(--color-primary)] hover:underline font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </motion.section>
            )}

            {/* Step 4: ID Card Upload */}
            {currentStep === 4 && (
              <motion.section
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-[24px]">badge</span>
                  </div>
                  <h2 className="font-heading text-lg font-black text-[var(--color-text)]">Upload Student ID</h2>
                  <p className="text-[var(--color-text-muted)] text-xs leading-relaxed max-w-sm mx-auto font-medium">
                    Please upload a clear photo of your student identity card. Front face must be clearly visible.
                  </p>
                </div>

                <FileUploader
                  label="Student ID Card"
                  description="PNG or JPG file, up to 5MB size."
                  icon="badge"
                  id="id-card-upload"
                  selectedFile={idCardFile}
                  onFileSelect={setIdCardFile}
                />

                <div className="flex flex-col gap-3 pt-4 border-t border-[var(--color-border)]/40">
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={!idCardFile}
                    onClick={() => setCurrentStep(5)}
                    className="font-bold py-3 shadow-md"
                  >
                    Next: Upload Selfie
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] underline py-1"
                    onClick={handleMockVerification}
                  >
                    Skip using Demo Credentials (Local Test)
                  </Button>
                </div>
              </motion.section>
            )}

            {/* Step 5: Selfie Photo Upload */}
            {currentStep === 5 && (
              <motion.section
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-[24px]">face</span>
                  </div>
                  <h2 className="font-heading text-lg font-black text-[var(--color-text)]">Selfie Check</h2>
                  <p className="text-[var(--color-text-muted)] text-xs leading-relaxed max-w-sm mx-auto font-medium">
                    Please upload a selfie for liveness check. This must match the face on your student ID.
                  </p>
                </div>

                <FileUploader
                  label="Selfie Photo"
                  description="High quality selfie, looking straight at the camera."
                  icon="face"
                  id="selfie-upload"
                  selectedFile={selfieFile}
                  onFileSelect={setSelfieFile}
                />

                <div className="flex flex-col gap-3 pt-4 border-t border-[var(--color-border)]/40">
                  <Button
                    variant="primary"
                    fullWidth
                    isLoading={isSubmittingDoc}
                    disabled={!selfieFile || isSubmittingDoc}
                    onClick={handleSubmitVerification}
                    className="font-bold py-3 shadow-md"
                  >
                    Submit for Student Verification
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => setCurrentStep(4)}
                      disabled={isSubmittingDoc}
                      className="font-bold"
                    >
                      Back
                    </Button>
                    <Button
                      variant="ghost"
                      fullWidth
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] underline"
                      onClick={handleMockVerification}
                      disabled={isSubmittingDoc}
                    >
                      Verify with Demo
                    </Button>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Step 6: Success Welcome Page */}
            {currentStep === 6 && (
              <motion.section
                key="step-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="space-y-6 text-center"
              >
                <div className="relative rounded-[32px] bg-gradient-to-br from-white/90 via-[var(--color-surface)]/75 to-[var(--color-surface-2)]/50 border border-white/80 p-8 shadow-[0_20px_50px_rgba(37,99,235,0.06)] overflow-hidden">
                  {/* Inner brand border reflection */}
                  <div className="absolute inset-3 rounded-[24px] border border-[var(--color-accent)]/20 pointer-events-none" />
                  
                  <div className="relative z-10 space-y-6">
                    {/* Radial Checked Seal */}
                    <div className="relative w-20 h-20 mx-auto">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--color-accent)]/30 pointer-events-none"
                      />
                      <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white text-3xl font-bold">done</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] bg-[var(--color-primary)]/10 px-3.5 py-1 rounded-full border border-[var(--color-accent)]/20">
                        Identity Verified
                      </span>
                      <h3 className="font-heading text-xl font-black text-[var(--color-text)]">
                        Welcome to the Inner Loop!
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-xs mx-auto font-medium">
                        Your student verification check is complete. You now have a verified badge and full access to buy/sell marketplace items!
                      </p>
                    </div>

                    {/* ID Card Preview */}
                    <div className="bg-white/80 border border-[var(--color-surface-2)] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm text-left max-w-xs mx-auto">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 border border-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold overflow-hidden shadow-inner">
                        {user?.avatar ? (
                          <Image alt="User avatar" src={user.avatar} width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          user?.name.charAt(0).toUpperCase() || 'S'
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading text-sm font-black text-[var(--color-text)] truncate max-w-[150px]">{user?.name || 'Student'}</span>
                          <span className="material-symbols-outlined text-[15px] text-[#007AFF]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        </div>
                        <span className="block text-[10px] text-[var(--color-text-muted)] font-bold truncate max-w-[180px]">
                          {user?.college?.name || 'Verified Student Member'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => router.push('/feed')}
                  className="font-bold py-3.5 shadow-xl hover:scale-[1.01] active-press"
                >
                  Enter CampusLoop Feed 🎉
                </Button>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Verification footer trust indicators */}
        {currentStep < 6 && (
          <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-[var(--color-text-muted)]/40 uppercase tracking-widest pt-2">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">lock</span> Secure 256-bit
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">privacy_tip</span> GDPR Compliant
            </span>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-center text-[var(--color-text-muted)] font-body py-10">Loading verification details…</div>}>
      <VerifyContent />
    </Suspense>
  );
}
