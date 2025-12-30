import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function ViewFeedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadFeedback = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockFeedback = [
        { id: 1, child: 'Emma Johnson', from: 'Ms. Sarah Johnson', date: '2024-12-10', subject: 'Excellent Progress in Mathematics', category: 'academic', status: 'unread', message: 'Emma has shown remarkable improvement in her mathematics skills this semester.' },
        { id: 2, child: 'Liam Johnson', from: 'Mr. David Smith', date: '2024-12-08', subject: 'Behavior in Class', category: 'behavior', status: 'read', message: 'Liam has been very attentive and participative in class discussions.' },
        { id: 3, child: 'Emma Johnson', from: 'Dr. Emily Chen', date: '2024-12-05', subject: 'Science Project Outstanding', category: 'academic', status: 'read', message: 'Emma\'s science project was exceptional and showed great creativity.' },
      ];
      
      setFeedbackList(mockFeedback);
      setLoading(false);
    };

    loadFeedback();
  }, [navigate]);

  const filteredFeedback = filter === 'all' ? feedbackList : feedbackList.filter(f => f.status === filter);

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterButtons: { display: 'flex', gap: '8px' },
    filterButton: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: 'white' },
    filterButtonActive: { borderColor: '#10b981', background: '#d1fae5', color: '#065f46' },
    feedbackList: { display: 'flex', flexDirection: 'column', gap: '16px' },
    feedbackCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', cursor: 'pointer', transition: 'all 0.3s' },
    feedbackHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' },
    feedbackInfo: { flex: 1 },
    feedbackChild: { fontSize: '14px', color: '#10b981', fontWeight: '600', marginBottom: '4px' },
    feedbackFrom: { fontSize: '16px', fontWeight: '600', color: '#1f2937' },
    feedbackDate: { fontSize: '13px', color: '#6b7280', marginTop: '4px' },
    feedbackSubject: { fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
    feedbackMessage: { fontSize: '14px', color: '#6b7280', lineHeight: '1.5' },
    badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginTop: '12px', marginRight: '8px' },
    unreadBadge: { background: '#dbeafe', color: '#1e40af' },
    readBadge: { background: '#f3f4f6', color: '#6b7280' },
    categoryBadge: { background: '#fef3c7', color: '#92400e' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>📬 Teacher Feedback</h1>
            <button style={styles.backButton} onClick={() => navigate('/parent')}>← Back to Dashboard</button>
          </div>
          <div style={styles.filterButtons}>
            {['all', 'unread', 'read'].map(status => (
              <button key={status} onClick={() => setFilter(status)} style={{...styles.filterButton, ...(filter === status ? styles.filterButtonActive : {})}}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredFeedback.length > 0 ? (
          <div style={styles.feedbackList}>
            {filteredFeedback.map(feedback => (
              <div key={feedback.id} style={styles.feedbackCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={styles.feedbackHeader}>
                  <div style={styles.feedbackInfo}>
                    <div style={styles.feedbackChild}>👤 {feedback.child}</div>
                    <div style={styles.feedbackFrom}>From: {feedback.from}</div>
                    <div style={styles.feedbackDate}>{feedback.date}</div>
                  </div>
                </div>
                <div style={styles.feedbackSubject}>{feedback.subject}</div>
                <div style={styles.feedbackMessage}>{feedback.message}</div>
                <div>
                  <span style={{...styles.badge, ...(feedback.status === 'unread' ? styles.unreadBadge : styles.readBadge)}}>
                    {feedback.status === 'unread' ? '🔵 Unread' : '✓ Read'}
                  </span>
                  <span style={{...styles.badge, ...styles.categoryBadge}}>📁 {feedback.category}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No feedback found</p>
            <p>You don't have any {filter === 'all' ? '' : filter} feedback yet</p>
          </div>
        )}
      </div>
    </div>
  );
}