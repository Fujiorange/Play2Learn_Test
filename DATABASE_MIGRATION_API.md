# Database Migration API Documentation

## Overview
This document describes the database migration API endpoints available to P2L Admins for maintaining and updating the database schema.

## Authentication
All migration endpoints require P2L Admin authentication. Include the admin token in the Authorization header:

```
Authorization: Bearer <admin-token>
```

---

## Endpoints

### 1. Check Migration Status

**Endpoint**: `GET /api/p2ladmin/migrations/status`

**Description**: Check the current status of database migrations, specifically the license type index.

**Request**:
```bash
curl -X GET https://play2learn-test.onrender.com/api/p2ladmin/migrations/status \
  -H "Authorization: Bearer <admin-token>"
```

**Response (Migration Needed)**:
```json
{
  "success": true,
  "data": {
    "licenseTypeIndexExists": true,
    "migrationNeeded": true,
    "allIndexes": [
      {
        "name": "_id_",
        "keys": { "_id": 1 },
        "unique": false
      },
      {
        "name": "name_1",
        "keys": { "name": 1 },
        "unique": true
      },
      {
        "name": "type_1",
        "keys": { "type": 1 },
        "unique": true
      }
    ],
    "recommendations": [
      "The type_1 unique index should be dropped to allow multiple licenses with the same type",
      "Use POST /api/p2ladmin/migrations/drop-license-type-index to run the migration"
    ]
  }
}
```

**Response (Already Migrated)**:
```json
{
  "success": true,
  "data": {
    "licenseTypeIndexExists": false,
    "migrationNeeded": false,
    "allIndexes": [
      {
        "name": "_id_",
        "keys": { "_id": 1 },
        "unique": false
      },
      {
        "name": "name_1",
        "keys": { "name": 1 },
        "unique": true
      }
    ],
    "recommendations": [
      "No migration needed - database schema is up to date"
    ]
  }
}
```

---

### 2. Drop License Type Index

**Endpoint**: `POST /api/p2ladmin/migrations/drop-license-type-index`

**Description**: Drops the unique index on the `type` field in the `licenses` collection. This allows creating multiple licenses with the same type (e.g., multiple "paid" licenses).

**Request**:
```bash
curl -X POST https://play2learn-test.onrender.com/api/p2ladmin/migrations/drop-license-type-index \
  -H "Authorization: Bearer <admin-token>"
```

**Success Response**:
```json
{
  "success": true,
  "message": "Successfully dropped type_1 unique index",
  "details": {
    "indexDropped": "type_1",
    "remainingIndexes": [
      {
        "name": "_id_",
        "keys": { "_id": 1 },
        "unique": false
      },
      {
        "name": "name_1",
        "keys": { "name": 1 },
        "unique": true
      }
    ]
  },
  "note": "Multiple licenses with the same type (free/paid) can now be created."
}
```

**Already Migrated Response**:
```json
{
  "success": true,
  "message": "type_1 index does not exist. No action needed.",
  "details": {
    "currentIndexes": [
      {
        "name": "_id_",
        "keys": { "_id": 1 },
        "unique": false
      },
      {
        "name": "name_1",
        "keys": { "name": 1 },
        "unique": true
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to drop license type index",
  "details": "Error message here"
}
```

---

## Usage Examples

### JavaScript/Fetch

```javascript
// Check migration status
const checkStatus = async () => {
  const response = await fetch('https://play2learn-test.onrender.com/api/p2ladmin/migrations/status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  console.log('Migration Status:', result);
  return result;
};

// Run migration
const runMigration = async () => {
  const response = await fetch('https://play2learn-test.onrender.com/api/p2ladmin/migrations/drop-license-type-index', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  console.log('Migration Result:', result);
  return result;
};
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const DatabaseMigration = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const checkMigrationStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/p2ladmin/migrations/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    if (!confirm('Are you sure you want to drop the license type index? This cannot be undone easily.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/p2ladmin/migrations/drop-license-type-index', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMessage(data.message);
      checkMigrationStatus(); // Refresh status
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  return (
    <div className="migration-panel">
      <h2>Database Migration</h2>
      
      {status && (
        <div className="status-section">
          <h3>Current Status</h3>
          <p>Migration Needed: {status.data.migrationNeeded ? 'Yes' : 'No'}</p>
          <p>License Type Index Exists: {status.data.licenseTypeIndexExists ? 'Yes' : 'No'}</p>
          
          {status.data.recommendations && (
            <div className="recommendations">
              <h4>Recommendations:</h4>
              <ul>
                {status.data.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <div className="actions">
        <button onClick={checkMigrationStatus} disabled={loading}>
          Check Status
        </button>
        
        {status?.data.migrationNeeded && (
          <button 
            onClick={runMigration} 
            disabled={loading}
            className="danger-button"
          >
            Run Migration
          </button>
        )}
      </div>
    </div>
  );
};

export default DatabaseMigration;
```

---

## Security Notes

1. **Authentication Required**: All endpoints require valid P2L Admin authentication
2. **Idempotent**: The migration can be run multiple times safely - it will skip if already applied
3. **No Data Loss**: This migration only drops an index, it does not delete any data
4. **Reversible**: The index can be recreated if needed (see MIGRATION_GUIDE.md)

---

## Related Documentation

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Complete migration guide including command-line approach
- [LICENSE_MANAGEMENT_API.md](./LICENSE_MANAGEMENT_API.md) - License management API documentation

---

## Troubleshooting

### Error: "Access token required"
- Make sure you're including the Authorization header with a valid admin token

### Error: "Access restricted to P2L Admins"
- Ensure you're logged in as a P2L Admin, not a school admin or other role

### Error: "Failed to drop license type index"
- Check the error details in the response
- Verify MongoDB connection is active
- Check server logs for more information

### Index Already Dropped
- If the index is already dropped, the endpoint will return success with a message indicating no action was needed
- This is normal and safe - the migration is idempotent
