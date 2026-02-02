// User Management Component - Dashboard for all users
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllUsers, getUserSchools, bulkDeleteUsers } from '../../services/p2lAdminService';
import './UserManagement.css';

function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const roles = [
    'Platform Admin',
    'p2ladmin',
    'School Admin',
    'Teacher',
    'Student',
    'Parent',
    'Trial Student',
    'Trial Teacher'
  ];

  useEffect(() => {
    // Check authentication
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    if (userData.role !== 'p2ladmin' && userData.role !== 'Platform Admin') {
      alert('Access denied. P2LAdmin role required.');
      navigate('/login');
      return;
    }

    fetchInitialData();
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [selectedSchool, selectedRole]);

  const fetchInitialData = async () => {
    try {
      const [usersResponse, schoolsResponse] = await Promise.all([
        getAllUsers(),
        getUserSchools()
      ]);
      setUsers(usersResponse.data || []);
      setSchools(schoolsResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const filters = {};
      if (selectedSchool) filters.schoolId = selectedSchool;
      if (selectedRole) filters.role = selectedRole;
      
      const response = await getAllUsers(filters);
      setUsers(response.data || []);
      setSelectedUsers([]); // Clear selection when filters change
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUsers.length} user(s)?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await bulkDeleteUsers(selectedUsers);
      alert(response.message || `Successfully deleted ${response.deletedCount} user(s)`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete users:', error);
      alert(error.message || 'Failed to delete users');
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSelectedSchool('');
    setSelectedRole('');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="user-management">
      <header className="page-header">
        <div>
          <h1>User Management Dashboard</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <div className="header-stats">
          <span>Total Users: {users.length}</span>
          <span>Selected: {selectedUsers.length}</span>
        </div>
      </header>

      <div className="content-container">
        <div className="filters-section">
          <h2>Filters</h2>
          <div className="filters-row">
            <div className="filter-group">
              <label>Filter by School:</label>
              <select 
                value={selectedSchool} 
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="filter-select"
              >
                <option value="">All Schools</option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.organization_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Filter by Role:</label>
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)}
                className="filter-select"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={clearFilters} className="btn-clear-filters">
              Clear Filters
            </button>
          </div>
        </div>

        <div className="actions-section">
          <button 
            onClick={handleSelectAll} 
            className="btn-select-all"
          >
            {selectedUsers.length === users.length && users.length > 0 
              ? '☐ Deselect All' 
              : '☑ Select All'}
          </button>
          <button 
            onClick={handleDeleteSelected} 
            className="btn-delete-selected"
            disabled={selectedUsers.length === 0 || deleting}
          >
            {deleting ? 'Deleting...' : `🗑️ Delete Selected (${selectedUsers.length})`}
          </button>
        </div>

        <div className="users-table-container">
          {users.length === 0 ? (
            <p className="no-data">No users found matching the selected filters.</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>School</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr 
                    key={user._id} 
                    className={selectedUsers.includes(user._id) ? 'selected' : ''}
                  >
                    <td className="checkbox-col">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                      />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role.toLowerCase().replace(/\s+/g, '-')}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.schoolName || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${user.accountActive ? 'active' : 'inactive'}`}>
                        {user.accountActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
