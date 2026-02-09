# CSV Bulk Upload & Automatic Quiz Generation - API Documentation

## Overview
This document describes the implementation of two major automation features for the Play2Learn platform:
1. **CSV Bulk Class Creation System** - Bulk upload classes, teachers, and students via CSV files
2. **Automatic Quiz Generation System** - Automatically generate quizzes when enough questions are available

## Task 1: CSV Bulk Class Creation System

### Features
- Upload CSV files to bulk create classes, teachers, and students
- Automatic detection of CSV file type (class, teacher, or student)
- Duplicate email detection and handling
- Automatic temporary password generation
- Parent account creation and linking
- License limit validation
- Transaction rollback on errors
- Credentials management and email distribution

### API Endpoints

#### 1. Bulk Upload CSV
**Endpoint:** `POST /api/mongo/school-admin/classes/bulk-upload`  
**Authentication:** School Admin token required  
**Content-Type:** `multipart/form-data`

**Request:**
```javascript
// Form data
csvFile: File // CSV file to upload
```

**CSV Formats:**

**Class CSV:**
```csv
Class Name,Grade,Subject
Science 10A,Primary 1,Science
Math 9B,Primary 2,Mathematics
```

**Teacher CSV:**
```csv
Teacher Name,Teacher Email,Teacher Role,Class Name
John Doe,john@school.edu,Teacher,Science 10A
Jane Smith,jane@school.edu,Teacher,Math 9B
```

**Student CSV:**
```csv
Student Name,Student Email,Student Role,Linked Parent Email,Class Name
Alice Brown,alice@student.edu,Student,parent1@email.com,Science 10A
Bob Johnson,bob@student.edu,Student,parent2@email.com,Science 10A
```

**Response:**
```javascript
{
  "success": true,
  "sessionId": "abc123...",
  "csvType": "student",
  "totalRows": 50,
  "successfulRows": 48,
  "failedRows": 2,
  "status": "partial",
  "createdEntities": [
    {
      "entityType": "student",
      "entityId": "507f1f77bcf86cd799439011",
      "name": "Alice Brown",
      "email": "alice@student.edu",
      "className": "Science 10A"
    }
  ],
  "errors": [
    {
      "row": 5,
      "field": "Student Email",
      "message": "Invalid email format",
      "data": { ... }
    }
  ],
  "message": "Successfully processed 48 out of 50 rows"
}
```

#### 2. Get Pending Credentials
**Endpoint:** `GET /api/mongo/school-admin/pending-credentials`  
**Authentication:** School Admin token required

**Response:**
```javascript
{
  "success": true,
  "credentials": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Alice Brown",
        "email": "alice@student.edu",
        "role": "Student",
        "class": "Science 10A"
      },
      "email": "alice@student.edu",
      "tempPassword": "TempPass123!",
      "role": "Student",
      "name": "Alice Brown",
      "classAssigned": "Science 10A",
      "linkedParentEmail": "parent1@email.com",
      "sent": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 25
}
```

#### 3. Send Credentials
**Endpoint:** `POST /api/mongo/school-admin/send-credentials`  
**Authentication:** School Admin token required

**Request:**
```javascript
{
  "credentialIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ]
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Sent 2 credentials, 0 failed",
  "results": {
    "success": 2,
    "failed": 0,
    "errors": []
  }
}
```

#### 4. Get Upload Sessions
**Endpoint:** `GET /api/mongo/school-admin/bulk-upload/sessions`  
**Authentication:** School Admin token required

**Response:**
```javascript
{
  "success": true,
  "sessions": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "sessionId": "abc123...",
      "csvType": "student",
      "status": "completed",
      "fileName": "students.csv",
      "totalRows": 50,
      "successfulRows": 50,
      "failedRows": 0,
      "uploadedBy": {
        "name": "Admin Name",
        "email": "admin@school.edu"
      },
      "timestamp": "2024-01-15T10:30:00.000Z",
      "completedAt": "2024-01-15T10:32:00.000Z"
    }
  ]
}
```

### Database Models

