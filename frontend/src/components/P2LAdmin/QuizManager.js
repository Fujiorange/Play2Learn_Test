// Quiz Manager Component
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes, updateQuiz, getQuestions, triggerQuizGeneration, getQuizGenerationStats } from '../../services/p2lAdminService';
import './QuizManager.css';

function QuizManager() {
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [generationStats, setGenerationStats] = useState(null);
  const [questionFilters, setQuestionFilters] = useState({
    topic: '',
    difficulty: ''
  });
  const [triggerFormData, setTriggerFormData] = useState({
    quiz_level: 1
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    question_ids: [],
    quiz_type: 'placement',
    is_adaptive: false,
    target_correct_answers: 10
  });

  useEffect(() => {
    fetchData();
    fetchGenerationStats();
  }, []);

  const fetchData = async () => {
    try {
      const [quizzesRes, questionsRes] = await Promise.all([
        getQuizzes(),
        getQuestions()
      ]);
      setQuizzes(quizzesRes.data || []);
      setQuestions(questionsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGenerationStats = async () => {
    try {
      const statsRes = await getQuizGenerationStats();
      setGenerationStats(statsRes.data || null);
    } catch (error) {
      console.error('Failed to fetch generation stats:', error);
    }
  };

  const handleTriggerQuizGeneration = async () => {
    setTriggerLoading(true);
    try {
      const result = await triggerQuizGeneration(triggerFormData.quiz_level);
      if (result.success) {
        alert(`Quiz generated successfully! Quiz ID: ${result.data?._id || 'N/A'}`);
        setShowTriggerModal(false);
        fetchData();
        fetchGenerationStats();
      } else {
        alert(`Failed to generate quiz: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to trigger quiz generation:', error);
      alert(`Failed to generate quiz: ${error.message || 'Unknown error'}`);
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Auto-sync quiz_type and is_adaptive for consistency
    if (name === 'quiz_type') {
      setFormData({ 
        ...formData, 
        quiz_type: value,
        is_adaptive: value === 'adaptive' // Auto-enable adaptive mode for adaptive quizzes
      });
    } else if (name === 'is_adaptive') {
      setFormData({ 
        ...formData, 
        is_adaptive: checked,
        // If enabling adaptive mode, set quiz_type to adaptive
        quiz_type: checked ? 'adaptive' : formData.quiz_type
      });
    } else {
      setFormData({ 
        ...formData, 
        [name]: newValue
      });
    }
  };

  const handleQuestionToggle = (questionId) => {
    const isSelected = formData.question_ids.includes(questionId);
    const newIds = isSelected
      ? formData.question_ids.filter(id => id !== questionId)
      : [...formData.question_ids, questionId];
    setFormData({ ...formData, question_ids: newIds });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only allow editing, not creating
      if (!editingQuiz) {
        alert('Manual quiz creation is disabled. Use "Trigger Quiz Generation" instead.');
        return;
      }
      
      // Transform question_ids to questions array format expected by backend
      const quizData = {
        title: formData.title,
        description: formData.description,
        questions: formData.question_ids.map(id => ({ question_id: id })),
        quiz_type: formData.quiz_type,
        is_adaptive: formData.is_adaptive
      };
      
      // Add adaptive config if adaptive mode is enabled
      if (formData.is_adaptive) {
        quizData.adaptive_config = {
          target_correct_answers: formData.target_correct_answers
        };
      }
      
      await updateQuiz(editingQuiz._id, quizData);
      alert('Quiz updated successfully');
      setShowForm(false);
      setEditingQuiz(null);
      setFormData({
        title: '',
        description: '',
        question_ids: [],
        quiz_type: 'placement',
        is_adaptive: false,
        target_correct_answers: 10
      });
      fetchData();
    } catch (error) {
      console.error('Failed to save quiz:', error);
      alert(error.message || 'Failed to save quiz');
    }
  };

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description || '',
      question_ids: quiz.questions?.map(q => q.question_id?._id || q.question_id) || [],
      quiz_type: quiz.quiz_type || 'placement',
      is_adaptive: quiz.is_adaptive !== undefined ? quiz.is_adaptive : false,
      target_correct_answers: quiz.adaptive_config?.target_correct_answers || 10
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingQuiz(null);
    setFormData({
      title: '',
      description: '',
      question_ids: [],
      quiz_type: 'placement',
      is_adaptive: false,
      target_correct_answers: 10
    });
    setQuestionFilters({ topic: '', difficulty: '' });
  };

  // Get unique topics from questions (memoized)
  const uniqueTopics = useMemo(() => {
    return [...new Set(questions.map(q => q.topic).filter(Boolean))].sort();
  }, [questions]);
  
  // Get unique difficulty levels from questions (memoized)
  const uniqueDifficulties = useMemo(() => {
    return [...new Set(questions.map(q => q.difficulty).filter(Boolean))].sort((a, b) => a - b);
  }, [questions]);

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const topicMatch = !questionFilters.topic || q.topic === questionFilters.topic;
      const difficultyMatch = !questionFilters.difficulty || q.difficulty === Number(questionFilters.difficulty);
      return topicMatch && difficultyMatch;
    });
  }, [questions, questionFilters]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="quiz-manager">
      <header className="page-header">
        <div>
          <h1>Quiz Manager</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            View and manage auto-generated quizzes. Manual creation is disabled.
          </p>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <button onClick={() => setShowTriggerModal(true)} className="btn-primary btn-generate">
          ⚡ Trigger Quiz Generation
        </button>
      </header>

      {/* Generation Stats Panel */}
      {generationStats && (
        <div className="generation-stats-panel">
          <h3>📊 Question Pool Status</h3>
          <div className="stats-grid">
            {generationStats.quizLevelStats?.map((stat) => (
              <div key={stat.quiz_level} className={`stat-item ${stat.count < 40 ? 'low-count' : ''}`}>
                <span className="stat-label">Quiz Level {stat.quiz_level}</span>
                <span className="stat-value">{stat.count} questions</span>
                {stat.count < 40 && <span className="stat-warning">⚠️ Need {40 - stat.count} more</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trigger Quiz Generation Modal */}
      {showTriggerModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>⚡ Trigger Quiz Generation</h2>
            <p className="modal-description">
              Generate a new adaptive quiz with 20 questions. The system will automatically 
              select questions using freshness weighting and difficulty progression.
            </p>
            
            <div className="form-group">
              <label>Select Quiz Level *</label>
              <select
                value={triggerFormData.quiz_level}
                onChange={(e) => setTriggerFormData({ ...triggerFormData, quiz_level: parseInt(e.target.value) })}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                  <option key={level} value={level}>Quiz Level {level}</option>
                ))}
              </select>
              <small>Requires at least 40 questions in the selected quiz level</small>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={handleTriggerQuizGeneration} 
                className="btn-submit"
                disabled={triggerLoading}
              >
                {triggerLoading ? 'Generating...' : 'Generate Quiz'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowTriggerModal(false)} 
                className="btn-cancel"
                disabled={triggerLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Edit Quiz</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Quiz Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
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
                />
              </div>

              <div className="form-group">
                <label>Quiz Type *</label>
                <select
                  name="quiz_type"
                  value={formData.quiz_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="placement">Placement Quiz (for student initial assessment)</option>
                  <option value="adaptive">Adaptive Quiz (for ongoing practice)</option>
                </select>
                <p className="help-text">
                  Placement quizzes are used for initial student assessment. Adaptive quizzes are used for ongoing practice with difficulty adjustment.
                </p>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_adaptive"
                    checked={formData.is_adaptive}
                    onChange={handleInputChange}
                    disabled={formData.quiz_type === 'placement'}
                  />
                  {' '}Enable Adaptive Mode
                </label>
                <p className="help-text">
                  {formData.quiz_type === 'placement' 
                    ? 'Placement quizzes do not use adaptive mode' 
                    : 'Adaptive quizzes adjust difficulty based on student performance'}
                </p>
              </div>

              {formData.is_adaptive && (
                <div className="form-group">
                  <label>How many questions correct to end the quiz? *</label>
                  <input
                    type="number"
                    name="target_correct_answers"
                    value={formData.target_correct_answers}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    required
                  />
                  <p className="help-text">
                    Students need to get this many correct answers to complete the adaptive quiz
                  </p>
                </div>
              )}

              <div className="form-group">
                <label>Select Questions ({formData.question_ids.length} selected)</label>
                
                {/* Filter controls */}
                <div className="question-filters">
                  <div className="filter-group">
                    <label htmlFor="topic-filter">Filter by Topic:</label>
                    <select
                      id="topic-filter"
                      value={questionFilters.topic}
                      onChange={(e) => setQuestionFilters({ ...questionFilters, topic: e.target.value })}
                    >
                      <option value="">All Topics</option>
                      {uniqueTopics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label htmlFor="difficulty-filter">Filter by Difficulty:</label>
                    <select
                      id="difficulty-filter"
                      value={questionFilters.difficulty}
                      onChange={(e) => setQuestionFilters({ ...questionFilters, difficulty: e.target.value })}
                    >
                      <option value="">All Difficulties</option>
                      {uniqueDifficulties.map(diff => (
                        <option key={diff} value={diff}>Level {diff}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="questions-selector">
                  {filteredQuestions.length === 0 ? (
                    <p className="no-questions">No questions match the selected filters.</p>
                  ) : (
                    filteredQuestions.map((q) => (
                      <div key={q._id} className="question-option">
                        <input
                          type="checkbox"
                          id={`question-${q._id}`}
                          checked={formData.question_ids.includes(q._id)}
                          onChange={() => handleQuestionToggle(q._id)}
                        />
                        <label htmlFor={`question-${q._id}`} className="question-preview">
                          <span className="question-text">
                            {q.text.length > 80 ? `${q.text.substring(0, 80)}...` : q.text}
                          </span>
                          <div className="question-meta">
                            {q.topic && <span className="badge topic-badge">📚 {q.topic}</span>}
                            <span className="badge difficulty-badge">Difficulty: {q.difficulty}</span>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  Update Quiz
                </button>
                <button type="button" onClick={cancelForm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="quizzes-grid">
        {quizzes.length === 0 ? (
          <p className="no-data">No quizzes found. Use "Trigger Quiz Generation" to create a quiz.</p>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz._id} className="quiz-card">
              <div className="quiz-header">
                <h3>{quiz.title}</h3>
                {quiz.is_auto_generated && (
                  <span className="auto-generated-badge">🤖 Auto-generated</span>
                )}
              </div>
              {quiz.generation_trigger && quiz.generation_trigger !== 'manual' && (
                <div className="generation-info">
                  <span className="trigger-badge">Trigger: {quiz.generation_trigger}</span>
                  {quiz.freshness_score != null && (
                    <span className="freshness-score">Freshness: {quiz.freshness_score.toFixed(1)}</span>
                  )}
                </div>
              )}
              <p className="quiz-description">{quiz.description || 'No description'}</p>
              <div className="quiz-meta">
                <p>Questions: {quiz.questions?.length || 0}</p>
                <p>Quiz Level: {quiz.quiz_level || 1}</p>
                <p>Category: {quiz.quiz_type === 'placement' ? '📊 Placement Quiz' : '🎯 Adaptive Quiz'}</p>
                <p>Mode: {quiz.is_adaptive ? '🔄 Adaptive' : '📝 Standard'}</p>
              </div>
              <div className="card-actions">
                <button onClick={() => handleEdit(quiz)} className="btn-edit">
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default QuizManager;
