// Health Check Dashboard Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHealthStatus } from '../../services/p2lAdminService';
import './HealthCheck.css';

function HealthCheck() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await getHealthStatus();
      setHealth(response);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Checking system health...</div>;
  }

  return (
    <div className="health-check">
      <header className="page-header">
        <div>
          <h1>System Health Check</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <button onClick={checkHealth} className="btn-primary">
          🔄 Refresh
        </button>
      </header>

      <div className="health-container">
        <div className={`status-banner ${health?.success ? 'healthy' : 'unhealthy'}`}>
          <h2>{health?.success ? '✅ System Healthy' : '❌ System Issues Detected'}</h2>
          {lastChecked && (
            <p>Last checked: {lastChecked.toLocaleTimeString()}</p>
          )}
        </div>

        <div className="health-grid">
          <div className="health-card">
            <h3>🗄️ Database Status</h3>
            {health?.database ? (
              <>
                <p className="status-value">{health.database.status || 'Unknown'}</p>
                <p className="status-detail">
                  {health.database.connected ? '✅ Connected' : '❌ Disconnected'}
                </p>
                <p className="status-detail">Type: {health.database.type || 'N/A'}</p>
              </>
            ) : (
              <p className="status-value">No data available</p>
            )}
          </div>

          <div className="health-card">
            <h3>🌍 Environment</h3>
            <p className="status-value">{health?.server?.environment || 'Unknown'}</p>
          </div>

          <div className="health-card">
            <h3>⏱️ Server Uptime</h3>
            <p className="status-value">
              {health?.server?.uptime 
                ? `${Math.floor(health.server.uptime / 3600)}h ${Math.floor((health.server.uptime % 3600) / 60)}m`
                : 'N/A'
              }
            </p>
          </div>

          <div className="health-card">
            <h3>📡 API Status</h3>
            <p className="status-value">
              {health?.success ? '✅ Operational' : '❌ Down'}
            </p>
          </div>
        </div>

        {health?.server && (
          <div className="server-details">
            <h3>Server Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <strong>Environment:</strong>
                <span>{health.server.environment || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Uptime:</strong>
                <span>{Math.floor(health.server.uptime / 60)} minutes</span>
              </div>
              <div className="detail-item">
                <strong>Timestamp:</strong>
                <span>{new Date(health.server.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <div className="monitoring-tips">
          <h3>💡 Monitoring Tips</h3>
          <ul>
            <li>Database should always show "Connected" status</li>
            <li>API should be "Operational" for the system to function</li>
            <li>Check this page regularly to ensure system health</li>
            <li>Long uptime is good, but schedule maintenance restarts periodically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HealthCheck;
