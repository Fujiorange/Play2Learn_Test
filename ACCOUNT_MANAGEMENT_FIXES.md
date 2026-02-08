# Account Management and Template Download Fixes

## Summary of Changes

This document outlines the fixes made to address the issues mentioned in the problem statement:

1. **"Error: Failed to download template"** - Template download errors
2. **"Format is bad fix front end"** - Frontend formatting issues
3. **Account management** - Proper class and grade assignment for users
4. **Bulk upload** - Consistent format with single user management

---

## Changes Made

### 1. Fixed Template Download Rate Limiting

**File:** `backend/routes/schoolAdminRoutes.js`

**Problem:** The CSV template download endpoint was using the same restrictive rate limiter as CSV uploads (5 requests per 15 minutes), which could cause "Failed to download template" errors when users tried to download templates multiple times.

**Solution:** Created a separate, more lenient rate limiter specifically for template downloads:
- Template downloads: 20 requests per 15 minutes (vs. 5 for uploads)
- This allows users to download templates multiple times without hitting rate limits

**Code Changes:**
```javascript
// Added new rate limiter
const csvTemplateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // More lenient than upload limiter
  message: { success: false, error: 'Too many template download requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Updated template endpoint to use new limiter
router.get('/classes/csv-template', csvTemplateLimiter, authenticateSchoolAdmin, ...)
```

---

### 2. Fixed Frontend Form Field Order and Layout

**File:** `frontend/src/components/SchoolAdmin/ManualAddUser.js`

**Problem:** The manual user creation form had inconsistent field ordering. For students, class assignment came before grade level, which was confusing since grade level is more fundamental than class assignment.

**Solution:** Reordered fields for better UX and logical flow:

**For Students:**
1. Name, Email, Role (required fields)
2. Salutation (if applicable)
3. Password (auto-generated)
4. Gender
5. Date of Birth
6. Contact Number
7. **Grade Level** (Primary 1-6) ← Moved before class
8. **Assign to Class** (Optional) ← Now comes after grade
9. Subject (Mathematics, fixed)
10. Parent creation option

**For Teachers:**
1. Name, Email, Role (required fields)
2. **Salutation** (Mr, Mrs, Ms, etc.)
3. **Assign to Class** (Optional) ← **NEWLY ADDED**
4. Password (auto-generated)
5. Gender
6. Date of Birth
7. Contact Number

**Code Changes:**
- Split class assignment into role-specific sections
- Students get grade level → class assignment
- Teachers get class assignment right after salutation
- Improved visual hierarchy and consistency

---

### 3. Added Teacher Class Assignment Support

**Files:** 
- `frontend/src/components/SchoolAdmin/ManualAddUser.js`
- `backend/routes/schoolAdminRoutes.js`

**Problem:** 
- Frontend: Teachers didn't have a class assignment field in the manual user form
- Backend: Bulk upload was only adding students to classes, not teachers

**Solution:**

**Frontend:**
Added a dedicated class assignment field for teachers in the manual form:
```javascript
{formData.role === 'teacher' && (
  <div style={styles.formGroup}>
    <label style={styles.label}>Assign to Class</label>
    <select name="classId" value={formData.classId} onChange={handleChange}>
      <option value="">Select class (optional)</option>
      {classes.map(cls => (
        <option key={cls.id} value={cls.id}>
          {cls.name} - {cls.grade}
        </option>
      ))}
    </select>
  </div>
)}
```

**Backend Bulk Upload:**
Extended class name resolution and assignment to support teachers:
```javascript
// Before: Only handled students
if (role === 'Student' && className) { ... }

// After: Handles both students and teachers
if ((role === 'Student' || role === 'Teacher') && className) { ... }

// Added teacher class assignment (using $addToSet to append, not overwrite)
if (role === 'Teacher' && classId) {
  await Class.findByIdAndUpdate(classId, { $addToSet: { teachers: newUser._id } });
  await User.findByIdAndUpdate(newUser._id, { $addToSet: { assignedClasses: classId } });
}
```

**Important:** Used `$addToSet` operator to append classes to the `assignedClasses` array instead of overwriting it. This allows teachers to be assigned to multiple classes over time.

---

### 4. Updated Bulk Upload Template and Documentation

**File:** `frontend/src/components/SchoolAdmin/BulkUploadCSV.js`

**Problem:** 
- The bulk CSV template example didn't show class assignment for teachers
- Documentation didn't clearly explain class assignment requirements

**Solution:**

**Updated Template:**
```csv
Name,Email,Role,Salutation,Class,GradeLevel,ParentEmail,StudentEmail,Relationship,Subject,ContactNumber,Gender,DateOfBirth
John Tan,john.tan@student.com,Student,,1A,Primary 1,parent.tan@email.com,,,Mathematics,+6591234567,male,15/03/2019
David Lee,david.lee@teacher.com,Teacher,Mr,1A,,,,,,+6591234567,male,15/03/1985
Lim Mei Ling,parent.lim@email.com,Parent,Mrs,,,,john.tan@student.com,Mother,,+6598765432,female,22/07/1980
```

