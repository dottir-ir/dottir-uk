export interface Comment {
  id: string;
  case_id: string;
  author_id: string;
  parent_id: string | null;
  comment_type: string;
  content: string;
  image_path: string | null;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    role: string;
    specialty: string;
  };
  replies?: Comment[];
}

export type CommentType = 'standard' | 'question' | 'differential' | 'treatment' | 'educational';

export interface CommentFormData {
  content: string;
  comment_type: CommentType;
  image_path?: string | null;
} 