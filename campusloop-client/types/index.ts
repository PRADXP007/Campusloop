export interface College {
  _id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  district: string;
  stateId?: string;
  districtId?: string;
  emailDomain: string;
  university?: string;
  type?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  college: College;
  department: string;
  year: string;
  bio: string;
  phone: string;
  isVerified: boolean;
  isEmailVerified?: boolean;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  isSuspicious?: boolean;
  blockedUsers?: string[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export type ListingCategory =
  | 'Books & Notes'
  | 'Electronics'
  | 'Furniture'
  | 'Clothing'
  | 'Sports'
  | 'Hostel Essentials'
  | 'Bicycles'
  | 'Other';

export type ListingCondition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
export type ListingStatus = 'active' | 'sold' | 'paused';

export interface Listing {
  _id: string;
  seller: Pick<User, '_id' | 'name' | 'avatar' | 'college' | 'department' | 'year' | 'createdAt' | 'isVerified' | 'verificationStatus' | 'isSuspicious'>;
  college: College;
  title: string;
  description: string;
  price: number;
  priceNegotiable: boolean;
  category: ListingCategory;
  condition: ListingCondition;
  images: string[];
  status: ListingStatus;
  views: number;
  savedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export const CATEGORIES: ListingCategory[] = [
  'Books & Notes',
  'Electronics',
  'Furniture',
  'Clothing',
  'Sports',
  'Hostel Essentials',
  'Bicycles',
  'Other',
];

export const CONDITIONS: ListingCondition[] = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor',
];

export const CATEGORY_ICONS: Record<ListingCategory, string> = {
  'Books & Notes':     '📚',
  'Electronics':       '💻',
  'Furniture':         '🛋️',
  'Clothing':          '👕',
  'Sports':            '⚽',
  'Hostel Essentials': '🏠',
  'Bicycles':          '🚲',
  'Other':             '📦',
};

export const CONDITION_COLORS: Record<ListingCondition, string> = {
  'New':      'text-emerald-400 bg-emerald-400/10',
  'Like New': 'text-green-400 bg-green-400/10',
  'Good':     'text-blue-400 bg-blue-400/10',
  'Fair':     'text-yellow-400 bg-yellow-400/10',
  'Poor':     'text-red-400 bg-red-400/10',
};

// ─── Feed / Social ─────────────────────────────────────────────────────────

export interface Post {
  _id: string;
  author: Pick<User, '_id' | 'name' | 'avatar' | 'department' | 'year' | 'isVerified' | 'verificationStatus' | 'isSuspicious'>;
  college: College;
  content: string;
  images: string[];
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  author: Pick<User, '_id' | 'name' | 'avatar' | 'department' | 'year' | 'isVerified' | 'verificationStatus' | 'isSuspicious'>;
  content: string;
  likes: string[];
  parentComment: string | null;
  createdAt: string;
}

// ─── Chat ───────────────────────────────────────────────────────────────

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
