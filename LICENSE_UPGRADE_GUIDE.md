# License Upgrade with Payment Simulation - Implementation Guide

## Overview
This document describes the implementation of the license upgrade functionality with a simulated payment system for school administrators.

## Features Implemented

### 1. Back to Dashboard Button
- Added a "Back to Dashboard" button at the top of the School License View page
- Allows school admins to easily navigate back to their dashboard
- Located at `/school-admin/license`

### 2. License Upgrade Flow

#### Step 1: View Available Plans
When a school admin clicks "Upgrade License", they see:
- A modal showing all available paid license plans
- Toggle between Monthly and Yearly billing (Yearly saves 17%)
- Each plan displays:
  - Plan name
  - Price (monthly or yearly based on selection)
  - Description
  - Maximum teachers allowed
  - Maximum students allowed
  - Maximum classes allowed
  - "Select Plan" button

#### Step 2: Payment Information
After selecting a plan, the school admin enters payment details:
- **Card Number**: 16-digit card number with automatic formatting (spaces every 4 digits)
- **Expiry Date**: MM/YY format with validation
- **CVV**: 3-digit security code

#### Step 3: Payment Processing
- Simulated payment processing (1-second delay)
- Real-time validation of payment details
- Success/error messaging

#### Step 4: Automatic License Update
Upon successful payment:
- School's license is automatically upgraded in the database
- License limits are updated immediately
- School admin can register more users based on new limits
- License information is refreshed on the page
- Success notification is displayed

## Validation Rules

### Card Number
- **Required**: Yes
- **Format**: 16 digits only
- **Display**: Formatted with spaces (XXXX XXXX XXXX XXXX)
- **Validation**: Must be exactly 16 numeric digits

### Expiry Date
- **Required**: Yes
- **Format**: MM/YY
- **Validation**: 
  - Month must be 01-12
  - Date must not be in the past
  - Automatically formatted as user types

### CVV
- **Required**: Yes
- **Format**: 3 digits
- **Validation**: Must be exactly 3 numeric digits

## API Endpoints

### GET /api/licenses
Fetches all available licenses from the database
- **Authentication**: Required (Bearer token)
- **Response**: List of all active paid licenses

### POST /api/mongo/school-admin/upgrade-license
Processes the license upgrade with payment simulation
- **Authentication**: Required (School Admin only)
- **Request Body**:
  ```json
  {
    "licenseId": "license_object_id",
    "billingCycle": "monthly" | "yearly",
    "paymentInfo": {
      "cardNumber": "1234567890123456",
      "expiryDate": "12/25",
      "cvv": "123"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment successful! Your license has been upgraded.",
    "upgradeDetails": {
      "previousPlan": "Free Trial",
      "newPlan": "Professional",
      "billingCycle": "monthly",
      "amountPaid": 250.00,
      "newLimits": {
        "maxTeachers": 50,
        "maxStudents": 500,
        "maxClasses": 100
      }
    }
  }
  ```

## Database Updates

When a license is upgraded, the following changes occur:

1. **School Document**:
   - `licenseId` is updated to the new license
   - `licenseExpiresAt` is set to null (paid licenses don't expire)

2. **Immediate Effects**:
   - User registration limits are updated
   - School admin can add more teachers, students, and classes
   - Changes are visible in `/p2ladmin/schools` for platform admins
   - Changes are visible in `/school-admin/license` for school admins

## User Interface Components

### SchoolLicenseView Component
- **Location**: `/frontend/src/components/SchoolAdmin/SchoolLicenseView.js`
- **Features**:
  - Back to Dashboard button
  - Current license information display
  - Usage statistics with progress bars
  - Upgrade License button (for free tier users)
  - License selection modal
  - Payment form modal
  - Real-time form validation
  - Error handling and success messages

### Styling
- **Location**: `/frontend/src/components/SchoolAdmin/SchoolLicenseView.css`
- **Features**:
  - Responsive design
  - Modern card-based layout for license plans
  - Color-coded usage indicators
  - Form validation error states
  - Smooth transitions and animations
  - Mobile-friendly layout

## Security Considerations

### Payment Simulation
- This is a **simulated** payment system for demonstration purposes
- No actual credit card processing occurs
- Card details are validated but not stored
- A note is displayed to users: "🔒 This is a simulated payment for demonstration purposes. No actual charges will be made."

### Backend Validation
- All payment details are validated on the backend
- Authentication required (School Admin role)
- License availability checked
- Card number, expiry date, and CVV validated
- Proper error messages returned for invalid data

## Testing Checklist

To test the implementation:

1. **Login as School Admin**
   - Navigate to `/school-admin/license`
   - Verify "Back to Dashboard" button appears

2. **View License Information**
   - Check current license details are displayed
   - Verify usage statistics show correct numbers

3. **Upgrade License**
   - Click "Upgrade License" button
   - Verify available plans are fetched and displayed
   - Toggle between Monthly and Yearly billing
   - Verify prices update correctly

4. **Select a Plan**
   - Click "Select Plan" on any license
   - Verify payment form appears
   - Check plan summary is correct

5. **Test Payment Validation**
   - **Invalid Card Number**:
     - Try: "123" → Should show error
     - Try: "abcd1234567890ab" → Should show error
     - Valid: "1234567890123456" → Should accept
   
   - **Invalid Expiry Date**:
     - Try: "13/25" → Should show "Invalid month" error
     - Try: "01/20" → Should show "Card has expired" error
     - Valid: "12/25" → Should accept
   
   - **Invalid CVV**:
     - Try: "12" → Should show error
     - Try: "abcd" → Should show error
     - Valid: "123" → Should accept

6. **Complete Payment**
   - Fill all fields correctly
   - Click "Complete Payment"
   - Verify processing state
   - Check success message appears
   - Verify license info refreshes with new limits

7. **Verify Database Updates**
   - Check school document in database
   - Verify `licenseId` updated
   - Verify `licenseExpiresAt` is null
   - Check P2L Admin view at `/p2ladmin/schools`

## Example Test Data

### Valid Test Card Numbers
- `1234567890123456`
- `4111111111111111`
- `5555555555554444`

### Valid Expiry Dates
- `12/25` (December 2025)
- `06/26` (June 2026)
- `01/27` (January 2027)

### Valid CVV
- `123`
- `456`
- `789`

## Files Modified

1. **Frontend**:
   - `/frontend/src/components/SchoolAdmin/SchoolLicenseView.js`
   - `/frontend/src/components/SchoolAdmin/SchoolLicenseView.css`

2. **Backend**:
   - `/backend/routes/schoolAdminRoutes.js`

## Future Enhancements

Potential improvements for production use:

1. **Real Payment Integration**
   - Integrate with Stripe, PayPal, or other payment gateways
   - Store payment history
   - Generate invoices
   - Send payment confirmation emails

2. **Subscription Management**
   - Auto-renewal handling
   - Cancellation support
   - Prorated upgrades/downgrades
   - Payment method management

3. **License Features**
   - Feature flags based on license tier
   - Usage analytics
   - Billing history
   - Multiple payment methods

4. **Admin Features**
   - Discount codes
   - Custom pricing
   - Trial extensions
   - Billing alerts

## Support

For any issues or questions:
- Check the console for error messages
- Verify backend server is running
- Ensure MongoDB is connected
- Check browser network tab for API calls
- Review this documentation
