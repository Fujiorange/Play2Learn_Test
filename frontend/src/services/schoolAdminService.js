// src/services/schoolAdminService.js
// School Admin Service for MongoDB Operations

const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`);

const schoolAdminService = {
  // Get auth token
  getToken() {
    return localStorage.getItem('token');
  },

  // ==================== DASHBOARD ====================
  async getDashboardStats() {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      return await response.json();
    } catch (error) {
      console.error('getDashboardStats error:', error);
      return { success: false, error: 'Failed to load dashboard stats' };
    }
  },

  // ==================== SCHOOL & LICENSE INFO ====================
  async getSchoolInfo() {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/school-info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch school info');
      }

      return await response.json();
    } catch (error) {
      console.error('getSchoolInfo error:', error);
      return { success: false, error: error.message || 'Failed to load school info' };
    }
  },

  // ==================== USER MANAGEMENT ====================
  async getUsers(filters = {}) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      let url = `${API_URL}/mongo/school-admin/users`;
      const params = new URLSearchParams();
      if (filters.gradeLevel) params.append('gradeLevel', filters.gradeLevel);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.role) params.append('role', filters.role);
      const query = params.toString();
      if (query) url += `?${query}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('getUsers error:', error);
      return { success: false, error: 'Failed to load users' };
    }
  },

  async getUserDetails(userId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/users/${userId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      return await response.json();
    } catch (error) {
      console.error('getUserDetails error:', error);
      return { success: false, error: 'Failed to load user details' };
    }
  },

  async createUser(userData) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/users/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      return await response.json();
    } catch (error) {
      console.error('createUser error:', error);
      return { success: false, error: error.message || 'Failed to create user' };
    }
  },

  async deleteUser(userId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      return await response.json();
    } catch (error) {
      console.error('deleteUser error:', error);
      return { success: false, error: error.message || 'Failed to delete user' };
    }
  },

  async resetUserPassword(userId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset password');
      }

      return await response.json();
    } catch (error) {
      console.error('resetUserPassword error:', error);
      return { success: false, error: error.message || 'Failed to reset password' };
    }
  },

  // ==================== CLASS MANAGEMENT ====================
  async getClasses(filters = {}) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      let url = `${API_URL}/mongo/school-admin/classes`;
      if (filters.grade || filters.subject) {
        const params = new URLSearchParams();
        if (filters.grade) params.append('grade', filters.grade);
        if (filters.subject) params.append('subject', filters.subject);
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      return await response.json();
    } catch (error) {
      console.error('getClasses error:', error);
      return { success: false, error: 'Failed to load classes' };
    }
  },

  async createClass(classData) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(classData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create class');
      }

      return await response.json();
    } catch (error) {
      console.error('createClass error:', error);
      return { success: false, error: error.message || 'Failed to create class' };
    }
  },

  async getClass(classId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/classes/${classId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch class');
      }

      return await response.json();
    } catch (error) {
      console.error('getClass error:', error);
      return { success: false, error: error.message || 'Failed to load class' };
    }
  },

  async updateClass(classId, classData) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/classes/${classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(classData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update class');
      }

      return await response.json();
    } catch (error) {
      console.error('updateClass error:', error);
      return { success: false, error: error.message || 'Failed to update class' };
    }
  },

  async deleteClass(classId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/classes/${classId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete class');
      }

      return await response.json();
    } catch (error) {
      console.error('deleteClass error:', error);
      return { success: false, error: error.message || 'Failed to delete class' };
    }
  },

  async getAvailableTeachers() {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/classes/available/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      return await response.json();
    } catch (error) {
      console.error('getAvailableTeachers error:', error);
      return { success: false, error: 'Failed to load teachers' };
    }
  },

  async getAvailableStudents(unassignedOnly = false, includeClassId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      let url = `${API_URL}/mongo/school-admin/classes/available/students`;
      const params = new URLSearchParams();
      if (unassignedOnly) params.append('unassigned', 'true');
      if (includeClassId) params.append('includeClassId', includeClassId);
      const query = params.toString();
      if (query) url += `?${query}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      return await response.json();
    } catch (error) {
      console.error('getAvailableStudents error:', error);
      return { success: false, error: 'Failed to load students' };
    }
  },

  // ==================== BULK UPLOAD ====================
  async bulkUploadUsers(file) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/mongo/school-admin/bulk-import-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload users');
      }

      return await response.json();
    } catch (error) {
      console.error('bulkUploadUsers error:', error);
      return { success: false, error: error.message || 'Failed to upload users' };
    }
  },

  // ==================== CREATE OR LINK PARENT ====================
  async createOrLinkParent(data) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/users/create-or-link-parent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create or link parent');
      }

      return await response.json();
    } catch (error) {
      console.error('createOrLinkParent error:', error);
      return { success: false, error: error.message || 'Failed to create or link parent' };
    }
  },

  // ==================== GET STUDENTS WITHOUT PARENT ====================
  async getStudentsWithoutParent() {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/students-without-parent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      return await response.json();
    } catch (error) {
      console.error('getStudentsWithoutParent error:', error);
      return { success: false, error: 'Failed to load students' };
    }
  }
};

export default schoolAdminService;
