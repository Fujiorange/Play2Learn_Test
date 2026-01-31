// School Admin Management Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSchools, createSchoolAdmins, getSchoolAdmins } from '../../services/p2lAdminService';
import './SchoolAdminManagement.css';

function SchoolAdminManagement() {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminForms, setAdminForms] = useState([{ name: '', email: '', contact: '' }]);
  const [createdAdmins, setCreatedAdmins] = useState([]);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchSchoolAdmins(selectedSchool);
    }
  }, [selectedSchool]);

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

  const fetchSchoolAdmins = async (schoolId) => {
    try {
      const response = await getSchoolAdmins(schoolId);
      setAdmins(response.data || []);
    } catch (error) {
      console.error('Failed to fetch school admins:', error);
    }
  };

  const handleAddAdminForm = () => {
    setAdminForms([...adminForms, { name: '', email: '', contact: '' }]);
  };

  const handleRemoveAdminForm = (index) => {
    const newForms = adminForms.filter((_, i) => i !== index);
    setAdminForms(newForms);
  };

  const handleAdminFormChange = (index, field, value) => {
    const newForms = [...adminForms];
    newForms[index][field] = value;
    setAdminForms(newForms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchool) {
      alert('Please select a school first');
      return;
    }

    try {
      const response = await createSchoolAdmins(selectedSchool, adminForms);
      setCreatedAdmins(response.created || []);
      setShowForm(false);
      setAdminForms([{ name: '', email: '', contact: '' }]);
      fetchSchoolAdmins(selectedSchool);
    } catch (error) {
      console.error('Failed to create school admins:', error);
      alert(error.message || 'Failed to create school admins');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setAdminForms([{ name: '', email: '', contact: '' }]);
    setCreatedAdmins([]);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="school-admin-management">
      <header className="page-header">
        <div>
          <h1>School Admin Management</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="btn-primary"
          disabled={!selectedSchool}
        >
          + Create Admin(s)
        </button>
      </header>

      <div className="content-container">
        <div className="school-selector">
          <h2>Select School</h2>
          <select 
            value={selectedSchool} 
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="school-select"
          >
            <option value="">-- Select a School --</option>
            {schools.map((school) => (
              <option key={school._id} value={school._id}>
                {school.organization_name} ({school.plan.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {selectedSchool && (
          <div className="admins-section">
            <h2>School Administrators</h2>
            {admins.length === 0 ? (
              <p className="no-data">No administrators found for this school.</p>
            ) : (
              <div className="admins-grid">
                {admins.map((admin) => (
                  <div key={admin._id} className="admin-card">
                    <h3>{admin.name}</h3>
                    <p><strong>Email:</strong> {admin.email}</p>
                    {admin.contact && <p><strong>Contact:</strong> {admin.contact}</p>}
                    <p><strong>Status:</strong> {admin.accountActive ? '✅ Active' : '❌ Inactive'}</p>
                    <p className="created-date">
                      Created: {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create School Admin(s)</h2>
            <p className="info-text">
              Temporary passwords will be auto-generated for each admin. 
              They will be required to change their password on first login.
            </p>

            <form onSubmit={handleSubmit}>
              {adminForms.map((form, index) => (
                <div key={index} className="admin-form-group">
                  <h3>Admin #{index + 1}</h3>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleAdminFormChange(index, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleAdminFormChange(index, 'email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact (Optional)</label>
                    <input
                      type="text"
                      value={form.contact}
                      onChange={(e) => handleAdminFormChange(index, 'contact', e.target.value)}
                    />
                  </div>

                  {adminForms.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveAdminForm(index)}
                      className="btn-remove"
                    >
                      Remove This Admin
                    </button>
                  )}
                </div>
              ))}

              <button 
                type="button" 
                onClick={handleAddAdminForm}
                className="btn-add-more"
              >
                + Add Another Admin
              </button>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  Create Admin(s)
                </button>
                <button type="button" onClick={cancelForm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>

            {createdAdmins.length > 0 && (
              <div className="created-admins-section">
                <h3>✅ Created Administrators</h3>
                <p className="warning-text">
                  ⚠️ Important: Save these temporary passwords! They won't be shown again.
                </p>
                {createdAdmins.map((admin, index) => (
                  <div key={index} className={`created-admin ${admin.success ? 'success' : 'error'}`}>
                    <p><strong>{admin.name}</strong></p>
                    <p>Email: {admin.email}</p>
                    {admin.success && admin.tempPassword && (
                      <p className="temp-password">
                        Password: <code>{admin.tempPassword}</code>
                      </p>
                    )}
                    {!admin.success && <p className="error-msg">{admin.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolAdminManagement;
