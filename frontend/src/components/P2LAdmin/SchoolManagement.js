// School Management Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSchools, createSchool, updateSchool, deleteSchool } from '../../services/p2lAdminService';
import './SchoolManagement.css';

const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : `${window.location.origin}/api`);

function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'school',
    licenseId: '',
    contact: ''
  });

  useEffect(() => {
    fetchSchools();
    fetchLicenses();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await getSchools();
      setSchools(response.data || []);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      alert('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const fetchLicenses = async () => {
    setLoadingLicenses(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/licenses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.licenses) {
        setLicenses(data.licenses);
        // Set default license if not already set
        if (!formData.licenseId && data.licenses.length > 0) {
          setFormData(prev => ({ ...prev, licenseId: data.licenses[0]._id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
      alert('Failed to load licenses. Please create licenses first.');
    } finally {
      setLoadingLicenses(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate license is selected
      if (!formData.licenseId) {
        alert('Please select a license');
        return;
      }

      if (editingSchool) {
        await updateSchool(editingSchool._id, formData);
        alert('School updated successfully');
      } else {
        await createSchool(formData);
        alert('School created successfully');
      }
      setShowForm(false);
      setEditingSchool(null);
      setFormData({
        organization_name: '',
        organization_type: 'school',
        licenseId: licenses.length > 0 ? licenses[0]._id : '',
        contact: ''
      });
      fetchSchools();
    } catch (error) {
      console.error('Failed to save school:', error);
      alert(error.message || 'Failed to save school');
    }
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      organization_name: school.organization_name,
      organization_type: school.organization_type,
      licenseId: school.licenseId?._id || school.licenseId,
      contact: school.contact || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this school?')) {
      return;
    }
    try {
      await deleteSchool(id);
      alert('School deleted successfully');
      fetchSchools();
    } catch (error) {
      console.error('Failed to delete school:', error);
      alert(error.message || 'Failed to delete school');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingSchool(null);
    setFormData({
      organization_name: '',
      organization_type: 'school',
      licenseId: licenses.length > 0 ? licenses[0]._id : '',
      contact: ''
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="school-management">
      <header className="page-header">
        <div>
          <h1>School Management</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingSchool ? 'Edit School' : 'Create New School'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Organization Name *</label>
                <input
                  type="text"
                  name="organization_name"
                  value={formData.organization_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Organization Type</label>
                <select
                  name="organization_type"
                  value={formData.organization_type}
                  onChange={handleInputChange}
                >
                  <option value="school">School</option>
                  <option value="university">University</option>
                  <option value="training_center">Training Center</option>
                </select>
              </div>

              <div className="form-group">
                <label>License *</label>
                {loadingLicenses ? (
                  <div>Loading licenses...</div>
                ) : licenses.length > 0 ? (
                  <select
                    name="licenseId"
                    value={formData.licenseId}
                    onChange={handleInputChange}
                    required
                  >
                    {licenses.map(license => (
                      <option key={license._id} value={license._id}>
                        {license.name} ({license.type}) - {license.maxTeachers} Teachers, {license.maxStudents} Students, {license.maxClasses} Classes
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: '10px', background: '#fff3cd', borderRadius: '4px', color: '#856404' }}>
                    ⚠️ No licenses found. Please create licenses in License Management first.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Contact Info</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Email or phone"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit" disabled={loadingLicenses || licenses.length === 0}>
                  {editingSchool ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={cancelForm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="schools-grid">
        {schools.length === 0 ? (
          <p className="no-data">No schools found. Create your first school!</p>
        ) : (
          schools.map((school) => {
            const license = school.licenseId;
            return (
              <div key={school._id} className="school-card">
                <h3>{school.organization_name}</h3>
                <div className="school-details">
                  <p><strong>Type:</strong> {school.organization_type}</p>
                  {license ? (
                    <>
                      <p><strong>License:</strong> {license.name} ({license.type})</p>
                      <p><strong>Teachers:</strong> {school.current_teachers || 0} / {license.maxTeachers === -1 ? 'Unlimited' : license.maxTeachers}</p>
                      <p><strong>Students:</strong> {school.current_students || 0} / {license.maxStudents === -1 ? 'Unlimited' : license.maxStudents}</p>
                      <p><strong>Classes:</strong> {school.current_classes || 0} / {license.maxClasses === -1 ? 'Unlimited' : license.maxClasses}</p>
                      <p><strong>Price:</strong> ${license.priceMonthly}/month, ${license.priceYearly}/year</p>
                    </>
                  ) : (
                    <p style={{ color: 'red' }}>⚠️ No license assigned</p>
                  )}
                  {school.contact && <p><strong>Contact:</strong> {school.contact}</p>}
                </div>
                <div className="card-actions">
                  <button onClick={() => handleEdit(school)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(school._id)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SchoolManagement;
