import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function StudentLeaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadClasses();
  }, [navigate]);

  useEffect(() => {
    if (myClasses.length >= 0) {
      loadLeaderboard();
    }
  }, [selectedClass, myClasses]);

  const loadClasses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/my-classes`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setMyClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      
      const url = selectedClass === 'all' 
        ? `${API_BASE_URL}/api/mongo/teacher/leaderboard`
        : `${API_BASE_URL}/api/mongo/teacher/leaderboard?className=${encodeURIComponent(selectedClass)}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      
      if (data.success) {
        // Add rank to each student
        const rankedLeaderboard = (data.leaderboard || []).map((student, index) => ({
          ...student,
          rank: index + 1
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

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)', color: 'white' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', color: 'white' };
    return { background: '#f3f4f6', color: '#6b7280' };
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1000px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterContainer: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
    select: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '150px' },
    podium: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '20px', marginBottom: '32px', padding: '20px' },
    podiumItem: { textAlign: 'center', padding: '20px', borderRadius: '16px', background: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
    podiumFirst: { minWidth: '140px', transform: 'scale(1.1)' },
    podiumSecond: { minWidth: '120px' },
    podiumThird: { minWidth: '120px' },
    podiumRank: { fontSize: '32px', marginBottom: '8px' },
    podiumName: { fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' },
    podiumClass: { fontSize: '12px', color: '#6b7280', marginBottom: '8px' },
    podiumPoints: { fontSize: '20px', fontWeight: '700', color: '#10b981' },
    tableContainer: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' },
    rankBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', fontWeight: '700', fontSize: '14px' },
    studentName: { fontWeight: '600', color: '#1f2937' },
    points: { fontWeight: '700', color: '#10b981', fontSize: '16px' },
    level: { padding: '4px 12px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    streak: { display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '600' },
    emptyState: { textAlign: 'center', padding: '60px 20px', color: '#6b7280' },
    errorState: { textAlign: 'center', padding: '40px', background: '#fee2e2', borderRadius: '12px', color: '#dc2626' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '18px', color: '#6b7280' },
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
            <h1 style={styles.title}>🏆 Class Leaderboard</h1>
            <button style={styles.backButton} onClick={() => navigate('/teacher')}>
              ← Back to Dashboard
            </button>
          </div>
          
          <div style={styles.filterContainer}>
            <label style={{ fontWeight: '500', color: '#374151' }}>Filter by Class:</label>
            <select 
              style={styles.select}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">All Classes</option>
              {myClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div style={styles.errorState}>
            <p>⚠️ {error}</p>
            <button onClick={loadLeaderboard} style={{ ...styles.backButton, marginTop: '16px' }}>
              Try Again
            </button>
          </div>
        )}

        {!error && leaderboard.length === 0 && (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No students found</p>
            <p>Students in your classes will appear here once they start earning points</p>
          </div>
        )}

        {!error && topThree.length > 0 && (
          <div style={styles.podium}>
            {topThree[1] && (
              <div style={{ ...styles.podiumItem, ...styles.podiumSecond }}>
                <div style={styles.podiumRank}>🥈</div>
                <div style={styles.podiumName}>{topThree[1].name}</div>
                <div style={styles.podiumClass}>{topThree[1].class || 'N/A'}</div>
                <div style={styles.podiumPoints}>{topThree[1].points || 0} pts</div>
              </div>
            )}
            {topThree[0] && (
              <div style={{ ...styles.podiumItem, ...styles.podiumFirst }}>
                <div style={styles.podiumRank}>🥇</div>
                <div style={styles.podiumName}>{topThree[0].name}</div>
                <div style={styles.podiumClass}>{topThree[0].class || 'N/A'}</div>
                <div style={styles.podiumPoints}>{topThree[0].points || 0} pts</div>
              </div>
            )}
            {topThree[2] && (
              <div style={{ ...styles.podiumItem, ...styles.podiumThird }}>
                <div style={styles.podiumRank}>🥉</div>
                <div style={styles.podiumName}>{topThree[2].name}</div>
                <div style={styles.podiumClass}>{topThree[2].class || 'N/A'}</div>
                <div style={styles.podiumPoints}>{topThree[2].points || 0} pts</div>
              </div>
            )}
          </div>
        )}

        {!error && remaining.length > 0 && (
          <div style={styles.tableContainer}>
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
                {remaining.map(student => (
                  <tr key={student._id}>
                    <td style={styles.td}>
                      <span style={{ ...styles.rankBadge, ...getRankBadgeStyle(student.rank) }}>
                        {student.rank}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.studentName}>{student.name}</span>
                    </td>
                    <td style={styles.td}>{student.class || 'N/A'}</td>
                    <td style={styles.td}>
                      <span style={styles.points}>{student.points || 0}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.level}>Level {student.level || 1}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.streak}>🔥 {student.streak || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!error && leaderboard.length > 0 && leaderboard.length <= 3 && (
          <div style={styles.tableContainer}>
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
                {leaderboard.map(student => (
                  <tr key={student._id}>
                    <td style={styles.td}>
                      <span style={{ ...styles.rankBadge, ...getRankBadgeStyle(student.rank) }}>
                        {student.rank}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.studentName}>{student.name}</span>
                    </td>
                    <td style={styles.td}>{student.class || 'N/A'}</td>
                    <td style={styles.td}>
                      <span style={styles.points}>{student.points || 0}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.level}>Level {student.level || 1}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.streak}>🔥 {student.streak || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