#### BulkUploadSession
```javascript
{
  sessionId: String,          // Unique session identifier
  csvType: String,            // 'class', 'teacher', or 'student'
  status: String,             // 'processing', 'completed', 'failed', 'partial'
  schoolId: ObjectId,         // Reference to School
  uploadedBy: ObjectId,       // Reference to User (School Admin)
  fileName: String,           // Original CSV filename
  totalRows: Number,          // Total rows in CSV
  successfulRows: Number,     // Successfully processed rows
  failedRows: Number,         // Failed rows
  createdEntities: [{         // Array of created entities
    entityType: String,       // 'class', 'teacher', 'student', 'parent'
    entityId: ObjectId,
    name: String,
    email: String,
    className: String
  }],
  uploadErrors: [{            // Array of errors
    row: Number,
    field: String,
    message: String,
    data: Mixed
  }],
  timestamp: Date,
  completedAt: Date
}
```

#### PendingCredential
```javascript
{
  userId: ObjectId,           // Reference to User (unique)
  email: String,
  tempPassword: String,       // Temporary password
  role: String,               // User role
  name: String,
  schoolId: ObjectId,         // Reference to School
  classAssigned: String,      // Class name (for students/teachers)
  linkedParentEmail: String,  // Parent email (for students)
  sent: Boolean,              // Whether credentials were sent
  sentAt: Date,
  sentBy: ObjectId,           // Reference to User who sent
  createdAt: Date,
  expiresAt: Date             // 30 days from creation
}
```

---

## Task 2: Automatic Quiz Generation System

### Features
- Automatic quiz generation when ≥40 questions exist for a Grade/Subject/QuizLevel combination
- Hourly background job to check and generate quizzes
- Freshness weighting (prioritizes newer/unused questions)
- Adaptive difficulty progression
- Unique question sequence per generation
- Quiz naming convention: `Grade_[GradeName]_[Subject]_QuizLevel_[LevelName]`
- Manual trigger option for administrators
- Enable/disable auto-generation per combination

### API Endpoints

#### 1. Get Generation Status
**Endpoint:** `GET /api/p2ladmin/quizzes/generation-status`  
**Authentication:** P2L Admin token required

**Response:**
```javascript
{
  "success": true,
  "summary": {
    "totalCombinations": 45,
    "canGenerate": 12,
    "autoEnabled": 12,
    "needsQuestions": 33
  },
  "combinations": [
    {
      "grade": "Primary 1",
      "subject": "Mathematics",
      "quizLevel": 1,
      "questionCount": 67,
      "canGenerate": true,
      "autoGenerationEnabled": true,
      "lastGenerated": "2024-01-15T10:00:00.000Z"
    }
  ],
  "jobStatus": {
    "running": true,
    "intervalMs": 3600000,
    "intervalHours": 1
  }
}
```

#### 2. Manually Trigger Auto-Generation
**Endpoint:** `POST /api/p2ladmin/quizzes/auto-generate`  
**Authentication:** P2L Admin token required

**Response:**
```javascript
{
  "success": true,
  "message": "Generated 5 quizzes, skipped 7, checked 12 combinations",
  "results": {
    "checked": 12,
    "generated": 5,
    "skipped": 7,
    "errors": []
  }
}
```

#### 3. Generate Quiz by Criteria
**Endpoint:** `POST /api/p2ladmin/quizzes/generate-by-criteria`  
**Authentication:** P2L Admin token required

**Request:**
```javascript
{
  "grade": "Primary 1",
  "subject": "Mathematics",
  "quizLevel": 1
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Quiz generated successfully: Grade_Primary 1_Mathematics_QuizLevel_1",
  "quiz": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Grade_Primary 1_Mathematics_QuizLevel_1",
    "description": "Auto-generated quiz for Primary 1, Mathematics, Level 1...",
    "questionCount": 20,
    "grade": "Primary 1",
    "subject": "Mathematics",
    "quizLevel": 1
  }
}
```

#### 4. Toggle Auto-Generation
**Endpoint:** `PUT /api/p2ladmin/quizzes/generation-tracking/:id/toggle`  
**Authentication:** P2L Admin token required

