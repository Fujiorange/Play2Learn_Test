// src/services/schoolAdminService.js
// School Admin Service for MongoDB Operations - COMPLETE VERSION

const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`);

const schoolAdminService = {
  getToken() {
    return localStorage.getItem('token');
  },

  async apiCall(endpoint, options = {}) {
    const token = this.getToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(`${API_URL}/mongo/school-admin${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        },
        ...options
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (error) {
      console.error(`API error (${endpoint}):`, error);
      return { success: false, error: error.message };
    }
  },

  // DASHBOARD
  async getDashboardStats() { return this.apiCall('/dashboard-stats'); },

  // USERS
  async getUsers(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    return this.apiCall(`/users${params.toString() ? '?' + params : ''}`);
  },
  async createUser(data) { return this.apiCall('/users', { method: 'POST', body: JSON.stringify(data) }); },
  async updateUser(id, data) { return this.apiCall(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteUser(id) { return this.apiCall(`/users/${id}`, { method: 'DELETE' }); },
  async updateUserStatus(id, accountActive) { return this.apiCall(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ accountActive }) }); },
  async resetUserPassword(id) { return this.apiCall(`/users/${id}/reset-password`, { method: 'POST' }); },

  // CLASSES
  async getClasses() { return this.apiCall('/classes'); },
  async createClass(data) { return this.apiCall('/classes', { method: 'POST', body: JSON.stringify(data) }); },
  async updateClass(id, data) { return this.apiCall(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteClass(id) { return this.apiCall(`/classes/${id}`, { method: 'DELETE' }); },

  // BADGES
  async getBadges() { return this.apiCall('/badges'); },
  async createBadge(data) { return this.apiCall('/badges', { method: 'POST', body: JSON.stringify(data) }); },
  async updateBadge(id, data) { return this.apiCall(`/badges/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteBadge(id) { return this.apiCall(`/badges/${id}`, { method: 'DELETE' }); },

  // POINT RULES
  async getPointRules() { return this.apiCall('/point-rules'); },
  async createPointRule(data) { return this.apiCall('/point-rules', { method: 'POST', body: JSON.stringify(data) }); },
  async updatePointRule(id, data) { return this.apiCall(`/point-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deletePointRule(id) { return this.apiCall(`/point-rules/${id}`, { method: 'DELETE' }); },
  async adjustStudentPoints(id, amount, reason) { return this.apiCall(`/students/${id}/adjust-points`, { method: 'POST', body: JSON.stringify({ amount, reason }) }); },

  // SHOP ITEMS
  async getShopItems() { return this.apiCall('/shop-items'); },
  async createShopItem(data) { return this.apiCall('/shop-items', { method: 'POST', body: JSON.stringify(data) }); },
  async updateShopItem(id, data) { return this.apiCall(`/shop-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteShopItem(id) { return this.apiCall(`/shop-items/${id}`, { method: 'DELETE' }); },

  // ANNOUNCEMENTS
  async getAnnouncements() { return this.apiCall('/announcements'); },
  async createAnnouncement(data) { return this.apiCall('/announcements', { method: 'POST', body: JSON.stringify(data) }); },
  async updateAnnouncement(id, data) { return this.apiCall(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteAnnouncement(id) { return this.apiCall(`/announcements/${id}`, { method: 'DELETE' }); },

  // MAINTENANCE
  async getMaintenanceMessages() { return this.apiCall('/maintenance'); },
  async createMaintenanceMessage(data) { return this.apiCall('/maintenance', { method: 'POST', body: JSON.stringify(data) }); },
  async updateMaintenanceMessage(id, data) { return this.apiCall(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteMaintenanceMessage(id) { return this.apiCall(`/maintenance/${id}`, { method: 'DELETE' }); },

  // SUPPORT TICKETS
  async getSupportTickets(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    return this.apiCall(`/support-tickets${params.toString() ? '?' + params : ''}`);
  },
  async updateSupportTicket(id, data) { return this.apiCall(`/support-tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },

  // ANALYTICS
  async getAnalytics() { return this.apiCall('/analytics'); },

  // BULK UPLOAD
  async bulkUploadUsers(file, userType) {
    const token = this.getToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/mongo/school-admin/bulk-upload/${userType}s`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default schoolAdminService;
