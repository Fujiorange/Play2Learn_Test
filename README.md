# Play2Learn - Educational Gamification Platform

Play2Learn is an educational platform that combines learning with gamification elements to engage students in their educational journey.

## 📚 Documentation

- **[Database Schema Diagram](DATABASE_SCHEMA.md)** - Complete database structure with entity relationships
- **[Email Setup Guide](EMAIL_SETUP_GUIDE.md)** - Instructions for configuring email functionality
- **[Teacher Role Implementation](TEACHER_ROLE_IMPLEMENTATION.md)** - Teacher role features and documentation

## 🗄️ Database Setup

### Step 1: Import SQL Database

1. Open MySQL Workbench
2. Connect to your local MySQL server

### Step 2: Create Database

Run this query:
```sql
CREATE DATABASE IF NOT EXISTS play2learn;
```

### Step 3: Import Database File

1. Click **Server** in the top menu
2. Click **Data Import**
3. Select "Import from Self-Contained File"
4. Click **Browse** and select the `database/play2learn_backup.sql` file
5. Under "Default Target Schema":
   - Select `play2learn` from dropdown
6. Click **Start Import** at the bottom right
7. Wait for it to finish

### Step 4: Verification

```sql
USE play2learn;
SELECT * FROM users;
```

It should display all users. You can also sign up a dummy account or use the default admin:

- **Email**: admin@play2learn.com
- **Password**: admin123

## ⚙️ Configuration

### Backend Configuration

1. Navigate to the `backend` directory
2. Create/edit the `.env` file with your MySQL credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_NAME=play2learn
```

**Note**: Change `DB_PASSWORD` to your MySQL root password

## 🚀 Running the Application

### Backend

1. Open terminal as administrator
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```

Expected output:
```
> play2learn-backend@1.0.0 start
> node server.js


╔════════════════════════════════════════╗
║   🚀 Play2Learn Server Running        ║
║   📍 Port: 5000                        ║
║   🌐 http://localhost:5000            ║
║   💾 Database: MySQL                   ║
╚════════════════════════════════════════╝

✅ Connected to MySQL database
```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## 📊 Database Schema

The Play2Learn platform uses a MySQL database with 17 interconnected tables:

### Core Tables
- **users** - Central user management
- **students**, **teachers**, **parents** - Role-specific profiles
- **platform_admins**, **school_admins** - Administrative roles

### Academic Structure
- **classes** - Classroom groups
- **courses** - Course offerings
- **subjects** - Subject master data
- **enrollments** - Student-course relationships
- **teacher_classes** - Teacher-class assignments

### Learning & Gamification
- **quests** - Learning activities (lessons, quizzes, assignments)
- **quest_completions** - Student progress tracking
- **rewards** - Available achievements
- **student_rewards** - Earned rewards

### Security & Audit
- **user_audit_log** - Comprehensive audit trail
- **teacher_invitations** - Teacher invitation system

For a complete visual representation of the database schema, see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## 🏗️ Project Structure

```
FYP-25-S4-14P_Play2Learn/
├── backend/           # Node.js backend server
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── middleware/   # Custom middleware
│   ├── services/     # Business logic
│   └── server.js     # Main server file
├── frontend/         # React frontend application
├── database/         # Database files and documentation
│   ├── play2learn_backup.sql  # Database backup
│   └── SCHEMA_DIAGRAM.md      # Quick schema reference
└── docs/            # Additional documentation
```

## 🔧 Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL 9.5.0
- **Frontend**: React.js
- **Authentication**: JWT, bcrypt
- **Email**: Nodemailer

## 👥 User Roles

1. **Platform Admin** - System-wide administration
2. **School Admin** - School-level management
3. **Teacher** - Course and class management
4. **Student** - Learning and quest participation
5. **Parent** - Student progress monitoring

## 📝 License

[Add your license information here]

## 🤝 Contributing

[Add contributing guidelines here]

## 📧 Contact

[Add contact information here]
