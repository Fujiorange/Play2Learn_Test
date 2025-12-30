import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function AttemptAssignment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const loadAssignments = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockAssignments = [
        { id: 1, title: 'Essay: Climate Change Impact', subject: 'English', dueDate: '2024-12-20', status: 'pending', marks: 100 },
        { id: 2, title: 'Solve 20 Algebra Problems', subject: 'Mathematics', dueDate: '2024-12-18', status: 'pending', marks: 50 },
        { id: 3, title: 'Science Lab Report', subject: 'Science', dueDate: '2024-12-15', status: 'submitted', marks: 80 },
        { id: 4, title: 'Historical Timeline Project', subject: 'History', dueDate: '2024-12-10', status: 'graded', marks: 90, score: 82 },
      ];
      
      setAssignments(mockAssignments);
      setLoading(false);
    };

    loadAssignments();
  }, [navigate]);

  const getStatusColor = (status) => {
    if (status === 'pending') return { bg: '#fef3c7', color: '#92400e' };
    if (status === 'submitted') return { bg: '#dbeafe', color: '#1e40af' };
    if (status === 'graded') return { bg: '#d1fae5', color: '#065f46' };
    return { bg: '#f3f4f6', color: '#6b7280' };
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    assignmentsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    assignmentCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', transition: 'all 0.3s' },
    assignmentTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    assignmentSubject: { fontSize: '14px', color: '#6b7280', marginBottom: '16px' },
    infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '14px' },
    statusBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    actionButton: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', marginTop: '16px' },
    viewButton: { background: '#3b82f6' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📄 My Assignments</h1>
          <button style={styles.backButton} onClick={() => navigate('/student')}>← Back to Dashboard</button>
        </div>

        <div style={styles.assignmentsGrid}>
          {assignments.map(assignment => (
            <div key={assignment.id} style={styles.assignmentCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={styles.assignmentTitle}>{assignment.title}</div>
              <div style={styles.assignmentSubject}>📚 {assignment.subject}</div>
              
              <div style={styles.infoRow}>
                <span>📅 Due Date:</span>
                <strong>{assignment.dueDate}</strong>
              </div>
              
              <div style={styles.infoRow}>
                <span>📊 Total Marks:</span>
                <strong>{assignment.marks}</strong>
              </div>

              {assignment.status === 'graded' && (
                <div style={styles.infoRow}>
                  <span>✅ Your Score:</span>
                  <strong style={{ color: '#10b981' }}>{assignment.score}/{assignment.marks}</strong>
                </div>
              )}

              <div style={styles.infoRow}>
                <span>Status:</span>
                <span style={{...styles.statusBadge, background: getStatusColor(assignment.status).bg, color: getStatusColor(assignment.status).color}}>
                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </span>
              </div>

              <button
                style={{
                  ...styles.actionButton,
                  ...(assignment.status === 'graded' || assignment.status === 'submitted' ? styles.viewButton : {})
                }}
                onClick={() => alert('Assignment feature coming soon!')}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {assignment.status === 'pending' && '📝 Start Assignment'}
                {assignment.status === 'submitted' && '👁️ View Submission'}
                {assignment.status === 'graded' && '📊 View Grade'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}