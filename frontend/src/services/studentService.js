// src/services/studentService.js
// Student Service for MongoDB Operations - FULLY DYNAMIC VERSION

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const studentService = {
  // ==================== PROFILE METHODS ====================
  
  async getProfile() {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }
      return { success: true, user: user };
    } catch (error) {
      return { success: false, error: 'Failed to load profile' };
    }
  },

  // ==================== MATH PROFILE & QUIZ METHODS ====================
  
  async getMathProfile() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/student/math-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch math profile');
      }

      return await response.json();
    } catch (error) {
      console.error('getMathProfile error:', error);
      return { success: false, error: 'Failed to load math profile' };
    }
  },

  async getMathSkills() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/student/math-skills`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch math skills');
      }

      return await response.json();
    } catch (error) {
      console.error('getMathSkills error:', error);
      return { success: false, error: 'Failed to load math skills' };
    }
  },

  async getMathProgress() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/student/math-progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch math progress');
      }

      return await response.json();
    } catch (error) {
      console.error('getMathProgress error:', error);
      return { success: false, error: 'Failed to load math progress' };
    }
  },

  async getMathQuizResults() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/student/quiz-results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz results');
      }

      return await response.json();
    } catch (error) {
      console.error('getMathQuizResults error:', error);
      return { success: false, error: 'Failed to load quiz results' };
    }
  },

  async getMathQuizHistory() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/student/quiz-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz history');
      }

      return await response.json();
    } catch (error) {
      console.error('getMathQuizHistory error:', error);
      return { success: false, error: 'Failed to load quiz history' };
    }
  },

  // ==================== DASHBOARD ====================
  
  async getDashboard() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/student/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      return await response.json();
    } catch (error) {
      console.error('getDashboard error:', error);
      return { success: false, error: 'Failed to load dashboard' };
    }
  },

  // ==================== LEADERBOARD ====================
  
  async getLeaderboard() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/student/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return await response.json();
    } catch (error) {
      console.error('getLeaderboard error:', error);
      return { success: false, error: 'Failed to load leaderboard' };
    }
  },

  // ==================== SUPPORT TICKETS ====================
  
  async createSupportTicket(ticketData) {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/student/support-ticket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...ticketData,
          student_email: user.email,
          student_name: user.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create support ticket');
      }

      return await response.json();
    } catch (error) {
      console.error('createSupportTicket error:', error);
      return { success: false, error: 'Failed to create support ticket' };
    }
  },

  async getSupportTickets() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/student/support-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch support tickets');
      }

      return await response.json();
    } catch (error) {
      console.error('getSupportTickets error:', error);
      return { success: false, error: 'Failed to load support tickets' };
    }
  },

  // ==================== TESTIMONIALS ====================
  
  async createTestimonial(testimonialData) {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/mongo/student/testimonial`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...testimonialData,
          student_email: user.email,
          student_name: user.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create testimonial');
      }

      return await response.json();
    } catch (error) {
      console.error('createTestimonial error:', error);
      return { success: false, error: 'Failed to create testimonial' };
    }
  },

  // ==================== ALIASES FOR COMPATIBILITY ====================
  
  getProgress() { return this.getMathProgress(); },
  getResults() { return this.getMathQuizResults(); },
  getResultHistory() { return this.getMathQuizHistory(); },
  getSkills() { return this.getMathSkills(); }
};

export default studentService;