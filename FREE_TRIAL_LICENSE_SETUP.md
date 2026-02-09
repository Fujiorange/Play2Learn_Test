# Free Trial License Initialization Guide

## Overview
This guide explains how to initialize the Free Trial license that is required for institute registration.

## Problem
When trying to register as an institute, users were getting the error:
> ⚠️ Trial license not configured. Please contact support.

This occurred because the Free Trial license didn't exist in the database.

## Solution
We've implemented several fixes:

### 1. Default Free Trial License
- **License Name**: Free Trial
- **License Type**: Free
- **Monthly Price**: $0
- **Yearly Price**: $0
- **Max Teachers**: 1
- **Max Students**: 5
- **Max Classes**: 1
- **Description**: Free trial institude
- **Protected**: Cannot be deleted

### 2. Changes Made

#### Backend Model (`backend/models/License.js`)
- Added `isDeletable` field to protect certain licenses from deletion

#### Backend Routes (`backend/routes/licenseRoutes.js`)
- Added validation to prevent deletion of protected licenses
- Returns 403 error when attempting to delete a non-deletable license

#### Seed Script (`backend/seed-licenses.js`)
- Updated Free Trial license to have `isDeletable: false`
- Ensured correct specifications as per requirements

#### Frontend UI (`frontend/src/components/P2LAdmin/LicenseManagement.js`)
- Made "+ Create New License" button smaller and cleaner ("+ Create License")
- Disabled delete button for protected licenses
- Added tooltip explaining why certain licenses can't be deleted

#### Initialization Script (`backend/init-trial-license.js`)
- New script to create/update the Free Trial license
- Idempotent - safe to run multiple times
- Updates existing license if it already exists

## How to Initialize the Free Trial License

### Method 1: Run the Initialization Script
```bash
cd backend
node init-trial-license.js
```

This will:
- Connect to your MongoDB database
- Check if Free Trial license exists
- Create it if it doesn't exist
- Update it with correct properties if it does exist
- Set it as non-deletable

### Method 2: Seed All Licenses
```bash
cd backend
node seed-licenses.js
```

**⚠️ Warning**: This will delete all existing licenses and recreate them from scratch. Only use this if you're setting up a fresh database or want to reset all licenses.

## Verification

After running the initialization script, verify the license was created:

1. Log in as P2L Admin
2. Navigate to `/p2ladmin/licenses`
3. You should see "Free Trial" license with:
   - Type: free
   - Monthly Price: $0.00
   - Yearly Price: $0.00
   - 1 Teacher, 5 Students, 1 Class
   - Delete button should be disabled

## Testing Institute Registration

1. Go to the institute registration page
2. Fill in the form:
   - Email
   - Password
   - Institution Name
3. Click Register
4. Should successfully register with the Free Trial license

## Multiple Licenses of Same Type

The system now supports creating multiple licenses of the same type:
- You can have multiple "free" licenses
- You can have multiple "paid" licenses
- Only the license **name** must be unique

Example valid scenario:
- "Free Trial" (free)
- "Free Limited" (free)
- "Basic Plan" (paid)
- "Premium Plan" (paid)

## UI Improvements

### Before
- Large "+ Create New License" button
- All licenses could be deleted

### After
- Normal sized "+ Create License" button
- Free Trial license is protected (delete button disabled with tooltip)
- Cleaner, more consistent UI

## Troubleshooting

### Error: "Trial license not configured"
Run the initialization script:
```bash
cd backend
node init-trial-license.js
```

### Error: "MongoDB connection failed"
Check your `MONGODB_URI` environment variable:
```bash
# In backend/.env
MONGODB_URI=mongodb://localhost:27017/play2learn
```

Or for production (Render):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/play2learn
```

### License appears but delete is not disabled
Refresh the page. The UI should reflect the `isDeletable: false` property.

### Want to reset all licenses
```bash
cd backend
node seed-licenses.js
```

## For Developers

### Adding a New Protected License
Edit `backend/seed-licenses.js` and add:
```javascript
{
  name: 'Your License Name',
  type: 'free', // or 'paid'
  priceMonthly: 0,
  priceYearly: 0,
  maxTeachers: 1,
  maxStudents: 5,
  maxClasses: 1,
  description: 'Your description',
  isActive: true,
  isDeletable: false  // This protects it
}
```

### Checking License in Code
When querying licenses:
```javascript
const license = await License.findById(id);
if (license.isDeletable === false) {
  // This license is protected
}
```

## Environment Variables Required

Make sure these are set in your environment:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - For authentication (optional, has default)

## Deployment Notes

### For Render Deployment
1. Push changes to GitHub
2. Render will auto-deploy
3. Run the initialization script via Render shell:
   ```bash
   cd backend && node init-trial-license.js
   ```

Or set up a one-time job in Render to run the script automatically.

## Summary of Changes

✅ Free Trial license can be created/initialized automatically
✅ Free Trial license is protected from deletion
✅ Multiple licenses can have the same type
✅ License names must be unique
✅ UI button is now normal sized
✅ Institute registration will work with Free Trial license

