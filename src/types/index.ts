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
  createdAt: string;
}

export interface UserBasic {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

// Post Types
export interface Post {
  id: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  author: UserBasic;
  createdAt: string;
  likes: string[]; // Array of user IDs who liked the post
  comments: Comment[];
}

// Comment Type
export interface Comment {
  id: string;
  content: string;
  author: UserBasic;
  createdAt: string;
}