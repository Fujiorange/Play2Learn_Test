// PlacementQuiz.js - Placement Quiz (First Time)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function PlacementQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadQuiz = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        console.log('📡 Generating placement quiz...');
        const result = await studentService.generatePlacementQuiz();
        console.log('📥 Quiz result:', result);

        if (result.success) {
          setQuizData(result);
          setAnswers(Array(result.total_questions).fill(''));
        } else {
          setError(result.error || 'Failed to load quiz');
          // If placement already completed, redirect
          if (result.error?.includes('already completed')) {
            setTimeout(() => navigate('/student/quiz/attempt'), 2000);
          }
        }
      } catch (error) {
        console.error('❌ Load quiz error:', error);
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [navigate]);

  const handleAnswerChange = (index, value) => {
    // Accept any value (for both numeric and multiple choice answers)
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.total_questions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions answered
    const unanswered = answers.filter(a => a === '').length;
    if (unanswered > 0) {
      if (!window.confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('📤 Submitting placement quiz...');
      console.log('Quiz ID:', quizData.quiz_id);
      console.log('Answers:', answers);

      const result = await studentService.submitPlacementQuiz(
        quizData.quiz_id,
        answers.map(a => a === '' ? '' : a) // Send answers as-is (strings or numbers)
      );

      console.log('📥 Submit result:', result);

      if (result.success) {
        // Navigate to result page with data
        navigate('/student/quiz/result', { 
          state: { 
            result: result.result,
            quizType: 'placement'
          } 
        });
      } else {
        setError(result.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '900px', margin: '0 auto' },
    
    header: { background: 'white', borderRadius: '16px', padding: '24px 32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    badge: { padding: '8px 16px', background: '#3b82f6', color: 'white', borderRadius: '12px', fontSize: '14px', fontWeight: '600' },
    subtitle: { fontSize: '15px', color: '#6b7280', marginTop: '8px' },
    
    progressBar: { width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginTop: '16px' },
    progressFill: { height: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', transition: 'width 0.3s' },
    
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
    
    quizCard: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    
    questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    questionNumber: { fontSize: '14px', fontWeight: '600', color: '#6b7280' },
    operationBadge: { padding: '4px 12px', background: '#f0f9ff', color: '#1e40af', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid #3b82f6' },
    
    questionText: { fontSize: '32px', fontWeight: '700', color: '#1f2937', textAlign: 'center', marginBottom: '32px' },
    
    answerSection: { maxWidth: '300px', margin: '0 auto 32px' },
    answerLabel: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    answerInput: { width: '100%', padding: '16px', fontSize: '24px', fontWeight: '600', textAlign: 'center', border: '3px solid #e5e7eb', borderRadius: '12px', transition: 'all 0.3s' },
    
    navigationButtons: { display: 'flex', gap: '12px', justifyContent: 'center' },
    navButton: { padding: '12px 24px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    navButtonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
    
    allQuestionsCard: { background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' },
    questionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' },
    questionBox: { padding: '12px', textAlign: 'center', borderRadius: '8px', border: '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.3s' },
    questionBoxActive: { borderColor: '#3b82f6', background: '#f0f9ff' },
    questionBoxAnswered: { background: '#d1fae5', borderColor: '#34d399' },
    questionBoxNumber: { fontSize: '16px', fontWeight: '700', color: '#1f2937' },
    
    submitButton: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s' },
    
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading quiz...</div></div>);

  if (!quizData) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.errorMessage}>
            ⚠️ {error || 'Failed to load quiz'}
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / quizData.total_questions) * 100;
  const answeredCount = answers.filter(a => a !== '').length;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🎯 Placement Quiz</h1>
            <div style={styles.badge}>Primary 1 Math</div>
          </div>
          <p style={styles.subtitle}>
            This quiz will determine your starting profile (1-10). Take your time and do your best!
          </p>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${progress}%`}} />
          </div>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        {/* Current Question */}
        <div style={styles.quizCard}>
          <div style={styles.questionHeader}>
            <span style={styles.questionNumber}>
              Question {currentQuestion + 1} of {quizData.total_questions}
            </span>
            <span style={styles.operationBadge}>
              {quizData.questions[currentQuestion].operation.toUpperCase()}
            </span>
          </div>

          <div style={styles.questionText}>
            {quizData.questions[currentQuestion].question_text}
          </div>

          <div style={styles.answerSection}>
            {quizData.questions[currentQuestion].choices && quizData.questions[currentQuestion].choices.length > 0 ? (
              // Multiple choice question
              <div>
                <label style={styles.answerLabel}>Select Your Answer:</label>
                {quizData.questions[currentQuestion].choices.map((choice, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    marginBottom: '8px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: answers[currentQuestion] === choice ? '#f0f9ff' : 'white',
                    borderColor: answers[currentQuestion] === choice ? '#3b82f6' : '#e5e7eb',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleAnswerChange(currentQuestion, choice)}
                  onMouseEnter={(e) => {
                    if (answers[currentQuestion] !== choice) {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (answers[currentQuestion] !== choice) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      checked={answers[currentQuestion] === choice}
                      onChange={() => handleAnswerChange(currentQuestion, choice)}
                      style={{ marginRight: '8px' }}
                    />
                    <span>{choice}</span>
                  </div>
                ))}
              </div>
            ) : (
              // Text input question
              <div>
                <label style={styles.answerLabel}>Your Answer:</label>
                <input
                  type="text"
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                  placeholder="Enter your answer"
                  style={styles.answerInput}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  autoFocus
                />
              </div>
            )}
          </div>

          <div style={styles.navigationButtons}>
            <button
              style={{
                ...styles.navButton,
                ...(currentQuestion === 0 ? styles.navButtonDisabled : {})
              }}
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              onMouseEnter={(e) => currentQuestion > 0 && (e.target.style.background = '#4b5563')}
              onMouseLeave={(e) => currentQuestion > 0 && (e.target.style.background = '#6b7280')}
            >
              ← Previous
            </button>
            <button
              style={{
                ...styles.navButton,
                ...(currentQuestion === quizData.total_questions - 1 ? styles.navButtonDisabled : {})
              }}
              onClick={handleNext}
              disabled={currentQuestion === quizData.total_questions - 1}
              onMouseEnter={(e) => currentQuestion < quizData.total_questions - 1 && (e.target.style.background = '#4b5563')}
              onMouseLeave={(e) => currentQuestion < quizData.total_questions - 1 && (e.target.style.background = '#6b7280')}
            >
              Next →
            </button>
          </div>
        </div>

        {/* All Questions Overview */}
        <div style={styles.allQuestionsCard}>
          <div style={styles.sectionTitle}>
            📊 Questions Overview ({answeredCount}/{quizData.total_questions} answered)
          </div>
          <div style={styles.questionsGrid}>
            {quizData.questions.map((_, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.questionBox,
                  ...(idx === currentQuestion ? styles.questionBoxActive : {}),
                  ...(answers[idx] !== '' ? styles.questionBoxAnswered : {})
                }}
                onClick={() => setCurrentQuestion(idx)}
                onMouseEnter={(e) => {
                  if (idx !== currentQuestion) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (idx !== currentQuestion) {
                    e.currentTarget.style.borderColor = answers[idx] !== '' ? '#34d399' : '#e5e7eb';
                  }
                }}
              >
                <div style={styles.questionBoxNumber}>
                  {answers[idx] !== '' ? '✓' : idx + 1}
                </div>
              </div>
            ))}
          </div>

          <button
            style={styles.submitButton}
            onClick={handleSubmit}
            disabled={submitting}
            onMouseEnter={(e) => !submitting && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !submitting && (e.target.style.transform = 'translateY(0)')}
          >
            {submitting ? '⏳ Submitting...' : `🚀 Submit Placement Quiz (${answeredCount}/${quizData.total_questions} answered)`}
          </button>
        </div>
      </div>
    </div>
  );
}