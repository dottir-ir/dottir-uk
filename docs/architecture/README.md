# Medical Case Sharing Platform - Architecture Document

## 1. System Architecture Overview

### 1.1 Supabase Architecture Components

The platform leverages Supabase's comprehensive Backend-as-a-Service (BaaS) offering, utilizing the following core components:

- **PostgreSQL Database**: Primary data storage with row-level security
- **Authentication**: User management, session handling, and multi-factor authentication
- **Storage**: File storage for images and other media
- **Realtime**: Live updates for notifications and interactive features
- **Edge Functions**: Serverless functions for custom backend logic
- **REST API**: Auto-generated API endpoints for database operations

### 1.2 Architecture Principles

- **Serverless First**: Minimize infrastructure management by leveraging Supabase's serverless architecture
- **Security by Design**: Implement row-level security policies at the database level
- **Scalability**: Design for horizontal scaling as user base grows
- **Performance Optimization**: Implement efficient data access patterns and caching strategies
- **Separation of Concerns**: Clear boundaries between data storage, business logic, and presentation layers

### 1.3 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Application                        │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   React UI   │  │   Router    │  │   State     │  │  Utils  │ │
│  │  Components  │  │             │  │  Management │  │         │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Client SDK                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Supabase Backend                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │             │  │             │  │             │  │         │ │
│  │   Auth      │  │  PostgreSQL │  │   Storage   │  │Realtime │ │
│  │             │  │             │  │             │  │         │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │             │  │             │                               │
│  │    Edge     │  │  REST API   │                               │
│  │  Functions  │  │             │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Database Schema Design

### 2.1 Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'doctor', 'educator', 'moderator', 'admin')),
  specialty TEXT,
  credentials TEXT,
  bio TEXT,
  profile_image_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_documents JSONB,
  years_experience INTEGER,
  institution TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Profiles Table (Extended User Information)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id),
  education JSONB,
  publications JSONB,
  research_interests TEXT[],
  teaching_appointments JSONB,
  awards JSONB,
  professional_memberships JSONB,
  languages TEXT[],
  privacy_settings JSONB DEFAULT '{"profile_visibility": "all_users", "case_visibility": "all_users"}',
  notification_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Medical Cases Table
