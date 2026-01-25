// P2LAdmin Service - API calls for platform admin

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

// Helper to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : '';
};

// Helper for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': getAuthToken(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

// ==================== SEED P2LADMIN ====================
export const seedP2LAdmin = async (credentials) => {
  return apiCall('/api/p2ladmin/seed', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

// ==================== REGISTER P2LADMIN ====================
/**
 * Register a new P2L Admin user
 * @param {Object} credentials - { email, password }
 * @returns {Promise} - Registration result
 */
export const registerP2LAdmin = async (credentials) => {
  try {
    const url = `${API_BASE_URL}/api/p2ladmin/register-admin`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    
    // Check HTTP status and return appropriate response
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`
      };
    }
    
    return data;
  } catch (error) {
    console.error('Registration API error:', error);
    return { 
      success: false, 
      error: 'Registration failed. Please try again.' 
    };
  }
};

// ==================== LANDING PAGE ====================
export const getLandingPage = async () => {
  return apiCall('/api/p2ladmin/landing');
};

export const saveLandingPage = async (blocks) => {
  return apiCall('/api/p2ladmin/landing', {
    method: 'POST',
    body: JSON.stringify({ blocks }),
  });
};

export const updateLandingPage = async (id, blocks) => {
  return apiCall(`/api/p2ladmin/landing/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ blocks }),
  });
};

export const deleteLandingPage = async () => {
  return apiCall('/api/p2ladmin/landing', {
    method: 'DELETE',
  });
};

// ==================== SCHOOLS ====================
export const getSchools = async () => {
  return apiCall('/api/p2ladmin/schools');
};

export const getSchool = async (id) => {
  return apiCall(`/api/p2ladmin/schools/${id}`);
};

export const createSchool = async (schoolData) => {
  return apiCall('/api/p2ladmin/schools', {
    method: 'POST',
    body: JSON.stringify(schoolData),
  });
};

export const updateSchool = async (id, schoolData) => {
  return apiCall(`/api/p2ladmin/schools/${id}`, {
    method: 'PUT',
    body: JSON.stringify(schoolData),
  });
};

export const deleteSchool = async (id) => {
  return apiCall(`/api/p2ladmin/schools/${id}`, {
    method: 'DELETE',
  });
};

// ==================== SCHOOL ADMINS ====================
export const getSchoolAdmins = async (schoolId) => {
  return apiCall(`/api/p2ladmin/schools/${schoolId}/admins`);
};

export const createSchoolAdmins = async (schoolId, admins) => {
  return apiCall('/api/p2ladmin/school-admins', {
    method: 'POST',
    body: JSON.stringify({ schoolId, admins }),
  });
};

// ==================== QUESTIONS ====================
export const getQuestions = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  return apiCall(`/api/p2ladmin/questions${queryString ? `?${queryString}` : ''}`);
};

export const getQuestion = async (id) => {
  return apiCall(`/api/p2ladmin/questions/${id}`);
};

export const createQuestion = async (questionData) => {
  return apiCall('/api/p2ladmin/questions', {
    method: 'POST',
    body: JSON.stringify(questionData),
  });
};

export const updateQuestion = async (id, questionData) => {
  return apiCall(`/api/p2ladmin/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(questionData),
  });
};

export const deleteQuestion = async (id) => {
  return apiCall(`/api/p2ladmin/questions/${id}`, {
    method: 'DELETE',
  });
};

export const uploadQuestionsCSV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/api/p2ladmin/questions/upload-csv`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': getAuthToken(),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'CSV upload failed');
  }

  return data;
};

export const getQuestionStats = async () => {
  return apiCall('/api/p2ladmin/questions-stats');
};

// ==================== QUIZZES ====================
export const getQuizzes = async () => {
  return apiCall('/api/p2ladmin/quizzes');
};

export const getQuiz = async (id) => {
  return apiCall(`/api/p2ladmin/quizzes/${id}`);
};

export const createQuiz = async (quizData) => {
  return apiCall('/api/p2ladmin/quizzes', {
    method: 'POST',
    body: JSON.stringify(quizData),
  });
};

export const updateQuiz = async (id, quizData) => {
  return apiCall(`/api/p2ladmin/quizzes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(quizData),
  });
};

export const deleteQuiz = async (id) => {
  return apiCall(`/api/p2ladmin/quizzes/${id}`, {
    method: 'DELETE',
  });
};

export const runAdaptiveQuiz = async (quizData) => {
  return apiCall('/api/p2ladmin/quizzes/run', {
    method: 'POST',
    body: JSON.stringify(quizData),
  });
};

// ==================== HEALTH CHECK ====================
export const getHealthStatus = async () => {
  return apiCall('/api/p2ladmin/health');
};

export default {
  seedP2LAdmin,
  registerP2LAdmin,
  getLandingPage,
  saveLandingPage,
  updateLandingPage,
  deleteLandingPage,
  getSchools,
  getSchool,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolAdmins,
  createSchoolAdmins,
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  uploadQuestionsCSV,
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  runAdaptiveQuiz,
  getHealthStatus,
};
