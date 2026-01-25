import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getQuestionStats } from '../../services/p2lAdminService';
import './AdaptiveQuizCreator.css';

function AdaptiveQuizCreator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_correct: 10,
    difficulty_progression: 'gradual',
    difficulty_distribution: {
      1: 10,
      2: 10,
      3: 10,
      4: 0,
      5: 0
    }
  });
  const [availableCounts, setAvailableCounts] = useState({});
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    fetchQuestionStats();
  }, []);

  const fetchQuestionStats = async () => {
    try {
      const result = await getQuestionStats();
      if (result.success && result.data) {
        setAvailableCounts(result.data.byDifficulty || {});
        setTotalQuestions(result.data.totalActive || 0);
        
        // Check if there are no questions at all
        if (result.data.totalActive === 0) {
          setWarnings([
            'No questions found in the question bank. Please add questions before creating a quiz.',
            'You can use the Question Bank page to add questions manually, or run the seed script to add sample questions.'
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch question stats:', error);
      setError('Failed to load question statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDifficultyChange = (difficulty, value) => {
    const intValue = parseInt(value) || 0;
    setFormData({
      ...formData,
      difficulty_distribution: {
        ...formData.difficulty_distribution,
        [difficulty]: intValue
      }
    });
  };

  const getTotalQuestions = () => {
    return Object.values(formData.difficulty_distribution).reduce((sum, val) => sum + val, 0);
  };

  const validateForm = () => {
    setWarnings([]);
    
    if (!formData.title.trim()) {
      setError('Quiz title is required');
      return false;
    }

    const total = getTotalQuestions();
    if (total === 0) {
      setError('Please select at least one question');
      return false;
    }

    // Check if enough questions are available for each difficulty
    const newWarnings = [];
    for (const [diff, count] of Object.entries(formData.difficulty_distribution)) {
      if (count > 0) {
        const available = availableCounts[diff] || 0;
        if (count > available) {
          setError(
            `Not enough questions for difficulty ${diff}. You requested ${count} but only ${available} ${
              available === 1 ? 'is' : 'are'
            } available. Please add more questions to the question bank or reduce the number requested.`
          );
          return false;
        } else if (available === 0) {
          newWarnings.push(`Note: No questions available at difficulty level ${diff}`);
        }
      }
    }
    
    if (newWarnings.length > 0) {
      setWarnings(newWarnings);
    }

    if (formData.target_correct > total) {
      setError('Target correct answers cannot exceed total questions');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/p2ladmin/quizzes/generate-adaptive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          difficulty_distribution: formData.difficulty_distribution,
          target_correct: formData.target_correct,
          difficulty_progression: formData.difficulty_progression
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Adaptive quiz created successfully!');
        setTimeout(() => {
          navigate('/p2ladmin/quizzes');
        }, 2000);
      } else {
        // Display error with suggestion if available
        let errorMsg = data.error || 'Failed to create quiz';
        if (data.suggestion) {
          errorMsg += '\n\nSuggestion: ' + data.suggestion;
        }
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Failed to create quiz:', error);
      setError('Failed to create quiz. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="adaptive-quiz-creator">
      <header className="page-header">
        <div>
          <h1>Create Adaptive Quiz</h1>
          <Link to="/p2ladmin/quizzes" className="back-link">← Back to Quiz Manager</Link>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {warnings.length > 0 && (
        <div className="warning-message">
          {warnings.map((warning, index) => (
            <div key={index}>⚠️ {warning}</div>
          ))}
        </div>
      )}
      {totalQuestions === 0 && !loading && (
        <div className="info-message">
          <strong>No questions found in the question bank!</strong>
          <p>
            To create an adaptive quiz, you first need to add questions to the question bank:
          </p>
          <ul>
            <li>Go to <Link to="/p2ladmin/question-bank">Question Bank</Link> to add questions manually</li>
            <li>Or run the seed script: <code>node backend/seed-questions.js</code> to add sample questions</li>
          </ul>
        </div>
      )}

      <div className="creator-container">
        <form onSubmit={handleSubmit} className="quiz-form">
          <div className="form-section">
            <h2>Quiz Details</h2>
            
            <div className="form-group">
              <label>Quiz Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Adaptive Math Quiz Level 1"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Describe what this quiz covers..."
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Adaptive Settings</h2>
            
            <div className="form-group">
              <label>Target Correct Answers</label>
              <input
                type="number"
                name="target_correct"
                value={formData.target_correct}
                onChange={handleInputChange}
                min="1"
                max="100"
              />
              <p className="help-text">
                Students need to get this many correct answers to complete the quiz
              </p>
            </div>

            <div className="form-group">
              <label>Difficulty Progression Strategy</label>
              <select
                name="difficulty_progression"
                value={formData.difficulty_progression}
                onChange={handleInputChange}
              >
                <option value="gradual">Gradual (adjusts based on recent 3 answers)</option>
                <option value="immediate">Immediate (adjusts after each answer)</option>
                <option value="ml-based">ML-Based (adjusts based on overall accuracy)</option>
              </select>
              <p className="help-text">
                How the quiz adjusts difficulty based on student performance
              </p>
            </div>
          </div>

          <div className="form-section">
            <h2>Question Distribution by Difficulty</h2>
            <p className="section-description">
              Specify how many questions of each difficulty level to include in the quiz pool
            </p>
            
            <div className="difficulty-grid">
              {[1, 2, 3, 4, 5].map(diff => (
                <div key={diff} className="difficulty-input-group">
                  <label>
                    <span className="difficulty-badge">Difficulty {diff}</span>
                    <span className="available-count">
                      ({availableCounts[diff] || 0} available)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.difficulty_distribution[diff]}
                    onChange={(e) => handleDifficultyChange(diff, e.target.value)}
                    min="0"
                    max={availableCounts[diff] || 0}
                  />
                </div>
              ))}
            </div>

            <div className="quiz-summary">
              <p><strong>Total Questions in Pool:</strong> {getTotalQuestions()}</p>
              <p><strong>Target Correct Answers:</strong> {formData.target_correct}</p>
              <p>
                <strong>Note:</strong> Students will answer questions adaptively from this pool 
                until they reach {formData.target_correct} correct answers. The quiz may end 
                before all questions are used.
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Create Adaptive Quiz
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/p2ladmin/quizzes')} 
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="info-panel">
          <h3>How Adaptive Quizzes Work</h3>
          <div className="info-content">
            <div className="info-item">
              <span className="icon">🎯</span>
              <div>
                <h4>Dynamic Difficulty</h4>
                <p>Quiz difficulty adjusts in real-time based on student performance</p>
              </div>
            </div>
            
            <div className="info-item">
              <span className="icon">📊</span>
              <div>
                <h4>Performance Tracking</h4>
                <p>Students start at difficulty 1 and progress based on correct answers</p>
              </div>
            </div>
            
            <div className="info-item">
              <span className="icon">✨</span>
              <div>
                <h4>Machine Learning</h4>
                <p>Algorithm learns from student responses to provide optimal challenge</p>
              </div>
            </div>

            <div className="info-item">
              <span className="icon">🏆</span>
              <div>
                <h4>Goal-Based</h4>
                <p>Quiz ends when student achieves target number of correct answers</p>
              </div>
            </div>
          </div>

          <div className="progression-strategies">
            <h4>Progression Strategies:</h4>
            <ul>
              <li><strong>Gradual:</strong> Looks at last 3 answers to decide difficulty change</li>
              <li><strong>Immediate:</strong> Increases/decreases difficulty after each answer</li>
              <li><strong>ML-Based:</strong> Uses overall accuracy to determine optimal difficulty</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdaptiveQuizCreator;