```sql
CREATE TABLE medical_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  description TEXT NOT NULL,
  patient_demographics JSONB NOT NULL,
  clinical_history TEXT,
  examination_findings TEXT,
  investigations JSONB,
  diagnosis TEXT,
  treatment TEXT,
  outcome TEXT,
  learning_points TEXT,
  references JSONB,
  tags TEXT[],
  privacy_level INTEGER NOT NULL DEFAULT 1 CHECK (privacy_level BETWEEN 1 AND 3),
  allowed_roles TEXT[] DEFAULT ARRAY['student', 'doctor', 'educator', 'moderator', 'admin'],
  allowed_specialties TEXT[],
  is_educational BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'under_review', 'archived')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Case Images Table
```sql
CREATE TABLE case_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES medical_cases(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  description TEXT,
  annotations JSONB,
  is_primary BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Comments Table
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES medical_cases(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  parent_id UUID REFERENCES comments(id),
  comment_type TEXT NOT NULL DEFAULT 'standard' CHECK (comment_type IN ('standard', 'question', 'differential', 'treatment', 'educational')),
  content TEXT NOT NULL,
  image_path TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Likes Table
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES medical_cases(id) ON DELETE CASCADE NOT NULL,
  like_type TEXT NOT NULL DEFAULT 'standard' CHECK (like_type IN ('standard', 'educational', 'clinical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, case_id)
);
```

#### Saved Cases Table
```sql
CREATE TABLE saved_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES medical_cases(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES collections(id),
  save_type TEXT NOT NULL DEFAULT 'quick_save' CHECK (save_type IN ('quick_save', 'educational', 'research', 'reference')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, case_id, collection_id)
);
```

#### Collections Table
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_collaborative BOOLEAN DEFAULT FALSE,
  is_educational BOOLEAN DEFAULT FALSE,
  specialty TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Collection Collaborators Table
```sql
CREATE TABLE collection_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, user_id)
);
```

#### Follows Table
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  followed_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, followed_id)
);
```

#### Specialty Follows Table
```sql
CREATE TABLE specialty_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  specialty TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, specialty)
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Entity Relationship Diagram (ERD)

```
┌─────────────┐       ┌───────────────┐       ┌─────────────┐
│   Users     │       │ Medical Cases  │       │  Comments   │
├─────────────┤       ├───────────────┤       ├─────────────┤
│ id          │       │ id            │       │ id          │
│ auth_id     │       │ author_id     │◄──────┤ case_id     │
│ email       │       │ title         │       │ author_id   │
│ full_name   │◄──────┤ specialty     │       │ parent_id   │
│ username    │       │ description   │       │ content     │
│ role        │       │ patient_demo  │       │ image_path  │
│ specialty   │       │ privacy_level │       │ is_pinned   │
│ verification │       │ status       │       │ is_hidden   │
└─────────────┘       └───────────────┘       └─────────────┘
      ▲                      ▲                       ▲
      │                      │                       │
      │                      │                       │
┌─────────────┐       ┌───────────────┐       ┌─────────────┐
│  Profiles   │       │  Case Images   │       │    Likes    │
├─────────────┤       ├───────────────┤       ├─────────────┤
│ id          │       │ id            │       │ id          │
│ education   │       │ case_id       │       │ user_id     │
│ publications │       │ storage_path  │       │ case_id     │
│ interests   │       │ file_name     │       │ like_type   │
│ privacy     │       │ annotations   │       │ created_at  │
└─────────────┘       └───────────────┘       └─────────────┘
                                                    ▲
                                                    │
┌─────────────┐       ┌───────────────┐       ┌─────────────┐
│ Collections  │       │ Saved Cases   │       │   Follows   │
├─────────────┤       ├───────────────┤       ├─────────────┤
│ id          │◄──────┤ id            │       │ id          │
│ owner_id    │       │ user_id       │       │ follower_id │
│ title       │       │ case_id       │       │ followed_id │
│ is_public   │       │ collection_id │       │ created_at  │
│ is_collab   │       │ save_type     │       └─────────────┘
└─────────────┘       └───────────────┘
      ▲
      │
┌─────────────┐       ┌───────────────┐       ┌─────────────┐
│ Collection  │       │  Specialty    │       │Notifications │
│Collaborators │       │   Follows     │       ├─────────────┤
├─────────────┤       ├───────────────┤       │ id          │
│ id          │       │ id            │       │ user_id     │
│ collection_id│       │ user_id      │       │ type        │
│ user_id     │       │ specialty     │       │ content     │
│ permission  │       │ created_at    │       │ is_read     │
└─────────────┘       └───────────────┘       └─────────────┘
```

## 3. Row-Level Security Policies

### 3.1 Users Table RLS
```sql
-- Allow users to read their own data and public profiles
CREATE POLICY users_read_policy ON users
  FOR SELECT USING (
    auth.uid() = auth_id OR
    verification_status = 'verified'
  );

-- Allow users to update only their own data
CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (
    auth.uid() = auth_id
  );

-- Only admins can delete users
CREATE POLICY users_delete_policy ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );
```

### 3.2 Medical Cases Table RLS
```sql
-- Case visibility based on privacy level and user role
CREATE POLICY cases_read_policy ON medical_cases
  FOR SELECT USING (
    -- Case author can always see their cases
    (SELECT auth_id FROM users WHERE id = author_id) = auth.uid() OR
    -- Level 1 cases visible to all authenticated users
    (privacy_level = 1) OR
    -- Level 2 cases visible to doctors and educators
    (privacy_level = 2 AND EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND role IN ('doctor', 'educator', 'moderator', 'admin')
    )) OR
    -- Level 3 cases visible to specific specialties
    (privacy_level = 3 AND EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND 
      (role IN ('moderator', 'admin') OR specialty = ANY(allowed_specialties))
    ))
  );

-- Authors can update their own cases
CREATE POLICY cases_update_policy ON medical_cases
  FOR UPDATE USING (
    (SELECT auth_id FROM users WHERE id = author_id) = auth.uid()
  );

-- Authors can delete their own cases, admins can delete any case
CREATE POLICY cases_delete_policy ON medical_cases
  FOR DELETE USING (
    (SELECT auth_id FROM users WHERE id = author_id) = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );
```

## 4. Data Storage Strategy

### 4.1 File Storage Architecture
- **Image Storage**: Supabase Storage buckets organized by content type
  - `case-images/`: Medical case images
  - `profile-images/`: User profile photos
  - `verification-docs/`: User verification documents (private)
  - `comment-attachments/`: Images attached to comments

### 4.2 Storage Policies
```sql
-- Case images bucket policies
CREATE POLICY "Case images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'case-images' AND EXISTS (
    SELECT 1 FROM medical_cases c
    JOIN case_images ci ON ci.case_id = c.id
    WHERE storage.filename(name) = ci.storage_path
    AND privacy_level = 1
  ));

-- Only case authors can upload images
CREATE POLICY "Only case authors can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'case-images' AND EXISTS (
    SELECT 1 FROM medical_cases c
    JOIN users u ON u.id = c.author_id
    WHERE u.auth_id = auth.uid()
  ));
