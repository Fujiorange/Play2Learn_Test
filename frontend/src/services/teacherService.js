// src/services/teacherService.js
// Teacher Service for MongoDB Operations

const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`);

const teacherService = {
  getToken() {
    return localStorage.getItem('token');
  },

  // ==================== STUDENTS ====================
  async getMyStudents() {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/teacher/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch students');
      return await response.json();
    } catch (error) {
      console.error('getMyStudents error:', error);
      return { success: false, error: 'Failed to load students' };
    }
  },

  async getStudentDetails(studentId) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/teacher/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch student details');
      return await response.json();
    } catch (error) {
      console.error('getStudentDetails error:', error);
      return { success: false, error: 'Failed to load student details' };
    }
  },

  // ==================== POINTS MANAGEMENT ====================
  async adjustStudentPoints(studentId, amount, reason) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/teacher/students/${studentId}/adjust-points`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, reason }),
      });

      const json = await response.json();
      return json;
    } catch (error) {
      console.error('adjustStudentPoints error:', error);
      return { success: false, error: 'Failed to adjust points' };
    }
  },

  async getStudentPointHistory(studentId) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/teacher/students/${studentId}/point-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch point history');
      return await response.json();
    } catch (error) {
      console.error('getStudentPointHistory error:', error);
      return { success: false, error: 'Failed to load point history' };
    }
  },

  // ==================== CLASSES ====================
  async getMyClasses() {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/teacher/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch classes');
      return await response.json();
    } catch (error) {
      console.error('getMyClasses error:', error);
      return { success: false, error: 'Failed to load classes' };
    }
  },

  async getClassStudents(className) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/teacher/classes/${encodeURIComponent(className)}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch class students');
      return await response.json();
    } catch (error) {
      console.error('getClassStudents error:', error);
      return { success: false, error: 'Failed to load class students' };
    }
  },

  // ==================== LEADERBOARD ====================
  async getClassLeaderboard(className) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/teacher/classes/${encodeURIComponent(className)}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return await response.json();
    } catch (error) {
      console.error('getClassLeaderboard error:', error);
      return { success: false, error: 'Failed to load leaderboard' };
    }
  },

  // ==================== DASHBOARD ====================
  async getDashboard() {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard');
      return await response.json();
    } catch (error) {
      console.error('getDashboard error:', error);
      return { success: false, error: 'Failed to load dashboard' };
    }
  },
};

export default teacherService;
