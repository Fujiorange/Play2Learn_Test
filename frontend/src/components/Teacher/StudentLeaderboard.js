import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function StudentLeaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState('all-time');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/mongo/teacher/leaderboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Add rank to each entry
          const rankedLeaderboard = data.leaderboard.map((student, index) => ({
            ...student,
            rank: index + 1,
            id: student._id
          }));
          setLeaderboard(rankedLeaderboard);
        } else {
          setError(data.error || 'Failed to load leaderboard');
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [navigate, timeframe]);

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)', color: 'white' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', color: 'white' };
    return { background: '#f3f4f6', color: '#6b7280' };
  };

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
    subtitle: {
      color: '#64748b',
      fontSize: '14px',
    },
    filterBar: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
    },
    filterBtn: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s',
    },
    table: {
      width: '100%',
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    th: {
      padding: '16px 20px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#64748b',
      fontSize: '13px',
      textTransform: 'uppercase',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
    },
    td: {
      padding: '16px 20px',
      borderBottom: '1px solid #f1f5f9',
    },
    rankBadge: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      fontSize: '14px',
    },
    studentInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '600',
    },
    statBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#64748b',
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
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p>Loading leaderboard...</p>
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
          <h1 style={styles.title}>🏆 Student Leaderboard</h1>
          <p style={styles.subtitle}>Track student performance and achievements</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <div style={styles.filterBar}>
          {['all-time', 'this-week', 'this-month'].map((filter) => (
            <button
              key={filter}
              style={{
                ...styles.filterBtn,
                background: timeframe === filter ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#f1f5f9',
                color: timeframe === filter ? 'white' : '#64748b',
              }}
              onClick={() => setTimeframe(filter)}
            >
              {filter === 'all-time' ? 'All Time' : filter === 'this-week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {leaderboard.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px', marginBottom: '10px' }}>📊</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No students found</p>
            <p>Students in your classes will appear here</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}>Student</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Points</th>
                <th style={styles.th}>Level</th>
                <th style={styles.th}>Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((student) => (
                <tr key={student.id}>
                  <td style={styles.td}>
                    <div style={{ ...styles.rankBadge, ...getRankBadgeStyle(student.rank) }}>
                      {student.rank}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.studentInfo}>
                      <div style={styles.avatar}>
                        {student.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span style={{ fontWeight: '500', color: '#1e293b' }}>{student.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: '#64748b' }}>{student.class || 'N/A'}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statBadge, background: '#dbeafe', color: '#1d4ed8' }}>
                      {student.points || 0} pts
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statBadge, background: '#dcfce7', color: '#16a34a' }}>
                      Lvl {student.level || 1}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statBadge, background: '#fef3c7', color: '#d97706' }}>
                      🔥 {student.streak || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
