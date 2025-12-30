import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function ViewChildren() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    const loadChildren = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      // Mock children data
      const mockChildren = [
        { id: 1, name: 'Emma Johnson', grade: 'Primary 5', class: 'Primary 5A', school: 'Springfield Elementary', overallGrade: 'A', attendance: '95%' },
        { id: 2, name: 'Liam Johnson', grade: 'Primary 3', class: 'Primary 3B', school: 'Springfield Elementary', overallGrade: 'B+', attendance: '92%' },
      ];
      
      setChildren(mockChildren);
      setLoading(false);
    };

    loadChildren();
  }, [navigate]);

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    childrenGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' },
    childCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', transition: 'all 0.3s' },
    childHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' },
    childName: { fontSize: '22px', fontWeight: '700', color: '#1f2937' },
    gradeBadge: { padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '700', background: '#d1fae5', color: '#065f46' },
    infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' },
    infoLabel: { fontSize: '14px', color: '#6b7280' },
    infoValue: { fontSize: '14px', fontWeight: '600', color: '#1f2937' },
    buttonGroup: { display: 'flex', gap: '8px', marginTop: '16px' },
    button: { flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>👨‍👩‍👧‍👦 My Children</h1>
          <button style={styles.backButton} onClick={() => navigate('/parent')}>← Back to Dashboard</button>
        </div>

        <div style={styles.childrenGrid}>
          {children.map(child => (
            <div key={child.id} style={styles.childCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={styles.childHeader}>
                <h2 style={styles.childName}>{child.name}</h2>
                <span style={styles.gradeBadge}>{child.overallGrade}</span>
              </div>
              
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Grade</span>
                <span style={styles.infoValue}>{child.grade}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Class</span>
                <span style={styles.infoValue}>{child.class}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>School</span>
                <span style={styles.infoValue}>{child.school}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Attendance</span>
                <span style={{...styles.infoValue, color: '#10b981'}}>{child.attendance}</span>
              </div>

              <div style={styles.buttonGroup}>
                <button style={styles.button} onClick={() => navigate('/parent/children/performance', { state: { child } })}>📊 View Performance</button>
                <button style={styles.button} onClick={() => navigate('/parent/children/progress', { state: { child } })}>📈 View Progress</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}