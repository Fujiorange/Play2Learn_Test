// frontend/src/services/parentService.js - WITH SKILL MATRIX METHOD
// ✅ UPDATED: Added getChildSkills(studentId) method
// ✅ UPDATED: Added createTestimonial(formData) method for WriteTestimonial.js
// ✅ Includes everything from Phase 2 + new skills method
// ✅ FIXED: Dynamic API_BASE_URL based on environment (localhost vs deployed)

import authService from './authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api/mongo/parent'
    : `${window.location.origin}/api/mongo/parent`);

console.log('🌐 Parent Service API_BASE_URL:', API_BASE_URL);

class ParentService {
  // ==================== DASHBOARD & CHILDREN (PHASE 1) ====================
  
  async getDashboard() {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load dashboard');
      }

      return data;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getChildStats(studentId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/child/${studentId}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load child stats');
      }

      return data;
    } catch (error) {
      console.error('Error loading child stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getChildActivities(studentId, limit = 10) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/child/${studentId}/activities?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load activities');
      }

      return data;
    } catch (error) {
      console.error('Error loading activities:', error);
      return {
        success: false,
        error: error.message,
        activities: []
      };
    }
  }

  async getChildrenSummary() {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/children/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load children summary');
      }

      return data;
    } catch (error) {
      console.error('Error loading children summary:', error);
      return {
        success: false,
        error: error.message,
        children: []
      };
    }
  }

  // ==================== SUPPORT TICKETS (PHASE 1) ====================
  
  async createSupportTicket(ticketData) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/support-tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create support ticket');
      }

      return data;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSupportTickets() {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/support-tickets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load support tickets');
      }

      return data;
    } catch (error) {
      console.error('Error loading support tickets:', error);
      return {
        success: false,
        error: error.message,
        tickets: []
      };
    }
  }

  async getSupportTicket(ticketId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/support-tickets/${ticketId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load ticket details');
      }

      return data;
    } catch (error) {
      console.error('Error loading ticket details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== TESTIMONIALS (PHASE 2) ====================
  
  /**
   * Create a new testimonial (used by WriteTestimonial.js)
   * @param {Object} formData - { rating, title, message }
   * @returns {Promise<Object>} - { success, testimonial?, error? }
   */
  async createTestimonial(formData) {
    try {
      const token = authService.getToken();
      
      if (!token) {
        console.error('❌ No authentication token');
        return { success: false, error: 'Not authenticated. Please log in.' };
      }

      console.log('📤 Parent submitting testimonial:', {
        title: formData.title,
        rating: formData.rating
      });

      const response = await fetch(`${API_BASE_URL}/testimonials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: formData.rating,
          title: formData.title,
          message: formData.message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Testimonial submission failed:', data);
        return {
          success: false,
          error: data.error || 'Failed to submit testimonial'
        };
      }

      console.log('✅ Testimonial submitted successfully:', data);
      return {
        success: true,
        testimonial: data.testimonial,
        message: data.message || 'Thank you for your feedback!'
      };

    } catch (error) {
      console.error('❌ Error submitting testimonial:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  async submitTestimonial(testimonialData) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/testimonials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testimonialData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('createTestimonial error:', error);
      return { success: false, error: 'Failed to submit testimonial' };
    }
  }


  async getTestimonials() {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/testimonials`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load testimonials');
      }

      return data;
    } catch (error) {
      console.error('Error loading testimonials:', error);
      return {
        success: false,
        error: error.message,
        testimonials: []
      };
    }
  }

  // ==================== FEEDBACK (PHASE 2) ====================
  
  async getFeedback() {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load feedback');
      }

      return data;
    } catch (error) {
      console.error('Error loading feedback:', error);
      return {
        success: false,
        error: error.message,
        feedback: []
      };
    }
  }

  async markFeedbackAsRead(feedbackId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark feedback as read');
      }

      return data;
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== PERFORMANCE (PHASE 2) ====================
  
  async getChildPerformance(studentId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/child/${studentId}/performance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load child performance');
      }

      return data;
    } catch (error) {
      console.error('Error loading child performance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== PROGRESS (PHASE 2) ====================
  
  async getChildProgress(studentId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/child/${studentId}/progress`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load child progress');
      }

      return data;
    } catch (error) {
      console.error('Error loading child progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== SKILL MATRIX (NEW - PHASE 2.5) ====================
  
  /**
   * Get child's math skill matrix (Addition, Subtraction, Multiplication, Division)
   * @param {string} studentId - The student's ID
   * @returns {Promise} API response with skills data
   */
  async getChildSkills(studentId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/child/${studentId}/skills`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load child skills');
      }

      return data;
    } catch (error) {
      console.error('Error loading child skills:', error);
      return {
        success: false,
        error: error.message,
        skills: []
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getGradeColor(grade) {
    const gradeColors = {
      'A': '#10b981',
      'B': '#3b82f6',
      'C': '#f59e0b',
      'D': '#ef4444',
      'F': '#991b1b',
      'N/A': '#6b7280'
    };
    return gradeColors[grade] || gradeColors['N/A'];
  }

  getProgressEmoji(progress) {
    const emojis = {
      'improving': '📈',
      'stable': '➡️',
      'declining': '📉'
    };
    return emojis[progress] || '➡️';
  }

  getSentimentEmoji(sentiment) {
    const emojis = {
      'positive': '😊',
      'neutral': '😐',
      'concern': '😟'
    };
    return emojis[sentiment] || '😐';
  }

  getSentimentColor(sentiment) {
    const colors = {
      'positive': '#10b981',
      'neutral': '#3b82f6',
      'concern': '#f59e0b'
    };
    return colors[sentiment] || '#6b7280';
  }

  // Skill matrix utility methods
  getSkillColor(level, maxLevel) {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#3b82f6';
    if (percentage >= 20) return '#a855f7';
    return '#ef4444';
  }

  getSkillIcon(skillName) {
    const name = (skillName || '').toLowerCase();
    if (name.includes('addition')) return '➕';
    if (name.includes('subtraction')) return '➖';
    if (name.includes('multiplication')) return '✖️';
    if (name.includes('division')) return '➗';
    return '📊';
  }

  getSkillLevel(level) {
    if (level >= 5) return { label: '🏆 Master', color: '#10b981' };
    if (level >= 4) return { label: '⭐ Advanced', color: '#f59e0b' };
    if (level >= 3) return { label: '📈 Intermediate', color: '#3b82f6' };
    if (level >= 2) return { label: '🌟 Beginner', color: '#a855f7' };
    if (level >= 1) return { label: '🌱 Learning', color: '#8b5cf6' };
    return { label: '✨ Novice', color: '#ef4444' };
  }
}

export default new ParentService();
