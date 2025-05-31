export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          auth_id: string
          email: string
          full_name: string
          role: string
          specialty: string | null
          bio: string | null
          location: string | null
          credentials: string | null
          verification_status: string
          verification_documents: Json | null
          years_experience: number | null
          institution: string | null
          website: string | null
          social_links: Json | null
          privacy_settings: Json
          notification_settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          email: string
          full_name: string
          role: string
          specialty?: string | null
          bio?: string | null
          location?: string | null
          credentials?: string | null
          verification_status?: string
          verification_documents?: Json | null
          years_experience?: number | null
          institution?: string | null
          website?: string | null
          social_links?: Json | null
          privacy_settings?: Json
          notification_settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          email?: string
          full_name?: string
          role?: string
          specialty?: string | null
          bio?: string | null
          location?: string | null
          credentials?: string | null
          verification_status?: string
          verification_documents?: Json | null
          years_experience?: number | null
          institution?: string | null
          website?: string | null
          social_links?: Json | null
          privacy_settings?: Json
          notification_settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      medical_cases: {
        Row: {
          id: string
          author_id: string
          title: string
          specialty: string
          description: string
          patient_demographics: Json
          clinical_history: string | null
          examination_findings: string | null
          investigations: Json | null
          diagnosis: string | null
          treatment: string | null
          outcome: string | null
          learning_points: string | null
          references: Json | null
          tags: string[] | null
          privacy_level: number
          allowed_roles: string[]
          allowed_specialties: string[] | null
          is_educational: boolean
          status: string
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          specialty: string
          description: string
          patient_demographics: Json
          clinical_history?: string | null
          examination_findings?: string | null
          investigations?: Json | null
          diagnosis?: string | null
          treatment?: string | null
          outcome?: string | null
          learning_points?: string | null
          references?: Json | null
          tags?: string[] | null
          privacy_level?: number
          allowed_roles?: string[]
          allowed_specialties?: string[] | null
          is_educational?: boolean
          status?: string
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          specialty?: string
          description?: string
          patient_demographics?: Json
          clinical_history?: string | null
          examination_findings?: string | null
          investigations?: Json | null
          diagnosis?: string | null
          treatment?: string | null
          outcome?: string | null
          learning_points?: string | null
          references?: Json | null
          tags?: string[] | null
          privacy_level?: number
          allowed_roles?: string[]
          allowed_specialties?: string[] | null
          is_educational?: boolean
          status?: string
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      case_images: {
        Row: {
          id: string
          case_id: string
          storage_path: string
          file_name: string
          file_type: string
          file_size: number
          width: number | null
          height: number | null
          description: string | null
          annotations: Json | null
          is_primary: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          storage_path: string
          file_name: string
          file_type: string
          file_size: number
          width?: number | null
          height?: number | null
          description?: string | null
          annotations?: Json | null
          is_primary?: boolean
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          storage_path?: string
          file_name?: string
          file_type?: string
          file_size?: number
          width?: number | null
          height?: number | null
          description?: string | null
          annotations?: Json | null
          is_primary?: boolean
          order_index?: number
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          case_id: string
          author_id: string
          parent_id: string | null
          comment_type: string
          content: string
          image_path: string | null
          is_pinned: boolean
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          author_id: string
          parent_id?: string | null
          comment_type?: string
          content: string
          image_path?: string | null
          is_pinned?: boolean
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          author_id?: string
          parent_id?: string | null
          comment_type?: string
          content?: string
          image_path?: string | null
          is_pinned?: boolean
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          case_id: string
          like_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          case_id: string
          like_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          case_id?: string
          like_type?: string
          created_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          is_public: boolean
          is_collaborative: boolean
          is_educational: boolean
          specialty: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          is_public?: boolean
          is_collaborative?: boolean
          is_educational?: boolean
          specialty?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          is_public?: boolean
          is_collaborative?: boolean
          is_educational?: boolean
          specialty?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_cases: {
        Row: {
          id: string
          user_id: string
          case_id: string
          collection_id: string | null
          save_type: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          case_id: string
          collection_id?: string | null
          save_type?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          case_id?: string
          collection_id?: string | null
          save_type?: string
          notes?: string | null
          created_at?: string
        }
      }
      collection_collaborators: {
        Row: {
          id: string
          collection_id: string
          user_id: string
          permission_level: string
          created_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          user_id: string
          permission_level?: string
          created_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          user_id?: string
          permission_level?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          followed_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          followed_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          followed_id?: string
          created_at?: string
        }
      }
      specialty_follows: {
        Row: {
          id: string
          user_id: string
          specialty: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialty: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialty?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 