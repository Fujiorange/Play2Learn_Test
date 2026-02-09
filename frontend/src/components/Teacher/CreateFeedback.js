import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function CreateFeedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadStudents = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/mongo/teacher/students', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setStudents(data.students || []);
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to load students' });
        }
      } catch (error) {
        console.error('Error loading students:', error);
        setMessage({ type: 'error', text: 'Failed to connect to server' });
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent || !feedbackText.trim()) {
      setMessage({ type: 'error', text: 'Please select a student and enter feedback' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/mongo/teacher/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          type: feedbackType,
          content: feedbackText
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Feedback sent successfully!' });
        setSelectedStudent('');
        setFeedbackText('');
        setFeedbackType('general');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send feedback' });
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '32px',
    },
    content: {
      maxWidth: '800px',
      margin: '0 auto',
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '8px',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      marginTop: '24px',
    },
    label: {
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px',
      display: 'block',
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      minHeight: '150px',
      resize: 'vertical',
    },
    btn: {
      padding: '14px 24px',
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '16px',
    },
    backBtn: {
      padding: '10px 20px',
      background: '#f1f5f9',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '500',
      marginBottom: '20px',
    },
    message: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '20px',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backBtn} onClick={() => navigate('/teacher')}>
          ← Back to Dashboard
        </button>

        <div style={styles.card}>
          <h1 style={styles.title}>📝 Create Feedback</h1>
          <p style={{ color: '#64748b' }}>Send feedback to students and parents</p>

          {message.text && (
            <div style={{
              ...styles.message,
              background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#16a34a' : '#dc2626',
            }}>
              {message.text}
            </div>
          )}

          <form style={styles.form} onSubmit={handleSubmit}>
            <div>
              <label style={styles.label}>Select Student</label>
              <select
                style={styles.select}
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="">-- Select a student --</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.class || 'No class'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Feedback Type</label>
              <select
                style={styles.select}
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
              >
                <option value="general">General</option>
                <option value="academic">Academic Performance</option>
                <option value="behavior">Behavior</option>
                <option value="improvement">Areas for Improvement</option>
                <option value="praise">Praise & Recognition</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Feedback Message</label>
              <textarea
                style={styles.textarea}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Enter your feedback here..."
              />
            </div>

            <button 
              type="submit" 
              style={{ ...styles.btn, opacity: submitting ? 0.7 : 1 }}
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
