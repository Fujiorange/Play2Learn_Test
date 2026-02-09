# Support Ticket Testing Guide

This guide explains how to test the fixed support ticket creation functionality.

## Overview

Support tickets can now be created by:
- **Students** via `/student/support` or `/student/support/create`
- **Teachers** via `/teacher/support/create`
- **Parents** via `/parent/support/create`

Tickets are routed to the appropriate admin based on category:
- **Website-Related Problem** → P2L Admin (`/p2ladmin/support-tickets`)
- **School-Related Problem** → School Admin (`/school-admin/support-tickets`)

## API Endpoints

### Student Tickets
- **Create**: `POST /api/mongo/student/support-tickets`
- **Get All**: `GET /api/mongo/student/support-tickets`

### Teacher Tickets
- **Create**: `POST /api/mongo/teacher/support-tickets`
- **Get All**: `GET /api/mongo/teacher/support-tickets`

### Parent Tickets
- **Create**: `POST /api/mongo/parent/support-tickets`
- **Get All**: `GET /api/mongo/parent/support-tickets`

### P2L Admin (Website Tickets)
- **Get All**: `GET /api/p2ladmin/support-tickets?status=all`
- **Get One**: `GET /api/p2ladmin/support-tickets/:id`
- **Reply**: `POST /api/p2ladmin/support-tickets/:id/reply`
- **Close**: `POST /api/p2ladmin/support-tickets/:id/close`
- **Stats**: `GET /api/p2ladmin/support-tickets-stats`

### School Admin (School Tickets)
- **Get All**: `GET /api/mongo/school-admin/support-tickets?status=all`
- **Get One**: `GET /api/mongo/school-admin/support-tickets/:id`
- **Reply**: `POST /api/mongo/school-admin/support-tickets/:id/reply`
- **Close**: `POST /api/mongo/school-admin/support-tickets/:id/close`
- **Stats**: `GET /api/mongo/school-admin/support-tickets-stats`

## Testing Steps

### 1. Test Student Ticket Creation

1. Login as a student
2. Navigate to `/student/support` or `/student/support/create`
3. Fill in the form:
   - **Category**: Website-Related Problem OR School-Related Problem
   - **Subject**: Test subject
   - **Description**: Test description
4. Submit the form
5. Verify success message appears with ticket ID
6. Check `/student/support/track` to see the created ticket

**Expected Results:**
- Success message: "✅ Support ticket #[ID] created successfully!"
- Ticket appears in student's tracking page
- Website tickets appear in P2L Admin dashboard
- School tickets appear in School Admin dashboard

### 2. Test Teacher Ticket Creation

1. Login as a teacher
2. Navigate to `/teacher/support/create`
3. Fill in the form:
   - **Category**: Website-Related Problem OR School-Related Problem
   - **Subject**: Test subject
   - **Description**: Test description
   - **Priority**: Normal/High/Low
4. Submit the form
5. Verify success message appears
6. Check `/teacher/support/track` to see the created ticket

**Expected Results:**
- Success message appears
- Ticket saved with `user_role='Teacher'`
- Ticket appears in teacher's tracking page
- Routed to correct admin based on category

### 3. Test Parent Ticket Creation

1. Login as a parent
2. Navigate to `/parent/support/create`
3. Fill in the form:
   - **Category**: Website-Related Problem OR School-Related Problem
   - **Subject**: Test subject
   - **Description**: Test description
4. Submit the form
5. Verify success message appears
6. Check `/parent/support/track` to see the created ticket

**Expected Results:**
- Success message appears
- Ticket saved with `user_role='Parent'`
- Priority field is included
- Ticket appears in parent's tracking page

### 4. Test P2L Admin View

1. Login as P2L Admin
2. Navigate to `/p2ladmin/support-tickets`
3. Verify only **website-related** tickets are shown
4. Filter by status (All, Open, Pending, Closed)
5. View individual ticket details
6. Test reply and close functionality

**Expected Results:**
- Only tickets with `category='website'` are displayed
- Tickets from all user roles (Student, Teacher, Parent) are visible
- Filtering works correctly
- Reply and close functions work

### 5. Test School Admin View

1. Login as School Admin
2. Navigate to `/school-admin/support-tickets` (if UI exists)
3. Verify only **school-related** tickets from their school are shown
4. View individual ticket details
5. Test reply and close functionality

**Expected Results:**
- Only tickets with `category='school'` AND matching school_id are displayed
- Tickets from students, teachers, and parents in the same school are visible
- Reply and close functions work

## Database Verification

To verify tickets are saved correctly, check the MongoDB `supporttickets` collection:

```javascript
// All tickets
db.supporttickets.find()

// Website tickets only
db.supporttickets.find({ category: 'website' })

// School tickets only
db.supporttickets.find({ category: 'school' })

// Tickets by user role
db.supporttickets.find({ user_role: 'Teacher' })
db.supporttickets.find({ user_role: 'Student' })
db.supporttickets.find({ user_role: 'Parent' })
```

## Common Issues

### "Failed to create support ticket" Error

**Possible Causes:**
1. Backend server not running
2. Database connection issues
3. Authentication token expired
4. Missing required fields
5. Network/CORS issues

**Debug Steps:**
1. Check browser console for detailed error
2. Verify backend server is running (`npm start` in backend folder)
3. Check MongoDB connection
4. Verify user is logged in (token in localStorage)
5. Check network tab in browser DevTools

### Tickets Not Appearing in Admin Dashboard

**Possible Causes:**
1. Category mismatch (website vs school)
2. School ID mismatch for school tickets
3. Database query filters

**Debug Steps:**
1. Verify ticket category in database
2. Check school_id matches for school tickets
3. Verify admin's school assignment
4. Check backend logs for errors

## Success Criteria

✅ Students can create tickets successfully
✅ Teachers can create tickets successfully
✅ Parents can create tickets successfully
✅ Website tickets route to P2L Admin
✅ School tickets route to School Admin (filtered by school)
✅ All users can view their created tickets
✅ Admins can view, reply, and close tickets
✅ No errors in browser console or backend logs
