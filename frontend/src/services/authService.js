const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : `${window.location.origin}/api`);

class AuthService {
  async register(userData) {
    try {
      const res = await fetch(`${API_URL}/mongo/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  async registerSchoolAdmin(userData) {
    try {
      const res = await fetch(`${API_URL}/mongo/auth/register-school-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  async verifyPIN(email, pin) {
    try {
      const res = await fetch(`${API_URL}/mongo/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Verification failed. Please try again.' };
    }
  }

  async resendPIN(email) {
    try {
      const res = await fetch(`${API_URL}/mongo/auth/resend-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Failed to resend PIN. Please try again.' };
    }
  }

  async login(email, password) {
    try {
      const res = await fetch(`${API_URL}/mongo/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (e) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }

  async updateProfile(profileData) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const res = await fetch(`${API_URL}/mongo/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (data.success && data.user) localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch {
      return { success: false, error: 'Failed to update profile' };
    }
  }

  async updateProfilePicture(profilePicture) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const res = await fetch(`${API_URL}/mongo/auth/update-picture`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profile_picture: profilePicture }),
      });
      const data = await res.json();
      if (data.success && data.user) localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch {
      return { success: false, error: 'Failed to update profile picture' };
    }
  }

  async getCurrentUserFromServer() {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const res = await fetch(`${API_URL}/mongo/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.user) localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch {
      return { success: false, error: 'Failed to get user data' };
    }
  }

  async changePassword(oldPassword, newPassword) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const res = await fetch(`${API_URL}/mongo/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      
      // If password change is successful, update user to clear requirePasswordChange flag
      if (data.success) {
        const user = this.getCurrentUser();
        if (user) {
          user.requirePasswordChange = false;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      return data;
    } catch {
      return { success: false, error: 'Failed to change password' };
    }
  }

  async getDashboardData() {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      const user = this.getCurrentUser();
      if (!user) return { success: false, error: 'User not found' };

      // Route to the appropriate dashboard endpoint based on user role
      let endpoint = '';
      if (user.role === 'Teacher' || user.role === 'Trial Teacher') {
        endpoint = `${API_URL}/mongo/teacher/dashboard`;
      } else if (user.role === 'Student') {
        endpoint = `${API_URL}/mongo/student/dashboard`;
      } else if (user.role === 'Parent') {
        endpoint = `${API_URL}/mongo/parent/dashboard`;
      } else {
        return { success: false, error: 'Unknown user role' };
      }

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      console.error('getDashboardData error:', error);
      return { success: false, error: 'Failed to get dashboard data' };
    }
  }
}

export default new AuthService();
