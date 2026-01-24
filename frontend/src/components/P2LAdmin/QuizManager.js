// Quiz Manager Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes, createQuiz, getQuestions } from '../../services/p2lAdminService';
import './QuizManager.css';

function QuizManager() {
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    question_ids: [],
    is_adaptive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quizzesRes, questionsRes] = await Promise.all([
        getQuizzes(),
        getQuestions()
      ]);
      setQuizzes(quizzesRes.quizzes || []);
      setQuestions(questionsRes.questions || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
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
      await createQuiz(formData);
      alert('Quiz created successfully');
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        question_ids: [],
        is_adaptive: true
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create quiz:', error);
      alert(error.message || 'Failed to create quiz');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="quiz-manager">
      <header className="page-header">
        <div>
          <h1>Adaptive Quiz Manager</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Create Quiz
        </button>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Create New Quiz</h2>
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
                <label>
                  <input
                    type="checkbox"
                    name="is_adaptive"
                    checked={formData.is_adaptive}
                    onChange={handleInputChange}
                  />
                  {' '}Enable Adaptive Mode
                </label>
                <p className="help-text">
                  Adaptive quizzes adjust difficulty based on student performance
                </p>
              </div>

              <div className="form-group">
                <label>Select Questions ({formData.question_ids.length} selected)</label>
                <div className="questions-selector">
                  {questions.map((q) => (
                    <div key={q._id} className="question-option">
                      <input
                        type="checkbox"
                        checked={formData.question_ids.includes(q._id)}
                        onChange={() => handleQuestionToggle(q._id)}
                      />
                      <span className="question-preview">
                        {q.text.substring(0, 80)}...
                        <span className="badge">Difficulty: {q.difficulty}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">Create Quiz</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="quizzes-grid">
        {quizzes.length === 0 ? (
          <p className="no-data">No quizzes found. Create your first quiz!</p>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz._id} className="quiz-card">
              <h3>{quiz.title}</h3>
              <p className="quiz-description">{quiz.description || 'No description'}</p>
              <div className="quiz-meta">
                <p>Questions: {quiz.questions?.length || 0}</p>
                <p>Type: {quiz.is_adaptive ? '🎯 Adaptive' : '📝 Standard'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default QuizManager;
