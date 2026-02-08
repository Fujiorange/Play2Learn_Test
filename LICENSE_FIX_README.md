# License Management Fix - E11000 Duplicate Key Error

## Problem
Users were encountering the following error when trying to create licenses:
```
E11000 duplicate key error collection: play2learn.licenses index: type_1 dup key: { type: "paid" }
```

This occurred because:
1. The `/p2ladmin/licenses` endpoint didn't exist
2. A MongoDB collection had a unique index on the "type" field
3. Multiple licenses with the same type (e.g., "paid", "starter") couldn't be created

## Solution
This fix implements complete license management functionality:

### Backend Changes
1. **New Model**: `backend/models/License.js`
   - Mongoose schema for licenses
   - **No unique index on `type`** - multiple licenses can have the same type
   - Fields: type, organization_name, teacher_limit, student_limit, price, dates, status

2. **New Routes**: Added to `backend/routes/p2lAdminRoutes.js`
   - `GET /api/p2ladmin/licenses` - List all licenses
   - `GET /api/p2ladmin/licenses/:id` - Get single license
   - `POST /api/p2ladmin/licenses` - Create new license
   - `PUT /api/p2ladmin/licenses/:id` - Update license
   - `DELETE /api/p2ladmin/licenses/:id` - Delete license

3. **Migration Script**: `backend/fix-license-indexes.js`
   - Removes problematic unique index on "type" field
   - Safe to run multiple times

### Frontend Changes
1. **New Component**: `frontend/src/components/P2LAdmin/LicenseManagement.js`
   - Full CRUD interface for license management
   - Form validation
   - Table view with filtering

2. **New Service**: Added to `frontend/src/services/p2lAdminService.js`
   - API client functions for all license operations

3. **Navigation**: Added to P2LAdmin Dashboard
   - New "License Management" card in dashboard
   - Route: `/p2ladmin/licenses`

## How to Fix Existing Database

If you have an existing `licenses` collection with the problematic index:

```bash
cd backend
node fix-license-indexes.js
```

This will:
- Connect to your MongoDB database
- Check for the `licenses` collection
- Remove the `type_1` unique index if it exists
- Display current state and verification

## How to Use

### Creating a License
1. Navigate to `/p2ladmin/licenses`
2. Click "Create New License"
3. Fill in the form:
   - **Type**: starter, professional, or enterprise
   - **Organization Name**: Name of the organization
   - **Teacher Limit**: Maximum teachers allowed
   - **Student Limit**: Maximum students allowed
   - **Price**: License price
   - **Start/End Dates** (optional)
   - **Status**: Active/Inactive
   - **Notes** (optional)
4. Click "Create License"

### Important Notes
- **Multiple licenses with same type**: ✅ Now allowed (e.g., multiple "paid" licenses)
- **Validation**: Required fields are enforced
- **Authentication**: Only P2L Admins can access these endpoints
- **No unique constraint on type**: Fixed in the new schema

## Testing

To verify the fix works:
1. Start the backend server
2. Navigate to `/p2ladmin/licenses`
3. Create multiple licenses with the same type
4. Verify no E11000 error occurs

## Migration Checklist
- [ ] Run `node fix-license-indexes.js` on production database
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Test creating multiple licenses with same type
- [ ] Verify existing licenses still work
