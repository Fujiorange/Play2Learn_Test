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

      // NOTE: Backend file you shared uses /quiz-results
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
  async getLeaderboard() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/mongo/student/leaderboard`, {
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

      const response = await fetch(`${API_URL}/mongo/student/support-tickets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ticketData,
          student_email: user.email,
          student_name: user.name,
        }),
      });

      const json = await response.json();
      if (!response.ok) return json;
      return json;
    } catch (error) {
      console.error('createSupportTicket error:', error);
      return { success: false, error: 'Failed to create support ticket' };
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

  // ==================== TESTIMONIALS ====================
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
