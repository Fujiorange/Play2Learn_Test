// src/services/studentService.js
// Student Service for MongoDB Operations - WITH QUIZ SYSTEM & Fully Dynamic

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`);

console.log('🌐 Student Service API_URL:', API_URL);

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return { json: null, text: '' };
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

/**
 * Normalizes quiz payloads so frontend pages can consistently use:
 * - quiz_id
 * - profile
 * - total_questions
 * - questions
 * - quizzes_remaining
 * - attemptsToday
 */
function normalizeQuizResponse(payload) {
  if (!payload || !payload.success) return payload;

  // Backend shape: { success:true, quiz:{ quiz_id, profile_level, quizzes_remaining, questions:[...] } }
  if (payload.quiz && typeof payload.quiz === 'object') {
    const q = payload.quiz;
    const total = Array.isArray(q.questions) ? q.questions.length : 15;

    return {
      ...payload,
      quiz_id: q.quiz_id ?? q._id ?? payload.quiz_id,
      profile: q.profile_level ?? q.profile ?? payload.profile ?? 1,
      total_questions: q.total_questions ?? payload.total_questions ?? total,
      questions: q.questions ?? payload.questions ?? [],
      quizzes_remaining: q.quizzes_remaining ?? payload.quizzes_remaining,
      // Your backend limit is 3/day. This derives "attempts today".
      attemptsToday:
        typeof q.quizzes_remaining === 'number'
          ? Math.max(0, 3 - q.quizzes_remaining)
          : payload.attemptsToday,
    };
  }

  // Backend placement shape: { success:true, quiz:{ quiz_id, questions:[...] } }
  // (same logic works above; this is just a fallback)
  if (!payload.quiz && payload.quiz_id && Array.isArray(payload.questions)) {
    return {
      ...payload,
      total_questions: payload.total_questions ?? payload.questions.length,
    };
  }

  return payload;
}

const studentService = {
  // ==================== PROFILE METHODS ====================
  async getProfile() {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return { success: false, error: 'Not authenticated' };
      return { success: true, user };
    } catch {
      return { success: false, error: 'Failed to load profile' };
    }
  },

  // ==================== PLACEMENT QUIZ ====================
  async generatePlacementQuiz() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(
        `${API_URL}/mongo/student/placement-quiz/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const { json, text } = await parseJsonSafe(response);

      if (!response.ok) {
        throw new Error(json?.error || text || 'Failed to generate placement quiz');
      }

      return normalizeQuizResponse(json);
    } catch (error) {
      console.error('generatePlacementQuiz error:', error);
      return { success: false, error: error.message || 'Failed to generate placement quiz' };
    }
  },

  async submitPlacementQuiz(quizId, answers) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(
        `${API_URL}/mongo/student/placement-quiz/submit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quiz_id: quizId, answers }),
        }
      );

      const { json, text } = await parseJsonSafe(response);

      if (!response.ok) {
        throw new Error(json?.error || text || 'Failed to submit placement quiz');
      }

      return json;
    } catch (error) {
      console.error('submitPlacementQuiz error:', error);
      return { success: false, error: error.message || 'Failed to submit placement quiz' };
    }
  },

  // ==================== REGULAR QUIZ ====================
  async generateQuiz() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/quiz/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const { json, text } = await parseJsonSafe(response);

      if (!response.ok) {
        throw new Error(json?.error || text || 'Failed to generate quiz');
      }

      return normalizeQuizResponse(json);
    } catch (error) {
      console.error('generateQuiz error:', error);
      return { success: false, error: error.message || 'Failed to generate quiz' };
    }
  },

  async submitQuiz(quizId, answers) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/quiz/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quiz_id: quizId, answers }),
      });

      const { json, text } = await parseJsonSafe(response);

      if (!response.ok) {
        throw new Error(json?.error || text || 'Failed to submit quiz');
      }

      return json;
    } catch (error) {
      console.error('submitQuiz error:', error);
      return { success: false, error: error.message || 'Failed to submit quiz' };
    }
  },

  // ==================== MATH PROFILE & QUIZ METHODS ====================
  async getMathProfile() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/math-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch math profile');
      return await response.json();
    } catch (error) {
      console.error('getMathProfile error:', error);
      return { success: false, error: 'Failed to load math profile' };
    }
  },

  async getMathSkills() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/math-skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch math skills');
      return await response.json();
    } catch (error) {
      console.error('getMathSkills error:', error);
      return { success: false, error: 'Failed to load math skills' };
    }
  },

  async getMathProgress() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/math-progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch math progress');
      return await response.json();
    } catch (error) {
      console.error('getMathProgress error:', error);
      return { success: false, error: 'Failed to load math progress' };
    }
  },

  async getMathQuizResults() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/quiz-results`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch quiz results');
      return await response.json();
    } catch (error) {
      console.error('getMathQuizResults error:', error);
      return { success: false, error: 'Failed to load quiz results' };
    }
  },

  async getMathQuizHistory() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/quiz-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch quiz history');
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
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard');

      const json = await response.json();

      // Compat: backend returns { dashboard: { totalPoints, completedQuizzes, currentProfile, gradeLevel } }
      // some UI expects { data: { points, quizzesTaken, level, gradeLevel } }
      if (json?.success && json?.dashboard && !json?.data) {
        json.data = {
          points: json.dashboard.totalPoints ?? 0,
          quizzesTaken: json.dashboard.completedQuizzes ?? 0,
          level: json.dashboard.currentProfile ?? 1,
          gradeLevel: json.dashboard.gradeLevel,
        };
      }

      return json;
    } catch (error) {
      console.error('getDashboard error:', error);
      return { success: false, error: 'Failed to load dashboard' };
    }
  },

  // ==================== LEADERBOARD ====================
  async getLeaderboard(schoolId, classId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      // Build query parameters
      const params = new URLSearchParams();
      if (schoolId) params.append('schoolId', schoolId);
      if (classId) params.append('class', classId);

      const queryString = params.toString();
      const url = queryString 
        ? `${API_URL}/mongo/student/leaderboard?${queryString}`
        : `${API_URL}/mongo/student/leaderboard`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch leaderboard');
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
      if (!token) return { success: false, error: 'Not authenticated' };

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return { success: false, error: 'User data not found' };

      // Get user ID - it could be id, _id, or userId
      const userId = user.id || user._id || user.userId;
      if (!userId) {
        console.error('❌ User ID not found in localStorage');
        return { success: false, error: 'User ID not found. Please log in again.' };
      }

      // Ensure required fields and proper field names
      const payload = {
        subject: ticketData.subject || '',
        category: ticketData.category || 'general',
        description: ticketData.description || '',
        message: ticketData.description || '',
        priority: ticketData.priority || 'normal',
        // Send both user_* and student_* fields for compatibility
        user_id: userId,
        user_name: user.name,
        user_email: user.email,
        student_name: user.name,
        student_email: user.email,
      };

      console.log('📤 Sending support ticket:', payload);

      const response = await fetch(`${API_URL}/mongo/student/support-tickets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const { json, text } = await parseJsonSafe(response);

      if (!response.ok) {
        console.error('❌ Support ticket submission failed:');
        console.error('Response status:', response.status);
        console.error('Response JSON:', json);
        console.error('Response text:', text);
        return {
          success: false,
          error: json?.error || json?.details || text || 'Failed to create support ticket'
        };
      }

      console.log('✅ Support ticket created successfully:', json);
      return {
        success: true,
        ticketId: json?.ticketId || json?.ticket_id || json?._id,
        message: json?.message || 'Support ticket created successfully!'
      };
    } catch (error) {
      console.error('❌ Error creating support ticket:', error);
      return { success: false, error: 'Network error. Please check your connection and try again.' };
    }
  },

  async getSupportTickets() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/support-tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch support tickets');
      return await response.json();
    } catch (error) {
      console.error('getSupportTickets error:', error);
      return { success: false, error: 'Failed to load support tickets' };
    }
  },

  async getSupportTicket(ticketId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/support-tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch support ticket');
      return await response.json();
    } catch (error) {
      console.error('getSupportTicket error:', error);
      return { success: false, error: 'Failed to load support ticket' };
    }
  },

  // ==================== TESTIMONIALS ====================
  
  /**
   * Create a new testimonial (called by WriteTestimonial.js)
   * @param {Object} formData - { title, rating, testimonial, displayName, allowPublic }
   * @returns {Promise<Object>} - { success, testimonial?, error? }
   */
  async createTestimonial(formData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token');
        return { success: false, error: 'Not authenticated. Please log in.' };
      }

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        console.error('❌ No user data found');
        return { success: false, error: 'User data not found' };
      }

      console.log('📤 Submitting testimonial:', {
        title: formData.title,
        rating: formData.rating,
        displayName: formData.displayName
      });

      const response = await fetch(`${API_URL}/mongo/student/testimonials`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          rating: formData.rating,
          testimonial: formData.testimonial, // Backend accepts both 'message' and 'testimonial'
          message: formData.testimonial,      // Send both for compatibility
          displayName: formData.displayName,
          student_name: formData.displayName,
          student_email: user.email,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        console.error('❌ Testimonial submission failed:', json);
        return {
          success: false,
          error: json.error || json.message || 'Failed to submit testimonial'
        };
      }

      console.log('✅ Testimonial submitted successfully:', json);
      return {
        success: true,
        testimonial: json.testimonial,
        message: json.message || 'Thank you for your feedback!'
      };

    } catch (error) {
      console.error('❌ Error submitting testimonial:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  },

  async submitTestimonial(testimonialData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return { success: false, error: 'User data not found' };

      const response = await fetch(`${API_URL}/mongo/student/testimonials`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testimonialData,
          student_email: user.email,
          student_name: user.name,
        }),
      });

      const json = await response.json();
      if (!response.ok) return json;
      return json;
    } catch (error) {
      console.error('submitTestimonial error:', error);
      return { success: false, error: 'Failed to submit testimonial' };
    }
  },

  async getTestimonials() {
    try {
      const response = await fetch(`${API_URL}/mongo/student/testimonials`);
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      return await response.json();
    } catch (error) {
      console.error('getTestimonials error:', error);
      return { success: false, error: 'Failed to load testimonials' };
    }
  },

  // ==================== REWARD SHOP METHODS ====================
  async getShopItems() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/shop`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch shop items');
      return await response.json();
    } catch (error) {
      console.error('getShopItems error:', error);
      return { success: false, error: 'Failed to load shop items' };
    }
  },

  async purchaseShopItem(itemId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/shop/${itemId}/purchase`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const json = await response.json();
      if (!response.ok) return json;
      return json;
    } catch (error) {
      console.error('purchaseShopItem error:', error);
      return { success: false, error: 'Failed to complete purchase' };
    }
  },

  async getPurchases() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/shop/purchases`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch purchases');
      return await response.json();
    } catch (error) {
      console.error('getPurchases error:', error);
      return { success: false, error: 'Failed to load purchases' };
    }
  },

  // ==================== BADGE METHODS ====================
  async getBadges() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/badges`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch badges');
      return await response.json();
    } catch (error) {
      console.error('getBadges error:', error);
      return { success: false, error: 'Failed to load badges' };
    }
  },

  async getBadgeProgress() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/badges/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch badge progress');
      return await response.json();
    } catch (error) {
      console.error('getBadgeProgress error:', error);
      return { success: false, error: 'Failed to load badge progress' };
    }
  },

  // ==================== ALIASES ====================
  getProgress() {
    return this.getMathProgress();
  },
  getResults() {
    return this.getMathQuizResults();
  },
  getResultHistory() {
    return this.getMathQuizHistory();
  },
  getSkills() {
    return this.getMathSkills();
  },
};

export default studentService;