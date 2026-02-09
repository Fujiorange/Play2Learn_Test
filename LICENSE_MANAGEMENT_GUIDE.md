# License Management System - Implementation Guide

This guide provides step-by-step instructions for deploying and using the new License Management System in the Play2Learn platform.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Database Setup](#database-setup)
5. [Testing the Implementation](#testing-the-implementation)
6. [Usage Guide](#usage-guide)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The License Management System enables:
- **School Admins** to register directly with automatic trial license (30 days, 1 teacher, 5 students, 1 class)
- **P2L Admins** to manage license types and pricing plans
- **School Admins** to view license usage and request upgrades

### Key Features

✅ Self-service school admin registration  
✅ Automatic trial license assignment  
✅ License usage tracking and limits  
✅ Upgrade request workflow  
✅ Complete admin interfaces for license management  

---

## Prerequisites

Ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (local or Atlas connection)
- Git

---

## Installation

### 1. Clone the Repository (if not already done)

```bash
git clone https://github.com/Fujiorange/FYP-25-S4-14P_Play2Learn.git
cd FYP-25-S4-14P_Play2Learn
git checkout copilot/update-registration-system
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

---

## Database Setup

### 1. Configure MongoDB Connection

Create or update `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/play2learn
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/play2learn

JWT_SECRET=your-secure-jwt-secret-here
NODE_ENV=development
```

### 2. Seed License Types

Run the seed script to create the default license types:

```bash
cd backend
node seed-licenses.js
```

Expected output:
```
🔗 Connecting to MongoDB...
✅ Connected to MongoDB
🗑️  Clearing existing licenses...
✅ Cleared existing licenses
📝 Creating license types...
   ✓ Created Trial license
   ✓ Created Starter license
   ✓ Created Professional license
   ✓ Created Enterprise license

✅ Successfully seeded all licenses!

License Summary:
   - Trial: $0/month, 1 teachers, 5 students, 1 classes
   - Starter: $29.99/month, 5 teachers, 50 students, 10 classes
   - Professional: $99.99/month, 20 teachers, 200 students, 50 classes
   - Enterprise: $299.99/month, Unlimited teachers, Unlimited students, Unlimited classes
```

---

## Testing the Implementation

### 1. Start the Backend Server

```bash
cd backend
npm start
# Or for development with auto-reload:
npm run dev
```

Expected output:
```
🚀 Starting Play2Learn Server...
🌐 Environment: development
🔗 MongoDB: Local
✅ Connected to MongoDB successfully!
✅ Registered all routes successfully.
🎧 Server is running on port 5000
```

### 2. Start the Frontend Application

In a new terminal:

```bash
cd frontend
npm start
```

The application should open at `http://localhost:3000`

### 3. Test School Admin Registration

1. Navigate to `http://localhost:3000/register`
2. Click the **"🏫 School Admin"** tab
3. Fill in the form:
   - Full Name: `Test Admin`
   - Email: `admin@testschool.com`
   - Institution Name: `Test School`
   - Password: `password123` (min 8 characters)
   - Confirm Password: `password123`
4. Click **"Start 30-Day Trial"**
5. You should see: "School admin account created with 30-day trial! Redirecting to login..."

### 4. Test School Admin Login

1. Navigate to `http://localhost:3000/login`
2. Login with:
   - Email: `admin@testschool.com`
   - Password: `password123`
3. You should be redirected to the School Admin Dashboard

### 5. View License Information

1. From the School Admin Dashboard, click **"📊 View License Details"**
2. You should see:
   - License Type: **Trial**
   - Days Remaining: **30**
   - Usage: 0/1 teachers, 0/5 students, 0/1 classes
   - Expiration warning

### 6. Test P2L Admin License Management

#### Create a P2L Admin User (if needed)

You can create a P2L admin using MongoDB directly:

```javascript
// In MongoDB shell or Compass
db.users.insertOne({
  name: "Platform Admin",
  email: "admin@play2learn.com",
  password: "$2b$10$hash_generated_for_password123", // Use bcrypt to hash
  role: "p2ladmin",
  emailVerified: true,
  createdAt: new Date()
})
```

Or use the existing create-admin script if available.

#### Access License Management

1. Login as P2L Admin
2. Navigate to `http://localhost:3000/p2ladmin/dashboard`
3. Click **"📜 License Management"**
4. You should see all license types (Trial, Starter, Professional, Enterprise)
5. Test creating, editing, and viewing licenses

---

## Usage Guide

### For School Admins

#### Registering a New School

1. Go to `/register`
2. Select **"🏫 School Admin"** tab
3. Provide:
   - Your name
   - Email address (must be unique)
   - Institution/Organization name (must be unique)
   - Contact number (optional)
   - Password (min 8 characters)
4. Optionally select how you heard about us
5. Click **"Start 30-Day Trial"**

#### Viewing License Information

1. Login to your account
2. Go to Dashboard → **"📊 View License Details"**
3. View:
   - Current plan and pricing
   - Usage statistics with progress bars
   - Days remaining (for trial)
   - Expiration warnings

#### Requesting an Upgrade

1. From the License Details page, click **"⬆️ Upgrade License"**
2. Or click **"Upgrade Now"** from the expiration warning
3. This opens a modal with contact information
4. Click **"Contact Sales"** to send an email request

### For P2L Admins

#### Managing Licenses

1. Login as P2L Admin
2. Navigate to **P2L Admin Dashboard** → **"📜 License Management"**

#### Creating a New License

1. Click **"+ Create New License"**
2. Fill in:
   - License Name (e.g., "Custom Plan")
   - License Type (unique, lowercase, e.g., "custom")
   - Monthly Price
   - Yearly Price
   - Max Teachers (use -1 for unlimited)
   - Max Students (use -1 for unlimited)
   - Max Classes (use -1 for unlimited)
   - Description
   - Active status checkbox
3. Click **"Create License"**

#### Editing a License

1. Find the license card
2. Click **"Edit"**
3. Modify the fields (note: type cannot be changed)
4. Click **"Update License"**

#### Deleting a License

1. Find the license card
2. Click **"Delete"**
3. Confirm the deletion
4. Note: Trial license cannot be deleted (protected)

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Error:** `Error connecting to MongoDB`

**Solutions:**
- Verify MongoDB is running: `mongod --version`
- Check connection string in `.env`
- For Atlas: verify network access and credentials
- Check firewall settings

#### 2. License Seeding Failed

**Error:** `Failed to seed licenses`

**Solutions:**
- Ensure MongoDB is connected
- Check if licenses already exist: `db.licenses.find()`
- Clear existing licenses and re-run: `db.licenses.deleteMany({})`
- Check for validation errors in console

#### 3. Registration Fails with "Email already registered"

**Solutions:**
- Use a different email address
- Or delete the existing user from database:
  ```javascript
  db.users.deleteOne({ email: "test@example.com" })
  ```

#### 4. Registration Fails with "Institution name already exists"

**Solutions:**
- Use a different institution name
- Or delete the existing school:
  ```javascript
  db.schools.deleteOne({ organization_name: /^Test School$/i })
  ```

#### 5. Cannot Access License Management Page

**Solutions:**
- Verify you're logged in as P2L Admin
- Check user role: `db.users.findOne({ email: "your@email.com" }).role`
- Should be `"p2ladmin"` or `"Platform Admin"`

#### 6. License Usage Not Updating

**Solutions:**
- Verify school has `current_teachers`, `current_students`, `current_classes` fields
- These are updated when teachers/students/classes are created
- Check school document:
  ```javascript
  db.schools.findOne({ organization_name: "Test School" })
  ```

### Debug Mode

Enable debug logging in backend:

```javascript
// In backend/server.js, add:
console.log('Debug mode enabled');
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

### Checking Database State

#### View All Licenses
```javascript
db.licenses.find().pretty()
```

#### View All Schools
```javascript
db.schools.find().pretty()
```

#### View Specific School's License Info
```javascript
db.schools.aggregate([
  { $lookup: {
      from: 'licenses',
      localField: 'licenseId',
      foreignField: '_id',
      as: 'license'
  }},
  { $unwind: '$license' }
])
```

---

## API Reference

For detailed API documentation, see: [LICENSE_MANAGEMENT_API.md](./LICENSE_MANAGEMENT_API.md)

## Security Considerations

For security analysis and recommendations, see: [SECURITY_SUMMARY.md](./SECURITY_SUMMARY.md)

---

## Support

For issues or questions:
1. Check this troubleshooting guide
2. Review the API documentation
3. Check application logs (backend console)
4. Contact the development team

---

## Next Steps

After successful deployment:

1. ✅ Test all registration flows
2. ✅ Verify license creation and assignment
3. ✅ Test license usage tracking
4. 🔄 Implement rate limiting (production requirement)
5. 🔄 Add CAPTCHA to registration (production requirement)
6. 🔄 Configure email verification (optional)
7. 🔄 Set up monitoring and alerts
8. 🔄 Configure production environment variables
9. 🔄 Enable HTTPS
10. 🔄 Deploy to production server

---

## Changelog

### Version 1.0.0 (Current)
- Initial implementation of License Management System
- School admin self-registration with trial license
- P2L Admin license CRUD interface
- School Admin license view and upgrade workflow
- Database models and API endpoints
- Frontend components and routing
- Security fixes and validation
- Documentation and guides
