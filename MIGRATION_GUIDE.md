# Database Migration Guide

## Task 1: Remove Unique Index on License Type

### Problem
The `licenses` collection has a unique index on the `type` field (`type_1`), which prevents creating multiple licenses with the same type (e.g., multiple "paid" licenses). This causes the error:

```
E11000 duplicate key error collection: play2learn.licenses index: type_1 dup key: { type: "paid" }
```

### Solutions
There are **two ways** to run the migration:

#### Option 1: Command-Line Script (Recommended for local development)

1. **Backup your database** (recommended before any migration):
   ```bash
   mongodump --uri="<your-mongodb-uri>" --out=./backup-$(date +%Y%m%d)
   ```

2. **Set your MongoDB connection string** in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/play2learn
   ```

3. **Run the migration script**:
   ```bash
   cd backend
   node drop-license-type-index.js
   ```

4. **Expected output**:
   ```
   🔗 Connecting to MongoDB...
   ✅ Connected to MongoDB
   📋 Checking existing indexes on licenses collection...
   🗑️  Dropping type_1 unique index...
   ✅ Successfully dropped type_1 index
   
   📋 Final indexes on licenses collection:
   [
     { "v": 2, "key": { "_id": 1 }, "name": "_id_" },
     { "v": 2, "key": { "name": 1 }, "name": "name_1", "unique": true }
   ]
   
   ✅ Migration completed successfully!
   📝 Note: Multiple licenses with the same type (free/paid) can now be created.
   ```

#### Option 2: Admin API Endpoint (Recommended for production)

This method allows you to run the migration through the admin panel without command-line access.

1. **Check migration status** (optional):
   ```bash
   GET https://play2learn-test.onrender.com/api/p2ladmin/migrations/status
   Authorization: Bearer <your-admin-token>
   ```

   **Response**:
   ```json
   {
     "success": true,
     "data": {
       "licenseTypeIndexExists": true,
       "migrationNeeded": true,
       "allIndexes": [
         { "name": "_id_", "keys": { "_id": 1 }, "unique": false },
         { "name": "name_1", "keys": { "name": 1 }, "unique": true },
         { "name": "type_1", "keys": { "type": 1 }, "unique": true }
       ],
       "recommendations": [
         "The type_1 unique index should be dropped to allow multiple licenses with the same type",
         "Use POST /api/p2ladmin/migrations/drop-license-type-index to run the migration"
       ]
     }
   }
   ```

2. **Run the migration**:
   ```bash
   POST https://play2learn-test.onrender.com/api/p2ladmin/migrations/drop-license-type-index
   Authorization: Bearer <your-admin-token>
   ```

   **Success Response**:
   ```json
   {
     "success": true,
     "message": "Successfully dropped type_1 unique index",
     "details": {
       "indexDropped": "type_1",
       "remainingIndexes": [
         { "name": "_id_", "keys": { "_id": 1 }, "unique": false },
         { "name": "name_1", "keys": { "name": 1 }, "unique": true }
       ]
     },
     "note": "Multiple licenses with the same type (free/paid) can now be created."
   }
   ```

   **If Already Migrated**:
   ```json
   {
     "success": true,
     "message": "type_1 index does not exist. No action needed.",
     "details": {
       "currentIndexes": [
         { "name": "_id_", "keys": { "_id": 1 }, "unique": false },
         { "name": "name_1", "keys": { "name": 1 }, "unique": true }
       ]
     }
   }
   ```

### Verify the Fix

5. **Verify the fix**:
   - Navigate to https://play2learn-test.onrender.com/p2ladmin/licenses
   - Try creating a second "paid" license type
   - It should succeed without the duplicate key error

### Rollback (if needed)
If you need to restore the unique index (not recommended):
```javascript
db.licenses.createIndex({ type: 1 }, { unique: true, name: "type_1" })
```

### Notes
- The `name` field remains unique (as intended)
- The `type` field can now have duplicate values
- This allows multiple license tiers of the same type (e.g., "Basic Plan", "Standard Plan", "Premium Plan" all with type "paid")
