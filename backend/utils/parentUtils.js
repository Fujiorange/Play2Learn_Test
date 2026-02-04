// backend/utils/parentUtils.js
// Utility functions for parent-student operations

/**
 * Filters out null or undefined student IDs from linkedStudents array.
 * Note: This specifically filters null and undefined only, not other falsy values,
 * as ObjectIDs can technically be any truthy value.
 * 
 * @param {Array} linkedStudents - Array of linked student objects with studentId field
 * @returns {Array} - Array of valid (non-null, non-undefined) student IDs
 */
function getValidStudentIds(linkedStudents) {
  if (!linkedStudents || !Array.isArray(linkedStudents)) {
    return [];
  }
  
  return linkedStudents
    .map(ls => ls.studentId)
    .filter(id => id !== null && id !== undefined); // Filter out null/undefined values specifically
}

module.exports = {
  getValidStudentIds
};
