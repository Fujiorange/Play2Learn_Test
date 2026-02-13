# Email Verification Flow for Registration

## Overview
This implementation adds a secure email verification flow to the school admin registration process using a 6-digit PIN system.

## Flow Description

### Step 1: Registration Request
**Endpoint:** `POST /register-school-admin`

**Request Body:**
```json
{
  "email": "admin@school.com",
  "password": "securePassword123",
  "institutionName": "Test School",
  "referralSource": "google" // optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification PIN sent to your email. Please check your inbox.",
  "email": "admin@school.com",
  "expiresIn": 15
}
```

**What Happens:**
1. Validates email and institution name (checks for duplicates)
2. Generates random 6-digit PIN
3. Hashes the password
4. Stores registration data temporarily in `RegistrationPIN` collection
5. Sends PIN to email address
6. Sets expiration to 15 minutes from now

### Step 2: PIN Verification
**Endpoint:** `POST /verify-pin`

**Request Body:**
```json
{
  "email": "admin@school.com",
  "pin": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully! Your institute has been registered.",
  "schoolId": "507f1f77bcf86cd799439011"
}
```

**What Happens:**
1. Finds registration record by email
2. Checks if PIN has expired
3. Validates the PIN
4. Creates School document
5. Creates School Admin user
6. Saves referral source (if provided)
7. Deletes the temporary registration record

### Step 3: Resend PIN (Optional)
**Endpoint:** `POST /resend-pin`

**Request Body:**
```json
{
  "email": "admin@school.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "New verification PIN sent to your email. Please check your inbox.",
  "email": "admin@school.com",
  "expiresIn": 15
}
```

**What Happens:**
1. Finds existing registration record
2. Generates new 6-digit PIN
3. Updates PIN and expiration time
4. Sends new PIN to email
5. Invalidates the previous PIN

## Database Schema

### RegistrationPIN Model
```javascript
{
  email: String (unique, lowercase, indexed),
  pin: String (6 digits),
  registrationData: {
    institutionName: String,
    password: String (hashed),
    referralSource: String (optional)
  },
  expiresAt: Date (indexed with TTL),
  createdAt: Date
}
```

**TTL Index:** MongoDB automatically deletes documents after `expiresAt` time passes.

## Email Template

The verification email includes:
- Institution name
- Large, easy-to-read PIN display
- 15-minute expiration warning
- Professional branding matching other Play2Learn emails

## Security Features

1. **PIN Expiration:** PINs expire after 15 minutes
2. **Automatic Cleanup:** MongoDB TTL index auto-deletes expired records
3. **Password Hashing:** Passwords are hashed before temporary storage
4. **One-time Use:** PIN is deleted after successful verification
5. **Invalidation on Resend:** Old PIN becomes invalid when new one is sent
6. **Email Validation:** Checks for existing users before sending PIN
7. **Institution Name Check:** Prevents duplicate school names

## Error Handling

### Registration Errors
- Missing required fields (400)
- Email already registered (400)
- Institution name already exists (400)
- Email sending failure (500)

### Verification Errors
- Missing email or PIN (400)
- No pending registration found (404)
- PIN expired (400)
- Invalid PIN (400)
- License not configured (500)

### Resend Errors
- Missing email (400)
- No pending registration found (404)
- Email sending failure (500)

## Testing

### Manual Testing Flow
1. **Register:**
   ```bash
   curl -X POST http://localhost:5000/auth/register-school-admin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!",
       "institutionName": "Test School"
     }'
   ```

2. **Check email for PIN**

3. **Verify:**
   ```bash
   curl -X POST http://localhost:5000/auth/verify-pin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "pin": "123456"
     }'
   ```

4. **Resend (if needed):**
   ```bash
   curl -X POST http://localhost:5000/auth/resend-pin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com"
     }'
   ```

### Automated Testing
Run the test script:
```bash
cd backend
node test-registration-pin-flow.js
```

## Frontend Integration Notes

### Registration Page Changes
1. After submitting registration form, show "Check your email" message
2. Display countdown timer (15 minutes)
3. Show PIN input field (6 digits)
4. Add "Resend PIN" button
5. Handle PIN verification on submit

### Example Frontend Flow
```javascript
// Step 1: Submit registration
const response = await fetch('/auth/register-school-admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: formData.email,
    password: formData.password,
    institutionName: formData.institutionName
  })
});

if (response.ok) {
  // Show PIN verification screen
  setShowPINVerification(true);
  startCountdown(15 * 60); // 15 minutes in seconds
}

// Step 2: Verify PIN
const verifyResponse = await fetch('/auth/verify-pin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: formData.email,
    pin: pinValue
  })
});

if (verifyResponse.ok) {
  // Registration complete - redirect to login
  navigate('/login');
}

// Step 3: Resend PIN (if needed)
const resendResponse = await fetch('/auth/resend-pin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: formData.email
  })
});
```

## Files Modified/Created

### New Files
1. `backend/models/RegistrationPIN.js` - Database model
2. `backend/utils/pinGenerator.js` - PIN generation utility
3. `backend/test-registration-pin-flow.js` - Test script

### Modified Files
1. `backend/routes/mongoAuthRoutes.js` - Registration endpoints
2. `backend/services/emailService.js` - Email template

## Environment Variables
No new environment variables required. Uses existing email configuration:
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`
- `FRONTEND_URL` (for email links)

## Migration Notes
- **Backward Compatible:** Existing users are not affected
- **No Database Migration:** New collection created automatically
- **Automatic Cleanup:** MongoDB handles expired PIN deletion
- **Safe Rollback:** Can revert endpoints without data loss

## Future Enhancements
1. Rate limiting on resend requests
2. Maximum retry attempts
3. SMS verification option
4. Customizable PIN length
5. Email template customization per institution
6. Analytics tracking for verification success rate
