import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AttemptAdaptiveQuiz.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

function AttemptAdaptiveQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [progress, setProgress] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (quizId) {
      startQuiz();
    }
  }, [quizId]);

  const getToken = () => localStorage.getItem('token');

  const startQuiz = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/adaptive-quiz/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      // If there's an incomplete attempt, offer to cancel it
      if (!data.success && data.error.includes('incomplete attempt') && data.attemptId) {
        console.log('Found incomplete attempt, offering to cancel...');
        const shouldCancel = window.confirm(
          'You have an incomplete quiz attempt. Would you like to cancel it and start fresh?'
        );
        
        if (shouldCancel) {
          // Cancel the incomplete attempt
          const cancelResponse = await fetch(
            `${API_BASE_URL}/api/adaptive-quiz/attempts/${data.attemptId}/cancel`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const cancelData = await cancelResponse.json();
          if (cancelData.success) {
            // Retry starting the quiz
            return startQuiz();
          } else {
            setError('Failed to cancel incomplete attempt');
            setLoading(false);
            return;
          }
        } else {
          setError(data.error);
          setLoading(false);
          return;
        }
      }

      if (data.success) {
        setAttemptId(data.data.attemptId);
        setProgress({
          correct_count: data.data.correct_count,
          target_correct_answers: data.data.target_correct_answers,
          current_difficulty: data.data.current_difficulty
        });
        await fetchNextQuestion(data.data.attemptId);
      } else {
        setError(data.error || 'Failed to start quiz');
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to start quiz:', error);
      setError('Failed to start quiz. Please try again.');
      setLoading(false);
    }
  };

  const fetchNextQuestion = async (attId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/adaptive-quiz/attempts/${attId}/next-question`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data.completed) {
          setQuizCompleted(true);
          await fetchResults(attId);
        } else {
          setCurrentQuestion(data.data.question);
          setProgress(data.data.progress);
          setAnswer('');
          setShowFeedback(false);
        }
      } else {
        setError(data.error || 'Failed to get next question');
      }
    } catch (error) {
      console.error('Failed to fetch next question:', error);
      setError('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError('Please enter an answer');
      return;
    }

    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/adaptive-quiz/attempts/${attemptId}/submit-answer`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            answer: answer.trim()
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setFeedbackData(data.data);
        setShowFeedback(true);
        setProgress({
          ...progress,
          correct_count: data.data.correct_count,
          total_answered: data.data.total_answered,
          current_difficulty: data.data.new_difficulty
        });
      } else {
        setError(data.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setError('Failed to submit answer');
    }
  };

  const handleNext = async () => {
    setShowFeedback(false);
    setFeedbackData(null);
    await fetchNextQuestion(attemptId);
  };

  const fetchResults = async (attId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/adaptive-quiz/attempts/${attId}/results`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showFeedback) {
      submitAnswer();
    } else if (e.key === 'Enter' && showFeedback) {
      handleNext();
    }
  };

  if (loading) {
    return (
      <div className="adaptive-quiz-container">
        <div className="loading">Loading quiz...</div>
      </div>
    );
  }

  if (quizCompleted && results) {
    return (
      <div className="adaptive-quiz-container">
        <div className="results-container">
          <div className="results-header">
            <h1>🎉 Quiz Completed!</h1>
            <h2>{results.quizTitle}</h2>
          </div>

          <div className="results-stats">
            <div className="stat-card">
              <div className="stat-value">{results.correct_count}</div>
              <div className="stat-label">Correct Answers</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{results.total_answered}</div>
              <div className="stat-label">Total Questions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{results.accuracy}%</div>
              <div className="stat-label">Accuracy</div>
            </div>
          </div>

          <div className="difficulty-progression">
            <h3>Difficulty Progression</h3>
            <div className="progression-chart">
              {results.difficulty_progression.map((item, index) => (
                <div 
                  key={index} 
                  className={`progression-item ${item.isCorrect ? 'correct' : 'incorrect'}`}
                >
                  <span className="question-num">Q{item.questionNumber}</span>
                  <span className="difficulty-level">
                    Level {item.difficulty}
                  </span>
                  <span className="result-icon">
                    {item.isCorrect ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="results-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/student/adaptive-quizzes')}
            >
              Back to Quizzes
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/student')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adaptive-quiz-container">
      <div className="quiz-header">
        <div className="progress-info">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ 
                width: `${(progress?.correct_count / progress?.target_correct_answers) * 100}%` 
              }}
            />
          </div>
          <div className="progress-text">
            {progress?.correct_count} / {progress?.target_correct_answers} correct answers
          </div>
        </div>
        
        <div className="difficulty-indicator">
          <span className="difficulty-label">Current Difficulty:</span>
          <span className={`difficulty-badge level-${progress?.current_difficulty}`}>
            Level {progress?.current_difficulty}
          </span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {currentQuestion && !showFeedback && (
        <div className="question-container">
          <div className="question-header">
            <span className="question-badge">Question</span>
            <span className={`difficulty-badge level-${currentQuestion.difficulty}`}>
              Difficulty {currentQuestion.difficulty}
            </span>
          </div>

          <div className="question-text">
            {currentQuestion.text}
          </div>

          {currentQuestion.choices && currentQuestion.choices.length > 0 ? (
            <div className="choices-container">
              {currentQuestion.choices.map((choice, index) => (
                <button
                  key={index}
                  className={`choice-button ${answer === choice ? 'selected' : ''}`}
                  onClick={() => setAnswer(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <div className="answer-input-container">
              <input
                type="text"
                className="answer-input"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer..."
                autoFocus
              />
            </div>
          )}

          <button 
            className="btn-submit"
            onClick={submitAnswer}
            disabled={!answer.trim()}
          >
            Submit Answer
          </button>
        </div>
      )}

      {showFeedback && feedbackData && (
        <div className={`feedback-container ${feedbackData.isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="feedback-icon">
            {feedbackData.isCorrect ? '✓' : '✗'}
          </div>
          <div className="feedback-message">
            {feedbackData.isCorrect ? 'Correct!' : 'Incorrect'}
          </div>
          {!feedbackData.isCorrect && (
            <div className="correct-answer-display">
              Correct answer: <strong>{feedbackData.correct_answer}</strong>
            </div>
          )}
          <div className="feedback-stats">
            <p>Correct: {feedbackData.correct_count} / {progress?.target_correct_answers}</p>
            <p>New Difficulty: Level {feedbackData.new_difficulty}</p>
          </div>
          <button className="btn-next" onClick={handleNext}>
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
}

export default AttemptAdaptiveQuiz;
