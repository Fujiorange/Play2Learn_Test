// AttemptAssignment.js - DYNAMIC VERSION (Pending for Teacher Integration)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function AttemptAssignment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAssignments = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // REAL API CALL - Get assignments from database
        const result = await studentService.getAssignments();

        if (result.success) {
          setAssignments(result.assignments || []);
        } else {
          setError('Failed to load assignments');
          setAssignments([]);
        }
      } catch (error) {
        console.error('Load assignments error:', error);
        setError('Failed to load assignments');
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [navigate]);

  const getStatusColor = (status) => {
    if (status === 'pending') return { bg: '#fef3c7', color: '#92400e' };
    if (status === 'submitted') return { bg: '#dbeafe', color: '#1e40af' };
    if (status === 'graded') return { bg: '#d1fae5', color: '#065f46' };
    if (status === 'overdue') return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#f3f4f6', color: '#6b7280' };
  };

  const handleAssignmentClick = (assignment) => {
    // Route to appropriate page based on status
    if (assignment.status === 'pending') {
      // TODO: Navigate to assignment attempt page when ready
      alert(`Assignment submission page coming soon!\n\nAssignment: ${assignment.title}\nThis will open when your friend completes the teacher assignment creation feature.`);
      // navigate(`/student/assignment/attempt/${assignment.id}`);
    } else if (assignment.status === 'submitted') {
      // TODO: View submission details
      alert('View submission details - Coming soon!');
      // navigate(`/student/assignment/view/${assignment.id}`);
    } else if (assignment.status === 'graded') {
      // TODO: View grade and feedback
      alert('View grade and feedback - Coming soon!');
      // navigate(`/student/assignment/grade/${assignment.id}`);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', width: '100%' },
    assignmentsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    assignmentCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', transition: 'all 0.3s', cursor: 'pointer' },
    assignmentTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    assignmentSubject: { fontSize: '14px', color: '#6b7280', marginBottom: '16px' },
    teacherInfo: { fontSize: '13px', color: '#6b7280', marginBottom: '12px', fontStyle: 'italic' },
    infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '14px' },
    statusBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    actionButton: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', marginTop: '16px' },
    viewButton: { background: '#3b82f6' },
    overdueButton: { background: '#ef4444' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    emptyIcon: { fontSize: '48px', marginBottom: '16px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📄 My Assignments</h1>
          <button 
            style={styles.backButton} 
            onClick={() => navigate('/student')}
            onMouseEnter={(e) => e.target.style.background = '#4b5563'}
            onMouseLeave={(e) => e.target.style.background = '#6b7280'}
          >
            ← Back to Dashboard
          </button>
          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {assignments.length > 0 ? (
          <div style={styles.assignmentsGrid}>
            {assignments.map(assignment => {
              const isOverdue = assignment.status === 'overdue' || 
                (assignment.status === 'pending' && new Date(assignment.dueDate) < new Date());
              
              return (
                <div 
                  key={assignment.id} 
                  style={styles.assignmentCard} 
                  onClick={() => handleAssignmentClick(assignment)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} 
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={styles.assignmentTitle}>{assignment.title}</div>
                  <div style={styles.assignmentSubject}>📚 {assignment.subject}</div>
                  {assignment.teacherName && (
                    <div style={styles.teacherInfo}>👨‍🏫 Assigned by: {assignment.teacherName}</div>
                  )}
                  
                  <div style={styles.infoRow}>
                    <span>📅 Due Date:</span>
                    <strong style={{ color: isOverdue ? '#ef4444' : '#1f2937' }}>
                      {assignment.dueDate}
                    </strong>
                  </div>
                  
                  <div style={styles.infoRow}>
                    <span>📊 Total Marks:</span>
                    <strong>{assignment.totalMarks}</strong>
                  </div>

                  {assignment.status === 'graded' && assignment.score !== undefined && (
                    <div style={styles.infoRow}>
                      <span>✅ Your Score:</span>
                      <strong style={{ color: '#10b981' }}>
                        {assignment.score}/{assignment.totalMarks} ({Math.round((assignment.score/assignment.totalMarks)*100)}%)
                      </strong>
                    </div>
                  )}

                  <div style={styles.infoRow}>
                    <span>Status:</span>
                    <span style={{
                      ...styles.statusBadge, 
                      background: getStatusColor(isOverdue ? 'overdue' : assignment.status).bg, 
                      color: getStatusColor(isOverdue ? 'overdue' : assignment.status).color
                    }}>
                      {isOverdue ? '⚠️ Overdue' : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </div>

                  <button
                    style={{
                      ...styles.actionButton,
                      ...(assignment.status === 'graded' ? styles.viewButton : {}),
                      ...(assignment.status === 'submitted' ? styles.viewButton : {}),
                      ...(isOverdue ? styles.overdueButton : {})
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignmentClick(assignment);
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    {assignment.status === 'pending' && (isOverdue ? '⚠️ Submit (Overdue)' : '📝 Start Assignment')}
                    {assignment.status === 'submitted' && '👁️ View Submission'}
                    {assignment.status === 'graded' && '📊 View Grade'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📄</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No assignments yet</p>
            <p>Your teachers haven't assigned any work yet.</p>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '16px' }}>
              💡 Assignments will appear here when your teachers create them
            </p>
          </div>
        )}
      </div>
    </div>
  );
}