# 🎓 Play2Learn - School Admin Registration & Question Bank CSV Upload

## 📝 Overview

This implementation adds two major features to the Play2Learn platform:

1. **School Admin Account Registration** - P2L Admins can create School Admin accounts with temporary passwords that must be changed on first login
2. **Question Bank CSV Upload** - Bulk upload questions via CSV file with improved answer selection to ensure accuracy

## ✨ What's New

### 1. School Admin Registration
- **Temporary Passwords**: Randomly generated secure passwords (e.g., `SCH4a2b@`)
- **Forced Password Change**: School admins must change password on first login
- **Email Notifications**: Welcome emails sent with credentials
- **Seamless Login Flow**: Automatic password change prompt, then route to School Admin dashboard

### 2. Question Bank CSV Upload  
- **Bulk Import**: Upload hundreds of questions at once via CSV
- **Template Download**: One-click download of properly formatted sample CSV
- **Answer Selection**: Dropdown selection from choices prevents typos
- **Error Handling**: Detailed error messages with line numbers for easy fixing
- **Validation**: MIME type and format validation before upload

## 🚀 Quick Start

### For P2L Admins

**Create a School Admin:**
```
1. Login → School Management
2. Select School → Create School Admin
3. Enter email and name
4. Note the temporary password or check email
```

**Upload Questions:**
```
1. Login → Question Bank
2. Click "Upload CSV" 
3. Download template (optional)
4. Select your CSV file
5. Click "Upload CSV"
6. Review results
```

### For School Admins

**First Login:**
```
1. Receive email with temporary password
2. Login with email + temp password
3. Password change modal appears automatically
4. Enter new password (min 8 characters)
5. Redirected to School Admin dashboard
```

## 📁 Repository Structure

```
Play2Learn_Test/
├── backend/
│   ├── models/
│   │   └── User.js (Added requirePasswordChange field)
│   ├── routes/
│   │   ├── mongoAuthRoutes.js (Added password change endpoint)
│   │   └── p2lAdminRoutes.js (Added school admin & CSV endpoints)
│   ├── utils/
│   │   └── passwordGenerator.js (Temp password generation)
│   └── test-new-features.js (Automated test script)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── ChangePassword.js (New password change modal)
│   │   │   │   └── ChangePassword.css
│   │   │   ├── LoginPage.js (Updated for password change flow)
│   │   │   └── P2LAdmin/
│   │   │       ├── QuestionBank.js (Added CSV upload)
│   │   │       └── QuestionBank.css (Upload styles)
│   │   └── services/
│   │       ├── authService.js (Added changePassword method)
│   │       └── p2lAdminService.js (Added uploadQuestionsCSV)
├── FEATURE_DOCUMENTATION.md (Technical documentation)
├── SECURITY_SUMMARY.md (Security analysis)
└── QUICK_START_GUIDE.md (User guide)
```

## 🔐 Security Features

### Implemented ✅
- **Bcrypt Hashing**: All passwords hashed with 10 salt rounds
- **Temporary Passwords**: Cryptographically secure random generation
- **Token Authentication**: JWT with 7-day expiry
- **Role-Based Access**: Strict permission checks
- **MIME Type Validation**: File upload security
- **Input Validation**: Email, password, and data validation

### Recommended for Production ⚠️
- **Rate Limiting**: Prevent brute force and DoS attacks
- **File Size Limits**: Restrict upload sizes
- **Audit Logging**: Track sensitive operations
- **CSRF Protection**: For state-changing operations

See [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) for details.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [FEATURE_DOCUMENTATION.md](FEATURE_DOCUMENTATION.md) | Complete technical documentation with API endpoints, architecture, and implementation details |
| [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) | Security analysis, CodeQL scan results, and production recommendations |
| [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) | Step-by-step user guide with examples and troubleshooting |

## 🧪 Testing

### Automated Test
```bash
cd backend
node test-new-features.js
```

### Manual Testing

**Test School Admin Creation:**
1. Create a school via P2L Admin dashboard
2. Create a school admin for that school
3. Check email for credentials
4. Login with temporary password
5. Verify password change prompt
6. Change password and verify redirect

**Test CSV Upload:**
1. Use sample CSV: `/tmp/sample_questions.csv`
2. Upload via Question Bank UI
3. Verify success message
4. Check uploaded questions in list
5. Test with invalid CSV to verify error handling

