# Create P2L Admin Account

This guide explains how to manually create a P2L Admin account using the database script.

## Quick Start

```bash
cd backend
node create-admin.js <email> <password>
```

### Example

```bash
node create-admin.js admin@play2learn.com SecurePass123!
```

## Requirements

- **Email**: Valid email format (e.g., user@domain.com)
- **Password**: Minimum 8 characters

## Prerequisites

1. **MongoDB Connection**: Ensure MONGODB_URI is set in your `.env` file or environment variables
2. **Dependencies Installed**: Run `npm install` in the backend directory first

## Step-by-Step Instructions

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Run the Script

```bash
node create-admin.js your-email@example.com YourPassword123!
```

Replace:
- `your-email@example.com` with your desired admin email
- `YourPassword123!` with your desired password (min 8 characters)

### 3. Success Output

If successful, you'll see:

```
✅ SUCCESS! P2L Admin account created successfully!

📋 Account Details:
   ID: 507f1f77bcf86cd799439011
   Name: your-email
   Email: your-email@example.com
   Role: p2ladmin
   Email Verified: true
   Account Active: true

🔑 Login Credentials:
   Email: your-email@example.com
   Password: (the password you provided)

🌐 You can now log in at:
   https://play2learn-test.onrender.com/login
```

### 4. Log In

Visit the login page and use the credentials you just created:
- **URL**: https://play2learn-test.onrender.com/login
- **Email**: The email you provided
- **Password**: The password you provided

## Troubleshooting

### Error: "Email already registered"

This means an account with that email already exists. You can:

**Option 1**: Use a different email address

**Option 2**: Delete the existing account from MongoDB:

```javascript
// In MongoDB shell or Atlas
db.users.deleteOne({ email: "your-email@example.com" })
```

Then run the create-admin script again.

### Error: "MongoDB connection failed"

**Check:**
1. Is MONGODB_URI set in your `.env` file?
   ```bash
   echo $MONGODB_URI
   ```

2. Is MongoDB service running (if using local MongoDB)?
   ```bash
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongod
   ```

3. For MongoDB Atlas:
   - Verify connection string is correct
   - Check IP whitelist (add 0.0.0.0/0 for testing)
   - Verify network connectivity

### Error: "Invalid email format"

Ensure your email follows the format: `user@domain.com`

### Error: "Password must be at least 8 characters long"

Use a password with at least 8 characters.

## For Production Deployment (Render)

If you need to create an admin account on the production server:

### Option 1: Use Render Shell

1. Go to your Render dashboard
2. Select your web service
3. Click "Shell" tab
4. Run:
   ```bash
   cd backend
   node create-admin.js admin@yourcompany.com YourSecurePassword123!
   ```

### Option 2: Use Environment Variables

Add these to your Render environment variables and restart:
- `ADMIN_EMAIL`: Your admin email
- `ADMIN_PASSWORD`: Your admin password

Then modify the script to read from environment variables.

## Security Notes

⚠️ **Important Security Considerations:**

1. **Password Strength**: Use a strong password with:
   - At least 8 characters
   - Mix of letters, numbers, and special characters
   - Not easily guessable

2. **Keep Credentials Safe**: 
   - Don't commit passwords to version control
   - Don't share admin credentials publicly
   - Store securely (password manager)

3. **Production Usage**:
   - Change default passwords immediately
   - Use strong, unique passwords for each admin
   - Enable 2FA when available

## What the Script Does

1. ✅ Validates email format
2. ✅ Validates password length (min 8 chars)
3. ✅ Connects to MongoDB
4. ✅ Checks if email already exists
5. ✅ Hashes password using bcrypt (10 salt rounds)
6. ✅ Creates user with role 'p2ladmin'
7. ✅ Sets emailVerified and accountActive to true
8. ✅ Saves to database
9. ✅ Displays success message with login details

## Account Properties

The created admin account will have:

```javascript
{
  name: "email-username",        // Extracted from email
  email: "user@example.com",     // Lowercase
  password: "$2b$10$...",         // Bcrypt hashed
  role: "p2ladmin",              // Admin role
  emailVerified: true,           // Pre-verified
  accountActive: true,           // Active account
  createdBy: "create-admin-script"
}
```

## Need Help?

If you encounter issues:

1. Check the error message details
2. Verify MongoDB connection
3. Ensure all dependencies are installed
4. Check that you have network access to MongoDB
5. Review the troubleshooting section above

## Alternative: Fix the Registration Page

If you prefer to use the web registration page, check the pull request that fixes the registration endpoint:
- The fix addresses Mongoose v9 compatibility issues
- Should allow normal registration through the web UI
