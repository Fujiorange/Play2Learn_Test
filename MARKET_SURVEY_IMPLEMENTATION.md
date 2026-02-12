# Market Survey Implementation Guide

## Overview
This document describes the market survey feature implementation that allows Play2Learn to track user feedback on subscription changes and registration sources.

## Features Implemented

### 1. Dropdown Menus for Feedback Collection

#### Auto-Renewal Disable Reasons
When a school admin disables auto-renewal, they must select from:
- Switching to a different plan
- Cost concerns
- Not using features enough
- Seasonal usage (e.g., school holidays)
- Trying alternative solutions
- Budget constraints
- Prefer manual renewal
- Other (with text input required)

#### Subscription Cancellation Reasons
When a school admin cancels their subscription, they must select from:
- Too expensive
- Not using enough features
- Switching to another platform
- Technical issues
- Lack of support
- School closure or restructuring
- Just wanted to try it out
- Other (with text input required)

#### Registration Referral Sources
During registration, schools can indicate where they heard about Play2Learn:
- Search Engine (Google, Bing, etc.)
- Social Media
- Friend or Colleague
- Advertisement
- Conference or Event
- Blog or Article
- Other

### 2. Market Survey Dashboard

P2LAdmin users can access a comprehensive market survey dashboard at `/p2ladmin/market-survey` that displays:

- **Registration Referral Sources**: Bar chart showing how schools discovered the platform
- **Auto-Renewal Disable Reasons**: Analytics on why schools turned off auto-renewal
- **Subscription Cancellation Reasons**: Insights into subscription cancellations

The dashboard includes:
- Interactive tabbed interface for different survey types
- Visual bar charts showing response distribution
- Percentage calculations for each reason
- Total response counts
- Summary statistics cards

## Technical Implementation

### Backend Components

#### 1. MarketSurvey Model (`backend/models/MarketSurvey.js`)
```javascript
{
  type: String, // 'registration_referral', 'auto_renewal_disable', 'subscription_cancel'
  reason: String, // Selected dropdown option
  otherReason: String, // Custom text if 'other' selected
  schoolId: ObjectId, // Reference to school
  schoolName: String, // School name for easy reference
  userEmail: String, // Email of user who submitted
  createdAt: Date // Timestamp
}
```

#### 2. API Endpoints Modified

**POST /api/mongo/school-admin/toggle-auto-renewal**
- Now accepts `reason` and `otherReason` parameters
- Validates reason is provided when disabling
- Validates otherReason when reason is 'other'
- Saves survey data to MarketSurvey collection

**POST /api/mongo/school-admin/cancel-subscription**
- Now accepts `reason` and `otherReason` parameters
- Validates reason is required
- Validates otherReason when reason is 'other'
- Saves survey data to MarketSurvey collection

**POST /api/mongo/auth/register-school-admin**
- Saves referralSource to MarketSurvey collection
- No changes to existing functionality

**GET /api/p2ladmin/market-survey**
- Returns aggregated survey data
- Groups responses by type and reason
- Calculates counts and percentages
- Returns last 50 survey responses

### Frontend Components

#### 1. SchoolLicenseView Component Updates
**Location**: `frontend/src/components/SchoolAdmin/SchoolLicenseView.js`

**Changes**:
- Replaced textarea with dropdown for auto-renewal disable reason
- Replaced inline prompt with modal dropdown for subscription cancellation
- Added conditional "Other" text input fields
- Updated state management for separate auto-renewal and cancellation reasons
- Added validation before API calls

**New State Variables**:
```javascript
const [cancelReason, setCancelReason] = useState('');
const [cancelOtherReason, setCancelOtherReason] = useState('');
const [autoRenewalReason, setAutoRenewalReason] = useState('');
const [autoRenewalOtherReason, setAutoRenewalOtherReason] = useState('');
```

#### 2. MarketSurvey Component
**Location**: `frontend/src/components/P2LAdmin/MarketSurvey.js`

**Features**:
- Tabbed interface for different survey types
- Bar chart visualization with percentages
- Responsive design
- Summary statistics cards
- Back button to dashboard
- Error handling and loading states

#### 3. Routing
**Location**: `frontend/src/App.js`

**Changes**:
- Added import for MarketSurvey component
- Added route: `/p2ladmin/market-survey`

#### 4. Dashboard Integration
**Location**: `frontend/src/components/P2LAdmin/P2LAdminDashboard.js`

**Changes**:
- Added "Market Survey" card with link to `/p2ladmin/market-survey`

## Data Flow

### Registration Flow
1. User fills out registration form with optional referral source
2. Frontend sends referralSource to `/api/mongo/auth/register-school-admin`
3. Backend creates school and user
4. If referralSource provided, creates MarketSurvey entry with type='registration_referral'

### Auto-Renewal Disable Flow
1. User clicks toggle to disable auto-renewal
2. Modal appears with dropdown menu
3. User selects reason (and provides details if "Other")
4. Frontend validates selection and sends to `/api/mongo/school-admin/toggle-auto-renewal`
5. Backend validates input and updates school
6. Backend creates MarketSurvey entry with type='auto_renewal_disable'

### Subscription Cancellation Flow
1. User clicks "Cancel Subscription" button
2. Modal appears with dropdown menu
3. User selects reason (and provides details if "Other")
4. Frontend validates selection and sends to `/api/mongo/school-admin/cancel-subscription`
5. Backend validates input and updates school
6. Backend creates MarketSurvey entry with type='subscription_cancel'

