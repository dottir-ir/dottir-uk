// User Types
export type UserRole = 'doctor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  specialty?: string;
  bio?: string;
  location?: string;
  specialization?: string;
  joinedAt: string;
  lastActive: string;
  isVerified: boolean;
  verificationDocumentUrl?: string;
  specialties?: Specialty[];
  mfa_enabled: boolean;
  mfa_secret?: string;
  mfa_backup_codes?: string[];
}

export interface UserBasic {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  specialty?: string;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// Post Types
export type PostStatus = 'draft' | 'published' | 'archived';

export interface Post {
  id: string;
  title: string;
  content: string;
  images: string[];
  imageDescriptions: string[];
  tags: string[];
  author: UserBasic;
  createdAt: string;
  lastUpdated: string;
  likes: string[]; // Array of user IDs who liked the post
  comments: Comment[];
  specialty?: string;
  age?: string;
  gender?: string;
  symptoms?: string;
  history?: string;
  diagnosis?: string;
  treatment?: string;
  outcome?: string;
  isAnonymous: boolean;
  status: PostStatus;
}

// Comment Type
export interface Comment {
  id: string;
  content: string;
  author: UserBasic;
  createdAt: string;
  lastUpdated?: string;
}

// Notification Type
export interface Notification {
  id: string;
  userId: string;
  type: string;
  content: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// Bookmark Type
export interface Bookmark {
  userId: string;
  postId: string;
  createdAt: string;
}