import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function ViewFeedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFeedback = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/mongo/teacher/feedback', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setFeedback(data.feedback || []);
        } else {
          setError(data.error || 'Failed to load feedback');
        }
      } catch (error) {
        console.error('Error loading feedback:', error);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [navigate]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '900px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
    card: { background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    backBtn: { padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500', marginBottom: '20px' },
    emptyState: { textAlign: 'center', padding: '60px 20px', color: '#64748b', background: 'white', borderRadius: '16px' },
    badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  };

  if (loading) {
    return <div style={styles.container}><div style={styles.content}><div style={{ textAlign: 'center', padding: '60px' }}><p>Loading feedback...</p></div></div></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        
        <div style={styles.header}>
          <h1 style={styles.title}>📬 Feedback History</h1>
          <p style={{ color: '#64748b' }}>View feedback you've sent to students</p>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

        {feedback.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px', marginBottom: '10px' }}>📭</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No feedback sent yet</p>
            <p>Feedback you send will appear here</p>
          </div>
        ) : (
          feedback.map((item) => (
            <div key={item._id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>To: {item.studentName}</span>
                <span style={{ ...styles.badge, background: '#dbeafe', color: '#1d4ed8' }}>{item.type}</span>
              </div>
              <p style={{ color: '#475569', marginBottom: '12px' }}>{item.content}</p>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{formatDate(item.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
