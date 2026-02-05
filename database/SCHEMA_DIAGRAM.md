# Play2Learn Database Schema - Quick Reference

## Visual Schema Diagram

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

## Table Summary

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| **users** | Central user accounts | Links to all role-specific tables |
| **platform_admins** | Platform administrators | users |
| **school_admins** | School administrators | users |
| **teachers** | Teacher profiles | users, courses |
| **students** | Student profiles with gamification | users, parents, classes |
| **parents** | Parent accounts | users, students |
| **classes** | Classroom groups | users (creator), students, teachers |
| **courses** | Course offerings | teachers, enrollments, quests |
| **subjects** | Subject master data | teacher_classes |
| **enrollments** | Student-course enrollments | students, courses |
| **quests** | Learning activities | courses, quest_completions |
| **quest_completions** | Student quest progress | students, quests |
| **rewards** | Available achievements | student_rewards |
| **student_rewards** | Earned rewards | students, rewards |
| **teacher_classes** | Teacher-class assignments | teachers, classes, subjects |
| **teacher_invitations** | Teacher invitation system | users (inviter) |
| **user_audit_log** | Audit trail | users (performer, target) |

## Database Details

- **DBMS**: MySQL 9.5.0
- **Total Tables**: 17
- **Engine**: InnoDB with foreign key constraints
- **Character Set**: utf8mb4
- **Backup Location**: `/database/play2learn_backup.sql`

For detailed information about each table, see [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) in the root directory.
