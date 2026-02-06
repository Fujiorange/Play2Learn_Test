// src/services/teacherService.js
// Teacher Service for MongoDB Operations

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`);

console.log('🌐 Teacher Service API_URL:', API_URL);

// Helper to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// ==================== DASHBOARD ====================
export const getDashboard = async () => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/dashboard`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return { success: false, error: 'Failed to load dashboard' };
  }
};

// ==================== PROFILE ====================
export const getProfile = async () => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/profile`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { success: false, error: 'Failed to load profile' };
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/profile`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(profileData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
};

export const updateProfilePicture = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/mongo/teacher/profile/picture`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return { success: false, error: 'Failed to update profile picture' };
  }
};

// ==================== STUDENTS ====================
export const getStudents = async (className = '') => {
  try {
    const url = className 
      ? `${API_URL}/mongo/teacher/students?className=${encodeURIComponent(className)}`
      : `${API_URL}/mongo/teacher/students`;
    const response = await fetch(url, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching students:', error);
    return { success: false, error: 'Failed to load students' };
  }
};

export const getStudentDetails = async (studentId) => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/students/${studentId}`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching student details:', error);
    return { success: false, error: 'Failed to load student details' };
  }
};

export const getStudentQuizResults = async (studentId) => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/students/${studentId}/quiz-results`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return { success: false, error: 'Failed to load quiz results' };
  }
};

export const getStudentSkills = async (studentId) => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/students/${studentId}/skills`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching student skills:', error);
    return { success: false, error: 'Failed to load student skills' };
  }
};

// ==================== LEADERBOARD ====================
export const getLeaderboard = async () => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/leaderboard`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { success: false, error: 'Failed to load leaderboard' };
  }
};

// ==================== CLASS PERFORMANCE ====================
export const getClassPerformance = async (className = 'all') => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/class-performance?className=${encodeURIComponent(className)}`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching class performance:', error);
    return { success: false, error: 'Failed to load class performance' };
  }
};

// ==================== MY CLASSES ====================
export const getMyClasses = async () => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/my-classes`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching classes:', error);
    return { success: false, error: 'Failed to load classes' };
  }
};

// ==================== QUIZ MANAGEMENT ====================
export const getAvailableQuizzes = async () => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/available-quizzes`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching available quizzes:', error);
    return { success: false, error: 'Failed to load quizzes' };
  }
};

export const getMyLaunchedQuizzes = async () => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/my-launched-quizzes`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching launched quizzes:', error);
    return { success: false, error: 'Failed to load launched quizzes' };
  }
};

export const launchQuiz = async (quizData) => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/launch-quiz`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(quizData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error launching quiz:', error);
    return { success: false, error: 'Failed to launch quiz' };
  }
};

export const endQuiz = async (quizId) => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/end-quiz/${quizId}`, {
      method: 'PUT',
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error ending quiz:', error);
    return { success: false, error: 'Failed to end quiz' };
  }
};

// ==================== FEEDBACK ====================
export const getFeedback = async () => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/feedback`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return { success: false, error: 'Failed to load feedback' };
  }
};

export const createFeedback = async (feedbackData) => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/feedback`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(feedbackData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating feedback:', error);
    return { success: false, error: 'Failed to create feedback' };
  }
};

// ==================== SUPPORT TICKETS ====================
export const getSupportTickets = async () => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/support-tickets`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return { success: false, error: 'Failed to load tickets' };
  }
};

export const createSupportTicket = async (ticketData) => {
  try {
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

    console.log('📤 Sending teacher support ticket:', payload);

    const response = await fetch(`${API_URL}/mongo/teacher/support-tickets`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });

    const json = await response.json();

    if (!response.ok) {
      console.error('❌ Support ticket submission failed:');
      console.error('Response status:', response.status);
      console.error('Response JSON:', json);
      return {
        success: false,
        error: json?.error || json?.details || 'Failed to create support ticket'
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
};

// ==================== ANNOUNCEMENTS ====================
export const getAnnouncements = async () => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/announcements`, {
      headers: getAuthHeader()
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return { success: false, error: 'Failed to load announcements' };
  }
};

// ==================== TESTIMONIALS ====================
export const createTestimonial = async (testimonialData) => {
  try {
    const response = await fetch(`${API_URL}/mongo/teacher/testimonial`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(testimonialData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return { success: false, error: 'Failed to submit testimonial' };
  }
};

// Export all as default object too
const teacherService = {
  // Dashboard
  getDashboard,
  // Profile
  getProfile,
  updateProfile,
  updateProfilePicture,
  // Students
  getStudents,
  getStudentDetails,
  getStudentQuizResults,
  getStudentSkills,
  // Leaderboard & Performance
  getLeaderboard,
  getClassPerformance,
  getMyClasses,
  // Quiz
  getAvailableQuizzes,
  getMyLaunchedQuizzes,
  launchQuiz,
  endQuiz,
  // Feedback
  getFeedback,
  createFeedback,
  // Support
  getSupportTickets,
  createSupportTicket,
  // Announcements
  getAnnouncements,
  // Testimonials
  createTestimonial,
};

export default teacherService;
