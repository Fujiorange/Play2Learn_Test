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

  // ==================== USER MANAGEMENT ====================
  async getUsers(filters = {}) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      let url = `${API_URL}/mongo/school-admin/users`;
      if (filters.gradeLevel || filters.subject) {
        const params = new URLSearchParams();
        if (filters.gradeLevel) params.append('gradeLevel', filters.gradeLevel);
        if (filters.subject) params.append('subject', filters.subject);
        url += `?${params.toString()}`;
      }

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

  async updateUserStatus(userId, isActive) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user status');
      }

      return await response.json();
    } catch (error) {
      console.error('updateUserStatus error:', error);
      return { success: false, error: error.message || 'Failed to update user status' };
    }
  },

  async updateUserRole(userId, role) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      // Security check
      if (role === 'school-admin') {
        return { success: false, error: 'Cannot assign school-admin role' };
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user role');
      }

      return await response.json();
    } catch (error) {
      console.error('updateUserRole error:', error);
      return { success: false, error: error.message || 'Failed to update user role' };
    }
  },

  async resetUserPassword(userId, newPassword) {
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
        body: JSON.stringify({ password: newPassword })
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

  // ==================== BULK UPLOAD ====================
  async bulkUploadUsers(file, userType) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const formData = new FormData();
      formData.append('file', file);

      let endpoint = '';
      switch(userType) {
        case 'teacher':
          endpoint = 'bulk-import-teachers';
          break;
        case 'student':
          endpoint = 'bulk-import-students';
          break;
        case 'parent':
          endpoint = 'bulk-import-parents';
          break;
        default:
          endpoint = 'bulk-import-students';
      }

      const response = await fetch(`${API_URL}/mongo/school-admin/${endpoint}`, {
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
  }
};

export default schoolAdminService;