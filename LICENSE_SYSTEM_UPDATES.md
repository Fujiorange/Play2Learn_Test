# License System Updates - Free vs Paid

## Overview
This document describes the updates made to the Play2Learn license management system, changing from a multi-tier system (trial, starter, professional, enterprise, custom) to a simplified two-tier system (Free vs Paid).

## Key Changes

### 1. License Types Simplified
**Before:** 
- Trial, Starter, Professional, Enterprise, Custom

**After:** 
- Free
- Paid

### 2. License Model Updates

#### Database Schema
```javascript
// License fields:
{
  name: String,              // e.g., "Free Trial", "Basic Plan"
  type: 'free' | 'paid',     // Simplified to just two types
  priceMonthly: Number,      // Monthly price in dollars
  priceYearly: Number,       // Yearly price in dollars
  maxTeachers: Number,       // -1 for unlimited
  maxStudents: Number,       // -1 for unlimited
  maxClasses: Number,        // -1 for unlimited
  description: String        // License description
  // isActive field REMOVED per requirements
}
```

#### Default Licenses
Four default licenses are created:
1. **Free Trial** (free) - 1 teacher, 5 students, 1 class - $0/month
2. **Basic Plan** (paid) - 50 teachers, 500 students, 100 classes - $29.99/month
3. **Professional Plan** (paid) - 100 teachers, 1000 students, 200 classes - $99.99/month
4. **Enterprise Plan** (paid) - Unlimited teachers/students/classes - $299.99/month

### 3. School-License Relationship

**Before:** Schools had a `plan` field with enum values
```javascript
plan: { type: String, enum: ['trial', 'starter', 'professional', 'enterprise'] }
plan_info: { teacher_limit, student_limit, class_limit, price }
```

**After:** Schools reference licenses via ObjectId
```javascript
licenseId: { type: ObjectId, ref: 'License', required: true }
plan: { type: String, default: null }  // Kept for backward compatibility
plan_info: { ... }                     // Kept for backward compatibility
```

This means:
- ✅ License changes automatically reflect in all schools using that license
- ✅ Single source of truth for license information
- ✅ Easier to manage and update licenses centrally

### 4. License Limit Enforcement

License limits are enforced when creating:
- **Teachers** - Checks `maxTeachers` limit
- **Students** - Checks `maxStudents` limit  
- **Classes** - Checks `maxClasses` limit

Special handling:
- `-1` means unlimited (no restriction)
- Proper error messages when limits are reached
- Counters (`current_teachers`, `current_students`, `current_classes`) automatically updated

### 5. UI Changes

#### P2L Admin - License Management (`/p2ladmin/licenses`)
- Type dropdown changed from 5 options to 2: **Free** and **Paid**
- **Active/Inactive toggle REMOVED** per requirements
- New badge colors:
  - Free licenses: Blue badge
  - Paid licenses: Green badge
- Quick template buttons updated:
  - 🎁 Free Trial
  - 🚀 Basic Plan
  - 💼 Professional
  - 🏢 Enterprise
- Delete protection: Free licenses cannot be deleted (like trial licenses before)

#### P2L Admin - School Management (`/p2ladmin/schools`)
- **License selection dropdown** replaces plan selection
- Shows comprehensive license info:
  - License name and type (Free/Paid)
  - Teacher, Student, and Class limits
  - Monthly price
  - Unlimited shown as ∞ symbol
- School cards display:
  - License name and type
  - Current usage vs limits for all resources
  - Unlimited limits shown as ∞

#### School Admin - License View (`/school-admin`)
- Updated to show "Free License" instead of "Trial"
- Displays:
  - License name and type
  - Current usage with progress bars
  - Limits (with ∞ for unlimited)
  - Expiry information (for free licenses)
  - Upgrade button (for free licenses)
- Color-coded progress bars:
  - Green: < 70% usage
  - Orange: 70-90% usage  
  - Red: > 90% usage

### 6. API Changes

#### License Routes (`/api/licenses`)
- `POST /api/licenses` - No longer accepts `isActive` field
- `PUT /api/licenses/:id` - No longer accepts `isActive` field
- `DELETE /api/licenses/:id` - Cannot delete free licenses
- Validation updated to accept only 'free' or 'paid' types

#### School Routes (`/api/mongo/p2ladmin/schools`)
- `POST /api/mongo/p2ladmin/schools` - Now requires `licenseId` instead of `plan` and `plan_info`
- `PUT /api/mongo/p2ladmin/schools/:id` - Can update `licenseId`
- `GET` endpoints populate `licenseId` to include full license details

#### School Admin Routes (`/api/mongo/school-admin`)
- `/license-info` - Returns license info from populated licenseId
- Limits checked using `license.maxTeachers`, `license.maxStudents`, `license.maxClasses`
- Supports unlimited (-1) properly

### 7. Migration Notes

For existing deployments:

1. **Database Migration Required:**
   ```bash
   cd backend
   node seed-licenses.js  # Creates new free/paid licenses
   ```

2. **Update Existing Schools:**
   - Existing schools will need their `licenseId` field populated
   - The `plan` and `plan_info` fields are kept for backward compatibility
   - Recommended: Map existing plans to new licenses:
     - trial → Free Trial license
     - starter → Basic Plan license
     - professional → Professional Plan license
     - enterprise → Enterprise Plan license

3. **Code Deployment:**
   - Backend changes are backward compatible (old fields remain)
   - Frontend requires rebuild to show new UI
   - No breaking changes for API consumers

### 8. Future Enhancements

The new system provides foundation for:
- **Upgrade/Downgrade**: School admins can request license changes
- **Custom Licenses**: P2L Admin can create custom paid licenses per school
- **License Expiry**: Already supported for free licenses
- **Billing Integration**: Monthly/yearly pricing fields ready for payment processing
- **Usage Analytics**: Track license utilization across all schools

### 9. Testing Checklist

- [ ] Create a new free license via P2L Admin
- [ ] Create a new paid license via P2L Admin
- [ ] Create a new school and assign a license
- [ ] Update school license to a different one
- [ ] Verify license info shows correctly in School Admin view
- [ ] Create teachers up to the limit and verify enforcement
- [ ] Create students up to the limit and verify enforcement
- [ ] Create classes up to the limit and verify enforcement
- [ ] Try creating beyond limits and verify error messages
- [ ] Test with unlimited license (-1 limits)
- [ ] Delete a class and verify counter decrements
- [ ] Update a license and verify schools see the changes

## Security Considerations

- All routes remain protected by authentication middleware
- License limits prevent resource exhaustion
- Free licenses cannot be deleted to maintain trial functionality
- CodeQL analysis shows no critical vulnerabilities introduced
- Informational alerts about missing rate limiting (pre-existing issue)

## Files Modified

### Backend
- `backend/models/License.js` - Updated schema
- `backend/models/School.js` - Updated schema
- `backend/routes/licenseRoutes.js` - Updated validation
- `backend/routes/p2lAdminRoutes.js` - Updated school CRUD
- `backend/routes/schoolAdminRoutes.js` - Updated limit checks
- `backend/seed-licenses.js` - New seed data

### Frontend  
- `frontend/src/components/P2LAdmin/LicenseManagement.js` - Updated UI
- `frontend/src/components/P2LAdmin/LicenseManagement.css` - New badge styles
- `frontend/src/components/P2LAdmin/SchoolManagement.js` - License dropdown
- `frontend/src/components/SchoolAdmin/SchoolLicenseView.js` - Updated display

## Support

For questions or issues related to this update, please contact the development team or refer to the main project documentation.
