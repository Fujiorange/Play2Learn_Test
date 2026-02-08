// Landing Page Manager Component
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  getLandingPage, 
  saveLandingPage,
  getTestimonials,
  updateTestimonial,
  deleteTestimonial,
  getLandingPageStatistics
} from '../../services/p2lAdminService';
import './LandingPageManager.css';

function LandingPageManager() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'preview'
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [testimonialError, setTestimonialError] = useState('');
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false); // Track if testimonials have been loaded
  const [testimonialFilters, setTestimonialFilters] = useState({
    minRating: '',
    sentiment: '',
    userRole: ''
  });
  const [statistics, setStatistics] = useState({
    schools: 0,
    students: 0,
    teachers: 0,
    updatedAt: null,
    loading: true
  });
  const [formData, setFormData] = useState({
    type: 'hero',
    title: '',
    content: '',
    image_url: '',
    order: 0,
    is_visible: true,
    custom_data: {}
  });

  useEffect(() => {
    fetchLandingPage();
  }, []);

  const fetchLandingPage = async () => {
    try {
      const response = await getLandingPage();
      setBlocks(response.blocks || []);
    } catch (error) {
      console.error('Failed to fetch landing page:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestimonials = useCallback(async () => {
    setLoadingTestimonials(true);
    setTestimonialError('');
    try {
      const response = await getTestimonials(testimonialFilters);
      if (response.success) {
        setTestimonials(response.testimonials || []);
        setTestimonialsLoaded(true); // Mark as loaded
      } else {
        setTestimonialError(response.error || 'Failed to load testimonials');
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
      setTestimonialError('Failed to load testimonials. Please try again.');
    } finally {
      setLoadingTestimonials(false);
    }
  }, [testimonialFilters]);

  const handleTestimonialToggleLanding = async (id, displayOnLanding) => {
    try {
      const result = await updateTestimonial(id, { display_on_landing: displayOnLanding });
      if (result.success) {
        fetchTestimonials(); // Refresh list
      } else {
        alert(result.error || 'Failed to update testimonial');
      }
    } catch (error) {
      console.error('Failed to update testimonial:', error);
      alert('Failed to update testimonial. Please try again.');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await deleteTestimonial(id);
      if (result.success) {
        alert('Testimonial deleted successfully!');
        fetchTestimonials(); // Refresh list
      } else {
        alert(result.error || 'Failed to delete testimonial');
      }
    } catch (error) {
      console.error('Failed to delete testimonial:', error);
      alert('Failed to delete testimonial. Please try again.');
    }
  };

  // Auto-fetch testimonials when filters change (only after initial load)
  useEffect(() => {
    // Only auto-fetch if testimonials have been loaded at least once
    // This prevents unnecessary API calls on component mount
    if (testimonialsLoaded) {
      fetchTestimonials();
    }
  }, [testimonialFilters, testimonialsLoaded, fetchTestimonials]);

  const fetchStatistics = async () => {
    try {
      setStatistics(prev => ({ ...prev, loading: true }));
      const response = await getLandingPageStatistics();
      if (response.success) {
        setStatistics({
          schools: response.schools || 0,
          students: response.students || 0,
          teachers: response.teachers || 0,
          updatedAt: response.updatedAt,
          loading: false
        });
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setStatistics(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch statistics on mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleCustomDataChange = (field, value) => {
    setFormData({
      ...formData,
      custom_data: {
        ...formData.custom_data,
        [field]: value
      }
    });
  };

  const handleArrayItemChange = (arrayName, index, field, value) => {
    const array = [...(formData.custom_data[arrayName] || [])];
    array[index] = {
      ...array[index],
      [field]: value
    };
    handleCustomDataChange(arrayName, array);
  };

  const addArrayItem = (arrayName, defaultItem) => {
    const array = [...(formData.custom_data[arrayName] || []), defaultItem];
    handleCustomDataChange(arrayName, array);
  };

  const removeArrayItem = (arrayName, index) => {
    const array = (formData.custom_data[arrayName] || []).filter((_, i) => i !== index);
    handleCustomDataChange(arrayName, array);
  };

  const handleAddBlock = () => {
    setEditingIndex(null);
    setFormData({
      type: 'hero',
      title: '',
      content: '',
      image_url: '',
      order: blocks.length,
      is_visible: true,
      custom_data: {}
    });
    setShowForm(true);
  };

  const handleEditBlock = (index) => {
    setEditingIndex(index);
    setFormData(blocks[index]);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let newBlocks = [...blocks];
    
    if (editingIndex !== null) {
      newBlocks[editingIndex] = formData;
    } else {
      newBlocks.push(formData);
    }
    
    setBlocks(newBlocks);
    setShowForm(false);
  };

  const handleDeleteBlock = (index) => {
    if (!window.confirm('Are you sure you want to delete this block?')) {
      return;
    }
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    try {
      await saveLandingPage(blocks);
      alert('Landing page saved successfully!');
    } catch (error) {
      console.error('Failed to save landing page:', error);
      alert(error.message || 'Failed to save landing page');
    }
  };

  const moveBlock = (index, direction) => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    newBlocks.forEach((block, i) => block.order = i);
    setBlocks(newBlocks);
  };

  // Render type-specific form fields
  const renderTypeSpecificFields = () => {
    const type = formData.type;
    const customData = formData.custom_data || {};

    switch (type) {
      case 'hero':
        return (
          <>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Revolutionizing Education Through Adaptive Learning"
                required
              />
            </div>
            <div className="form-group">
              <label>Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="3"
                placeholder="Personalized learning paths powered by AI..."
                required
              />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/hero-image.jpg"
              />
            </div>
          </>
        );

      case 'features':
        const features = customData.features || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Platform Features"
              />
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Features List</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('features', { icon: '🎯', title: '', description: '' })}
                  className="btn-add-item"
                >
                  + Add Feature
                </button>
              </div>
              {features.map((feature, index) => (
                <div key={index} className="array-item">
                  <div className="item-header">
                    <h5>Feature {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('features', index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Icon (emoji)</label>
                    <input
                      type="text"
                      value={feature.icon || ''}
                      onChange={(e) => handleArrayItemChange('features', index, 'icon', e.target.value)}
                      placeholder="🎯"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={feature.title || ''}
                      onChange={(e) => handleArrayItemChange('features', index, 'title', e.target.value)}
                      placeholder="Adaptive Learning Paths"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={feature.description || ''}
                      onChange={(e) => handleArrayItemChange('features', index, 'description', e.target.value)}
                      rows="2"
                      placeholder="AI-powered personalized learning journeys..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'about':
        const goals = customData.goals || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="About Play2Learn"
              />
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div className="form-group">
                <label>Mission 🎯</label>
                <textarea
                  value={customData.mission || ''}
                  onChange={(e) => handleCustomDataChange('mission', e.target.value)}
                  rows="3"
                  placeholder="To transform education by providing..."
                />
              </div>
              <div className="form-group">
                <label>Vision 👁️</label>
                <textarea
                  value={customData.vision || ''}
                  onChange={(e) => handleCustomDataChange('vision', e.target.value)}
                  rows="3"
                  placeholder="A world where every learner achieves..."
                />
              </div>
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Goals 🎯</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('goals', '')}
                  className="btn-add-item"
                >
                  + Add Goal
                </button>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '12px' 
              }}>
                {goals.map((goal, index) => (
                  <div key={index} className="array-item-simple">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        const newGoals = [...goals];
                        newGoals[index] = e.target.value;
                        handleCustomDataChange('goals', newGoals);
                      }}
                      placeholder="Increase student engagement by 70%..."
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('goals', index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Statistics (Automated) 📊</h4>
                <button
                  type="button"
                  onClick={fetchStatistics}
                  className="btn-add-item"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  🔄 Refresh Stats
                </button>
              </div>
              <div style={{ 
                padding: '20px', 
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '2px solid #3b82f6'
              }}>
                {statistics.loading ? (
                  <p style={{ textAlign: 'center', color: '#666' }}>Loading statistics...</p>
                ) : (
                  <>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ 
                        padding: '16px', 
                        background: 'white', 
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: '1px solid #bfdbfe'
                      }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                          {statistics.schools}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                          Schools
                        </div>
                      </div>
                      <div style={{ 
                        padding: '16px', 
                        background: 'white', 
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: '1px solid #bfdbfe'
                      }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                          {statistics.students}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                          Students
                        </div>
                      </div>
                      <div style={{ 
                        padding: '16px', 
                        background: 'white', 
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: '1px solid #bfdbfe'
                      }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                          {statistics.teachers}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                          Teachers
                        </div>
                      </div>
                    </div>
                    <p style={{ 
                      textAlign: 'center', 
                      fontSize: '16px', 
                      margin: '12px 0',
                      color: '#334155'
                    }}>
                      <strong>{statistics.schools} schools</strong>, <strong>{statistics.students} students</strong>, 
                      and <strong>{statistics.teachers} teachers</strong> are using this website
                    </p>
                    {statistics.updatedAt && (
                      <p style={{ 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        color: '#64748b',
                        marginTop: '8px'
                      }}>
                        Last updated: {new Date(statistics.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </>
                )}
              </div>
              <p style={{ 
                fontSize: '13px', 
                color: '#64748b', 
                marginTop: '12px',
                fontStyle: 'italic'
              }}>
                ℹ️ Statistics are automatically calculated from active schools, students, and teachers. 
                They are cached for 1 hour and update automatically.
              </p>
            </div>
          </>
        );

      case 'roadmap':
        const steps = customData.steps || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Learning Journey Roadmap"
              />
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Roadmap Steps</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('steps', { step: steps.length + 1, title: '', description: '', duration: '' })}
                  className="btn-add-item"
                >
                  + Add Step
                </button>
              </div>
              {steps.map((step, index) => (
                <div key={index} className="array-item">
                  <div className="item-header">
                    <h5>Step {step.step || index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('steps', index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Step Number</label>
                    <input
                      type="number"
                      value={step.step || ''}
                      onChange={(e) => handleArrayItemChange('steps', index, 'step', parseInt(e.target.value, 10) || 0)}
                      placeholder="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={step.title || ''}
                      onChange={(e) => handleArrayItemChange('steps', index, 'title', e.target.value)}
                      placeholder="Assessment & Onboarding"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={step.description || ''}
                      onChange={(e) => handleArrayItemChange('steps', index, 'description', e.target.value)}
                      rows="2"
                      placeholder="Initial student assessment to determine..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={step.duration || ''}
                      onChange={(e) => handleArrayItemChange('steps', index, 'duration', e.target.value)}
                      placeholder="1-2 weeks"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'testimonials':
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Success Stories"
              />
            </div>
            <div className="form-group">
              <label>Subtitle</label>
              <input
                type="text"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Hear what our users say about Play2Learn."
              />
            </div>
            
            <div className="form-section">
              <div className="section-header">
                <h4>📊 Testimonial Filter & Management</h4>
                <button
                  type="button"
                  onClick={fetchTestimonials}
                  className="btn-add-item"
                  style={{ background: '#3b82f6' }}
                >
                  🔍 Load Testimonials
                </button>
              </div>
              
              <div className="testimonial-filters" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px', 
                marginBottom: '20px',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div className="form-group">
                  <label>Minimum Rating</label>
                  <select
                    value={testimonialFilters.minRating}
                    onChange={(e) => setTestimonialFilters({ ...testimonialFilters, minRating: e.target.value })}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  >
                    <option value="">All Ratings</option>
                    <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
                    <option value="4">⭐⭐⭐⭐+ (4+ stars)</option>
                    <option value="3">⭐⭐⭐+ (3+ stars)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Sentiment</label>
                  <select
                    value={testimonialFilters.sentiment}
                    onChange={(e) => setTestimonialFilters({ ...testimonialFilters, sentiment: e.target.value })}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  >
                    <option value="">All Sentiments</option>
                    <option value="positive">😊 Positive</option>
                    <option value="neutral">😐 Neutral</option>
                    <option value="negative">😞 Negative</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>User Type</label>
                  <select
                    value={testimonialFilters.userRole}
                    onChange={(e) => setTestimonialFilters({ ...testimonialFilters, userRole: e.target.value })}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  >
                    <option value="">All Users</option>
                    <option value="Student">👨‍🎓 Students</option>
                    <option value="Parent">👨‍👩‍👧 Parents</option>
                    <option value="Teacher">👨‍🏫 Teachers</option>
                  </select>
                </div>
              </div>

              <div className="testimonials-list" style={{ 
                maxHeight: '500px', 
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px'
              }}>
                {testimonialError && (
                  <div style={{ 
                    padding: '16px', 
                    background: '#fee2e2', 
                    color: '#991b1b', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    border: '1px solid #f87171'
                  }}>
                    ⚠️ {testimonialError}
                  </div>
                )}
                {loadingTestimonials ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                    <p>Loading testimonials...</p>
                  </div>
                ) : testimonials.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <p>Click "Load Testimonials" to view and manage testimonials.</p>
                    {Object.values(testimonialFilters).some(v => v) && (
                      <p style={{ fontSize: '14px', marginTop: '8px' }}>
                        💡 Try adjusting your filters if no testimonials are found.
                      </p>
                    )}
                  </div>
                ) : (
                  testimonials.map((testimonial) => (
                    <div 
                      key={testimonial.id} 
                      className="testimonial-item"
                      style={{
                        padding: '16px',
                        marginBottom: '12px',
                        background: testimonial.display_on_landing ? '#f0fdf4' : '#fef3c7',
                        border: `2px solid ${testimonial.display_on_landing ? '#86efac' : '#fcd34d'}`,
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '16px' }}>{testimonial.student_name}</strong>
                          <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '12px', fontSize: '12px' }}>
                            {testimonial.user_role}
                          </span>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                            {'⭐'.repeat(testimonial.rating)} ({testimonial.rating}/5)
                            <span style={{ marginLeft: '12px', padding: '2px 8px', background: testimonial.sentiment_label === 'positive' ? '#d1fae5' : testimonial.sentiment_label === 'negative' ? '#fee2e2' : '#e5e7eb', borderRadius: '12px', fontSize: '11px' }}>
                              {testimonial.sentiment_label === 'positive' ? '😊' : testimonial.sentiment_label === 'negative' ? '😞' : '😐'} {testimonial.sentiment_label}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleTestimonialToggleLanding(testimonial.id, !testimonial.display_on_landing)}
                            style={{
                              padding: '6px 12px',
                              background: testimonial.display_on_landing ? '#f59e0b' : '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {testimonial.display_on_landing ? '🌐 On Landing' : '📄 Add to Landing'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTestimonial(testimonial.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Delete testimonial"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                      {testimonial.title && (
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{testimonial.title}</div>
                      )}
                      <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                        {testimonial.message}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                        {new Date(testimonial.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        );

      case 'pricing':
        const plans = customData.plans || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Subscription Plans"
              />
            </div>
            <div className="form-group">
              <label>Subtitle</label>
              <input
                type="text"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Flexible licensing options for schools of all sizes"
              />
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Pricing Plans</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('plans', { 
                    name: '', 
                    description: '', 
                    price: { yearly: 0, monthly: 0 },
                    teachers: 0,
                    students: 0,
                    features: [],
                    popular: false
                  })}
                  className="btn-add-item"
                >
                  + Add Plan
                </button>
              </div>
              {plans.map((plan, index) => (
                <div key={index} className="array-item">
                  <div className="item-header">
                    <h5>Plan {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('plans', index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Plan Name</label>
                    <input
                      type="text"
                      value={plan.name || ''}
                      onChange={(e) => handleArrayItemChange('plans', index, 'name', e.target.value)}
                      placeholder="Starter"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={plan.description || ''}
                      onChange={(e) => handleArrayItemChange('plans', index, 'description', e.target.value)}
                      placeholder="Perfect for small schools and institutions"
                    />
                  </div>
                  <div className="form-group-inline">
                    <div className="form-group">
                      <label>Monthly Price ($)</label>
                      <input
                        type="number"
                        value={plan.price?.monthly || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          const newPlan = { ...plan, price: { ...plan.price, monthly: isNaN(value) ? 0 : value } };
                          const newPlans = [...plans];
                          newPlans[index] = newPlan;
                          handleCustomDataChange('plans', newPlans);
                        }}
                        placeholder="250"
                      />
                    </div>
                    <div className="form-group">
                      <label>Yearly Price ($)</label>
                      <input
                        type="number"
                        value={plan.price?.yearly || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          const newPlan = { ...plan, price: { ...plan.price, yearly: isNaN(value) ? 0 : value } };
                          const newPlans = [...plans];
                          newPlans[index] = newPlan;
                          handleCustomDataChange('plans', newPlans);
                        }}
                        placeholder="2500"
                      />
                    </div>
                  </div>
                  <div className="form-group-inline">
                    <div className="form-group">
                      <label>Max Teachers</label>
                      <input
                        type="number"
                        value={plan.teachers || ''}
                        onChange={(e) => handleArrayItemChange('plans', index, 'teachers', parseInt(e.target.value, 10) || 0)}
                        placeholder="50"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Students</label>
                      <input
                        type="number"
                        value={plan.students || ''}
                        onChange={(e) => handleArrayItemChange('plans', index, 'students', parseInt(e.target.value, 10) || 0)}
                        placeholder="500"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={plan.popular || false}
                        onChange={(e) => handleArrayItemChange('plans', index, 'popular', e.target.checked)}
                      />
                      {' '}Mark as Popular
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Features (one per line)</label>
                    <textarea
                      value={(plan.features || []).join('\n')}
                      onChange={(e) => {
                        const features = e.target.value.split('\n').filter(f => f.trim());
                        handleArrayItemChange('plans', index, 'features', features);
                      }}
                      rows="4"
                      placeholder="Basic adaptive learning paths&#10;Standard analytics dashboard&#10;Email support"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'contact':
        const contactMethods = customData.contactMethods || [];
        const faqs = customData.faqs || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contact & Support"
              />
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Contact Methods</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('contactMethods', { icon: '📧', title: '', details: [] })}
                  className="btn-add-item"
                >
                  + Add Contact Method
                </button>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '16px' 
              }}>
                {contactMethods.map((method, index) => (
                  <div key={index} className="array-item">
                    <div className="item-header">
                      <h5>Contact Method {index + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('contactMethods', index)}
                        className="btn-remove-item"
                      >
                        ×
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Icon (emoji)</label>
                      <input
                        type="text"
                        value={method.icon || ''}
                        onChange={(e) => handleArrayItemChange('contactMethods', index, 'icon', e.target.value)}
                        placeholder="📧"
                      />
                    </div>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={method.title || ''}
                        onChange={(e) => handleArrayItemChange('contactMethods', index, 'title', e.target.value)}
                        placeholder="Email"
                      />
                    </div>
                    <div className="form-group">
                      <label>Details (one per line)</label>
                      <textarea
                        value={(method.details || []).join('\n')}
                        onChange={(e) => {
                          const details = e.target.value.split('\n').filter(d => d.trim());
                          handleArrayItemChange('contactMethods', index, 'details', details);
                        }}
                        rows="2"
                        placeholder="hello@Play2Learn.com&#10;support@Play2Learn.com"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>FAQs</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('faqs', { question: '', answer: '' })}
                  className="btn-add-item"
                >
                  + Add FAQ
                </button>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
                gap: '16px' 
              }}>
                {faqs.map((faq, index) => (
                  <div key={index} className="array-item">
                    <div className="item-header">
                      <h5>FAQ {index + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('faqs', index)}
                        className="btn-remove-item"
                      >
                        ×
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Question</label>
                      <input
                        type="text"
                        value={faq.question || ''}
                        onChange={(e) => handleArrayItemChange('faqs', index, 'question', e.target.value)}
                        placeholder="How long does implementation take?"
                      />
                    </div>
                    <div className="form-group">
                      <label>Answer</label>
                      <textarea
                        value={faq.answer || ''}
                        onChange={(e) => handleArrayItemChange('faqs', index, 'answer', e.target.value)}
                        rows="2"
                        placeholder="Typically 2-4 weeks depending on school size..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'footer':
        return (
          <>
            <div className="form-group">
              <label>Footer Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="3"
                placeholder="© 2024 Play2Learn. All rights reserved."
              />
            </div>
          </>
        );

      default:
        return (
          <>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="4"
              />
            </div>
          </>
        );
    }
  };

  // Render block preview based on type
  const renderBlockPreview = (block) => {
    if (!block.is_visible) return null;

    switch (block.type) {
      case 'hero':
        return (
          <section className="preview-hero">
            <div className="preview-container">
              <div className="preview-hero-content">
                <h1>{block.title || 'Hero Title'}</h1>
                <p>{block.content || 'Hero content will appear here'}</p>
                {block.image_url && <img src={block.image_url} alt={block.title || 'Hero section image'} />}
              </div>
            </div>
          </section>
        );
      
      case 'features':
        const previewFeatures = (block.custom_data && block.custom_data.features) || [];
        return (
          <section className="preview-features">
            <div className="preview-container">
              <h2>{block.title || 'Features'}</h2>
              {previewFeatures.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '24px' }}>
                  {previewFeatures.map((feature, index) => (
                    <div key={index} style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon || '🎯'}</div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>{feature.title}</h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>{feature.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="preview-features-content">
                  <p>{block.content || 'Features content will appear here'}</p>
                </div>
              )}
            </div>
          </section>
        );
      
      case 'about':
        const aboutData = block.custom_data || {};
        return (
          <section className="preview-about">
            <div className="preview-container">
              <h2>{block.title || 'About Us'}</h2>
              <div className="preview-about-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {aboutData.mission && (
                  <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>🎯 Mission</h3>
                    <p>{aboutData.mission}</p>
                  </div>
                )}
                {aboutData.vision && (
                  <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>👁️ Vision</h3>
                    <p>{aboutData.vision}</p>
                  </div>
                )}
              </div>
              {aboutData.goals && aboutData.goals.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Goals</h3>
                  <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', listStyle: 'none', padding: 0 }}>
                    {aboutData.goals.map((goal, index) => (
                      <li key={index} style={{ padding: '12px', background: '#fef3c7', borderRadius: '6px' }}>✓ {goal}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Automated Statistics Display */}
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '16px', textAlign: 'center' }}>Our Impact 📊</h3>
                {statistics.loading ? (
                  <p style={{ textAlign: 'center', color: '#666' }}>Loading statistics...</p>
                ) : (
                  <>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ textAlign: 'center', padding: '16px', background: '#dbeafe', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{statistics.schools}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>Schools</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '16px', background: '#d1fae5', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{statistics.students}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>Students</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{statistics.teachers}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>Teachers</div>
                      </div>
                    </div>
                    <p style={{ 
                      textAlign: 'center', 
                      fontSize: '18px', 
                      color: '#334155',
                      fontWeight: '500'
                    }}>
                      <strong>{statistics.schools} schools</strong>, <strong>{statistics.students} students</strong>, 
                      and <strong>{statistics.teachers} teachers</strong> are using this website
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      
      case 'testimonials':
        return (
          <section className="preview-testimonials">
            <div className="preview-container">
              <h2>{block.title || 'Testimonials'}</h2>
              <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px' }}>{block.content}</p>
              <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ color: '#6b7280' }}>
                  💡 Testimonials are managed dynamically from student and parent submissions.
                  <br/>Use the filter system above to display testimonials on the landing page.
                </p>
              </div>
            </div>
          </section>
        );
      
      case 'pricing':
        const previewPlans = (block.custom_data && block.custom_data.plans) || [];
        return (
          <section className="preview-pricing">
            <div className="preview-container">
              <h2>{block.title || 'Pricing'}</h2>
              {previewPlans.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
                  {previewPlans.map((plan, index) => (
                    <div key={index} style={{ 
                      padding: '32px 24px', 
                      background: plan.popular ? '#eff6ff' : '#f9fafb', 
                      borderRadius: '12px',
                      border: plan.popular ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      position: 'relative'
                    }}>
                      {plan.popular && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '-12px', 
                          left: '50%', 
                          transform: 'translateX(-50%)', 
                          background: '#3b82f6', 
                          color: 'white', 
                          padding: '4px 16px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Most Popular
                        </div>
                      )}
                      <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>{plan.name}</h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>{plan.description}</p>
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '36px', fontWeight: '800', color: '#111827' }}>${plan.price?.monthly || 0}</span>
                        <span style={{ fontSize: '16px', color: '#6b7280' }}>/month</span>
                        {plan.price?.yearly && (() => {
                          const savings = plan.price.monthly * 12 - plan.price.yearly;
                          return (
                            <div style={{ fontSize: '14px', color: '#059669', marginTop: '4px' }}>
                              {savings > 0 ? (
                                <>or ${plan.price.yearly}/year (save ${savings.toFixed(0)})</>
                              ) : (
                                <>or ${plan.price.yearly}/year</>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div style={{ padding: '12px', background: 'white', borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '14px', color: '#374151' }}>Up to {plan.teachers} teachers</div>
                        <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>Up to {plan.students} students</div>
                      </div>
                      {plan.features && plan.features.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {plan.features.map((feature, fIdx) => (
                            <li key={fIdx} style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', paddingLeft: '24px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#10b981' }}>✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="preview-pricing-content">
                  <p>{block.content || 'Pricing information will appear here'}</p>
                </div>
              )}
            </div>
          </section>
        );
      
      case 'roadmap':
        const roadmapSteps = (block.custom_data && block.custom_data.steps) || [];
        return (
          <section className="preview-roadmap">
            <div className="preview-container">
              <h2>{block.title || 'Roadmap'}</h2>
              {roadmapSteps.length > 0 ? (
                <div style={{ marginTop: '32px', position: 'relative', paddingLeft: '40px' }}>
                  {roadmapSteps.map((step, index) => (
                    <div key={index} style={{ 
                      marginBottom: '32px', 
                      position: 'relative',
                      paddingLeft: '40px',
                      borderLeft: index < roadmapSteps.length - 1 ? '2px solid #e5e7eb' : 'none'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        left: '-20px', 
                        top: '0',
                        width: '40px', 
                        height: '40px', 
                        background: '#3b82f6', 
                        color: 'white', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '16px',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {step.step || index + 1}
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>{step.title}</h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>{step.description}</p>
                      {step.duration && (
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '4px 12px', 
                          background: '#dbeafe', 
                          color: '#1e40af', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          ⏱️ {step.duration}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '24px' }}>
                  {block.content || 'Roadmap steps will appear here'}
                </p>
              )}
            </div>
          </section>
        );
      
      case 'contact':
        const contactData = block.custom_data || {};
        return (
          <section className="preview-contact">
            <div className="preview-container">
              <h2>{block.title || 'Contact Us'}</h2>
              {contactData.contactMethods && contactData.contactMethods.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  {contactData.contactMethods.map((method, index) => (
                    <div key={index} style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>{method.icon}</div>
                      <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>{method.title}</h3>
                      {method.details && method.details.map((detail, idx) => (
                        <div key={idx} style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{detail}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {contactData.faqs && contactData.faqs.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '24px', marginBottom: '16px', textAlign: 'center' }}>Frequently Asked Questions</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
                    {contactData.faqs.map((faq, index) => (
                      <div key={index} style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1e40af' }}>Q: {faq.question}</h4>
                        <p style={{ fontSize: '14px', color: '#374151' }}>A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      
      case 'footer':
        return (
          <footer className="preview-footer">
            <div className="preview-container">
              <p>{block.content || 'Footer content will appear here'}</p>
            </div>
          </footer>
        );
      
      default:
        return (
          <section className="preview-default">
            <div className="preview-container">
              <h2>{block.title || 'Content Block'}</h2>
              <p>{block.content || 'Content will appear here'}</p>
            </div>
          </section>
        );
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="landing-page-manager">
      <header className="page-header">
        <div>
          <h1>Landing Page Manager</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button 
              onClick={() => setViewMode('edit')} 
              className={viewMode === 'edit' ? 'active' : ''}
            >
              ✏️ Edit Mode
            </button>
            <button 
              onClick={() => setViewMode('preview')} 
              className={viewMode === 'preview' ? 'active' : ''}
            >
              👁️ Preview
            </button>
          </div>
          <button onClick={handleAddBlock} className="btn-primary">
            + Add Block
          </button>
          <button onClick={handleSave} className="btn-save">
            💾 Save Changes
          </button>
        </div>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingIndex !== null ? 'Edit Block' : 'Add New Block'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Block Type *</label>
                <select name="type" value={formData.type} onChange={handleInputChange} required>
                  <option value="hero">Hero</option>
                  <option value="features">Features</option>
                  <option value="about">About</option>
                  <option value="roadmap">Roadmap</option>
                  <option value="testimonials">Testimonials</option>
                  <option value="pricing">Pricing</option>
                  <option value="contact">Contact</option>
                  <option value="footer">Footer</option>
                </select>
              </div>

              {renderTypeSpecificFields()}

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_visible"
                    checked={formData.is_visible}
                    onChange={handleInputChange}
                  />
                  {' '}Visible
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingIndex !== null ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'preview' ? (
        <div className="landing-preview">
          <div className="preview-notice">
            <p>📋 Preview Mode - This is how your landing page will look to visitors</p>
          </div>
          {blocks.length === 0 ? (
            <div className="preview-empty">
              <p>No blocks to preview. Add some blocks to see the preview!</p>
            </div>
          ) : (
            <div className="preview-content">
              {[...blocks]
                .sort((a, b) => a.order - b.order)
                .map((block, index) => (
                  <div key={index}>
                    {renderBlockPreview(block)}
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="blocks-list">
          {blocks.length === 0 ? (
            <p className="no-data">No blocks added yet. Create your first block!</p>
          ) : (
            blocks.map((block, index) => (
              <div key={index} className={`block-card ${!block.is_visible ? 'hidden' : ''}`}>
                <div className="block-header">
                  <span className="block-type">{block.type.toUpperCase()}</span>
                  {!block.is_visible && <span className="hidden-badge">Hidden</span>}
                </div>
                
                <h3>{block.title || 'No Title'}</h3>
                <p className="block-content">{block.content?.substring(0, 100)}...</p>
                
                <div className="block-actions">
                  <button onClick={() => moveBlock(index, 'up')} disabled={index === 0}>
                    ↑
                  </button>
                  <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1}>
                    ↓
                  </button>
                  <button onClick={() => handleEditBlock(index)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteBlock(index)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default LandingPageManager;
