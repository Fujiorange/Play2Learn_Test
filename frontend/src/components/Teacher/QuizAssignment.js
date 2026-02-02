import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function QuizAssignment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [launchedQuizzes, setLaunchedQuizzes] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('available');
  const [launchModal, setLaunchModal] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [quizzesRes, launchedRes, classesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mongo/teacher/available-quizzes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }),
        fetch(`${API_BASE_URL}/api/mongo/teacher/my-launched-quizzes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }),
        fetch(`${API_BASE_URL}/api/mongo/teacher/my-classes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
      ]);

      const [quizzesData, launchedData, classesData] = await Promise.all([
        quizzesRes.json(),
        launchedRes.json(),
        classesRes.json()
      ]);

      if (quizzesData.success) {
        setAvailableQuizzes(quizzesData.quizzes || []);
      }
      if (launchedData.success) {
        setLaunchedQuizzes(launchedData.quizzes || []);
      }
      if (classesData.success) {
        setMyClasses(classesData.classes || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchQuiz = async () => {
    if (!launchModal || selectedClasses.length === 0) {
      setError('Please select at least one class');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/launch-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          quizId: launchModal._id,
          classes: selectedClasses
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Quiz launched successfully!');
        setLaunchModal(null);
        setSelectedClasses([]);
        fetchData();
      } else {
        setError(data.error || 'Failed to launch quiz');
      }
    } catch (error) {
      console.error('Launch quiz error:', error);
      setError('Failed to launch quiz');
    }
  };

  const handleRevokeQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to revoke this quiz? Students will no longer be able to access it.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/revoke-quiz/${quizId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Quiz revoked successfully');
        fetchData();
      } else {
        setError(data.error || 'Failed to revoke quiz');
      }
    } catch (error) {
      console.error('Revoke quiz error:', error);
      setError('Failed to revoke quiz');
    }
  };

  const toggleClassSelection = (className) => {
    setSelectedClasses(prev => 
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const selectAllClasses = () => {
    setSelectedClasses([...myClasses]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '32px',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0,
    },
    backButton: {
      padding: '10px 20px',
      background: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    tabs: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
    },
    tab: {
      padding: '12px 24px',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    activeTab: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      borderColor: '#10b981',
    },
    alert: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '20px',
      fontSize: '14px',
      fontWeight: '500',
    },
    successAlert: {
      background: '#d1fae5',
      color: '#065f46',
      border: '1px solid #34d399',
    },
    errorAlert: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #f87171',
    },
    quizGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px',
    },
    quizCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    quizTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px',
    },
    quizDescription: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '16px',
    },
    quizStats: {
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
      flexWrap: 'wrap',
    },
    stat: {
      fontSize: '13px',
      color: '#4b5563',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
    },
    launchedBadge: {
      background: '#d1fae5',
      color: '#065f46',
    },
    notLaunchedBadge: {
      background: '#fee2e2',
      color: '#991b1b',
    },
    launchButton: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      marginTop: '12px',
    },
    revokeButton: {
      padding: '10px 20px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      marginTop: '12px',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '20px',
    },
    classCheckbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px',
      background: '#f9fafb',
      borderRadius: '8px',
      marginBottom: '8px',
      cursor: 'pointer',
    },
    classCheckboxSelected: {
      background: '#d1fae5',
    },
    modalActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
    },
    cancelButton: {
      flex: 1,
      padding: '12px',
      background: '#e5e7eb',
      color: '#374151',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    confirmButton: {
      flex: 1,
      padding: '12px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '16px',
      color: '#6b7280',
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
    classInfo: {
      fontSize: '13px',
      color: '#6b7280',
      marginTop: '8px',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ fontSize: '24px', color: '#6b7280', fontWeight: '600' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎯 Quiz Assignment</h1>
          <button style={styles.backButton} onClick={() => navigate('/teacher')}>
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div style={{...styles.alert, ...styles.errorAlert}}>
            {error}
            <button 
              onClick={() => setError('')}
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
            >✕</button>
          </div>
        )}

        {success && (
          <div style={{...styles.alert, ...styles.successAlert}}>
            {success}
            <button 
              onClick={() => setSuccess('')}
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
            >✕</button>
          </div>
        )}

        {myClasses.length === 0 && (
          <div style={{...styles.alert, ...styles.errorAlert}}>
            ⚠️ You don't have any classes assigned yet. Please contact your school administrator.
          </div>
        )}

        <div style={styles.tabs}>
          <button
            style={{...styles.tab, ...(activeTab === 'available' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('available')}
          >
            Available Quizzes ({availableQuizzes.filter(q => !q.launchedByMe).length})
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'launched' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('launched')}
          >
            My Launched Quizzes ({launchedQuizzes.length})
          </button>
        </div>

        {activeTab === 'available' && (
          <div style={styles.quizGrid}>
            {availableQuizzes.filter(q => !q.launchedByMe).length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <p style={{ fontSize: '18px', fontWeight: '600' }}>No quizzes available</p>
                <p>Quizzes created by P2L admin will appear here</p>
              </div>
            ) : (
              availableQuizzes.filter(q => !q.launchedByMe).map(quiz => (
                <div key={quiz._id} style={styles.quizCard}>
                  <div style={styles.quizTitle}>{quiz.title}</div>
                  <div style={styles.quizDescription}>
                    {quiz.description || 'No description'}
                  </div>
                  <div style={styles.quizStats}>
                    <span style={styles.stat}>
                      🎯 Target: {quiz.adaptive_config?.target_correct_answers || 10} correct
                    </span>
                    <span style={styles.stat}>
                      📊 {quiz.adaptive_config?.difficulty_progression || 'gradual'} progression
                    </span>
                  </div>
                  <span style={{...styles.badge, ...styles.notLaunchedBadge}}>
                    Not Launched
                  </span>
                  <button
                    style={styles.launchButton}
                    onClick={() => {
                      setLaunchModal(quiz);
                      setSelectedClasses([]);
                    }}
                    disabled={myClasses.length === 0}
                  >
                    🚀 Launch Quiz
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'launched' && (
          <div style={styles.quizGrid}>
            {launchedQuizzes.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
                <p style={{ fontSize: '18px', fontWeight: '600' }}>No launched quizzes</p>
                <p>Launch quizzes from the Available tab</p>
              </div>
            ) : (
              launchedQuizzes.map(quiz => (
                <div key={quiz._id} style={styles.quizCard}>
                  <div style={styles.quizTitle}>{quiz.title}</div>
                  <div style={styles.quizDescription}>
                    {quiz.description || 'No description'}
                  </div>
                  <span style={{...styles.badge, ...styles.launchedBadge}}>
                    ✅ Launched
                  </span>
                  <div style={styles.classInfo}>
                    📚 Classes: {quiz.launched_for_classes?.join(', ') || 'All'}
                  </div>
                  <div style={styles.classInfo}>
                    📅 Launched: {formatDate(quiz.launched_at)}
                  </div>
                  {quiz.launch_end_date && (
                    <div style={styles.classInfo}>
                      ⏰ Ends: {formatDate(quiz.launch_end_date)}
                    </div>
                  )}
                  <button
                    style={styles.revokeButton}
                    onClick={() => handleRevokeQuiz(quiz._id)}
                  >
                    🛑 Revoke Quiz
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Launch Modal */}
        {launchModal && (
          <div style={styles.modal} onClick={() => setLaunchModal(null)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>🚀 Launch "{launchModal.title}"</h2>
              <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                Select the classes that should have access to this quiz:
              </p>
              
              <button
                onClick={selectAllClasses}
                style={{ 
                  marginBottom: '12px', 
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Select All Classes
              </button>

              {myClasses.map(className => (
                <div
                  key={className}
                  style={{
                    ...styles.classCheckbox,
                    ...(selectedClasses.includes(className) ? styles.classCheckboxSelected : {})
                  }}
                  onClick={() => toggleClassSelection(className)}
                >
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(className)}
                    onChange={() => {}}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{className}</span>
                </div>
              ))}

              <div style={styles.modalActions}>
                <button style={styles.cancelButton} onClick={() => setLaunchModal(null)}>
                  Cancel
                </button>
                <button 
                  style={styles.confirmButton} 
                  onClick={handleLaunchQuiz}
                  disabled={selectedClasses.length === 0}
                >
                  Launch Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
