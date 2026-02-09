# Bulk Class Creation CSV Format Guide

This guide explains how to create a CSV file for bulk class creation with teachers, students, and parents.

## Overview

The bulk class creation feature allows school administrators to create an entire class, including teacher and student accounts, and optionally parent accounts, all in a single CSV upload.

## CSV Format Requirements

### Class Metadata (Required in First Row)
The first row of your CSV must contain the class information:

| Column Name | Required | Description | Example |
|------------|----------|-------------|---------|
| Class Name | Yes | Name of the class | "Primary 3 Mathematics A" |
| Grade | Yes | Grade level | "Primary 3" |
| Subject | Yes | Subject taught in this class | "Mathematics" |

### Teacher Information (One row, required)
Include one row with teacher information:

| Column Name | Required | Description | Example |
|------------|----------|-------------|---------|
| Teacher Name | Yes | Full name of the teacher | "Ms. Sarah Johnson" |
| Teacher Email | Yes | Email address (must be unique) | "sarah.johnson@school.edu.sg" |
| Teacher Role | Yes | Must be "Teacher" | "Teacher" |

### Student Information (Multiple rows, as needed)
Include one row per student:

| Column Name | Required | Description | Example |
|------------|----------|-------------|---------|
| Student Name | Yes | Full name of the student | "John Tan Wei Ming" |
| Student Email | Yes | Email address (must be unique) | "john.tan@student.edu.sg" |
| Student Role | Yes | Must be "Student" | "Student" |
| Linked Parent Email | Optional | Parent's email address | "parent.tan@email.com" |

## Sample CSV Template

```csv
Class Name,Grade,Subject,Teacher Name,Teacher Email,Teacher Role,Student Name,Student Email,Student Role,Linked Parent Email
Primary 3 Mathematics A,Primary 3,Mathematics,Ms. Sarah Johnson,sarah.johnson@school.edu.sg,Teacher,,,,
,,,,,John Tan Wei Ming,john.tan@student.edu.sg,Student,parent.tan@email.com
,,,,,Mary Lim Hui Ling,mary.lim@student.edu.sg,Student,parent.lim@email.com
,,,,,David Wong Jun Hao,david.wong@student.edu.sg,Student,parent.wong@email.com
```

## Important Notes

### Class Information
- **Class Name**: Must be unique within your school
- **Grade**: Must match one of: Primary 1, Primary 2, Primary 3, Primary 4, Primary 5, Primary 6
- **Subject**: Can be Mathematics, Science, or English

### Teacher Rules
- **Only ONE teacher per class** is allowed
- If teacher email already exists in the system, they will be assigned to the class without creating a new account
- If teacher is new, a temporary password will be generated

### Student Rules
- **Multiple students** can be included in one CSV
- If student email already exists in the system, they will be assigned to the class
- If student is new, a temporary password will be generated
- Students will automatically be assigned the grade level from the class metadata

### Parent Rules
- Parents are **optional** - you can leave the "Linked Parent Email" column empty
- One parent can be linked to multiple students
- If parent email already exists, the student will be linked to that existing parent account
- If parent is new, a temporary password will be generated
- **Parent name will be automatically generated** as "Parent of [Student Name]"
  - Note: This is a simplified implementation. If you need custom parent names, they can be updated manually after creation via the user management interface.

### Existing Users
- If an email already exists in the system:
  - The system will **NOT** create a duplicate account
  - The existing user will be assigned to the class
  - No new password will be generated
  - The user will appear in the "assigned" count, not "created" count

### Password Management
- All newly created accounts receive a randomly generated temporary password
- Temporary passwords are stored in the system
- Users can be viewed in the "Pending Credentials" page
- School admin can send login credentials via email from the Pending Credentials page
- Users will be required to change their password on first login

### License Limits
- The system will check your school's license limits for:
  - Number of classes
  - Number of teachers
  - Number of students
  - Number of parents
- If any limit is reached, the upload will fail with an error message
- You may need to upgrade your plan to add more users