**Request:**
```javascript
{
  "autoGenerationEnabled": false
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Auto-generation disabled for Primary 1/Mathematics/Level 1",
  "tracking": {
    "_id": "507f1f77bcf86cd799439011",
    "grade": "Primary 1",
    "subject": "Mathematics",
    "quizLevel": 1,
    "questionCount": 67,
    "autoGenerationEnabled": false,
    "lastGenerated": "2024-01-15T10:00:00.000Z"
  }
}
```

### Database Models

#### QuizGenerationTracking
```javascript
{
  grade: String,                    // Grade level
  subject: String,                  // Subject name
  quizLevel: Number,                // Quiz level (1-10)
  questionCount: Number,            // Current question count
  lastChecked: Date,                // Last check timestamp
  lastGenerated: Date,              // Last generation timestamp
  generatedQuizzes: [{              // Array of generated quizzes
    quizId: ObjectId,               // Reference to Quiz
    generatedAt: Date,
    questionCount: Number
  }],
  autoGenerationEnabled: Boolean,   // Whether auto-gen is enabled
  createdAt: Date,
  updatedAt: Date
}
```

### Background Job

The automatic quiz generation job:
- **Frequency:** Runs every hour (3600000 ms)
- **Startup:** Automatically starts when server starts
- **Shutdown:** Gracefully stops on SIGTERM
- **Process:**
  1. Checks all Grade/Subject/QuizLevel combinations
  2. Counts questions for each combination
  3. Generates quiz if ≥40 questions and auto-generation enabled
  4. Updates tracking records
  5. Logs results

### Quiz Generation Algorithm

1. **Threshold Check:** Verify ≥40 questions exist
2. **Freshness Weighting:** Calculate weight for each question based on:
   - Time since last use (newer = higher weight)
   - Usage count (less used = higher weight)
3. **Adaptive Selection:** Select 20 questions with difficulty progression
4. **Shuffle:** Randomize final question order
5. **Save:** Create quiz with naming convention
6. **Update:** Mark questions as used and update tracking

### Usage Example

```javascript
// Server automatically starts the job on startup
// in backend/server.js:
const { startAutoGenerationJob } = require('./services/autoGenerationJob');
startAutoGenerationJob();

// To manually trigger generation from admin panel:
POST /api/p2ladmin/quizzes/auto-generate
Authorization: Bearer <admin_token>

// To check status:
GET /api/p2ladmin/quizzes/generation-status
Authorization: Bearer <admin_token>
```

---

## Error Handling

### CSV Bulk Upload
- **Invalid CSV format:** Returns 400 with error message
- **License limit exceeded:** Skips user creation, logs in errors array
- **Duplicate email:** Skips creation, assigns to class only
- **Missing required fields:** Logs in errors array, continues processing
- **Database error:** Rolls back all created entities, returns 500

### Quiz Generation
- **Insufficient questions:** Throws error with count details
- **Database connection error:** Logs error, continues with next combination
- **Invalid parameters:** Returns 400 with validation error

## Security Considerations

1. **Authentication:** All endpoints require proper role-based authentication
2. **License Validation:** Checks license limits before creating users
3. **Email Validation:** Validates email format before creation
4. **Password Security:** Temporary passwords are hashed with bcrypt
5. **Rollback Protection:** Failed uploads rollback all created entities
6. **Input Validation:** CSV data is validated before processing

## Testing

Run the test script to verify implementation:
```bash
cd backend
node test-imports.js
```

Expected output:
```
✅ All import and syntax tests passed!
✅ Task 1: Automatic Quiz Generation System - Implementation Complete
✅ Task 2: CSV Bulk Class Creation System - Implementation Complete
```

## Deployment Notes

1. **Environment Variables:** No new variables required
2. **Database:** MongoDB indexes will be created automatically
3. **Background Job:** Starts automatically on server startup
4. **Email Service:** Requires email configuration for credentials sending
5. **CSV Storage:** Uses temporary uploads folder (auto-cleanup on completion)
