# License and Pricing Changes

## Overview
This document describes the changes made to the license system and landing page pricing functionality.

## Changes Made

### 1. License Type Uniqueness Clarification

**Issue**: There was confusion about whether multiple licenses of the same type could be created.

**Clarification**: 
- The `type` field in the License model is **NOT unique**
- Multiple licenses can have the same `type` (e.g., multiple "paid" licenses)
- Only the `name` field has a uniqueness constraint
- Comments have been added to the code to clarify this

**Example**:
```javascript
// These are all valid and can coexist:
{ name: "Basic Plan", type: "paid", priceMonthly: 250 }
{ name: "Standard Plan", type: "paid", priceMonthly: 500 }
{ name: "Premium Plan", type: "paid", priceMonthly: 1000 }
```

### 2. Landing Page Pricing Auto-Fetch

**Issue**: P2L Admin was manually editing pricing in the landing page, which could become out of sync with actual license data.

**Solution**: 
- Pricing is now automatically fetched from active licenses
- The `/api/public/landing-page` endpoint now fetches active licenses and injects them into the pricing block
- P2L Admin can no longer manually edit pricing plans in the landing page manager
- P2L Admin can still edit the title and subtitle of the pricing section

**How It Works**:
1. When the public landing page is loaded, the server fetches all active licenses
2. Licenses are transformed into the pricing plan format with:
   - Name and description from the license
   - Monthly and yearly pricing
   - Max teachers and students
3. The pricing data is injected into the pricing block's `custom_data.plans`
4. The frontend renders the pricing automatically from this data

**To Update Pricing**:
- Go to **License Management** (accessible from P2L Admin dashboard)
- Create, update, or delete licenses as needed
- Set `isActive: true` for licenses that should appear on the landing page
- The landing page pricing will automatically reflect these changes (with a 5-minute cache)

## Benefits

1. **Single Source of Truth**: License pricing is defined once in the License Management section
2. **Consistency**: Pricing displayed on the landing page always matches the actual license data
3. **Simplicity**: P2L Admin doesn't need to update pricing in multiple places
4. **Real-time Updates**: Changes to licenses are automatically reflected on the landing page (with cache refresh)

## Cache Behavior

- Landing page data is cached for 5 minutes to reduce database load
- After updating licenses, pricing changes will appear on the landing page within 5 minutes
- The cache automatically refreshes when it expires

## Migration Notes

- Existing landing pages with manually-entered pricing will be overridden by auto-fetched pricing from licenses
- Ensure active licenses are properly configured before this change goes live
- The pricing block UI in Landing Page Manager now shows an informational message instead of editable fields