**Key Changes:**
- Teacher now has class "1A" assigned (was blank before)
- Filename: `bulk_users_upload_template.csv` (descriptive and clear)

**Updated Documentation:**
Added clear instructions about class assignment:
- "Class: Enter the class NAME (e.g., '1A', '2B'). Must match existing class in system."
- "For Students: GradeLevel ('Primary 1'), Class (class name, optional - e.g., '1A')"
- "For Teachers: Class (class name, optional)"
- "Class Assignment: Use class NAME (e.g., '1A'), not ID. Class must exist in system before upload."

---

## How Class Assignment Works

### Class Name vs. Class ID

- **Frontend (Manual Form):** Uses class ID (MongoDB ObjectId) from dropdown
- **Backend (Bulk Upload):** Uses class NAME (e.g., "1A") and looks it up in database

### Lookup Process (Bulk Upload)

1. Backend fetches all classes for the school:
   ```javascript
   const allClasses = await Class.find({ school_id: schoolAdmin.schoolId });
   ```

2. Creates a name-to-ID mapping (case-insensitive):
   ```javascript
   const classNameToId = {};
   allClasses.forEach(cls => {
     classNameToId[cls.class_name.toLowerCase()] = cls._id.toString();
   });
   ```

3. Resolves class name to ID for each user:
   ```javascript
   const classKey = className.toLowerCase().trim();
   if (classNameToId[classKey]) {
     classId = classNameToId[classKey];
   }
   ```

4. Adds user to class document:
   - Students: Added to `Class.students` array
   - Teachers: Added to `Class.teachers` array and `User.assignedClasses` array

---

## Testing Recommendations

### Manual Testing

1. **Template Download:**
   - Log in as School Admin
   - Navigate to CSV Class Upload page
   - Click "Download Template" button multiple times
   - Verify template downloads successfully without rate limit errors

2. **Manual User Creation - Students:**
   - Create a new student
   - Verify Grade Level field appears before Class field
   - Select a grade level (Primary 1)
   - Select a class (optional)
   - Verify user is created with both grade and class assigned

3. **Manual User Creation - Teachers:**
   - Create a new teacher
   - Verify Class assignment field appears after Salutation
   - Select a class (optional)
   - Verify teacher is created and added to class

4. **Bulk Upload - Students:**
   - Download the CSV template
   - Add student rows with class names (e.g., "1A")
   - Upload CSV
   - Verify students are created and assigned to correct classes

5. **Bulk Upload - Teachers:**
   - Use the same CSV with teacher rows
   - Include class names for teachers
   - Upload CSV
   - Verify teachers are created and assigned to classes
   - Verify teachers appear in Class.teachers array

### Database Verification

After creating users, verify in MongoDB:

```javascript
// Check student class assignment
db.users.find({ email: "john.tan@student.com" }).pretty()
// Should have: class: ObjectId("..."), gradeLevel: "Primary 1"

// Check teacher class assignment
db.users.find({ email: "david.lee@teacher.com" }).pretty()
// Should have: class: ObjectId("..."), assignedClasses: [ObjectId("...")]

// Check class documents
db.classes.find({ class_name: "1A" }).pretty()
// Should have students and teachers arrays populated
```

---

## API Endpoints Affected

1. **GET** `/api/mongo/school-admin/classes/csv-template`
   - Now uses `csvTemplateLimiter` (20 req/15min)
   
2. **POST** `/api/mongo/school-admin/users/manual`
   - Already supported class assignment for both roles
   
3. **POST** `/api/mongo/school-admin/bulk-import-users`
   - Now properly handles teacher class assignment

---

## Benefits

✅ **Reduced Template Download Errors:** More lenient rate limiting prevents legitimate users from being blocked

✅ **Better UX:** Logical field ordering makes forms easier to understand and complete

✅ **Feature Parity:** Teachers can now be assigned to classes just like students

✅ **Consistency:** Both manual and bulk user creation now handle class assignment the same way

✅ **Clear Documentation:** Users understand exactly how to format CSV files for class assignment

---

## Backward Compatibility

All changes are backward compatible:

- Existing API endpoints unchanged (only behavior improved)
- Class assignment remains optional for both students and teachers
- Existing users without class assignments are not affected
- CSV files without class columns still work (class assignment is optional)

---

## Files Modified

1. `backend/routes/schoolAdminRoutes.js` - Rate limiting and bulk upload fixes
2. `frontend/src/components/SchoolAdmin/ManualAddUser.js` - Form field reordering and teacher class assignment
3. `frontend/src/components/SchoolAdmin/BulkUploadCSV.js` - Template and documentation updates
