'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';

import FloatingInput from '@/components/ui/FloatingInput';
import Button from '@/components/ui/Button';
import CollegeSearchSelect from '@/components/ui/CollegeSearchSelect';
import api from '@/lib/api';

// ─── Validation schema ────────────────────────────────────────────────────
const registerSchema = z.object({
  stateId: z.string().min(1, 'Please select your state'),
  districtId: z.string().min(1, 'Please select your district'),
  collegeId: z.string().min(1, 'Please select your college'),
  department: z.string().min(1, 'Please enter or select your department'),
  year: z.string().min(1, 'Please select your year'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name is too long'),
  email: z.string().email('Please enter a valid college email'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const stepInfo = [
  { title: 'State', desc: 'Choose your college state' },
  { title: 'District', desc: 'Choose your college district' },
  { title: 'College', desc: 'Search and select your college' },
  { title: 'Department', desc: 'Specify your academic branch' },
  { title: 'Year', desc: 'Select your study year' },
  { title: 'Account', desc: 'Create your sign-in details' },
];

const DEPARTMENT_CATEGORIES: Record<string, string[]> = {
  'Engineering & Tech': [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biotechnology Engineering',
    'Aerospace Engineering',
    'Automobile Engineering',
    'Mechatronics Engineering',
    'Mining Engineering',
    'Production & Industrial Engineering',
    'Metallurgical Engineering',
  ],
  'Sciences': [
    'Physics (B.Sc / M.Sc)',
    'Chemistry (B.Sc / M.Sc)',
    'Mathematics (B.Sc / M.Sc)',
    'Computer Application (BCA / MCA)',
    'Data Science & Analytics',
    'Statistics',
    'Biology / Zoology / Botany',
    'Biotechnology & Microbiology',
    'Bioinformatics',
    'Food Science & Nutrition',
    'Environmental Science',
  ],
  'Business & Management': [
    'Business Administration (BBA / MBA)',
    'Commerce (B.Com / M.Com)',
    'Financial Markets & Investment',
    'Economics (B.A / M.A)',
    'Chartered Accountancy (CA) / CS',
    'Hospital & Healthcare Management',
    'Tourism & Hospitality Management',
    'Human Resource Management',
    'Marketing Management',
  ],
  'Arts & Humanities': [
    'English Literature',
    'History & Archaeology',
    'Political Science',
    'Sociology & Anthropology',
    'Psychology & Cognitive Science',
    'Journalism & Mass Communication',
    'Geography & Geology',
    'Philosophy',
    'Public Administration',
    'Performing Arts (Music / Dance / Drama)',
  ],
  'Medical & Health': [
    'Medicine & Surgery (MBBS)',
    'Dental Surgery (BDS)',
    'Pharmacy (B.Pharm / M.Pharm)',
    'Nursing (B.Sc Nursing)',
    'Physiotherapy (BPT)',
    'Optometry',
    'Occupational Therapy',
    'Allied Health Sciences',
    'Ayurvedic Medicine (BAMS)',
    'Homeopathic Medicine (BHMS)',
  ],
  'Design & Media': [
    'Fashion Design & Technology',
    'Graphic Design & Animation',
    'Interior Design',
    'Product / Industrial Design',
    'Fine Arts (BFA / MFA)',
    'Film & Television Production',
  ],
  'Law & Social Work': [
    'Integrated Law (BA LLB / BBA LLB)',
    'Bachelor of Laws (LLB)',
    'Master of Laws (LLM)',
    'Social Work (BSW / MSW)',
    'Criminology & Forensic Science',
  ],
  'Agriculture & Veterinary': [
    'Agriculture (B.Sc Agriculture)',
    'Horticulture (B.Sc Horticulture)',
    'Forestry',
    'Veterinary Science & Animal Husbandry',
    'Food Technology & Processing',
  ],
  'Other Professional': [
    'Architecture (B.Arch)',
    'Planning (B.Plan)',
    'Education (B.Ed / M.Ed)',
    'Physical Education (B.P.Ed)',
    'Library & Information Science',
  ],
};

const ALL_DEPARTMENTS = Object.values(DEPARTMENT_CATEGORIES).flat();


const YEARS = [
  { value: '1', label: '1st Year', badge: 'Freshman' },
  { value: '2', label: '2nd Year', badge: 'Sophomore' },
  { value: '3', label: '3rd Year', badge: 'Junior' },
  { value: '4', label: '4th Year', badge: 'Senior' },
  { value: 'PG', label: 'Postgraduate', badge: 'Master / PhD' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingDevOtp, setPendingDevOtp] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('Engineering & Tech');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptInputRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        deptInputRef.current &&
        !deptInputRef.current.contains(event.target as Node)
      ) {
        setIsDeptDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Redirect to verify page after successful registration
  useEffect(() => {
    if (pendingUserId) {
      const devOtpParam = pendingDevOtp ? `&devOtp=${pendingDevOtp}` : '';
      router.push(`/verify?userId=${pendingUserId}${devOtpParam}`);
    }
  }, [pendingUserId, pendingDevOtp, router]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      stateId: '',
      districtId: '',
      collegeId: '',
      department: '',
      year: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const { confirmPassword, ...payload } = data;
      void confirmPassword;

      const response = await api.post('/auth/register', payload);
      if (response.data.devOtp) {
        setPendingDevOtp(response.data.devOtp);
      }
      setPendingUserId(response.data.userId);
      
      if (response.data.emailSent === false) {
        toast.error(response.data.message || 'Account created, but OTP email failed to send. Please request a new OTP.');
      } else {
        toast.success('Account created! Check your email for the OTP.');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: Array<keyof RegisterForm> = [];
    if (step === 1) fieldsToValidate = ['stateId'];
    else if (step === 2) fieldsToValidate = ['districtId'];
    else if (step === 3) fieldsToValidate = ['collegeId'];
    else if (step === 4) fieldsToValidate = ['department'];
    else if (step === 5) fieldsToValidate = ['year'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setDirection(1);
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  // Reactive next-button disabled states
  const activeStateId = watch('stateId');
  const activeDistrictId = watch('districtId');
  const activeCollegeId = watch('collegeId');
  const activeDepartment = watch('department') || '';
  const activeYear = watch('year');

  const filteredDepts = activeDepartment.trim()
    ? ALL_DEPARTMENTS.filter((d) =>
        d.toLowerCase().includes(activeDepartment.toLowerCase())
      )
    : DEPARTMENT_CATEGORIES[activeCategory] || [];


  const isNextDisabled = () => {
    if (step === 1 && !activeStateId) return true;
    if (step === 2 && !activeDistrictId) return true;
    if (step === 3 && !activeCollegeId) return true;
    if (step === 4 && !activeDepartment.trim()) return true;
    if (step === 5 && !activeYear) return true;
    return false;
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      opacity: 0,
    }),
  };

  if (pendingUserId) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
          Create Account
        </h2>
        <p className="text-xs text-slate-500 font-medium font-body">
          {stepInfo[step - 1].desc}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-4 font-body">
        {stepInfo.map((s, index) => {
          const isCompleted = step > index + 1;
          const isActive = step === index + 1;
          return (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              {/* Connection Line */}
              {index < 5 && (
                <div
                  className={`absolute top-4 left-1/2 right-[-50%] h-[2px] z-0 transition-colors duration-300 ${
                    step > index + 2 ? 'bg-[#2563EB]' : 'bg-slate-200'
                  }`}
                />
              )}
              <button
                type="button"
                onClick={async () => {
                  // Allow clicking back to completed steps
                  if (index + 1 < step) {
                    setDirection(-1);
                    setStep(index + 1);
                  }
                }}
                disabled={index + 1 >= step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black z-10 transition-all duration-300 cursor-pointer ${
                  isCompleted
                    ? 'bg-blue-50 text-[#2563EB] border border-blue-200 hover:bg-blue-100 ring-4 ring-blue-50/50'
                    : isActive
                    ? 'bg-[#2563EB] text-white ring-4 ring-blue-100 scale-110 shadow-sm'
                    : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </button>
              <span
                className={`text-[9px] mt-1.5 font-bold tracking-tight uppercase hidden sm:block ${
                  isActive || isCompleted ? 'text-slate-900 font-extrabold' : 'text-slate-400 font-medium'
                }`}
              >
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Steps Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-body" noValidate>
        <div className="overflow-visible relative min-h-[120px] px-1 py-1">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-4"
            >
              {/* Steps 1, 2, and 3: College Selection cascading steps */}
              {step <= 3 && (
                <div className="space-y-1.5">
                  <CollegeSearchSelect
                    value={watch('collegeId')}
                    onChange={(val) => setValue('collegeId', val, { shouldValidate: true })}
                    stateId={watch('stateId')}
                    onStateChange={(val) => {
                      setValue('stateId', val, { shouldValidate: true });
                      setValue('districtId', '', { shouldValidate: true });
                      setValue('collegeId', '', { shouldValidate: true });
                    }}
                    districtId={watch('districtId')}
                    onDistrictChange={(val) => {
                      setValue('districtId', val, { shouldValidate: true });
                      setValue('collegeId', '', { shouldValidate: true });
                    }}
                    step={step}
                    error={
                      step === 1
                        ? errors.stateId?.message
                        : step === 2
                        ? errors.districtId?.message
                        : errors.collegeId?.message
                    }
                    userEmail={watch('email')}
                  />
                  {step === 1 && (
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed pl-1">
                      Please choose the Indian State/UT where your college is situated.
                    </p>
                  )}
                  {step === 2 && (
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed pl-1">
                      Select the official district corresponding to your state.
                    </p>
                  )}
                  {step === 3 && (
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed pl-1">
                      Start typing to search. If your college isn&apos;t listed, you can add it manually in the dropdown.
                    </p>
                  )}
                </div>
              )}

              {/* Step >= 4 Selected College Summary */}
              {step >= 4 && watch('collegeId') && (
                <div className="mb-4">
                  <CollegeSearchSelect
                    value={watch('collegeId')}
                    onChange={() => {}}
                    stateId={watch('stateId')}
                    districtId={watch('districtId')}
                    step={99}
                  />
                </div>
              )}

              {/* Step 4: Department */}
              {step === 4 && (
                <div className="space-y-4" ref={deptInputRef} data-lenis-prevent>
                  <div className="relative">
                    <FloatingInput
                      id="reg-dept"
                      type="text"
                      label="Department / Course"
                      error={errors.department?.message}
                      leftIcon={<span className="text-sm">🎓</span>}
                      onFocus={() => setIsDeptDropdownOpen(true)}
                      light
                      {...register('department')}
                    />

                    {/* Autocomplete Dropdown overlay */}
                    {isDeptDropdownOpen && filteredDepts.length > 0 && (
                      <div
                        data-lenis-prevent
                        className="absolute z-[9999] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto font-body p-2 scrollbar-thin"
                      >
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-450 px-3 py-1 border-b border-slate-100 mb-1">
                          Matching Departments ({filteredDepts.length})
                        </div>
                        {filteredDepts.map((dept) => {
                          const isSelected = activeDepartment === dept;
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => {
                                setValue('department', dept, { shouldValidate: true });
                                setIsDeptDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                                isSelected 
                                  ? 'bg-blue-50 text-blue-750 font-semibold' 
                                  : 'text-slate-800 hover:bg-slate-50'
                              }`}
                            >
                              <span className="text-[10px]">✨</span>
                              {dept}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Horizontal Scrollable stream category Tabs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pl-1">
                      <span className="text-xs font-bold text-slate-500">
                        Browse by Stream
                      </span>
                      {activeDepartment && (
                        <button
                          type="button"
                          onClick={() => {
                            setValue('department', '', { shouldValidate: true });
                          }}
                          className="text-[10px] text-blue-600 font-extrabold hover:underline"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                    
                    {/* Horizontal scroll tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1 scrollbar-none snap-x select-none">
                      {Object.keys(DEPARTMENT_CATEGORIES).map((cat) => {
                        const isActive = activeCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setActiveCategory(cat);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-300 cursor-pointer snap-start ${
                              isActive
                                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-850'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Suggestions for active category */}
                    <div className="flex flex-wrap gap-2 pt-1 animate-in fade-in duration-300">
                      {DEPARTMENT_CATEGORIES[activeCategory].map((dept) => {
                        const isSelected = activeDepartment === dept;
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              setValue('department', dept, { shouldValidate: true });
                              setIsDeptDropdownOpen(false);
                            }}
                            className={`px-3 py-2 rounded-2xl text-[11px] font-bold border transition-all duration-350 cursor-pointer active-press ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm scale-[1.02]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {dept}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Year of Study */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {YEARS.map((y) => {
                      const isSelected = watch('year') === y.value;
                      return (
                        <button
                          key={y.value}
                          type="button"
                          onClick={() => setValue('year', y.value, { shouldValidate: true })}
                          className={`p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer active-press flex flex-col gap-1 ${
                            isSelected
                              ? 'border-blue-650 bg-blue-50/50 text-blue-900 shadow-md ring-2 ring-blue-650/10 scale-[1.02]'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <span className={`text-xs font-black ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>{y.label}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                            {y.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.year?.message && (
                    <p className="text-xs text-red-650 font-medium pl-1">⚠️ {errors.year?.message}</p>
                  )}
                </div>
              )}

              {/* Step 6: Account Details */}
              {step === 6 && (
                <div className="space-y-4 animate-in fade-in duration-300 text-slate-900">
                  <FloatingInput
                    id="reg-name"
                    type="text"
                    label="Full Name"
                    autoComplete="name"
                    error={errors.name?.message}
                    light
                    leftIcon={
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                    {...register('name')}
                  />

                  <FloatingInput
                    id="reg-email"
                    type="email"
                    label="College Email"
                    autoComplete="email"
                    error={errors.email?.message}
                    light
                    leftIcon={
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    }
                    {...register('email')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FloatingInput
                      id="reg-password"
                      type="password"
                      label="Password"
                      autoComplete="new-password"
                      error={errors.password?.message}
                      light
                      leftIcon={
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      }
                      {...register('password')}
                    />

                    <FloatingInput
                      id="reg-confirm-password"
                      type="password"
                      label="Confirm Password"
                      autoComplete="new-password"
                      error={errors.confirmPassword?.message}
                      light
                      leftIcon={
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      }
                      {...register('confirmPassword')}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed pl-1">
                    Password must be 6+ characters with at least one uppercase letter and one number.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Wizard Controls */}
        <div className="flex items-center justify-between gap-4 pt-2">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleBack}
              className="flex-1 border-slate-200 hover:bg-slate-55 text-slate-600 font-semibold transition-all duration-300"
            >
              ← Back
            </Button>
          ) : (
            <div className="flex-1" />
          )}

          {step < 6 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isNextDisabled()}
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:from-[var(--color-accent)] hover:to-[var(--color-primary)] text-[#FCFAF7] border-0 disabled:opacity-45 disabled:cursor-not-allowed font-semibold shadow-md shadow-[var(--color-primary)]/10 hover:shadow-[var(--color-primary)]/20 transition-all duration-300"
            >
              Next →
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={isSubmitting}
              fullWidth={false}
              size="md"
              className="flex-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:from-[var(--color-accent)] hover:to-[var(--color-primary)] text-[#FCFAF7] border-0 font-semibold shadow-lg shadow-[var(--color-primary)]/10 hover:shadow-[var(--color-primary)]/20 transition-all duration-300"
            >
              Create Account
            </Button>
          )}
        </div>
      </form>

      {/* Divider */}
      <div className="relative font-body">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
          <span className="px-3 bg-white text-slate-400">or</span>
        </div>
      </div>

      {/* Sign in link */}
      <p className="text-center text-xs text-slate-500 font-medium font-body">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 font-bold hover:underline transition-colors font-premium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