**Test Answer Selection:**
1. Create question manually
2. Add choices
3. Verify answer field becomes dropdown
4. Select answer and save
5. Verify exact match with choice

## 🔄 User Flows

### School Admin Registration Flow
```
P2L Admin creates school
    ↓
P2L Admin creates school admin account
    ↓
System generates temp password (SCH4a2b@)
    ↓
Email sent to school admin with credentials
    ↓
School admin logs in with temp password
    ↓
Password change modal appears (automatic)
    ↓
School admin enters new password
    ↓
System validates and saves new password
    ↓
School admin redirected to dashboard
```

### CSV Upload Flow
```
P2L Admin clicks "Upload CSV"
    ↓
Modal displays with instructions
    ↓
P2L Admin downloads template (optional)
    ↓
P2L Admin prepares CSV file
    ↓
P2L Admin selects file
    ↓
System validates file type
    ↓
System parses CSV line by line
    ↓
System validates each question
    ↓
System creates database records
    ↓
Results displayed with counts
    ↓
Question list refreshes automatically
```

## 🛠️ Technical Details

### Backend API Endpoints

```javascript
// School Admin Management
POST /api/p2ladmin/schools/:id/admins
GET  /api/p2ladmin/schools/:id/admins

// Password Change
PUT  /api/mongo/auth/change-password

// CSV Upload
POST /api/p2ladmin/questions/upload-csv
```

### CSV Format
```csv
text,choice1,choice2,choice3,choice4,answer,difficulty,subject,topic
"What is 2 + 2?","2","3","4","5","4",1,"Math","Addition"
```

**Required:** text, answer  
**Optional:** choices, difficulty (1-5), subject, topic

### Password Requirements
- Minimum 8 characters
- Must match confirmation
- Old password required (except first-time change)

## 🎯 Key Improvements

### Before This Update ❌
- No way to create school admin accounts
- Questions had to be created manually one by one
- Answers were typed, causing potential mismatches
- No bulk import functionality

### After This Update ✅
- P2L Admins can create school admin accounts
- Temporary passwords with forced change on first login
- Bulk upload hundreds of questions via CSV
- Answer dropdown prevents typos and ensures accuracy
- Template download for easy CSV preparation
- Detailed error reporting for failed uploads

## 🐛 Known Limitations

1. **Rate Limiting**: Not implemented yet (recommended for production)
2. **File Size**: No hard limit set (configure in production)
3. **Email Dependency**: Password delivery relies on email (temp password shown in response as fallback)
4. **Single Admin**: Currently one admin per school (can be extended)

See [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) for recommendations.

## 📊 Dependencies

### Backend
- `multer` ^2.0.2 - File upload handling ✅
- `csv-parser` ^3.2.0 - CSV parsing ✅
- `bcrypt` ^6.0.0 - Password hashing ✅

**All dependencies checked for vulnerabilities: No issues found! ✅**

### Frontend
- React routing for password change modal
- FormData API for file uploads
- Existing UI components and styling

## 🚢 Deployment Checklist

- [x] Code implemented and tested
- [x] Documentation completed
- [x] Security scan performed
- [x] Dependencies checked for vulnerabilities
- [ ] Rate limiting added (recommended)
- [ ] File size limits configured (recommended)
- [ ] Environment variables set
- [ ] Email service configured
- [ ] Database migration (if needed)
- [ ] Smoke testing in staging
- [ ] User acceptance testing
- [ ] Production deployment

## 🤝 Contributing

When working with this code:
1. Review [FEATURE_DOCUMENTATION.md](FEATURE_DOCUMENTATION.md) for technical details
2. Check [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) for security best practices
3. Follow existing code patterns
4. Test thoroughly before committing
5. Update documentation if making changes

## 📞 Support

For issues or questions:
1. Check [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) for common scenarios
2. Review error messages carefully
3. Check backend logs for detailed errors
4. Contact development team with:
   - Steps to reproduce
   - Error messages
   - Screenshots (if applicable)

## 📄 License

Same as Play2Learn platform.

---

**Status**: ✅ Ready for review and testing  
**Version**: 1.0.0  
**Last Updated**: 2026-01-25
