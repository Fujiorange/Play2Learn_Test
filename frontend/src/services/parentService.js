// src/services/parentService.js
// Parent Service for MongoDB Operations - Parent Dashboard & Child Monitoring

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`);

console.log('🌐 Parent Service API_URL:', API_URL);

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return { json: null, text: '' };
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

const parentService = {
  // ==================== DASHBOARD METHODS ====================
  
  /**
   * Get parent dashboard data with linked students
   * @returns {Promise<Object>} Dashboard data including parent info and linked students
   */
  async getDashboard() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/parent/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const { json } = await parseJsonSafe(response);

      if (!response.ok) {
        return {
          success: false,
          error: json?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return json || { success: false, error: 'Empty response' };
    } catch (error) {
      console.error('❌ Parent Dashboard Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to load dashboard',
      };
    }
  },

  // ==================== CHILD STATISTICS METHODS ====================
  
  /**
   * Get detailed statistics for a specific child
   * @param {string} studentId - The ID of the student/child
   * @returns {Promise<Object>} Child statistics including quiz performance, assignments, etc.
   */
  async getChildStats(studentId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      if (!studentId) {
        return { success: false, error: 'Student ID is required' };
      }

      const response = await fetch(`${API_URL}/mongo/parent/child/${studentId}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const { json } = await parseJsonSafe(response);

      if (!response.ok) {
        return {
          success: false,
          error: json?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return json || { success: false, error: 'Empty response' };
    } catch (error) {
      console.error('❌ Child Stats Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to load child statistics',
      };
    }
  },

  // ==================== CHILD ACTIVITIES METHODS ====================
  
  /**
   * Get recent activities for a specific child
   * @param {string} studentId - The ID of the student/child
   * @param {number} limit - Maximum number of activities to return (default: 10)
   * @returns {Promise<Object>} Recent activities including quizzes, assignments, logins
   */
  async getChildActivities(studentId, limit = 10) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      if (!studentId) {
        return { success: false, error: 'Student ID is required' };
      }

      const response = await fetch(
        `${API_URL}/mongo/parent/child/${studentId}/activities?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const { json } = await parseJsonSafe(response);

      if (!response.ok) {
        return {
          success: false,
          error: json?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return json || { success: false, error: 'Empty response' };
    } catch (error) {
      console.error('❌ Child Activities Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to load child activities',
      };
    }
  },

  // ==================== CHILD PERFORMANCE METHODS ====================
  
  /**
   * Get detailed performance data for a specific child
   * @param {string} studentId - The ID of the student/child
   * @returns {Promise<Object>} Performance data including quiz scores, skill progress, etc.
   */
  async getChildPerformance(studentId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      if (!studentId) {
        return { success: false, error: 'Student ID is required' };
      }

      const response = await fetch(
        `${API_URL}/mongo/parent/child/${studentId}/performance`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const { json } = await parseJsonSafe(response);

      if (!response.ok) {
        return {
          success: false,
          error: json?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return json || { success: false, error: 'Empty response' };
    } catch (error) {
      console.error('❌ Child Performance Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to load child performance',
      };
    }
  },

  // ==================== CHILDREN SUMMARY METHODS ====================
  
  /**
   * Get summary data for all linked children
   * @returns {Promise<Object>} Summary data for all children including quick stats
   */
  async getChildrenSummary() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/parent/children/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const { json } = await parseJsonSafe(response);

      if (!response.ok) {
        return {
          success: false,
          error: json?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return json || { success: false, error: 'Empty response' };
    } catch (error) {
      console.error('❌ Children Summary Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to load children summary',
      };
    }
  },

  // ==================== UTILITY METHODS ====================
  
  /**
   * Get current parent profile from localStorage
   * @returns {Object|null} Parent user object or null
   */
  getParentProfile() {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.role === 'Parent') {
        return user;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated as a parent
   * @returns {boolean} True if authenticated parent
   */
  isParentAuthenticated() {
    const user = this.getParentProfile();
    const token = localStorage.getItem('token');
    return !!(user && token);
  },
};

export default parentService;
