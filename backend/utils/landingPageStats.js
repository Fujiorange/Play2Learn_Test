/**
 * Utility function to calculate automated statistics for landing page
 */

const User = require('../models/User');
const School = require('../models/School');

/**
 * Calculate automated statistics for the landing page About section
 * @returns {Promise<Array>} Array of statistics objects with value and label
 */
async function calculateLandingPageStatistics() {
  // Calculate all statistics in parallel for better performance
  const [schoolCount, studentCount, teacherCount] = await Promise.all([
    School.countDocuments({ is_active: true }),
    User.countDocuments({ role: { $in: ['Student', 'Trial Student'] } }),
    User.countDocuments({ role: { $in: ['Teacher', 'Trial Teacher'] } })
  ]);

  // Create automated statistics array
  return [
    { value: `${schoolCount}+`, label: 'Schools Partnered' },
    { value: `${studentCount}+`, label: 'Students Using This' },
    { value: `${teacherCount}+`, label: 'Teachers Using This' }
  ];
}

module.exports = {
  calculateLandingPageStatistics
};