### Data Retrieval Flow
1. P2LAdmin navigates to `/p2ladmin/market-survey`
2. Component fetches data from `/api/p2ladmin/market-survey`
3. Backend aggregates data by type and reason
4. Frontend displays in tabbed interface with charts

## Validation

### Frontend Validation
- Dropdown must have a value selected before submission
- "Other" text input must be filled when "Other" option selected
- Error messages displayed in modal

### Backend Validation
- Reason must be provided when disabling auto-renewal or cancelling
- OtherReason must be provided when reason is 'other'
- Proper error responses returned with descriptive messages

## Security Considerations

### Authentication
- All endpoints require appropriate authentication:
  - School admin endpoints: `authenticateSchoolAdmin` middleware
  - P2LAdmin endpoints: `authenticateP2LAdmin` middleware

### Data Privacy
- Survey data includes school reference for administrative purposes
- No sensitive personal data is stored
- Aggregated data only shown to P2LAdmin users

### Input Sanitization
- Optional: Consider adding input sanitization for 'otherReason' text
- MongoDB query injection protection through Mongoose

## Testing Recommendations

### Manual Testing Checklist
1. **Auto-Renewal Disable**
   - [ ] Test with each dropdown option
   - [ ] Test "Other" option with text input
   - [ ] Test "Other" option without text input (should show error)
   - [ ] Test without selecting a reason (should show error)
   - [ ] Verify survey data is saved in database
   - [ ] Verify auto-renewal is actually disabled

2. **Subscription Cancellation**
   - [ ] Test with each dropdown option
   - [ ] Test "Other" option with text input
   - [ ] Test "Other" option without text input (should show error)
   - [ ] Test without selecting a reason (should show error)
   - [ ] Verify survey data is saved in database
   - [ ] Verify subscription is actually cancelled

3. **Registration**
   - [ ] Test with each referral source option
   - [ ] Test with no referral source (optional field)
   - [ ] Verify survey data is saved when source provided
   - [ ] Verify registration works without source

4. **Market Survey Dashboard**
   - [ ] Verify data displays correctly in each tab
   - [ ] Verify percentages calculate correctly
   - [ ] Verify charts render properly
   - [ ] Test responsive design on mobile
   - [ ] Verify "Other" responses show custom text

### Database Verification
```javascript
// Check MarketSurvey collection
db.marketsurveys.find().pretty()

// Count by type
db.marketsurveys.aggregate([
  { $group: { _id: "$type", count: { $sum: 1 } } }
])

// Count by reason for auto-renewal
db.marketsurveys.aggregate([
  { $match: { type: "auto_renewal_disable" } },
  { $group: { _id: "$reason", count: { $sum: 1 } } }
])
```

## Future Enhancements

### Potential Improvements
1. **Export Functionality**: Add CSV export for survey data
2. **Date Filtering**: Allow P2LAdmin to filter by date range
3. **Trend Analysis**: Show changes over time with line charts
4. **Email Notifications**: Notify admin of high cancellation rates
5. **Retention Campaigns**: Automated follow-up based on cancellation reasons
6. **A/B Testing**: Test different dropdown options
7. **Analytics Integration**: Connect to Google Analytics or similar

### Performance Optimization
1. Add database indexes on frequently queried fields
2. Implement caching for aggregated statistics
3. Add pagination for large datasets
4. Consider materialized views for complex aggregations

## Maintenance Notes

### Adding New Dropdown Options
To add a new option to any dropdown:

1. **Frontend**: Update the `<select>` options in `SchoolLicenseView.js`
2. **Backend**: No changes needed - accepts any string value
3. **Dashboard**: Automatically shows in aggregated results

### Modifying Survey Questions
To change the survey questions:

1. Update dropdown options in `SchoolLicenseView.js`
2. Update validation logic if needed
3. Consider data migration for existing survey responses
4. Update this documentation

### Database Maintenance
```javascript
// Clean up old survey data (if needed)
db.marketsurveys.deleteMany({
  createdAt: { $lt: new Date('2024-01-01') }
})

// Create indexes for better performance
db.marketsurveys.createIndex({ type: 1, createdAt: -1 })
db.marketsurveys.createIndex({ schoolId: 1 })
```

## Files Modified/Created

### Backend
- ✅ `backend/models/MarketSurvey.js` (new)
- ✅ `backend/routes/schoolAdminRoutes.js` (modified)
- ✅ `backend/routes/mongoAuthRoutes.js` (modified)
- ✅ `backend/routes/p2lAdminRoutes.js` (modified)

### Frontend
- ✅ `frontend/src/components/SchoolAdmin/SchoolLicenseView.js` (modified)
- ✅ `frontend/src/components/P2LAdmin/MarketSurvey.js` (new)
- ✅ `frontend/src/components/P2LAdmin/MarketSurvey.css` (new)
- ✅ `frontend/src/components/P2LAdmin/P2LAdminDashboard.js` (modified)
- ✅ `frontend/src/App.js` (modified)

## Support

For questions or issues:
1. Check MongoDB logs for survey data persistence
2. Check browser console for frontend errors
3. Check network tab for API request/response details
4. Verify authentication tokens are valid
5. Check database indexes are created

---

**Last Updated**: 2026-02-11
**Version**: 1.0.0
**Status**: Implementation Complete ✅
