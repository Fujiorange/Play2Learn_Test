# License Management API Documentation

This document describes the API endpoints for the License Management system in the Play2Learn platform.

## Overview

The License Management system allows:
- School admins to register with automatic trial license assignment
- P2L Admins to manage license types and pricing
- School admins to view their license usage and upgrade options

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### License Management (P2L Admin)

#### GET /api/licenses
Get all available license types.

**Authentication Required:** Yes  
**Role Required:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "licenses": [
    {
      "_id": "...",
      "name": "Trial",
      "type": "trial",
      "priceMonthly": 0,
      "priceYearly": 0,
      "maxTeachers": 1,
      "maxStudents": 5,
      "maxClasses": 1,
      "description": "30-day free trial...",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### GET /api/licenses/:id
Get a specific license by ID.

**Authentication Required:** Yes  
**Role Required:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "license": { /* license object */ }
}
```

#### POST /api/licenses
Create a new license type.

**Authentication Required:** Yes  
**Role Required:** P2L Admin (`p2ladmin` or `Platform Admin`)

**Request Body:**
```json
{
  "name": "Professional",
  "type": "professional",
  "priceMonthly": 99.99,
  "priceYearly": 999.99,
  "maxTeachers": 20,
  "maxStudents": 200,
  "maxClasses": 50,
  "description": "Ideal for medium-sized institutions",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "license": { /* created license object */ }
}
```

#### PUT /api/licenses/:id
Update an existing license.

**Authentication Required:** Yes  
**Role Required:** P2L Admin (`p2ladmin` or `Platform Admin`)

**Request Body:** Same fields as POST, all optional

**Response:**
```json
{
  "success": true,
  "license": { /* updated license object */ }
}
```

#### DELETE /api/licenses/:id
Delete a license type.

**Authentication Required:** Yes  
**Role Required:** P2L Admin (`p2ladmin` or `Platform Admin`)

**Note:** Trial license cannot be deleted.

**Response:**
```json
{
  "success": true,
  "message": "License deleted successfully"
}
```

---

### School Admin Registration

#### POST /api/mongo/auth/register-school-admin
Register a new school admin with automatic trial license assignment.

**Authentication Required:** No (public endpoint)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "institutionName": "ABC Learning Center",
  "referralSource": "search-engine",
  "contact": "+1234567890",
  "gender": "male",
  "date_of_birth": "1990-01-01"
}
```

**Required Fields:**
- `name`
- `email`
- `password`
- `institutionName`

**Response:**
```json
{
  "success": true,
  "message": "School admin account created successfully with 30-day trial license",
  "schoolId": "...",
  "trialExpiresAt": "2026-03-10T08:12:35.002Z"
}
```

**Validation:**
- Email must be unique
- Institution name must be unique
- Trial license must exist in database
- Creates both school and school admin user

---

### School Admin License Management

#### GET /api/mongo/school-admin/license-info
Get current school's license information and usage statistics.

**Authentication Required:** Yes  
**Role Required:** School Admin

**Response:**
```json
{
  "success": true,
  "license": {
    "type": "trial",
    "name": "Trial",
    "description": "30-day free trial...",
    "expiresAt": "2026-03-10T08:12:35.002Z",
    "daysRemaining": 30,
    "limits": {
      "maxTeachers": 1,
      "maxStudents": 5,
      "maxClasses": 1
    },
    "usage": {
      "currentTeachers": 0,
      "currentStudents": 0,
      "currentClasses": 0
    },
    "isExpired": false,
    "isNearExpiry": false
  }
}
```

**Notes:**
- `daysRemaining` is `null` if license has no expiration
- `-1` in limits means unlimited
- `isExpired` is `true` if `daysRemaining <= 0`
- `isNearExpiry` is `true` if `daysRemaining > 0 && daysRemaining <= 7`

#### POST /api/mongo/school-admin/upgrade-license
Request a license upgrade.

**Authentication Required:** Yes  
**Role Required:** School Admin

**Request Body:**
```json
{
  "licenseType": "professional",
  "billingCycle": "monthly"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Upgrade request received. Please contact support to complete the upgrade.",
  "upgradeDetails": {
    "currentPlan": "trial",
    "newPlan": "professional",
    "billingCycle": "monthly",
    "price": 99.99
  }
}
```

**Notes:**
- This endpoint currently just prepares the upgrade request
- In production, this would integrate with a payment processor

---

## Database Models

### License Model
```javascript
{
  name: String,           // "Trial", "Starter", "Professional", "Enterprise"
  type: String,           // "trial", "starter", "professional", "enterprise" (unique)
  priceMonthly: Number,   // Monthly price in USD
  priceYearly: Number,    // Yearly price in USD
  maxTeachers: Number,    // -1 for unlimited
  maxStudents: Number,    // -1 for unlimited
  maxClasses: Number,     // -1 for unlimited
  description: String,    // License description
  isActive: Boolean,      // Whether license is active
  createdAt: Date,
  updatedAt: Date
}
```

### School Model (Updated)
```javascript
{
  organization_name: String,
  organization_type: String,
  plan: String,                    // "trial", "starter", "professional", "enterprise"
  plan_info: {
    teacher_limit: Number,
    student_limit: Number,
    class_limit: Number,           // NEW
    price: Number
  },
  licenseId: ObjectId,             // NEW - Reference to License
  licenseExpiresAt: Date,          // NEW - Expiration date
  contact: String,
  is_active: Boolean,
  current_teachers: Number,
  current_students: Number,
  current_classes: Number,         // NEW
  createdAt: Date,
  updatedAt: Date
}
```

### User Model (Relevant Fields)
```javascript
{
  name: String,
  email: String,
  password: String,
  role: String,            // "School Admin" for school admins
  schoolId: String,        // Reference to school
  isTrialUser: Boolean,    // true for trial accounts
  // ... other fields
}
```

---

## Frontend Components

### P2L Admin
- **LicenseManagement** (`/p2ladmin/licenses`): CRUD interface for managing licenses

### School Admin
- **SchoolLicenseView** (`/school-admin/license`): View license info, usage, and upgrade options

### Public
- **RegisterPage** (`/register`): Updated to support both trial student and school admin registration

---

## Seeding Data

To seed the default license types, run:
```bash
cd backend
node seed-licenses.js
```

This creates:
1. **Trial**: Free, 1 teacher, 5 students, 1 class, 30-day validity
2. **Starter**: $29.99/month, 5 teachers, 50 students, 10 classes
3. **Professional**: $99.99/month, 20 teachers, 200 students, 50 classes
4. **Enterprise**: $299.99/month, unlimited everything

---

## Error Handling

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

Common error cases:
- **400 Bad Request**: Missing required fields, validation errors
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions for the operation
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

---

## Security Considerations

1. **Institution Name Uniqueness**: Prevents duplicate school registrations
2. **Email Uniqueness**: Prevents duplicate user accounts
3. **Role-Based Access**: Only P2L Admins can modify licenses
4. **Trial License Protection**: Trial license cannot be deleted
5. **Password Hashing**: All passwords are hashed with bcrypt
6. **JWT Authentication**: All protected endpoints require valid JWT token

---

## Future Enhancements

1. **Rate Limiting**: Add rate limiting to registration endpoint
2. **Payment Integration**: Integrate with Stripe/PayPal for license upgrades
3. **Email Confirmation**: Email verification flow for new registrations
4. **CAPTCHA**: Add Google reCAPTCHA to prevent automated registrations
5. **License Usage Enforcement**: Middleware to enforce license limits
6. **Automated Expiration**: Cron job to handle expired licenses
7. **Migration Script**: Tool to migrate existing trial users to new system