```

### 4.3 File Processing Pipeline
1. **Upload**: Client uploads file to temporary storage
2. **Processing**:
   - Image optimization (resizing, compression)
   - EXIF data removal
   - Automatic facial blurring (if enabled)
   - Thumbnail generation
3. **Storage**: Processed file moved to permanent storage
4. **Database**: File metadata stored in appropriate table

## 5. Caching Strategy

### 5.1 Client-Side Caching
- **React Query**: Implement for data fetching, caching, and state management
  - Cache invalidation strategies based on data type
  - Optimistic updates for improved UX
  - Prefetching for anticipated user actions

### 5.2 API-Level Caching
- **Cache-Control Headers**: Implement appropriate HTTP caching headers
  - Short TTL for dynamic content (newsfeed)
  - Longer TTL for static content (published cases)
  - No-cache for sensitive or frequently updated data

### 5.3 Database-Level Caching
- **Materialized Views**: For complex, frequently accessed queries
  ```sql
  CREATE MATERIALIZED VIEW trending_cases AS
  SELECT c.id, c.title, c.specialty, c.author_id, u.full_name as author_name,
         COUNT(DISTINCT l.id) as like_count,
         COUNT(DISTINCT cm.id) as comment_count
  FROM medical_cases c
  JOIN users u ON u.id = c.author_id
  LEFT JOIN likes l ON l.case_id = c.id
  LEFT JOIN comments cm ON cm.case_id = c.id
  WHERE c.created_at > NOW() - INTERVAL '7 days'
  GROUP BY c.id, c.title, c.specialty, c.author_id, u.full_name
  ORDER BY like_count DESC, comment_count DESC;
  ```

- **Refresh Schedule**: Automated refresh of materialized views
  ```sql
  -- Refresh trending cases view every hour
  SELECT cron.schedule(
    'refresh-trending-cases',
    '0 * * * *',
    $$REFRESH MATERIALIZED VIEW trending_cases$$
  );
  ```

## 6. Real-time Features Implementation

### 6.1 Supabase Realtime Configuration
- **Enabled Tables**: Configure Supabase Realtime for specific tables
  ```sql
  -- Enable realtime for notifications
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  
  -- Enable realtime for comments
  ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  ```

### 6.2 Client-Side Implementation
- **Subscription Setup**: React components subscribe to relevant channels
  ```javascript
  // Example subscription to notifications
  const notificationSubscription = supabase
    .from(`notifications:user_id=eq.${userId}`)
    .on('INSERT', handleNewNotification)
    .subscribe();
  ```

### 6.3 Real-time Features
- **Live Notifications**: Instant delivery of new notifications
- **Comment Updates**: Real-time comment threads
- **Like Counters**: Live updating engagement metrics
- **Online Presence**: User online status indicators

## 7. Edge Functions for Custom Logic

### 7.1 Notification Processing
- **Function**: `process-notification`
  - Triggered by database changes
  - Formats notification content
  - Determines delivery channels
  - Handles email delivery when required

### 7.2 Image Processing
- **Function**: `process-case-image`
  - Triggered on image upload
  - Performs facial blurring
  - Generates thumbnails
  - Extracts and removes EXIF data

### 7.3 Search Indexing
- **Function**: `index-case-content`
  - Triggered on case creation/update
  - Extracts searchable content
  - Updates search index

## 8. Performance Optimization

### 8.1 Database Indexes
```sql
-- Indexes for frequently queried columns
CREATE INDEX idx_medical_cases_specialty ON medical_cases(specialty);
CREATE INDEX idx_medical_cases_created_at ON medical_cases(created_at);
CREATE INDEX idx_comments_case_id ON comments(case_id);
CREATE INDEX idx_likes_case_id ON likes(case_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

### 8.2 Query Optimization
- **Pagination**: Implement cursor-based pagination for all list views
  ```sql
  -- Example efficient pagination query
  SELECT * FROM medical_cases
  WHERE created_at < $last_seen_timestamp
  ORDER BY created_at DESC
  LIMIT 20;
  ```

- **Selective Loading**: Implement GraphQL-like field selection
  ```javascript
  // Example selective field loading
  const { data } = await supabase
    .from('medical_cases')
    .select('id, title, specialty, author:author_id(full_name, profile_image_url)')
    .order('created_at', { ascending: false })
    .limit(20);
  ```

### 8.3 Connection Pooling
- Configure appropriate connection pool settings in Supabase dashboard
- Monitor connection usage and adjust as needed

## 9. Data Migration and Backup Strategy

### 9.1 Backup Configuration
- **Automated Backups**: Daily database backups
- **Point-in-Time Recovery**: Enable for production environment
- **Retention Policy**: 30 days of backup history

### 9.2 Migration Strategy
- **Schema Versioning**: Track database schema versions
- **Migration Scripts**: Use SQL migration scripts for schema changes
- **Data Transformation**: Scripts for data structure changes
- **Rollback Plans**: Prepare rollback procedures for each migration

### 9.3 Disaster Recovery
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours
- **Recovery Procedure**: Documented step-by-step recovery process
