import { UserRole } from '../../types';

export interface Case {
  id: string;
  title: string;
  content: string;
  author_id: string;
  status: 'open' | 'closed' | 'archived';
  visibility: 'public' | 'private' | 'doctors_only';
  tags: string[];
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  case_id: string;
  author_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  case_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_verified: boolean;
  verification_document_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'case_comment' | 'case_update' | 'verification_status' | 'mention';
  title: string;
  message: string;
  read: boolean;
  data: Record<string, any>;
  created_at: string;
}

export interface SearchFilters {
  status?: Case['status'];
  visibility?: Case['visibility'];
  tags?: string[];
  author_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search_term?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SearchResponse<T> {
  data: T[];
  total: number;
  page: number;
  total_pages: number;
} 