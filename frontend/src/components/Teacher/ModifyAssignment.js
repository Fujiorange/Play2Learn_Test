import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function ModifyAssignment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const loadAssignments = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }
      const mockData = [
        { id: 1, title: 'Essay on Climate Change', class: 'Primary 5A', subject: 'English', dueDate: '2024-12-20', status: 'active' },
        { id: 2, title: 'Quadratic Equations Worksheet', class: 'Primary 5B', subject: 'Mathematics', dueDate: '2024-12-18', status: 'active' },
      ];
      setAssignments(mockData);
      setLoading(false);
    };
    loadAssignments();
  }, [navigate]);

  const handleModify = (id) => {
    // Navigate to edit page
    alert(`Modify assignment ${id} - Feature coming soon!`);
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
    card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' },
    cardInfo: { fontSize: '14px', color: '#6b7280', marginBottom: '8px' },
    button: { padding: '8px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📅 Modify Assignment Deadlines</h1>
          <button style={styles.backButton} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        </div>
        <div style={styles.grid}>
          {assignments.map(assignment => (
            <div key={assignment.id} style={styles.card}>
              <div style={styles.cardTitle}>{assignment.title}</div>
              <div style={styles.cardInfo}>📚 Subject: {assignment.subject}</div>
              <div style={styles.cardInfo}>👥 Class: {assignment.class}</div>
              <div style={styles.cardInfo}>📅 Due Date: {assignment.dueDate}</div>
              <button style={styles.button} onClick={() => handleModify(assignment.id)}>
                ✏️ Modify Deadline
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}