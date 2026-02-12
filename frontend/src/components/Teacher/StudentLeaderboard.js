import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function StudentLeaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState('all-time');

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // Simulated leaderboard data
        const mockData = [
          { id: 1, rank: 1, name: 'Sarah Williams', class: 'Primary 5A', points: 1250, level: 18, achievements: 24, streak: 15 },
          { id: 2, rank: 2, name: 'Jane Smith', class: 'Primary 5A', points: 1180, level: 16, achievements: 20, streak: 12 },
          { id: 3, rank: 3, name: 'John Doe', class: 'Primary 5B', points: 1050, level: 15, achievements: 18, streak: 10 },
          { id: 4, rank: 4, name: 'Mike Johnson', class: 'Primary 5A', points: 980, level: 14, achievements: 16, streak: 8 },
          { id: 5, rank: 5, name: 'Emily Davis', class: 'Primary 5B', points: 920, level: 13, achievements: 15, streak: 7 },
          { id: 6, rank: 6, name: 'David Brown', class: 'Primary 5A', points: 850, level: 12, achievements: 14, streak: 6 },
          { id: 7, rank: 7, name: 'Lisa Wilson', class: 'Primary 5B', points: 780, level: 11, achievements: 12, streak: 5 },
          { id: 8, rank: 8, name: 'Tom Anderson', class: 'Primary 5A', points: 720, level: 10, achievements: 10, streak: 4 },
        ];
        
        setLeaderboard(mockData);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
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
      padding: '32px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    headerTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0,
    },
    backButton: {
      padding: '10px 20px',
      background: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    timeframeSection: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    timeframeButton: {
      padding: '8px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      background: 'white',
      fontWeight: '500',
    },
    timeframeButtonActive: {
      borderColor: '#10b981',
      background: '#d1fae5',
      color: '#065f46',
      fontWeight: '600',
    },
    podium: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: '16px',
      marginBottom: '32px',
      padding: '32px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    podiumPlace: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '150px',
    },
    podiumBase: {
      width: '100%',
      borderRadius: '12px 12px 0 0',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    podiumAvatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      marginBottom: '12px',
      border: '3px solid white',
    },
    podiumName: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'white',
      marginBottom: '4px',
      textAlign: 'center',
    },
    podiumPoints: {
      fontSize: '18px',
      fontWeight: '700',
      color: 'white',
    },
    tableContainer: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      borderBottom: '2px solid #e5e7eb',
      fontSize: '13px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
    },
    td: {
      padding: '16px 12px',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '14px',
      color: '#1f2937',
    },
    rankBadge: {
      display: 'inline-block',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      textAlign: 'center',
      lineHeight: '40px',
      fontWeight: '700',
      fontSize: '16px',
    },
    medal: {
      fontSize: '24px',
    },
    statBadge: {
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      background: '#f3f4f6',
      color: '#6b7280',
      display: 'inline-block',
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
    loadingText: {
      fontSize: '24px',
      color: '#6b7280',
      fontWeight: '600',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading leaderboard...</div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🏆 Student Leaderboard</h1>
            <button
              style={styles.backButton}
              onClick={() => navigate('/teacher')}
              onMouseEnter={(e) => e.target.style.background = '#4b5563'}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
            >
              ← Back to Dashboard
            </button>
          </div>

          <div style={styles.timeframeSection}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Timeframe:</span>
            {['all-time', 'this-month', 'this-week'].map(period => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                style={{
                  ...styles.timeframeButton,
                  ...(timeframe === period ? styles.timeframeButtonActive : {})
                }}
              >
                {period === 'all-time' ? 'All Time' : period === 'this-month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        <div style={styles.podium}>
          {/* 2nd Place */}
          {topThree[1] && (
            <div style={styles.podiumPlace}>
              <div style={styles.medal}>🥈</div>
              <div style={{ ...styles.podiumBase, background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)', height: '180px' }}>
                <div style={styles.podiumAvatar}>👤</div>
                <div style={styles.podiumName}>{topThree[1].name}</div>
                <div style={styles.podiumPoints}>{topThree[1].points} pts</div>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div style={styles.podiumPlace}>
              <div style={styles.medal}>🥇</div>
              <div style={{ ...styles.podiumBase, background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', height: '220px' }}>
                <div style={styles.podiumAvatar}>👤</div>
                <div style={styles.podiumName}>{topThree[0].name}</div>
                <div style={styles.podiumPoints}>{topThree[0].points} pts</div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div style={styles.podiumPlace}>
              <div style={styles.medal}>🥉</div>
              <div style={{ ...styles.podiumBase, background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', height: '140px' }}>
                <div style={styles.podiumAvatar}>👤</div>
                <div style={styles.podiumName}>{topThree[2].name}</div>
                <div style={styles.podiumPoints}>{topThree[2].points} pts</div>
              </div>
            </div>
          )}
        </div>

        {/* Full Leaderboard Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Points</th>
                <th style={styles.th}>Level</th>
                <th style={styles.th}>Achievements</th>
                <th style={styles.th}>Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(student => (
                <tr key={student.id}>
                  <td style={styles.td}>
                    <span style={{ ...styles.rankBadge, ...getRankBadgeStyle(student.rank) }}>
                      {student.rank <= 3 ? (student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : '🥉') : student.rank}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <strong>{student.name}</strong>
                  </td>
                  <td style={styles.td}>{student.class}</td>
                  <td style={styles.td}>
                    <strong style={{ color: '#10b981', fontSize: '16px' }}>{student.points.toLocaleString()}</strong>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.statBadge}>Level {student.level}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statBadge, background: '#fef3c7', color: '#92400e' }}>
                      🏆 {student.achievements}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statBadge, background: '#ffedd5', color: '#9a3412' }}>
                      🔥 {student.streak} days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}