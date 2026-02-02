// School Admin Management Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSchools, createSchoolAdmins, getSchoolAdmins, updateSchoolAdmin, deleteSchoolAdmin, resetSchoolAdminPassword } from '../../services/p2lAdminService';
import './SchoolAdminManagement.css';

function SchoolAdminManagement() {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminForms, setAdminForms] = useState([{ name: '', email: '', contact: '' }]);
  const [createdAdmins, setCreatedAdmins] = useState([]);
  const [viewedPasswords, setViewedPasswords] = useState({});
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', contact: '', accountActive: true });
  // Store temp passwords for recently created admins (persists in session)
  const [tempPasswords, setTempPasswords] = useState({});

  useEffect(() => {
    fetchSchools();
    // Load temp passwords from session storage
    const stored = sessionStorage.getItem('schoolAdminTempPasswords');
    if (stored) {
      try {
        setTempPasswords(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored temp passwords:', e);
      }
    }
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
      
      // Store created admins with their temp passwords
      if (response.created && response.created.length > 0) {
        setCreatedAdmins(response.created);
        // Initialize viewedPasswords state for each created admin
        const initialViewed = {};
        const newTempPasswords = { ...tempPasswords };
        
        response.created.forEach(admin => {
          if (admin.id) {
            initialViewed[admin.id] = false;
            // Store temp password for this admin in session
            if (admin.tempPassword) {
              newTempPasswords[admin.id] = {
                password: admin.tempPassword,
                email: admin.email,
                name: admin.name,
                createdAt: new Date().toISOString()
              };
            }
          }
        });
        setViewedPasswords(initialViewed);
        setTempPasswords(newTempPasswords);
        
        // Persist to session storage
        sessionStorage.setItem('schoolAdminTempPasswords', JSON.stringify(newTempPasswords));
      }
      
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
    setViewedPasswords({});
  };
  
  const handleViewPassword = (adminId) => {
    // Mark this password as viewed (can only be viewed once)
    setViewedPasswords(prev => ({ ...prev, [adminId]: true }));
  };

  const handleViewTempPasswordFromList = (adminId) => {
    if (!tempPasswords[adminId]) {
      alert('Temporary password is no longer available. It may have been viewed previously or the browser session may have expired.');
      return;
    }
    
    const userConfirmed = window.confirm(
      `⚠️ Warning: This temporary password can only be viewed once!\n\n` +
      `Once you view it, make sure to save it securely. After viewing, ` +
      `it will be removed from the system.\n\nClick OK to view the password.`
    );
    
    if (userConfirmed) {
      const tempPasswordData = tempPasswords[adminId];
      alert(
        `Temporary Password for ${tempPasswordData.name}:\n\n` +
        `Email: ${tempPasswordData.email}\n` +
        `Password: ${tempPasswordData.password}\n\n` +
        `⚠️ Save this password now! It will be removed after closing this dialog.`
      );
      
      // Remove the temp password after viewing
      const newTempPasswords = { ...tempPasswords };
      delete newTempPasswords[adminId];
      setTempPasswords(newTempPasswords);
      sessionStorage.setItem('schoolAdminTempPasswords', JSON.stringify(newTempPasswords));
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setEditForm({
      name: admin.name || '',
      email: admin.email || '',
      contact: admin.contact || '',
      accountActive: admin.accountActive !== undefined ? admin.accountActive : true
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    try {
      await updateSchoolAdmin(editingAdmin._id, editForm);
      alert('Admin updated successfully');
      setEditingAdmin(null);
      fetchSchoolAdmins(selectedSchool);
    } catch (error) {
      console.error('Failed to update admin:', error);
      alert(error.message || 'Failed to update admin');
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm(`Are you sure you want to delete admin ${admin.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteSchoolAdmin(admin._id);
      alert('Admin deleted successfully');
      fetchSchoolAdmins(selectedSchool);
    } catch (error) {
      console.error('Failed to delete admin:', error);
      alert(error.message || 'Failed to delete admin');
    }
  };

  const handleResetPassword = async (admin) => {
    if (!window.confirm(`Are you sure you want to reset the password for ${admin.name}?\n\nA new temporary password will be generated and the admin will be required to change it on first login.`)) {
      return;
    }
    
    try {
      const response = await resetSchoolAdminPassword(admin._id);
      
      if (response.success) {
        // Store temp password for one-time viewing
        const newTempPasswords = {
          ...tempPasswords,
          [admin._id]: {
            password: response.tempPassword,
            email: response.email,
            name: response.name,
            createdAt: new Date().toISOString()
          }
        };
        setTempPasswords(newTempPasswords);
        sessionStorage.setItem('schoolAdminTempPasswords', JSON.stringify(newTempPasswords));
        
        alert(
          `Password reset successfully!\n\n` +
          `A new temporary password has been generated and sent to ${admin.email}.\n` +
          `You can view the temporary password once by clicking the "View Temp Password" button.`
        );
        
        // Refresh the admin list to show the updated status
        fetchSchoolAdmins(selectedSchool);
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert(error.message || 'Failed to reset password');
    }
  };

  const cancelEdit = () => {
    setEditingAdmin(null);
    setEditForm({ name: '', email: '', contact: '', accountActive: true });
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
                {admins.map((admin) => {
                  const hasTempPassword = tempPasswords[admin._id];
                  return (
                    <div key={admin._id} className={`admin-card ${hasTempPassword ? 'newly-created' : ''}`}>
                      <h3>{admin.name}</h3>
                      <p><strong>Email:</strong> {admin.email}</p>
                      {admin.contact && <p><strong>Contact:</strong> {admin.contact}</p>}
                      <p><strong>Status:</strong> {admin.accountActive ? '✅ Active' : '❌ Inactive'}</p>
                      <p className="created-date">
                        Created: {new Date(admin.createdAt).toLocaleDateString()}
                      </p>
                      {hasTempPassword && (
                        <div className="temp-password-notice">
                          <p className="notice-text">⚠️ Temporary password available</p>
                        </div>
                      )}
                      <div className="admin-card-actions">
                        {hasTempPassword && (
                          <button 
                            onClick={() => handleViewTempPasswordFromList(admin._id)}
                            className="btn-view-temp-password"
                            title="View temporary password (one-time only)"
                          >
                            👁️ View Temp Password
                          </button>
                        )}
                        <button 
                          onClick={() => handleResetPassword(admin)}
                          className="btn-reset-password"
                          title="Reset password and generate new temporary password"
                        >
                          🔑 Reset Password
                        </button>
                        <button 
                          onClick={() => handleEditAdmin(admin)}
                          className="btn-edit"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteAdmin(admin)}
                          className="btn-delete"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                  ⚠️ Important: You can only view each password once! Make sure to save it.
                </p>
                {createdAdmins.map((admin, index) => (
                  <div key={index} className={`created-admin ${admin.success ? 'success' : 'error'}`}>
                    <p><strong>{admin.name}</strong></p>
                    <p>Email: {admin.email}</p>
                    {admin.success && admin.tempPassword && (
                      <div className="temp-password-section">
                        {!viewedPasswords[admin.id] ? (
                          <button 
                            onClick={() => handleViewPassword(admin.id)} 
                            className="btn-view-password"
                          >
                            👁️ View Temp Password
                          </button>
                        ) : (
                          <p className="temp-password">
                            Password: <code>{admin.tempPassword}</code>
                            <span className="password-warning"> (Password revealed - save it now!)</span>
                          </p>
                        )}
                      </div>
                    )}
                    {!admin.success && <p className="error-msg">{admin.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {editingAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit School Admin</h2>
            <form onSubmit={handleUpdateAdmin}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleEditFormChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact</label>
                <input
                  type="text"
                  value={editForm.contact}
                  onChange={(e) => handleEditFormChange('contact', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.accountActive}
                    onChange={(e) => handleEditFormChange('accountActive', e.target.checked)}
                  />
                  {' '}Account Active
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  Update Admin
                </button>
                <button type="button" onClick={cancelEdit} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolAdminManagement;
