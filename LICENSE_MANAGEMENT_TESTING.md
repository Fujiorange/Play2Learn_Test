# License Management Testing Guide

## Overview
This guide explains how to test the license management CRUD operations at `/p2ladmin/licenses`.

## Prerequisites
- Backend server running on port 5000
- Frontend running on port 3000
- MongoDB database connected
- P2L Admin account for authentication

## What Was Fixed

### 1. **Critical Bug Fixed: Unique Constraint**
- **Problem**: License model had `unique: true` on `type` field instead of `name`
- **Impact**: Prevented creating multiple licenses of the same type (e.g., two different "custom" licenses)
- **Solution**: Moved unique constraint to `name` field
- **Result**: Now multiple licenses can share the same type, but must have unique names

### 2. **Enhanced Type Support**
- **Added**: `custom` type to the enum
- **Types Now**: trial, starter, professional, enterprise, custom
- **Benefit**: Allows creating custom license plans beyond the standard types

### 3. **Improved Validation**
- **Backend**: Added validation for negative prices with detailed error messages
- **Backend**: Enhanced error logging with emoji indicators (✅, ❌, 📝)
- **Backend**: Better duplicate detection and error handling
- **Frontend**: Changed type input from text to dropdown for consistency
- **Frontend**: Added predefined templates for quick license creation

### 4. **Predefined Templates**
Added one-click templates for standard license types:
- **Trial**: $0/month, 1 teacher, 5 students, 1 class
- **Starter**: $250/month, $2500/year, 50 teachers, 500 students, 100 classes
- **Professional**: $500/month, $5000/year, 100 teachers, 1000 students, 200 classes
- **Enterprise**: $1000/month, $10000/year, 250 teachers, 2500 students, 500 classes

## Testing Steps

### 1. Access the License Management Page
```
URL: http://localhost:3000/p2ladmin/licenses
Authentication: P2L Admin account required
```

### 2. View Existing Licenses
- Upon loading, all licenses should be displayed in card format
- Each card shows: name, type, prices, limits, description, status
- Active licenses show a green "Active" badge
- Inactive licenses are slightly faded with a gray badge

### 3. Create a New License Using Template

**Test Case 1: Create Trial License**
1. Click "Create New License" button
2. Click "📋 Trial" template button
3. Verify form is pre-filled with trial values
4. Click "Create License"
5. **Expected**: Success message, license appears in list

**Test Case 2: Create Custom License**
1. Click "Create New License" button
2. Fill in:
   - Name: "Custom School Plan"
   - Type: Select "custom" from dropdown
   - Monthly Price: 150
   - Yearly Price: 1500
   - Max Teachers: 25
   - Max Students: 250
   - Max Classes: 50
   - Description: "Tailored plan for mid-size schools"
3. Click "Create License"
4. **Expected**: Success message, license appears in list

### 4. Test Validation Errors

**Test Case 3: Duplicate Name**
1. Try creating a license with an existing name
2. **Expected**: Error message "License name already exists"

**Test Case 4: Missing Required Fields**
1. Try creating a license without a name
2. **Expected**: Browser validation prevents submission

**Test Case 5: Negative Price**
1. Try creating a license with negative price (e.g., -100)
2. **Expected**: Browser min validation prevents negative values

### 5. Update an Existing License

**Test Case 6: Edit License**
1. Click "Edit" button on any license card
2. Modify the name or prices
3. Click "Update License"
4. **Expected**: Success message, changes reflected in card

**Test Case 7: Cannot Change Type**
1. Click "Edit" on a license
2. **Expected**: Type field is disabled with help text

### 6. Delete a License

**Test Case 8: Delete Custom License**
1. Click "Delete" on a non-trial license
2. Confirm deletion in dialog
3. **Expected**: Success message, license removed from list

**Test Case 9: Cannot Delete Trial License**
1. Try to delete a license with type "trial"
2. **Expected**: No delete button shown OR error if attempted via API

## API Endpoints Test

### GET /api/licenses
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/licenses
```
**Expected Response**:
```json
{
  "success": true,
  "licenses": [...]
}
```

### POST /api/licenses
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test License",
    "type": "custom",
    "priceMonthly": 100,
    "priceYearly": 1000,
    "maxTeachers": 10,
    "maxStudents": 100,
    "maxClasses": 20,
    "description": "Test license"
  }' \
  http://localhost:5000/api/licenses
```
**Expected Response**:
```json
{
  "success": true,
  "license": {...}
}
```

### PUT /api/licenses/:id
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "priceMonthly": 150
  }' \
  http://localhost:5000/api/licenses/LICENSE_ID
```

### DELETE /api/licenses/:id
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/licenses/LICENSE_ID
```

## Server Logs to Observe

When creating a license, you should see in server console:
```
📝 Creating license: { name: '...', type: '...', priceMonthly: ..., priceYearly: ... }
✅ License created successfully: 507f1f77bcf86cd799439011
```

On validation errors:
```
❌ Validation failed: Missing name or type
❌ Validation failed: Invalid type
❌ License name already exists: Test License
```

## Troubleshooting

### Error: "Failed to create license"
**Check**:
1. MongoDB is running and connected
2. JWT token is valid (not expired)
3. User has P2L Admin role
4. License name doesn't already exist
5. Type is one of: trial, starter, professional, enterprise, custom

### Error: "License name already exists"
**Solution**: Use a different, unique name for the license

### Error: "Access denied"
**Solution**: Ensure you're logged in as a P2L Admin user

### Licenses Not Showing
**Check**:
1. Backend is running
2. API endpoint returns 200 status
3. Check browser console for errors
4. Verify JWT token in localStorage

## Database Seeding

To reset licenses to default state:
```bash
cd backend
node seed-licenses.js
```

This will create the 4 standard license types.

## Success Criteria

✅ Can view all existing licenses
✅ Can create new licenses with templates
✅ Can create custom licenses manually
✅ Cannot create duplicate license names
✅ Cannot enter negative prices
✅ Can edit existing licenses
✅ Cannot change license type after creation
✅ Can delete non-trial licenses
✅ Cannot delete trial license
✅ All operations show proper success/error messages
✅ Server logs show detailed operation status

## UI Features Checklist

- [x] License cards with all information
- [x] Active/Inactive status badges
- [x] Quick template buttons (Trial, Starter, Professional, Enterprise)
- [x] Type dropdown instead of text input
- [x] Form validation messages
- [x] Edit functionality with pre-filled data
- [x] Delete confirmation
- [x] Success/Error alerts
- [x] Responsive design
- [x] Loading state
- [x] Empty state message
