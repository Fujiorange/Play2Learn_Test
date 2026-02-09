import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function StudentPerformance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        // Get class performance data
        const response = await fetch(`http://localhost:5000/api/mongo/teacher/class-performance?className=${selectedClass}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setPerformanceData(data);
          if (data.classes) {
            setClasses(data.classes);
          }
        } else {
          setError(data.error || 'Failed to load performance data');
        }
      } catch (error) {
        console.error('Error loading performance:', error);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, selectedClass]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '32px',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '8px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '24px',
    },
    statCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    statValue: {
      fontSize: '32px',
      fontWeight: '700',
      marginBottom: '8px',
    },
    statLabel: {
      color: '#64748b',
      fontSize: '14px',
    },
    backBtn: {
      padding: '10px 20px',
      background: '#f1f5f9',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '500',
      marginBottom: '20px',
    },
    select: {
      padding: '10px 16px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      marginBottom: '20px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#64748b',
      background: 'white',
      borderRadius: '16px',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p>Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backBtn} onClick={() => navigate('/teacher')}>
          ← Back to Dashboard
        </button>

        <div style={styles.header}>
          <h1 style={styles.title}>📊 Student Performance</h1>
          <p style={{ color: '#64748b' }}>Overview of class performance metrics</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <select 
          style={styles.select} 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="all">All Classes</option>
          {classes.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>

        {performanceData ? (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: '#6366f1' }}>
                {performanceData.totalStudents || 0}
              </div>
              <div style={styles.statLabel}>Total Students</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: '#10b981' }}>
                {performanceData.averageScore?.toFixed(1) || 0}%
              </div>
              <div style={styles.statLabel}>Average Score</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: '#f59e0b' }}>
                {performanceData.totalQuizAttempts || 0}
              </div>
              <div style={styles.statLabel}>Quiz Attempts</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: '#ec4899' }}>
                {performanceData.completionRate?.toFixed(1) || 0}%
              </div>
              <div style={styles.statLabel}>Completion Rate</div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px', marginBottom: '10px' }}>📊</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No performance data available</p>
            <p>Data will appear once students complete quizzes</p>
          </div>
        )}
      </div>
    </div>
  );
}
