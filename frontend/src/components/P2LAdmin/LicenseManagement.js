// License Management Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLicenses, createLicense, updateLicense, deleteLicense } from '../../services/p2lAdminService';
import './LicenseManagement.css';

function LicenseManagement() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [formData, setFormData] = useState({
    type: 'starter',
    organization_name: '',
    teacher_limit: '',
    student_limit: '',
    price: '',
    start_date: '',
    end_date: '',
    is_active: true,
    notes: ''
  });

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const data = await getLicenses();
      setLicenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
      alert('Failed to load licenses: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.organization_name || !formData.teacher_limit || !formData.student_limit || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const licenseData = {
        type: formData.type,
        organization_name: formData.organization_name,
        teacher_limit: parseInt(formData.teacher_limit),
        student_limit: parseInt(formData.student_limit),
        price: parseFloat(formData.price),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        is_active: formData.is_active,
        notes: formData.notes
      };

      if (editingLicense) {
        await updateLicense(editingLicense._id, licenseData);
        alert('License updated successfully!');
      } else {
        await createLicense(licenseData);
        alert('License created successfully!');
      }

      resetForm();
      fetchLicenses();
    } catch (error) {
      console.error('Failed to save license:', error);
      alert('Failed to save license: ' + error.message);
    }
  };

  const handleEdit = (license) => {
    setEditingLicense(license);
    setFormData({
      type: license.type,
      organization_name: license.organization_name,
      teacher_limit: license.teacher_limit,
      student_limit: license.student_limit,
      price: license.price,
      start_date: license.start_date ? new Date(license.start_date).toISOString().split('T')[0] : '',
      end_date: license.end_date ? new Date(license.end_date).toISOString().split('T')[0] : '',
      is_active: license.is_active,
      notes: license.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this license?')) {
      return;
    }

    try {
      await deleteLicense(id);
      alert('License deleted successfully!');
      fetchLicenses();
    } catch (error) {
      console.error('Failed to delete license:', error);
      alert('Failed to delete license: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'starter',
      organization_name: '',
      teacher_limit: '',
      student_limit: '',
      price: '',
      start_date: '',
      end_date: '',
      is_active: true,
      notes: ''
    });
    setEditingLicense(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="license-management loading">Loading licenses...</div>;
  }

  return (
    <div className="license-management">
      <div className="header">
        <h2>License Management</h2>
        <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
      </div>

      <div className="controls">
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Create New License'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingLicense ? 'Edit License' : 'Create New License'}</h3>
          <form onSubmit={handleSubmit} className="license-form">
            <div className="form-row">
              <div className="form-group">
                <label>License Type *</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="form-group">
                <label>Organization Name *</label>
                <input
                  type="text"
                  name="organization_name"
                  value={formData.organization_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter organization name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Teacher Limit *</label>
                <input
                  type="number"
                  name="teacher_limit"
                  value={formData.teacher_limit}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="e.g., 50"
                />
              </div>

              <div className="form-group">
                <label>Student Limit *</label>
                <input
                  type="number"
                  name="student_limit"
                  value={formData.student_limit}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="e.g., 500"
                />
              </div>

              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g., 2500.00"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Additional notes about this license..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingLicense ? 'Update License' : 'Create License'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="licenses-list">
        <h3>Existing Licenses ({licenses.length})</h3>
        {licenses.length === 0 ? (
          <p className="no-data">No licenses found. Create one to get started!</p>
        ) : (
          <div className="table-container">
            <table className="licenses-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Organization</th>
                  <th>Limits (T/S)</th>
                  <th>Price</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr key={license._id}>
                    <td>
                      <span className={`badge badge-${license.type}`}>
                        {license.type.charAt(0).toUpperCase() + license.type.slice(1)}
                      </span>
                    </td>
                    <td>{license.organization_name}</td>
                    <td>{license.teacher_limit} / {license.student_limit}</td>
                    <td>${license.price.toFixed(2)}</td>
                    <td>{formatDate(license.start_date)}</td>
                    <td>{formatDate(license.end_date)}</td>
                    <td>
                      <span className={`status ${license.is_active ? 'active' : 'inactive'}`}>
                        {license.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEdit(license)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(license._id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LicenseManagement;
