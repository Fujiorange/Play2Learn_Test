// backend/utils/parentUtils.js
// Utility functions for parent-student operations

/**
 * Filters out null or undefined student IDs from linkedStudents array
 * @param {Array} linkedStudents - Array of linked student objects with studentId field
 * @returns {Array} - Array of valid student IDs
 */
function getValidStudentIds(linkedStudents) {
  if (!linkedStudents || !Array.isArray(linkedStudents)) {
    return [];
  }
  
  return linkedStudents
    .map(ls => ls.studentId)
    .filter(id => id); // Filter out null/undefined
}

module.exports = {
  getValidStudentIds
};
