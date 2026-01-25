// Question Bank Management Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../services/p2lAdminService';
import './QuestionBank.css';

function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [filters, setFilters] = useState({ difficulty: '', subject: '' });
  const [formData, setFormData] = useState({
    text: '',
    choices: ['', '', '', ''],
    answer: '',
    difficulty: 3,
    subject: 'General',
    topic: ''
  });

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      const response = await getQuestions(filters);
      setQuestions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      alert('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleChoiceChange = (index, value) => {
    const newChoices = [...formData.choices];
    newChoices[index] = value;
    setFormData({ ...formData, choices: newChoices });
  };

  const handleAddChoice = () => {
    setFormData({ ...formData, choices: [...formData.choices, ''] });
  };

  const handleRemoveChoice = (index) => {
    const newChoices = formData.choices.filter((_, i) => i !== index);
    setFormData({ ...formData, choices: newChoices });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty choices
    const validChoices = formData.choices.filter(c => c.trim() !== '');
    const dataToSubmit = { ...formData, choices: validChoices };

    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion._id, dataToSubmit);
        alert('Question updated successfully');
      } else {
        await createQuestion(dataToSubmit);
        alert('Question created successfully');
      }
      cancelForm();
      fetchQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
      alert(error.message || 'Failed to save question');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      text: question.text,
      choices: question.choices || ['', '', '', ''],
      answer: question.answer,
      difficulty: question.difficulty,
      subject: question.subject || 'General',
      topic: question.topic || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }
    try {
      await deleteQuestion(id);
      alert('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert(error.message || 'Failed to delete question');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingQuestion(null);
    setFormData({
      text: '',
      choices: ['', '', '', ''],
      answer: '',
      difficulty: 3,
      subject: 'General',
      topic: ''
    });
  };

  const getDifficultyLabel = (level) => {
    const labels = { 1: 'Level 1', 2: 'Level 2', 3: 'Level 3', 4: 'Level 4', 5: 'Level 5' };
    return labels[level] || 'Unknown';
  };

  const getDifficultyClass = (level) => {
    const classes = { 1: 'level-1', 2: 'level-2', 3: 'level-3', 4: 'level-4', 5: 'level-5' };
    return classes[level] || '';
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="question-bank">
      <header className="page-header">
        <div>
          <h1>Question Bank</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Create Question
        </button>
      </header>

      <div className="filters-section">
        <div className="filter-group">
          <label>Difficulty:</label>
          <select 
            value={filters.difficulty} 
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          >
            <option value="">All</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
            <option value="5">Level 5</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Subject:</label>
          <input 
            type="text" 
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            placeholder="Filter by subject"
          />
        </div>

        <button onClick={() => setFilters({ difficulty: '', subject: '' })} className="btn-clear">
          Clear Filters
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>{editingQuestion ? 'Edit Question' : 'Create New Question'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Question Text *</label>
                <textarea
                  name="text"
                  value={formData.text}
                  onChange={handleInputChange}
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Choices</label>
                {formData.choices.map((choice, index) => (
                  <div key={index} className="choice-input">
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => handleChoiceChange(index, e.target.value)}
                      placeholder={`Choice ${index + 1}`}
                    />
                    {formData.choices.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveChoice(index)}
                        className="btn-remove-choice"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={handleAddChoice} className="btn-add-choice">
                  + Add Choice
                </button>
              </div>

              <div className="form-group">
                <label>Correct Answer *</label>
                <input
                  type="text"
                  name="answer"
                  value={formData.answer}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Difficulty *</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    required
                  >
                    <option value={1}>Level 1</option>
                    <option value={2}>Level 2</option>
                    <option value={3}>Level 3</option>
                    <option value={4}>Level 4</option>
                    <option value={5}>Level 5</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Topic (Optional)</label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingQuestion ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={cancelForm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="questions-list">
        {questions.length === 0 ? (
          <p className="no-data">No questions found. Create your first question!</p>
        ) : (
          questions.map((question) => (
            <div key={question._id} className="question-card">
              <div className="question-header">
                <span className={`difficulty-badge ${getDifficultyClass(question.difficulty)}`}>
                  {getDifficultyLabel(question.difficulty)}
                </span>
                <span className="subject-badge">{question.subject}</span>
              </div>
              
              <p className="question-text">{question.text}</p>
              
              {question.choices && question.choices.length > 0 && (
                <div className="choices">
                  <strong>Choices:</strong>
                  <ul>
                    {question.choices.map((choice, index) => (
                      <li key={index}>{choice}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="answer"><strong>Answer:</strong> {question.answer}</p>
              
              {question.topic && <p className="topic"><strong>Topic:</strong> {question.topic}</p>}
              
              <div className="card-actions">
                <button onClick={() => handleEdit(question)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(question._id)} className="btn-delete">
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

export default QuestionBank;
