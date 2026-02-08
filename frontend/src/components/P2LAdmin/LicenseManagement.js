// License Management Component for P2L Admin
import React, { useState, useEffect } from 'react';
import './LicenseManagement.css';

const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : `${window.location.origin}/api`);

function LicenseManagement() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    priceMonthly: 0,
    priceYearly: 0,
    maxTeachers: 1,
    maxStudents: 5,
    maxClasses: 1,
    description: ''
  });

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/licenses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setLicenses(data.licenses || []);
      } else {
        setError('Failed to load licenses');
      }
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
      setError('Failed to load licenses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const url = editingLicense 
        ? `${API_URL}/licenses/${editingLicense._id}`
        : `${API_URL}/licenses`;
      
      const response = await fetch(url, {
        method: editingLicense ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingLicense ? 'License updated successfully' : 'License created successfully');
        setShowForm(false);
        setEditingLicense(null);
        resetForm();
        fetchLicenses();
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Failed to save license:', error);
      setError('Failed to save license');
    }
  };

  const handleEdit = (license) => {
    setEditingLicense(license);
    setFormData({
      name: license.name,
      type: license.type,
      priceMonthly: license.priceMonthly,
      priceYearly: license.priceYearly,
      maxTeachers: license.maxTeachers,
      maxStudents: license.maxStudents,
      maxClasses: license.maxClasses,
      description: license.description
    });
    setShowForm(true);
  };

  const handleDelete = async (licenseId) => {
    if (!window.confirm('Are you sure you want to delete this license?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/licenses/${licenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('License deleted successfully');
        fetchLicenses();
      } else {
        setError(data.error || 'Failed to delete license');
      }
    } catch (error) {
      console.error('Failed to delete license:', error);
      setError('Failed to delete license');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      priceMonthly: 0,
      priceYearly: 0,
      maxTeachers: 1,
      maxStudents: 5,
      maxClasses: 1,
      description: ''
    });
  };

  const applyTemplate = (template) => {
    const templates = {
      free: {
        name: 'Free Trial',
        type: 'free',
        priceMonthly: 0,
        priceYearly: 0,
        maxTeachers: 1,
        maxStudents: 5,
        maxClasses: 1,
        description: '30-day free trial with basic features'
      },
      basic: {
        name: 'Basic Plan',
        type: 'paid',
        priceMonthly: 250,
        priceYearly: 2500,
        maxTeachers: 50,
        maxStudents: 500,
        maxClasses: 100,
        description: 'Perfect for small to medium schools'
      },
      professional: {
        name: 'Professional Plan',
        type: 'paid',
        priceMonthly: 500,
        priceYearly: 5000,
        maxTeachers: 100,
        maxStudents: 1000,
        maxClasses: 200,
        description: 'Ideal for growing educational institutions'
      },
      enterprise: {
        name: 'Enterprise Plan',
        type: 'paid',
        priceMonthly: 1000,
        priceYearly: 10000,
        maxTeachers: 250,
        maxStudents: 2500,
        maxClasses: 500,
        description: 'Unlimited features for large organizations'
      }
    };
    
    if (templates[template]) {
      setFormData(templates[template]);
      setSuccess(`${template.charAt(0).toUpperCase() + template.slice(1)} template applied`);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLicense(null);
    resetForm();
  };

  if (loading) {
    return <div className="license-management loading">Loading licenses...</div>;
  }

  return (
    <div className="license-management">
      <div className="license-header">
        <h2>License Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingLicense(null);
            resetForm();
          }}
        >
          + Create New License
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="license-form-container">
          <h3>{editingLicense ? 'Edit License' : 'Create New License'}</h3>
          
          {!editingLicense && (
            <div className="template-buttons">
              <p className="template-label">Quick Templates:</p>
              <div className="template-grid">
                <button 
                  type="button" 
                  className="btn btn-template"
                  onClick={() => applyTemplate('free')}
                >
                  🎁 Free Trial
                </button>
                <button 
                  type="button" 
                  className="btn btn-template"
                  onClick={() => applyTemplate('basic')}
                >
                  🚀 Basic Plan
                </button>
                <button 
                  type="button" 
                  className="btn btn-template"
                  onClick={() => applyTemplate('professional')}
                >
                  💼 Professional
                </button>
                <button 
                  type="button" 
                  className="btn btn-template"
                  onClick={() => applyTemplate('enterprise')}
                >
                  🏢 Enterprise
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="license-form">
            <div className="form-row">
              <div className="form-group">
                <label>License Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Professional"
                />
              </div>

              <div className="form-group">
                <label>License Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  disabled={editingLicense}
                  className="form-select"
                >
                  <option value="">Select a type...</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
                {editingLicense && (
                  <small className="help-text">Type cannot be changed after creation</small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Monthly Price ($)</label>
                <input
                  type="number"
                  name="priceMonthly"
                  value={formData.priceMonthly}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Yearly Price ($)</label>
                <input
                  type="number"
                  name="priceYearly"
                  value={formData.priceYearly}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Max Teachers</label>
                <input
                  type="number"
                  name="maxTeachers"
                  value={formData.maxTeachers}
                  onChange={handleInputChange}
                  min="-1"
                  placeholder="-1 for unlimited"
                />
                <small className="help-text">Use -1 for unlimited</small>
              </div>

              <div className="form-group">
                <label>Max Students</label>
                <input
                  type="number"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleInputChange}
                  min="-1"
                  placeholder="-1 for unlimited"
                />
                <small className="help-text">Use -1 for unlimited</small>
              </div>

              <div className="form-group">
                <label>Max Classes</label>
                <input
                  type="number"
                  name="maxClasses"
                  value={formData.maxClasses}
                  onChange={handleInputChange}
                  min="-1"
                  placeholder="-1 for unlimited"
                />
                <small className="help-text">Use -1 for unlimited</small>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Brief description of the license"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingLicense ? 'Update License' : 'Create License'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="license-list">
        <h3>Existing Licenses</h3>
        {licenses.length === 0 ? (
          <p className="no-data">No licenses found. Create one to get started.</p>
        ) : (
          <div className="license-cards">
            {licenses.map(license => (
              <div key={license._id} className="license-card">
                <div className="license-card-header">
                  <h4>{license.name}</h4>
                  <span className={`badge ${license.type === 'free' ? 'badge-free' : 'badge-paid'}`}>
                    {license.type === 'free' ? 'Free' : 'Paid'}
                  </span>
                </div>
                
                <div className="license-card-body">
                  <div className="license-info">
                    <span className="label">Type:</span>
                    <span className="value">{license.type}</span>
                  </div>
                  
                  <div className="license-pricing">
                    <div className="price-item">
                      <span className="price-label">Monthly:</span>
                      <span className="price-value">${license.priceMonthly.toFixed(2)}</span>
                    </div>
                    <div className="price-item">
                      <span className="price-label">Yearly:</span>
                      <span className="price-value">${license.priceYearly.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="license-limits">
                    <div className="limit-item">
                      <span className="limit-icon">👨‍🏫</span>
                      <span className="limit-text">
                        {license.maxTeachers === -1 ? 'Unlimited' : license.maxTeachers} Teachers
                      </span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-icon">👨‍🎓</span>
                      <span className="limit-text">
                        {license.maxStudents === -1 ? 'Unlimited' : license.maxStudents} Students
                      </span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-icon">🏫</span>
                      <span className="limit-text">
                        {license.maxClasses === -1 ? 'Unlimited' : license.maxClasses} Classes
                      </span>
                    </div>
                  </div>

                  {license.description && (
                    <div className="license-description">
                      <p>{license.description}</p>
                    </div>
                  )}
                </div>

                <div className="license-card-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(license)}
                  >
                    Edit
                  </button>
                  {license.type !== 'free' && (
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(license._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LicenseManagement;
