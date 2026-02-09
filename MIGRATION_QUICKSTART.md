# Quick Start: Database Migration

## Problem
You're seeing this error when trying to create multiple licenses with the same type:
```
E11000 duplicate key error collection: play2learn.licenses index: type_1 dup key: { type: "paid" }
```

## Quick Fix

### Option 1: Using API Endpoint (Recommended for Production)

1. **Get your admin token**:
   - Log in to the admin panel
   - Token is in localStorage as `authToken`

2. **Run the migration**:
   ```bash
   curl -X POST https://play2learn-test.onrender.com/api/p2ladmin/migrations/drop-license-type-index \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

3. **Verify**:
   - Go to the Licenses page
   - Try creating a second "paid" license
   - Should work now! ✅

### Option 2: Using Command-Line Script

1. **Set MongoDB URI** in `backend/.env`:
   ```
   MONGODB_URI=your-mongodb-connection-string
   ```

2. **Run the script**:
   ```bash
   cd backend
   node drop-license-type-index.js
   ```

## What This Does
- Removes the unique constraint on the license `type` field
- Allows multiple licenses with the same type (e.g., "Basic Plan", "Pro Plan", "Enterprise Plan" all as "paid")
- Does NOT delete any data
- Safe to run multiple times

## Need More Help?
- Full API docs: [DATABASE_MIGRATION_API.md](./DATABASE_MIGRATION_API.md)
- Complete guide: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- Security info: [SECURITY_SUMMARY_MIGRATION.md](./SECURITY_SUMMARY_MIGRATION.md)

## Check Status First (Optional)
```bash
curl -X GET https://play2learn-test.onrender.com/api/p2ladmin/migrations/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

This tells you if the migration is needed or already done.
