// Quiz Manager Component
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes, createQuiz, updateQuiz, deleteQuiz, getQuestions } from '../../services/p2lAdminService';
import './QuizManager.css';

function QuizManager() {
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [questionFilters, setQuestionFilters] = useState({
    topic: '',
    difficulty: ''
  });
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
      setQuizzes(quizzesRes.data || []);
      setQuestions(questionsRes.data || []);
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
      // Transform question_ids to questions array format expected by backend
      const quizData = {
        title: formData.title,
        description: formData.description,
        questions: formData.question_ids.map(id => ({ question_id: id })),
        is_adaptive: formData.is_adaptive
      };
      
      if (editingQuiz) {
        await updateQuiz(editingQuiz._id, quizData);
        alert('Quiz updated successfully');
      } else {
        await createQuiz(quizData);
        alert('Quiz created successfully');
      }
      setShowForm(false);
      setEditingQuiz(null);
      setFormData({
        title: '',
        description: '',
        question_ids: [],
        is_adaptive: true
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
      is_adaptive: quiz.is_adaptive !== undefined ? quiz.is_adaptive : true
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) {
      return;
    }
    try {
      await deleteQuiz(id);
      alert('Quiz deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert(error.message || 'Failed to delete quiz');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingQuiz(null);
    setFormData({
      title: '',
      description: '',
      question_ids: [],
      is_adaptive: true
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
          <h1>Adaptive Quiz Manager</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/p2ladmin/quizzes/create-adaptive" className="btn-primary">
            + Create Adaptive Quiz
          </Link>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Create Quiz
          </button>
        </div>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</h2>
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
                  {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
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
              <div className="card-actions">
                <button onClick={() => handleEdit(quiz)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(quiz._id)} className="btn-delete">
                  Delete
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
