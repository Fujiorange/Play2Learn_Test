// School Admin Management Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSchools, getSchoolAdmins, updateSchoolAdmin, deleteSchoolAdmin, resetSchoolAdminPassword } from '../../services/p2lAdminService';
import './SchoolAdminManagement.css';

function SchoolAdminManagement() {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', contact: '' });
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
      contact: admin.contact || ''
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
    setEditForm({ name: '', email: '', contact: '' });
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link 
            to="/p2ladmin/school-admins/manual-add"
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            + Add Admin
          </Link>
        </div>
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
