// src/services/parentService.js
// Parent Service for MongoDB Operations

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`);

console.log('🌐 Parent Service API_URL:', API_URL);

const parentService = {
  // ==================== TESTIMONIALS ====================
  async createTestimonial(testimonialData) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/mongo/parent/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testimonialData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('createTestimonial error:', error);
      return { success: false, error: 'Failed to submit testimonial' };
    }
  },

  async getTestimonials() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/mongo/parent/testimonials`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      return await response.json();
    } catch (error) {
      console.error('getTestimonials error:', error);
      return { success: false, error: 'Failed to load testimonials' };
    }
  }
};

export default parentService;
