# License System Update - Implementation Guide

## Overview

This update simplifies the license system from multiple specific types (trial, starter, professional, enterprise, custom) to two generic types: **free** and **paid**. Schools now directly reference licenses from the License collection, ensuring automatic updates when licenses change.

## Changes Made

### 1. License Model (backend/models/License.js)

**Changed:**
- License type enum from `['trial', 'starter', 'professional', 'enterprise', 'custom']` to `['free', 'paid']`

**Kept:**
- All existing fields: name, priceMonthly, priceYearly, maxTeachers, maxStudents, maxClasses, description, isActive
- Support for unlimited limits using `-1` value

### 2. School Model (backend/models/School.js)

**Removed:**
- `plan` field (old enum-based plan type)
- `plan_info` object (teacher_limit, student_limit, class_limit, price)

**Changed:**
- `licenseId` is now **required** (was optional)

**Benefit:** Schools now reference licenses dynamically. When a license is updated, all schools using that license automatically reflect the changes.

### 3. Backend Routes

#### License Routes (backend/routes/licenseRoutes.js)
- Updated validation to accept only 'free' or 'paid' types
- Removed special handling for trial license deletion

#### P2L Admin Routes (backend/routes/p2lAdminRoutes.js)
- `GET /api/schools` - Now populates licenseId
- `POST /api/schools` - Requires licenseId, validates license exists
- `PUT /api/schools/:id` - Supports license updates with validation

#### School Admin Routes (backend/routes/schoolAdminRoutes.js)
- `checkLicenseAvailability()` - Now uses `licenseId.maxTeachers/maxStudents`
- `GET /api/mongo/school-admin/license-info` - Returns license data from licenseId
- `POST /api/mongo/school-admin/classes` - Enforces class limits, tracks current_classes

### 4. Frontend Components

#### LicenseManagement.js (P2L Admin)
- License type dropdown: Only shows "Free" and "Paid"
- Removed isActive checkbox from form (still exists in model for internal use)
- Updated templates: Free Trial, Basic Plan, Standard Plan, Premium Plan
- All licenses can be deleted (no special restrictions)

#### SchoolManagement.js (P2L Admin)
- Fetches licenses from `/api/licenses` endpoint
- School creation/edit requires selecting a license
- Displays full license info: name, type, limits, monthly/yearly pricing

#### SchoolLicenseView.js (School Admin)
- Changed 'trial' references to 'free'
- Shows upgrade button for free licenses
- Displays expiry warnings for free licenses with expiration dates

### 5. CSS Updates

#### SchoolLicenseView.css
- Removed old badge styles: trial, starter, professional, enterprise
- Added new badge styles: free (green gradient), paid (blue gradient)

## Migration Guide

### For New Installations

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Seed licenses:
   ```bash
   node seed-licenses.js
   ```
   This creates 4 default licenses:
   - Free Trial (free): 1 teacher, 5 students, 1 class, $0/month
   - Basic Plan (paid): 50 teachers, 500 students, 100 classes, $250/month
   - Standard Plan (paid): 100 teachers, 1000 students, 200 classes, $500/month
   - Premium Plan (paid): 250 teachers, 2500 students, 500 classes, $1000/month

3. Create schools through the P2L Admin UI, selecting a license for each

### For Existing Installations

1. **Backup your database first!**

2. Seed new licenses:
   ```bash
   cd backend
   node seed-licenses.js
   ```

3. Migrate existing schools to use licenses:
   ```bash
   node migrate-schools-to-licenses.js
   ```
   This script:
   - Assigns the "Free Trial" license to schools that don't have a licenseId
   - Skips schools that already have a valid licenseId
   - Reports migration statistics

4. Review migrated schools in the P2L Admin UI and update licenses as needed

## API Changes

### School Creation (POST /api/schools)

**Before:**
```json
{
  "organization_name": "Test School",
  "organization_type": "school",
  "plan": "starter",
  "plan_info": {
    "teacher_limit": 50,
    "student_limit": 500,
    "class_limit": 100,
    "price": 2500
  }
}
```

**After:**
```json
{
  "organization_name": "Test School",
  "organization_type": "school",
  "licenseId": "license_object_id_here",
  "contact": "contact@school.com"
}
```

### School Response (GET /api/schools)

**Before:**
```json
{
  "_id": "school_id",
  "organization_name": "Test School",
  "plan": "starter",
  "plan_info": {
    "teacher_limit": 50,
    "student_limit": 500,
    "price": 2500
  }
}
```

**After:**
```json
{
  "_id": "school_id",
  "organization_name": "Test School",
  "licenseId": {
    "_id": "license_id",
    "name": "Basic Plan",
    "type": "paid",
    "maxTeachers": 50,
    "maxStudents": 500,
    "maxClasses": 100,
    "priceMonthly": 250,
    "priceYearly": 2500,
    "description": "Perfect for small to medium schools"
  }
}
```

## License Enforcement

The system enforces license limits for:

1. **Teachers**: When creating a teacher, checks `currentTeachers < license.maxTeachers`
2. **Students**: When creating a student, checks `currentStudents < license.maxStudents`
3. **Classes**: When creating a class, checks `currentClasses < license.maxClasses`

**Note:** A value of `-1` means unlimited for any limit.

## Benefits of This Update

1. **Simplicity**: Two license types (free/paid) instead of five (trial/starter/professional/enterprise/custom)
2. **Flexibility**: P2L admins can create custom licenses with any combination of limits and pricing
3. **Dynamic Updates**: Changing a license automatically updates all schools using it
4. **Better UX**: School admins see clear license information with usage metrics
5. **Scalability**: Easy to add new licenses without code changes

## Testing Checklist

- [ ] Create a new free license in P2L Admin
- [ ] Create a new paid license in P2L Admin
- [ ] Edit an existing license
- [ ] Delete a license
- [ ] Create a school with a free license
- [ ] Create a school with a paid license
- [ ] Edit a school's license
- [ ] Create teachers/students/classes up to the limit
- [ ] Verify license limit enforcement
- [ ] View license info in School Admin dashboard
- [ ] Test upgrade flow for free licenses

## Support

For questions or issues, please contact the development team or create an issue in the repository.
