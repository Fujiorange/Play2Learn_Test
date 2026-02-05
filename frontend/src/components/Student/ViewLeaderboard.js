// ViewLeaderboard.js - UPDATED with real backend connection
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function ViewLeaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const user = authService.getCurrentUser();
      setCurrentUser(user);

      try {
        // REAL API CALL - Get leaderboard filtered by current user's school & class
        const result = await studentService.getLeaderboard(user.schoolId, user.class);

        if (result.success) {
          setLeaderboard(result.leaderboard || []);
        } else {
          setError('Failed to load leaderboard');
          setLeaderboard([]);
        }
      } catch (error) {
        console.error('Load leaderboard error:', error);
        setError('Failed to load leaderboard');
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [navigate]);

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)', color: 'white' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', color: 'white' };
    return { background: '#f3f4f6', color: '#6b7280' };
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', width: '100%' },
    podium: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '16px', marginBottom: '32px', padding: '32px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    podiumPlace: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '150px' },
    podiumBase: { width: '100%', borderRadius: '12px 12px 0 0', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    medal: { fontSize: '32px', marginBottom: '8px' },
    playerName: { fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '4px', textAlign: 'center' },
    playerPoints: { fontSize: '18px', fontWeight: '700', color: 'white' },
    tableContainer: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' },
    currentUserRow: { background: '#f0fdf4', fontWeight: '600' },
    rankBadge: { display: 'inline-block', width: '40px', height: '40px', borderRadius: '50%', textAlign: 'center', lineHeight: '40px', fontWeight: '700', fontSize: '16px' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  const topThree = leaderboard.slice(0, 3);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🏆 Leaderboard</h1>
          <button style={styles.backButton} onClick={() => navigate('/student')}>← Back to Dashboard</button>
          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {leaderboard.length >= 3 && (
          <div style={styles.podium}>
            {topThree[1] && (
              <div style={styles.podiumPlace}>
                <div style={styles.medal}>🥈</div>
                <div style={{...styles.podiumBase, background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)', height: '180px'}}>
                  <div style={styles.playerName}>{topThree[1].name}</div>
                  <div style={styles.playerPoints}>{topThree[1].points} pts</div>
                </div>
              </div>
            )}
            {topThree[0] && (
              <div style={styles.podiumPlace}>
                <div style={styles.medal}>🥇</div>
                <div style={{...styles.podiumBase, background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', height: '220px'}}>
                  <div style={styles.playerName}>{topThree[0].name}</div>
                  <div style={styles.playerPoints}>{topThree[0].points} pts</div>
                </div>
              </div>
            )}
            {topThree[2] && (
              <div style={styles.podiumPlace}>
                <div style={styles.medal}>🥉</div>
                <div style={{...styles.podiumBase, background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', height: '140px'}}>
                  <div style={styles.playerName}>{topThree[2].name}</div>
                  <div style={styles.playerPoints}>{topThree[2].points} pts</div>
                </div>
              </div>
            )}
          </div>
        )}

        {leaderboard.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Rank</th>
                  <th style={styles.th}>Player</th>
                  <th style={styles.th}>Points</th>
                  <th style={styles.th}>Level</th>
                  <th style={styles.th}>Achievements</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(player => (
                  <tr key={player.rank} style={player.isCurrentUser ? styles.currentUserRow : {}}>
                    <td style={styles.td}>
                      <span style={{...styles.rankBadge, ...getRankBadgeStyle(player.rank)}}>
                        {player.rank <= 3 ? (player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉') : player.rank}
                      </span>
                    </td>
                    <td style={styles.td}><strong>{player.name}</strong>{player.isCurrentUser && ' (You)'}</td>
                    <td style={styles.td}><strong style={{ color: '#10b981' }}>{player.points?.toLocaleString() || 0}</strong></td>
                    <td style={styles.td}>Level {player.level || 1}</td>
                    <td style={styles.td}>🏆 {player.achievements || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No rankings yet</p>
            <p>The leaderboard will populate as students earn points</p>
          </div>
        )}
      </div>
    </div>
  );
}