# Registration Fix Summary

## Problem
The `/register` endpoint (specifically `/register-school-admin`) was failing with the error "⚠️ Registration failed. Please try again."

## Root Cause
The School model requires a `licenseId` field (marked as required in the schema), but the registration code was setting `licenseId: null`. This violated the database constraint and caused the save operation to fail.

```javascript
// OLD CODE (BROKEN)
const newSchool = new School({
  organization_name: institutionName,
  organization_type: 'school',
  plan: 'trial',
  plan_info: { ... },
  licenseId: null,  // ❌ This violates the required constraint!
  // ...
});
```

## Solution
Updated the registration endpoint to:
1. Query the License collection for the "Free Trial" license
2. Assign the trial license's `_id` to the new school
3. Handle the case where the trial license doesn't exist with a clear error message

```javascript
// NEW CODE (FIXED)
// Find the trial license
const trialLicense = await License.findOne({ 
  name: 'Free Trial',
  type: 'free',
  isActive: true 
});

if (!trialLicense) {
  console.error('❌ Trial license not found in database');
  return res.status(500).json({ 
    success: false, 
    error: 'Trial license not configured. Please contact support.' 
  });
}

// Create school with free trial license
const newSchool = new School({
  organization_name: institutionName,
  organization_type: 'school',
  licenseId: trialLicense._id,  // ✅ Properly assigned!
  // ...
});
```

## Changes Made

### Backend (`backend/routes/mongoAuthRoutes.js`)
1. Import License model
2. Query for Free Trial license before creating school
3. Assign trial license ID to new school
4. Remove deprecated `plan` and `plan_info` fields
5. Add error handling for missing trial license

### Prerequisites
The "Free Trial" license must exist in the database. This can be ensured by:
1. Running the seed script: `npm run seed-licenses` (if available)
2. Or manually running: `node backend/seed-licenses.js`
3. Or creating it via the License Management UI

## Expected Behavior After Fix

1. **Registration Flow:**
   - User fills out registration form at `/register`
   - Backend fetches "Free Trial" license from database
   - Creates new school with trial license assigned
   - Creates school admin user linked to the school
   - Returns success response

2. **School Appears in Admin Panel:**
   - Navigate to `/p2ladmin/schools`
   - Newly registered school is visible
   - Shows "Free Trial" license (1 teacher, 5 students, 1 class)
   - All limits display correctly

3. **Error Handling:**
   - If trial license doesn't exist: User sees "Trial license not configured. Please contact support."
   - If institution name already exists: User sees "An organization with this name already exists. Please use a different name."
   - If email already exists: User sees "Email already registered"

## Testing Checklist

- [ ] Trial license exists in database (run `seed-licenses.js` if needed)
- [ ] Registration form accepts valid input
- [ ] Registration creates school with trial license
- [ ] School admin user is created successfully
- [ ] User can log in after registration
- [ ] School appears in `/p2ladmin/schools` with correct license
- [ ] License limits are displayed correctly

## Related Files
- `backend/routes/mongoAuthRoutes.js` - Registration endpoint
- `backend/models/School.js` - School schema with required licenseId
- `backend/models/License.js` - License schema
- `backend/seed-licenses.js` - Script to seed default licenses
- `frontend/src/components/RegisterPage.js` - Registration UI
