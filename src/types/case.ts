export interface Case {
  id: string;
  author_id: string;
  title: string;
  specialty: string;
  description: string;
  patient_demographics: Record<string, any>;
  clinical_history?: string;
  examination_findings?: string;
  investigations?: Record<string, any>;
  diagnosis?: string;
  treatment?: string;
  outcome?: string;
  learning_points?: string;
  references?: Record<string, any>;
  tags: string[];
  privacy_level: number;
  allowed_roles: string[];
  allowed_specialties?: string[];
  is_educational: boolean;
  status: 'draft' | 'published' | 'under_review' | 'archived';
  view_count: number;
  created_at: string;
  updated_at: string;
} 