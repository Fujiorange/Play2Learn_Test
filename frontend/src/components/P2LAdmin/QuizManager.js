// Quiz Manager Component
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes, generateQuiz, updateQuiz, deleteQuiz, getQuestions } from '../../services/p2lAdminService';
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
    quiz_level: 1,
    student_id: null,
    trigger_reason: 'manual'
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingQuiz) {
      // For editing existing quiz (metadata only)
      try {
        const quizData = {
          title: editingQuiz.title,
          description: editingQuiz.description
        };
        
        await updateQuiz(editingQuiz._id, quizData);
        alert('Quiz updated successfully');
        setShowForm(false);
        setEditingQuiz(null);
        fetchData();
      } catch (error) {
        console.error('Failed to update quiz:', error);
        alert(error.message || 'Failed to update quiz');
      }
    } else {
      // For generating new quiz
      try {
        const result = await generateQuiz({
          quiz_level: parseInt(formData.quiz_level),
          student_id: formData.student_id || null,
          trigger_reason: 'manual'
        });
        
        alert(`Quiz generated successfully! Created quiz: ${result.data.title}`);
        setShowForm(false);
        setFormData({
          quiz_level: 1,
          student_id: null,
          trigger_reason: 'manual'
        });
        fetchData();
      } catch (error) {
        console.error('Failed to generate quiz:', error);
        alert(error.message || 'Failed to generate quiz');
      }
    }
  };

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
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
      quiz_level: 1,
      student_id: null,
      trigger_reason: 'manual'
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
            View and manage auto-generated quizzes for students
          </p>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Trigger Quiz Generation
        </button>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingQuiz ? 'Edit Quiz Metadata' : 'Trigger Quiz Generation'}</h2>
            {editingQuiz ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Quiz Title *</label>
                  <input
                    type="text"
                    value={editingQuiz.title}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editingQuiz.description}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="info-box">
                  <p><strong>Note:</strong> You can only edit quiz metadata. Questions are auto-generated and cannot be modified.</p>
                  <p><strong>Quiz Level:</strong> {editingQuiz.quiz_level || 'N/A'}</p>
                  <p><strong>Questions:</strong> {editingQuiz.questions?.length || 0}</p>
                  <p><strong>Auto-generated:</strong> {editingQuiz.is_auto_generated ? 'Yes' : 'No'}</p>
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
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Quiz Level *</label>
                  <select
                    name="quiz_level"
                    value={formData.quiz_level}
                    onChange={handleInputChange}
                    required
                  >
                    <option value={1}>Quiz Level 1</option>
                    <option value={2}>Quiz Level 2</option>
                    <option value={3}>Quiz Level 3</option>
                    <option value={4}>Quiz Level 4</option>
                    <option value={5}>Quiz Level 5</option>
                    <option value={6}>Quiz Level 6</option>
                    <option value={7}>Quiz Level 7</option>
                    <option value={8}>Quiz Level 8</option>
                    <option value={9}>Quiz Level 9</option>
                    <option value={10}>Quiz Level 10</option>
                  </select>
                  <p className="help-text">
                    Select the quiz level for which to generate a quiz. The system will automatically select 20 questions with adaptive difficulty progression.
                  </p>
                </div>

                <div className="info-box">
                  <h4>✨ Auto-Generation Features</h4>
                  <ul>
                    <li>✅ 20 questions per quiz</li>
                    <li>✅ Questions selected with freshness weighting</li>
                    <li>✅ Adaptive difficulty progression</li>
                    <li>✅ Unique sequence for each generation</li>
                    <li>✅ Requires at least 40 questions in the quiz level</li>
                  </ul>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit">
                    Generate Quiz
                  </button>
                  <button type="button" onClick={cancelForm} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="quizzes-grid">
        {quizzes.length === 0 ? (
          <p className="no-data">No quizzes found. Generate your first quiz!</p>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz._id} className="quiz-card">
              <div className="quiz-header-badges">
                {quiz.is_auto_generated && (
                  <span className="badge auto-generated-badge">✨ Auto-generated</span>
                )}
                {quiz.quiz_level && (
                  <span className="badge level-badge">Level {quiz.quiz_level}</span>
                )}
              </div>
              <h3>{quiz.title}</h3>
              <p className="quiz-description">{quiz.description || 'No description'}</p>
              <div className="quiz-meta">
                <p>Questions: {quiz.questions?.length || 0}</p>
                {quiz.generation_criteria && (
                  <p>Generated: {quiz.generation_criteria}</p>
                )}
                <p>Category: {quiz.quiz_type === 'placement' ? '📊 Placement Quiz' : '🎯 Adaptive Quiz'}</p>
                <p>Mode: {quiz.is_adaptive ? '🔄 Adaptive' : '📝 Standard'}</p>
              </div>
              <div className="card-actions">
                <button onClick={() => handleEdit(quiz)} className="btn-edit">
                  View/Edit
                </button>
                <button 
                  onClick={() => handleDelete(quiz._id)} 
                  className="btn-delete"
                >
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
