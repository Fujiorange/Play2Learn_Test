# CSV Template Examples

This folder contains example CSV templates for the bulk upload feature.

## Files

### 1. sample_classes.csv
Template for creating classes in bulk.

**Required Columns:**
- Class Name
- Grade (must be one of: Primary 1, Primary 2, Primary 3, Primary 4, Primary 5, Primary 6)
- Subject (e.g., Mathematics, Science, English)

### 2. sample_teachers.csv
Template for creating and assigning teachers to classes.

**Required Columns:**
- Teacher Name
- Teacher Email (must be valid email format)
- Teacher Role (should be "Teacher")
- Class Name (must match an existing class)

**Note:** Teachers are created if they don't exist, otherwise just assigned to the class.

### 3. sample_students.csv
Template for creating students and linking them to parents.

**Required Columns:**
- Student Name
- Student Email (must be valid email format)
- Student Role (should be "Student")
- Linked Parent Email (optional - parent account will be created if email provided)
- Class Name (must match an existing class)

**Note:** 
- Students are created if they don't exist, otherwise just assigned to the class
- Parent accounts are automatically created if parent email is provided
- Parent name defaults to "Parent of [Student Name]" and can be updated after login

## Upload Order

To successfully upload all data:

1. **First:** Upload `sample_classes.csv` to create classes
2. **Second:** Upload `sample_teachers.csv` to assign teachers
3. **Third:** Upload `sample_students.csv` to create students and parents

## Important Notes

- All email addresses must be unique across the system
- Class names in teacher/student CSVs must match exactly with created classes
- Grades must be one of the predefined options
- Temporary passwords will be generated for all new accounts
- Credentials can be reviewed and sent via the school admin panel

## License Limits

Before uploading:
- Check your school's license limits for teachers and students
- The system will skip creation if limits are exceeded
- Failed rows will be reported in the upload summary
