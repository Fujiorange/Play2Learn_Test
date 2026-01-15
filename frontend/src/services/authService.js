// src/services/authService.js
// Real API authentication service for Play2Learn - MONGODB VERSION

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  // Register new user - MONGODB
  async register(userData) {
    try {
      console.log('📤 Sending registration to:', `${API_URL}/mongo/auth/register`);
      console.log('📦 Data:', userData);

      const response = await fetch(`${API_URL}/mongo/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          contact: userData.contact,
          gender: userData.gender,
          dateOfBirth: userData.dateOfBirth, // ✅ This matches backend
          organizationName: userData.organizationName,
          organizationType: userData.organizationType,
          businessRegistrationNumber: userData.businessRegistrationNumber,
          role: userData.role
        }),
      });

      const data = await response.json();
      console.log('📥 Registration response:', data);

      if (data.success) {
        // Don't store token - user needs to login manually
        return { success: true, message: data.message || 'Account created successfully' };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  }

  // Login user - MONGODB
  async login(email, password, role) {
    try {
      console.log('📤 Sending login to:', `${API_URL}/mongo/auth/login`);
      console.log('📦 Data:', { email, role });

      const response = await fetch(`${API_URL}/mongo/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      console.log('📥 Login response:', data);

      if (data.success) {
        // Store token and user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('✅ Login successful, token stored');
        return { success: true, user: data.user };
      } else {
        console.log('❌ Login failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  }

  // Logout user
  async logout() {
    try {
      const token = this.getToken();
      
      if (token) {
        await fetch(`${API_URL}/mongo/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Get current user from localStorage
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expirationTime;
    } catch (error) {
      return false;
    }
  }

  // Get current user data from server (with fresh token verification)
  async getCurrentUserFromServer() {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        // Token might be invalid, clear auth
        this.logout();
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Get dashboard data
  async getDashboardData() {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Dashboard error:', error);
      return { success: false, error: 'Failed to load dashboard data' };
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;