# Play2Learn Database Schema Diagram

This document provides a comprehensive visual representation of the Play2Learn database schema.

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ platform_admins : "has"
    users ||--o{ school_admins : "has"
    users ||--o{ teachers : "has"
    users ||--o{ students : "has"
    users ||--o{ parents : "has"
    users ||--o{ classes : "creates"
    users ||--o{ teacher_invitations : "invites"
    users ||--o{ user_audit_log : "performs"
    users ||--o{ user_audit_log : "target of"
    users ||--o{ teacher_classes : "assigns"
    users ||--o{ students : "parent of"
    users ||--o{ users : "approves"
    users ||--o{ users : "creates account"
    
    teachers ||--o{ courses : "teaches"
    teachers ||--o{ teacher_classes : "assigned to"
    
    students ||--o{ enrollments : "enrolls in"
    students ||--o{ quest_completions : "completes"
    students ||--o{ student_rewards : "earns"
    
    classes ||--o{ students : "contains"
    classes ||--o{ teacher_classes : "has teachers"
    
    courses ||--o{ enrollments : "has enrollments"
    courses ||--o{ quests : "contains"
    
    quests ||--o{ quest_completions : "completed by"
    
    rewards ||--o{ student_rewards : "awarded to"
    
    subjects ||--o{ teacher_classes : "taught in"
    
    users {
        int user_id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar contact
        enum gender
        varchar organization_name
        enum organization_type
        varchar business_registration_number
        enum role
        tinyint is_active
        enum approval_status
        tinyint email_verified
        varchar email_verification_token
        timestamp created_at
        timestamp updated_at
        timestamp last_login
        timestamp verified_at
        timestamp approved_at
        varchar profile_picture
        int approved_by FK
        text rejection_reason
        int created_by FK
    }
    
    platform_admins {
        int platform_admin_id PK
        int user_id FK UK
        enum admin_level
        text permissions
    }
    
    school_admins {
        int admin_id PK
        int user_id FK UK
        varchar position
        varchar department
    }
    
    teachers {
        int teacher_id PK
        int user_id FK UK
        varchar subject_specialization
        int years_of_experience
        varchar qualification
        int school_id
    }
    
    students {
        int student_id PK
        int user_id FK UK
        varchar grade_level
        int points
        int level
        date date_of_birth
        int parent_id FK
        int school_id
        int class_id FK
        date enrollment_date
    }
    
    parents {
        int parent_id PK
        int user_id FK UK
        varchar occupation
    }
    
    classes {
        int class_id PK
        varchar class_name
        varchar grade_level
        varchar school_name
        varchar academic_year
        int created_by FK
        tinyint is_active
        timestamp created_at
        timestamp updated_at
    }
    
    courses {
        int course_id PK
        varchar course_name
        enum subject
        text description
        varchar grade_level
        int teacher_id FK
        timestamp created_at
        tinyint is_active
    }
    
    enrollments {
        int enrollment_id PK
        int student_id FK
        int course_id FK
        timestamp enrollment_date
        decimal progress_percentage
        enum status
    }
    
    quests {
        int quest_id PK
        int course_id FK
        varchar quest_name
        text description
        enum quest_type
        int points_reward
        enum difficulty
        tinyint is_active
        timestamp due_date
        timestamp created_at
    }
    
    quest_completions {
        int completion_id PK
        int student_id FK
        int quest_id FK
        decimal score
        timestamp completed_at
        int time_spent_minutes
        enum status
    }
    
    rewards {
        int reward_id PK
        varchar reward_name
        text description
        enum reward_type
        int points_required
        varchar icon_url
    }
    
    student_rewards {
        int student_reward_id PK
        int student_id FK
        int reward_id FK
        timestamp earned_at
    }
    
    subjects {
        int subject_id PK
        varchar subject_name UK
        text description
        tinyint is_active
        timestamp created_at
    }
    
    teacher_classes {
        int assignment_id PK
        int teacher_id FK
        int class_id FK
        int subject_id FK
        int assigned_by FK
        timestamp assigned_at
        tinyint is_active
    }
    
    teacher_invitations {
        int invitation_id PK
        varchar email
        varchar invitation_token UK
        int invited_by FK
        varchar school_name
        timestamp expires_at
        enum status
        timestamp created_at
        timestamp accepted_at
    }
    
    user_audit_log {
        int log_id PK
        varchar action
        int performed_by FK
        int target_user_id FK
        json details
        varchar ip_address
        timestamp created_at
    }
```

## Table Descriptions

### Core User Tables

#### users
The central user table containing all user accounts across the platform.
- **Primary Key**: `user_id`
- **Unique Constraints**: `email`
- **Roles**: school-admin, platform-admin, teacher, student, parent
- **Organization Types**: tuition-center, government-school, private-school, business, individual
- **Approval Statuses**: pending, email_verified, approved, rejected, suspended

#### platform_admins
Platform administrators with system-wide permissions.
- **Foreign Keys**: `user_id` → users
- **Admin Levels**: super, moderator, support

#### school_admins
School administrators managing their respective institutions.
- **Foreign Keys**: `user_id` → users

#### teachers
Teacher-specific information and qualifications.
- **Foreign Keys**: `user_id` → users

#### students
Student profiles with gamification elements (points, levels).
- **Foreign Keys**: 
  - `user_id` → users
  - `parent_id` → users
  - `class_id` → classes

#### parents
Parent accounts linked to student accounts.
- **Foreign Keys**: `user_id` → users

### Academic Structure Tables

#### classes
Classroom/class groups within schools.
- **Foreign Keys**: `created_by` → users
- **Features**: Grade levels, academic years, school names

#### courses
Courses offered within the platform.
- **Foreign Keys**: `teacher_id` → teachers
- **Subjects**: English, Math, Science, Other

#### subjects
Master list of available subjects.
- **Contains**: Mathematics, Science, English, History, Geography, PE, Art, Music, Computer Science

#### teacher_classes
Junction table assigning teachers to classes for specific subjects.
- **Foreign Keys**:
  - `teacher_id` → teachers
  - `class_id` → classes
  - `subject_id` → subjects
  - `assigned_by` → users

#### teacher_invitations
System for inviting teachers to join the platform.
- **Foreign Keys**: `invited_by` → users
- **Statuses**: pending, accepted, expired, cancelled

### Learning & Gamification Tables

#### enrollments
Student enrollments in courses.
- **Foreign Keys**:
  - `student_id` → students
  - `course_id` → courses
- **Tracks**: Progress percentage, enrollment status

#### quests
Learning activities within courses (lessons, quizzes, assignments, challenges).
- **Foreign Keys**: `course_id` → courses
- **Types**: lesson, quiz, assignment, challenge
- **Difficulty Levels**: easy, medium, hard

#### quest_completions
Records of student quest completions.
- **Foreign Keys**:
  - `student_id` → students
  - `quest_id` → quests
- **Tracks**: Scores, time spent, completion status

#### rewards
Available rewards/achievements in the gamification system.
- **Types**: badge, certificate, achievement, item
- **Points Required**: Points needed to unlock rewards

#### student_rewards
Junction table tracking which students have earned which rewards.
- **Foreign Keys**:
  - `student_id` → students
  - `reward_id` → rewards

### Audit & Security Tables

#### user_audit_log
Comprehensive audit trail of user actions.
- **Foreign Keys**:
  - `performed_by` → users
  - `target_user_id` → users
- **Features**: Tracks actions, IP addresses, JSON details

## Key Relationships

1. **User Hierarchy**: The `users` table is the central hub, with role-specific tables (platform_admins, school_admins, teachers, students, parents) extending user functionality.

2. **Academic Structure**: Classes contain students, teachers are assigned to classes via teacher_classes, and courses are taught by teachers.

3. **Learning Flow**: Students enroll in courses, complete quests within those courses, earn points and rewards.

4. **Gamification**: Students earn points through quest completions and can unlock rewards based on points required.

5. **Access Control**: Multiple admin levels (platform and school) with audit logging for security and compliance.

## Database Engine

- **Engine**: InnoDB
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_0900_ai_ci
- **Features**: Foreign key constraints, cascading deletes, default timestamps
