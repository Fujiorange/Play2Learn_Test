// P2LAdmin Dashboard Component
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getHealthStatus, getDashboardStats } from '../../services/p2lAdminService';
import './P2LAdminDashboard.css';

function P2LAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage
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

    setUser(userData);

    // Fetch health status and dashboard stats
    Promise.all([
      getHealthStatus(),
      getDashboardStats()
    ])
      .then(([healthResponse, statsResponse]) => {
        setHealthStatus(healthResponse);
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      })
      .catch(error => {
        console.error('Failed to fetch dashboard data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="p2ladmin-dashboard">
      <header className="dashboard-header">
        <h1>P2L Admin Dashboard</h1>
        <div className="header-actions">
          <span className="user-info">Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="health-status">
          <h2>System Health</h2>
          {healthStatus ? (
            <div className={`status-card ${healthStatus.success ? 'healthy' : 'unhealthy'}`}>
              <p><strong>Status:</strong> {healthStatus.success ? '✅ Healthy' : '❌ Unhealthy'}</p>
              <p><strong>Database:</strong> {healthStatus.database?.status || 'Unknown'}</p>
              <p><strong>Environment:</strong> {healthStatus.environment || 'Unknown'}</p>
              <p><strong>Uptime:</strong> {healthStatus.uptime ? `${Math.floor(healthStatus.uptime / 60)} minutes` : 'N/A'}</p>
            </div>
          ) : (
            <p>Unable to fetch health status</p>
          )}
        </div>

        <div className="management-grid">
          <Link to="/p2ladmin/users" className="management-card">
            <h3>👥 User Management</h3>
            <p>View and manage all users in the database</p>
          </Link>

          <Link to="/p2ladmin/landing-page" className="management-card">
            <h3>📄 Landing Page Manager</h3>
            <p>Manage modular blocks for the landing page</p>
          </Link>

          <Link to="/p2ladmin/schools" className="management-card">
            <h3>🏫 School Management</h3>
            <p>Create and manage schools with licensing plans</p>
          </Link>

          <Link to="/p2ladmin/school-admins" className="management-card">
            <h3>👥 School Admin Management</h3>
            <p>Create admin accounts for schools</p>
          </Link>

          <Link to="/p2ladmin/questions" className="management-card">
            <h3>📚 Question Bank</h3>
            <p>Manage questions with difficulty levels</p>
          </Link>

          <Link to="/p2ladmin/quizzes" className="management-card">
            <h3>📝 Adaptive Quiz Manager</h3>
            <p>Create and manage adaptive quizzes</p>
          </Link>

          <Link to="/p2ladmin/maintenance" className="management-card">
            <h3>📢 Maintenance Broadcasts</h3>
            <p>Create system-wide announcements and alerts</p>
          </Link>

          <Link to="/p2ladmin/health" className="management-card">
            <h3>🔍 Health Check</h3>
            <p>Monitor system health and connectivity</p>
          </Link>
        </div>

        <div className="quick-stats">
          <h2>Quick Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Schools</h4>
              <p className="stat-value">{stats ? stats.schools : '-'}</p>
            </div>
            <div className="stat-card">
              <h4>Total Admins</h4>
              <p className="stat-value">{stats ? stats.admins : '-'}</p>
            </div>
            <div className="stat-card">
              <h4>Total Questions</h4>
              <p className="stat-value">{stats ? stats.questions : '-'}</p>
            </div>
            <div className="stat-card">
              <h4>Total Quizzes</h4>
              <p className="stat-value">{stats ? stats.quizzes : '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default P2LAdminDashboard;
