# Quick Start Guide: New Features

## Feature 1: School Admin Account Creation

### For P2L Admins

#### Step 1: Create a School
1. Login as P2L Admin
2. Navigate to "School Management"
3. Click "Create School"
4. Fill in school details (name, plan, contact)
5. Click "Submit"

#### Step 2: Create School Admin Account
1. Find the school in the list
2. Click "Manage Admins" or the school name
3. Click "Create School Admin"
4. Enter:
   - Email address (required)
   - Name (optional - will use email prefix if not provided)
5. Click "Create"
6. **Important**: Note the temporary password displayed or check the email sent to the admin

**Example Response:**
```json
{
  "success": true,
  "message": "School admin created successfully",
  "data": {
    "id": "65f3a2b1c4d5e6f7a8b9c0d1",
    "email": "admin@school.edu",
    "name": "John Doe",
    "role": "School Admin",
    "tempPassword": "SCH4a2b@"
  }
}
```

### For School Admins (First Login)

#### Step 1: Receive Credentials
- Check email for welcome message with temporary password
- Or get credentials from P2L Admin

#### Step 2: First Login
1. Go to login page
2. Enter your email
3. Enter temporary password (e.g., `SCH4a2b@`)
4. Click "Log In"

#### Step 3: Change Password (Automatic)
1. Password change modal appears automatically
2. Enter new password (minimum 8 characters)
3. Confirm new password
4. Click "Change Password"
5. You'll be redirected to School Admin dashboard

**Password Requirements:**
- Minimum 8 characters
- Must match confirmation
- No old password needed on first login

#### Step 4: Future Logins
- Use your email and new password
- No password change required
- Direct access to School Admin dashboard

---

## Feature 2: Question Bank CSV Upload

### For P2L Admins

#### Step 1: Prepare CSV File

**Option A: Download Template**
1. Navigate to Question Bank
2. Click "Upload CSV"
3. Click "Download Template" in the modal
4. Open the template in Excel or text editor
5. Fill in your questions following the format

**Option B: Create Your Own**
Create a CSV file with these columns:

**Required Columns:**
- `text` - The question text
- `answer` - The correct answer

**Optional Columns:**
- `choice1`, `choice2`, `choice3`, `choice4` - Answer choices
- `difficulty` - Number from 1-5 (default: 3)
- `subject` - Subject name (default: "General")
- `topic` - Topic or subtopic
- `is_active` - true/false (default: true)

**Example CSV:**
```csv
text,choice1,choice2,choice3,choice4,answer,difficulty,subject,topic
"What is 2 + 2?","2","3","4","5","4",1,"Math","Addition"
"Capital of France?","London","Berlin","Paris","Rome","Paris",2,"Geography","Capitals"
"Closest planet to sun?","Venus","Mars","Mercury","Earth","Mercury",3,"Science","Solar System"
```

#### Step 2: Upload CSV
1. Navigate to Question Bank
2. Click "Upload CSV" button (📤 icon)
3. Review format instructions
4. Click "Choose CSV file"
5. Select your prepared CSV file
6. Click "Upload CSV"

#### Step 3: Review Results
The system will display:
- ✅ Success count
- ❌ Failure count (if any)
- Detailed error messages with line numbers

**Example Success:**
```
✅ Upload Successful!
Total questions: 5
Successfully uploaded: 5
Failed: 0
```

**Example Partial Success:**
```
✅ Upload Successful!
Total questions: 10
Successfully uploaded: 8
Failed: 2

Errors:
Line 3: Missing required field: answer
Line 7: Missing required field: text
```

#### Step 4: Verify Questions
1. Modal will close automatically or click "Close"
2. View uploaded questions in the list
3. Edit any questions if needed
4. Questions are immediately available for quizzes

### Creating Questions Manually (with Answer Selection)

#### Step 1: Create Question
1. Click "Create Question"
2. Enter question text

#### Step 2: Add Choices
1. Fill in choice fields (Choice 1, Choice 2, etc.)
2. Click "+ Add Choice" for more choices
3. Click "×" to remove a choice

#### Step 3: Select Correct Answer
1. The "Correct Answer" field automatically becomes a dropdown
2. Select the correct answer from your choices
3. **No typing needed** - prevents typos!

#### Step 4: Additional Details
1. Select difficulty (1-5)
2. Enter subject (e.g., "Math", "Science")
3. Enter topic (optional)
4. Click "Create"

**Tips:**
- Add choices first, then select answer from dropdown
- If you don't add choices, you can type the answer
- The dropdown ensures exact match between choices and answer

---

## Common Scenarios

