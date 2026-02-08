/**
 * CSV Class Parser Utility
 * Parses CSV files for bulk class and user creation
 * Supports multi-section format with [Classes], [Teachers], [Students], [Parents]
 */

/**
 * Parse multi-section CSV format
 * @param {string} csvContent - The raw CSV content
 * @returns {Object} - Parsed sections: { classes, teachers, students, parents }
 */
function parseMultiSectionCSV(csvContent) {
  const result = {
    classes: [],
    teachers: [],
    students: [],
    parents: []
  };

  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
  let currentSection = null;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for section headers
    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1).toLowerCase();
      // Next line should be the column headers
      if (i + 1 < lines.length) {
        headers = parseCSVLine(lines[i + 1]);
        i++; // Skip the header line
      }
      continue;
    }

    // Parse data line based on current section
    if (currentSection && headers.length > 0) {
      const values = parseCSVLine(line);
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });

      switch (currentSection) {
        case 'classes':
          result.classes.push(parseClassRow(obj));
          break;
        case 'teachers':
          result.teachers.push(parseTeacherRow(obj));
          break;
        case 'students':
          result.students.push(parseStudentRow(obj));
          break;
        case 'parents':
          result.parents.push(parseParentRow(obj));
          break;
      }
    }
  }

  return result;
}

/**
 * Parse a CSV line handling quoted values and commas
 * @param {string} line - CSV line
 * @returns {Array} - Array of values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Parse class row
 */
function parseClassRow(obj) {
  return {
    className: obj.ClassName || obj.className || obj.class_name || '',
    gradeLevel: obj.GradeLevel || obj.gradeLevel || obj.grade || '',
    subjects: parseArrayField(obj.Subjects || obj.subjects || '')
  };
}

/**
 * Parse teacher row
 */
function parseTeacherRow(obj) {
  return {
    fullName: obj.FullName || obj.fullName || obj.name || '',
    email: (obj.Email || obj.email || '').toLowerCase().trim(),
    classes: parseArrayField(obj.Class || obj.Classes || obj.classes || ''),
    subjects: parseArrayField(obj.Subjects || obj.subjects || obj.Subject || '')
  };
}

/**
 * Parse student row
 */
function parseStudentRow(obj) {
  return {
    fullName: obj.FullName || obj.fullName || obj.name || '',
    email: (obj.Email || obj.email || '').toLowerCase().trim(),
    class: obj.Class || obj.class || obj.className || '',
    gradeLevel: obj.GradeLevel || obj.gradeLevel || obj.grade || '',
    linkedParentEmail: (obj.LinkedParentEmail || obj.linkedParentEmail || obj.parentEmail || '').toLowerCase().trim()
  };
}

/**
 * Parse parent row
 */
function parseParentRow(obj) {
  return {
    fullName: obj.FullName || obj.fullName || obj.name || '',
    email: (obj.Email || obj.email || '').toLowerCase().trim(),
    linkedStudentEmails: parseArrayField(obj.LinkedStudentEmail || obj.linkedStudentEmail || obj.studentEmail || obj.LinkedStudentEmails || obj.linkedStudentEmails || '')
  };
}

/**
 * Parse array field (comma-separated values)
 * @param {string} value - Comma-separated string
 * @returns {Array} - Array of trimmed values
 */
function parseArrayField(value) {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(v => v);
}

/**
 * Validate parsed CSV data
 * @param {Object} data - Parsed CSV data
 * @returns {Object} - { valid: boolean, errors: Array }
 */
function validateCSVData(data) {
  const errors = [];

  // Validate classes
  data.classes.forEach((cls, index) => {
    if (!cls.className) {
      errors.push(`Class at row ${index + 1}: ClassName is required`);
    }
    if (!cls.gradeLevel) {
      errors.push(`Class at row ${index + 1}: GradeLevel is required`);
    }
  });

  // Validate teachers
  data.teachers.forEach((teacher, index) => {
    if (!teacher.fullName) {
      errors.push(`Teacher at row ${index + 1}: FullName is required`);
    }
    if (!teacher.email) {
      errors.push(`Teacher at row ${index + 1}: Email is required`);
    } else if (!isValidEmail(teacher.email)) {
      errors.push(`Teacher at row ${index + 1}: Invalid email format`);
    }
    if (!teacher.classes || teacher.classes.length === 0) {
      errors.push(`Teacher at row ${index + 1}: At least one class assignment is required`);
    }
  });

  // Validate students
  data.students.forEach((student, index) => {
    if (!student.fullName) {
      errors.push(`Student at row ${index + 1}: FullName is required`);
    }
    if (!student.email) {
      errors.push(`Student at row ${index + 1}: Email is required`);
    } else if (!isValidEmail(student.email)) {
      errors.push(`Student at row ${index + 1}: Invalid email format`);
    }
    if (!student.class) {
      errors.push(`Student at row ${index + 1}: Class is required`);
    }
  });

  // Validate parents
  data.parents.forEach((parent, index) => {
    if (!parent.fullName) {
      errors.push(`Parent at row ${index + 1}: FullName is required`);
    }
    if (!parent.email) {
      errors.push(`Parent at row ${index + 1}: Email is required`);
    } else if (!isValidEmail(parent.email)) {
      errors.push(`Parent at row ${index + 1}: Invalid email format`);
    }
    if (!parent.linkedStudentEmails || parent.linkedStudentEmails.length === 0) {
      errors.push(`Parent at row ${index + 1}: At least one linked student email is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate CSV template for multi-section format
 * @returns {string} - CSV template content
 */
function generateCSVTemplate() {
  return `[Classes]
ClassName,GradeLevel,Subjects
Science 101,Primary 1,"Mathematics,Science"
Math 202,Primary 2,"Mathematics"

[Teachers]
FullName,Email,Class,Subjects
John Doe,john@school.edu,Science 101,"Mathematics,Science"
Sarah Chen,sarah@school.edu,"Science 101,Math 202",Mathematics

[Students]
FullName,Email,Class,GradeLevel,LinkedParentEmail
Jane Smith,jane@school.edu,Science 101,Primary 1,parent@email.com
Mike Lee,mike@school.edu,Math 202,Primary 2,parent2@email.com

[Parents]
FullName,Email,LinkedStudentEmail
Mary Smith,parent@email.com,jane@school.edu
Robert Lee,parent2@email.com,mike@school.edu`;
}

module.exports = {
  parseMultiSectionCSV,
  validateCSVData,
  generateCSVTemplate,
  parseCSVLine
};
