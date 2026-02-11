import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function StudentLeaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    loadData();
  }, [navigate]);

  useEffect(() => {
    if (selectedClass === 'all') {
      setFilteredStudents(allStudents);
    } else {
      const filtered = allStudents.filter(s => s.className === selectedClass);
      setFilteredStudents(filtered);
    }
  }, [selectedClass, allStudents]);

  const loadData = async () => {
    try {
      setError('');
      
      // Get classes first
      const classRes = await fetch(`${API_BASE_URL}/api/mongo/teacher/my-classes`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const classData = await classRes.json();
      
      let classNames = [];
      let classIds = [];
      if (classData.success) {
        classNames = classData.classes || [];
        classIds = classData.classIds || [];
      }
      setMyClasses(classNames);
      
      // Create ID to name map
      const idToName = {};
      classNames.forEach((name, i) => {
        if (classIds[i]) idToName[classIds[i]] = name;
      });
      
      // Get leaderboard
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/leaderboard`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const students = (data.leaderboard || []).map((s, i) => ({
          ...s,
          rank: i + 1,
          className: idToName[s.class] || s.class || 'Unknown'
        }));
        setAllStudents(students);
        setFilteredStudents(students);
      } else {
        setError(data.error || 'Failed to load');
      }
    } catch (e) { 
      console.error(e); 
      setError('Failed to connect');
    }
    finally { setLoading(false); }
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '900px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '24px 32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937' },
    backBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    filterRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    filterLabel: { fontWeight: '500', color: '#374151' },
    select: { padding: '10px 16px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', minWidth: '200px', cursor: 'pointer' },
    podiumContainer: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
    podiumCard: { background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center', minWidth: '140px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    podiumFirst: { transform: 'scale(1.1)', background: 'linear-gradient(135deg, #fef3c7, #fde68a)' },
    podiumRank: { fontSize: '36px', marginBottom: '8px' },
    podiumName: { fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' },
    podiumClass: { fontSize: '13px', color: '#6b7280', marginBottom: '8px' },
    podiumPoints: { fontSize: '20px', fontWeight: '700', color: '#10b981' },
    tableContainer: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '16px 20px', textAlign: 'left', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 20px', borderBottom: '1px solid #f3f4f6' },
    rankCell: { fontWeight: '700', fontSize: '18px' },
    nameCell: { fontWeight: '600', color: '#1f2937' },
    classBadge: { display: 'inline-block', padding: '4px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
    pointsCell: { fontWeight: '700', color: '#10b981', fontSize: '16px' },
    empty: { textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    error: { background: '#fee2e2', color: '#dc2626', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' },
  };

  if (loading) return <div style={styles.container}><div style={{ textAlign: 'center', marginTop: '100px', color: '#6b7280' }}>Loading leaderboard...</div></div>;

  const top3 = filteredStudents.slice(0, 3);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🏆 Class Leaderboard</h1>
            <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
          </div>
          <div style={styles.filterRow}>
            <span style={styles.filterLabel}>Filter by Class:</span>
            <select style={styles.select} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="all">All Classes ({allStudents.length} students)</option>
              {myClasses.map(cls => {
                const count = allStudents.filter(s => s.className === cls).length;
                return <option key={cls} value={cls}>{cls} ({count} students)</option>;
              })}
            </select>
          </div>
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        {!error && filteredStudents.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No students found</p>
            <p>Students will appear here once they earn points</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div style={styles.podiumContainer}>
                {top3[1] && (
                  <div style={styles.podiumCard}>
                    <div style={styles.podiumRank}>🥈</div>
                    <div style={styles.podiumName}>{top3[1].name}</div>
                    <div style={styles.podiumClass}>{top3[1].className}</div>
                    <div style={styles.podiumPoints}>{top3[1].points || 0} pts</div>
                  </div>
                )}
                {top3[0] && (
                  <div style={{ ...styles.podiumCard, ...styles.podiumFirst }}>
                    <div style={styles.podiumRank}>🥇</div>
                    <div style={styles.podiumName}>{top3[0].name}</div>
                    <div style={styles.podiumClass}>{top3[0].className}</div>
                    <div style={styles.podiumPoints}>{top3[0].points || 0} pts</div>
                  </div>
                )}
                {top3[2] && (
                  <div style={styles.podiumCard}>
                    <div style={styles.podiumRank}>🥉</div>
                    <div style={styles.podiumName}>{top3[2].name}</div>
                    <div style={styles.podiumClass}>{top3[2].className}</div>
                    <div style={styles.podiumPoints}>{top3[2].points || 0} pts</div>
                  </div>
                )}
              </div>
            )}

            {/* Full Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Rank</th>
                    <th style={styles.th}>Student</th>
                    <th style={styles.th}>Class</th>
                    <th style={styles.th}>Points</th>
                    <th style={styles.th}>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => (
                    <tr key={s._id}>
                      <td style={{ ...styles.td, ...styles.rankCell }}>{getRankDisplay(i + 1)}</td>
                      <td style={{ ...styles.td, ...styles.nameCell }}>{s.name}</td>
                      <td style={styles.td}><span style={styles.classBadge}>{s.className}</span></td>
                      <td style={{ ...styles.td, ...styles.pointsCell }}>{s.points || 0}</td>
                      <td style={styles.td}>Lv {s.level || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