## How to Use

1. **Download or create a CSV file** following the format above
2. **Navigate to**: `https://play2learn-test.onrender.com/school-admin/classes/manage`
3. **Click on "Bulk Create Class"** (or similar button)
4. **Upload your CSV file**
5. **Review the results**:
   - Number of classes created
   - Number of teachers created/assigned
   - Number of students created/assigned
   - Number of parents created
   - Any errors or warnings

## Viewing Created Accounts

After successful upload:

### View the Class
- Go to: `https://play2learn-test.onrender.com/school-admin/classes/manage`
- Your new class will appear in the list

### View Teachers
- Go to: `https://play2learn-test.onrender.com/school-admin/teachers`

### View Students
- Go to: `https://play2learn-test.onrender.com/school-admin/students`

### View Parents
- Go to: `https://play2learn-test.onrender.com/school-admin/parents`

### View and Send Credentials
- Go to: `https://play2learn-test.onrender.com/school-admin/users/pending-credentials`
- You'll see all newly created accounts with their temporary passwords
- You can send credentials via email from this page

## Error Handling

### Common Errors

1. **"CSV file is empty"**
   - The uploaded file has no data rows

2. **"CSV must include Class Name, Grade, and Subject in the first row"**
   - The first row is missing required class metadata

3. **"A class with name [ClassName] already exists"**
   - A class with this name already exists in your school
   - Choose a different class name

4. **"Class limit reached"**
   - Your school has reached the maximum number of classes allowed
   - Upgrade your license plan

5. **"Teacher limit reached"**
   - Your school has reached the maximum number of teachers allowed
   - Upgrade your license plan

6. **"Student limit reached"**
   - Your school has reached the maximum number of students allowed
   - Upgrade your license plan

7. **"Email already exists"** (in errors array)
   - An account with this email already exists
   - The system will attempt to assign the existing user to the class

### Warnings

1. **"Only one teacher per class is allowed. Skipping additional teacher."**
   - Multiple teacher rows were found in the CSV
   - Only the first teacher will be processed

2. **"Parent limit reached"**
   - Parent account creation was skipped due to license limit
   - Student will still be created but without parent link

## Tips for Success

1. **Test with a small file first** - Create a CSV with 1 teacher and 2-3 students to test
2. **Use unique email addresses** - Each email must be unique across the system
3. **Check your license limits** before uploading large files
4. **Keep backups** - Save a copy of your CSV file before uploading
5. **Use Excel or Google Sheets** to create your CSV, then export as CSV format
6. **Avoid special characters** in names and emails that might cause parsing issues

## Example Full CSV File

```csv
Class Name,Grade,Subject,Teacher Name,Teacher Email,Teacher Role,Student Name,Student Email,Student Role,Linked Parent Email
Primary 4 Mathematics B,Primary 4,Mathematics,Mr. David Lee,david.lee@school.edu.sg,Teacher,,,,
,,,,,Alice Ng Mei Ling,alice.ng@student.edu.sg,Student,parent.ng@email.com
,,,,,Brandon Koh Jun Wei,brandon.koh@student.edu.sg,Student,parent.koh@email.com
,,,,,Chloe Tan Xin Yi,chloe.tan@student.edu.sg,Student,parent.tan@email.com
,,,,,Daniel Lim Wei Jie,daniel.lim@student.edu.sg,Student,parent.lim@email.com
,,,,,Emily Chen Yu Xuan,emily.chen@student.edu.sg,Student,parent.chen@email.com
```

## Support

If you encounter issues with bulk class creation:
1. Check this guide for proper CSV format
2. Verify your CSV file matches the template exactly
3. Check the error messages for specific issues
4. Contact your P2L Admin for assistance

## API Endpoint

**Endpoint**: `POST /api/school-admin/classes/bulk-create`

**Authentication**: School Admin JWT token required

**Request**: Multipart form-data with CSV file

**Response**: JSON with creation summary and any errors/warnings