### Scenario 1: School Admin Forgot Password
**Solution**: P2L Admin or School Admin can use the password reset feature
1. School Admin goes to their dashboard
2. Clicks on "Reset Password" in settings
3. Enters current password and new password
4. Saves changes

**Alternative**: P2L Admin can create a new account with different email

### Scenario 2: CSV Upload Fails
**Common Issues:**

1. **Wrong file format**
   - Solution: Ensure file ends with .csv
   - Check MIME type is text/csv

2. **Missing required fields**
   - Solution: Ensure `text` and `answer` columns exist
   - Check column names match template

3. **Special characters in content**
   - Solution: Wrap content in quotes: `"What is 2+2?"`
   - Escape quotes with double quotes: `"He said ""Hello"""`

4. **Incorrect difficulty values**
   - Solution: Use numbers 1-5 only
   - System will default to 3 if invalid

### Scenario 3: Answer Doesn't Match Choices
**Problem**: When creating manually, answer typed doesn't exactly match a choice

**Old Behavior** (before this update):
- User types answer: "paris" 
- Choice was: "Paris"
- Students marking "Paris" as answer get it wrong! ❌

**New Behavior** (after this update):
- User selects from dropdown: "Paris"
- Answer exactly matches choice ✅
- Students selecting "Paris" get it right! ✅

---

## Troubleshooting

### School Admin Creation

**Error**: "Email already registered"
- **Cause**: Email is already used by another user
- **Solution**: Use a different email address

**Error**: "School not found"
- **Cause**: Invalid school ID
- **Solution**: Create the school first, then add admin

**Email not received**
- **Cause**: Email service issue or spam filter
- **Solution**: Check spam folder or get temp password from P2L Admin in the response

### CSV Upload

**Error**: "Please select a valid CSV file"
- **Cause**: File is not CSV format or wrong MIME type
- **Solution**: Save as CSV, not Excel (.xlsx)

**Error**: "No valid questions found in CSV"
- **Cause**: All rows failed validation
- **Solution**: Check template, ensure required fields present

**Partial upload success**
- **Cause**: Some rows have errors
- **Solution**: Fix rows with errors (shown in error list) and re-upload

### Password Change

**Error**: "Password must be at least 8 characters long"
- **Cause**: New password too short
- **Solution**: Use password with 8+ characters

**Error**: "New passwords do not match"
- **Cause**: Password and confirmation don't match
- **Solution**: Re-type both fields carefully

**Error**: "Current password is incorrect"
- **Cause**: Wrong old password entered
- **Solution**: Enter correct current password

---

## Best Practices

### Security
1. **School Admin Passwords**
   - Share temporary passwords securely (encrypted email)
   - Verify school admin changes password immediately
   - Don't reuse passwords across accounts

2. **CSV Files**
   - Don't include sensitive information in questions
   - Review questions before upload
   - Keep master CSV files backed up

3. **Answer Accuracy**
   - Always use dropdown for answer selection
   - Review uploaded questions for correctness
   - Test questions with sample quiz before assigning

### Efficiency
1. **Bulk Upload**
   - Use CSV for 10+ questions
   - Prepare CSV in batches by subject/topic
   - Use template to ensure correct format

2. **Manual Entry**
   - Use for quick single questions
   - Use for questions with complex formatting
   - Good for editing existing questions

### Organization
1. **Question Management**
   - Use consistent subject names
   - Add topics for better filtering
   - Set appropriate difficulty levels
   - Mark questions as inactive rather than deleting

2. **School Admin Accounts**
   - Use school email addresses (@school.edu)
   - One admin per school initially
   - Add more admins as needed
   - Use descriptive names

---

## Quick Reference

### Temporary Password Format
```
SCHxxxx@
```
- First 3 characters: SCH (school)
- Next 4 characters: Random hex (0-9, a-f)
- Last character: Special character (!@#$%^&*)
- Total: 8 characters
- Example: `SCH4a2b@`

### CSV Column Headers (Case-Insensitive)
```
text, choice1, choice2, choice3, choice4, answer, difficulty, subject, topic
```

### Difficulty Levels
- 1 = Very Easy
- 2 = Easy
- 3 = Medium (default)
- 4 = Hard
- 5 = Very Hard

### Supported File Types
- Extension: `.csv`
- MIME Types: `text/csv`, `application/csv`, `text/plain`
- Max Size: 5MB (recommended)

### User Roles & Routes
- P2L Admin → `/platform-admin`
- School Admin → `/school-admin`
- Teacher → `/teacher`
- Student → `/student`
- Parent → `/parent`

---

## Support

For issues or questions:
1. Check this guide first
2. Review error messages carefully
3. Check logs (backend console for admins)
4. Contact platform support with:
   - Screenshot of error
   - Steps to reproduce
   - User role and email (if applicable)
