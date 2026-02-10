import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function StudentLeaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');
  const isObjectId = (str) => str && typeof str === 'string' && /^[a-f\d]{24}$/i.test(str);
  
  const getClassDisplayName = (studentClass) => {
    if (!studentClass) return 'Unassigned';
    if (!isObjectId(studentClass)) return studentClass;
    if (myClasses.length > 0) return myClasses[0];
    return 'Primary 1';
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadClasses();
  }, [navigate]);

  useEffect(() => {
    if (myClasses.length >= 0) loadLeaderboard();
  }, [selectedClass, myClasses]);

  const loadClasses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/my-classes`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setMyClasses(data.classes || []);
    } catch (err) { console.error('Error:', err); }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const url = selectedClass === 'all' 
        ? `${API_BASE_URL}/api/mongo/teacher/leaderboard`
        : `${API_BASE_URL}/api/mongo/teacher/leaderboard?className=${encodeURIComponent(selectedClass)}`;
      
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      const data = await res.json();
      
      if (data.success) {
        const ranked = (data.leaderboard || []).map((s, i) => ({ ...s, rank: i + 1 }));
        setLeaderboard(ranked);
      } else {
        setError(data.error || 'Failed to load');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: 'white' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #d1d5db, #9ca3af)', color: 'white' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #fb923c, #ea580c)', color: 'white' };
    return { background: '#f3f4f6', color: '#6b7280' };
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1000px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    select: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '150px' },
    podium: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' },
    podiumItem: { textAlign: 'center', padding: '20px', borderRadius: '16px', background: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', minWidth: '120px' },
    podiumFirst: { transform: 'scale(1.1)' },
    podiumRank: { fontSize: '32px', marginBottom: '8px' },
    podiumName: { fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' },
    podiumClass: { fontSize: '12px', color: '#6b7280', marginBottom: '8px' },
    podiumPoints: { fontSize: '20px', fontWeight: '700', color: '#10b981' },
    tableBox: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' },
    rankBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', fontWeight: '700', fontSize: '14px' },
    classBadge: { padding: '4px 10px', background: '#dbeafe', color: '#1e40af', borderRadius: '8px', fontSize: '12px', fontWeight: '500' },
    points: { fontWeight: '700', color: '#10b981', fontSize: '16px' },
    level: { padding: '4px 12px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    streak: { color: '#f59e0b', fontWeight: '600' },
    empty: { textAlign: 'center', padding: '60px 20px', color: '#6b7280', background: 'white', borderRadius: '16px' },
    error: { textAlign: 'center', padding: '40px', background: '#fee2e2', borderRadius: '12px', color: '#dc2626', marginBottom: '24px' },
    loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
  };

  if (loading && leaderboard.length === 0) return <div style={styles.loading}><div>Loading leaderboard...</div></div>;

  const top3 = leaderboard.slice(0, 3);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🏆 Class Leaderboard</h1>
            <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontWeight: '500' }}>Filter by Class:</label>
            <select style={styles.select} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="all">All Classes</option>
              {myClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        {!error && leaderboard.length === 0 && (
          <div style={styles.empty}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No students found</p>
            <p>Students will appear here once they earn points</p>
          </div>
        )}

        {!error && top3.length > 0 && (
          <div style={styles.podium}>
            {top3[1] && (
              <div style={styles.podiumItem}>
                <div style={styles.podiumRank}>🥈</div>
                <div style={styles.podiumName}>{top3[1].name}</div>
                <div style={styles.podiumClass}>{getClassDisplayName(top3[1].class)}</div>
                <div style={styles.podiumPoints}>{top3[1].points || 0} pts</div>
              </div>
            )}
            {top3[0] && (
              <div style={{ ...styles.podiumItem, ...styles.podiumFirst }}>
                <div style={styles.podiumRank}>🥇</div>
                <div style={styles.podiumName}>{top3[0].name}</div>
                <div style={styles.podiumClass}>{getClassDisplayName(top3[0].class)}</div>
                <div style={styles.podiumPoints}>{top3[0].points || 0} pts</div>
              </div>
            )}
            {top3[2] && (
              <div style={styles.podiumItem}>
                <div style={styles.podiumRank}>🥉</div>
                <div style={styles.podiumName}>{top3[2].name}</div>
                <div style={styles.podiumClass}>{getClassDisplayName(top3[2].class)}</div>
                <div style={styles.podiumPoints}>{top3[2].points || 0} pts</div>
              </div>
            )}
          </div>
        )}

        {!error && leaderboard.length > 0 && (
          <div style={styles.tableBox}>
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
                {leaderboard.map((s) => (
                  <tr key={s._id}>
                    <td style={styles.td}><span style={{ ...styles.rankBadge, ...getRankStyle(s.rank) }}>{s.rank}</span></td>
                    <td style={styles.td}><strong>{s.name}</strong></td>
                    <td style={styles.td}><span style={styles.classBadge}>{getClassDisplayName(s.class)}</span></td>
                    <td style={styles.td}><span style={styles.points}>{s.points || 0}</span></td>
                    <td style={styles.td}><span style={styles.level}>Lv {s.level || 1}</span></td>
                    <td style={styles.td}><span style={styles.streak}>🔥 {s.streak || 0}</span></td>
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
