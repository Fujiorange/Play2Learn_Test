// Question Bank Management Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, uploadQuestionsCSV, getQuestionSubjects, getQuestionTopics, getQuestionGrades, bulkDeleteQuestions } from '../../services/p2lAdminService';
import './QuestionBank.css';

function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [filters, setFilters] = useState({ difficulty: '', subject: '', topic: '', grade: '' });
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [formData, setFormData] = useState({
    text: '',
    choices: ['', '', '', ''],
    answer: '',
    difficulty: 3,
    subject: 'General',
    topic: '',
    grade: 'Primary 1'
  });
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  useEffect(() => {
    fetchSubjects();
    fetchTopics();
    fetchGrades();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await getQuestions(filters);
      setQuestions(response.data || []);
      // Clear selections when filter changes
      setSelectedQuestions([]);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      alert('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await getQuestionSubjects();
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await getQuestionTopics();
      setTopics(response.data || []);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await getQuestionGrades();
      setGrades(response.data || []);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
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
      topic: question.topic || '',
      grade: question.grade || 'Primary 1'
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

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) {
      alert('Please select questions to delete');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedQuestions.length} question(s)?`)) {
      return;
    }
    
    try {
      await bulkDeleteQuestions(selectedQuestions);
      alert(`${selectedQuestions.length} question(s) deleted successfully`);
      setSelectedQuestions([]);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete questions:', error);
      alert(error.message || 'Failed to delete questions');
    }
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length && questions.length > 0) {
      // Deselect all
      setSelectedQuestions([]);
    } else {
      // Select all filtered questions
      setSelectedQuestions(questions.map(q => q._id));
    }
  };

  const handleQuestionSelect = (id) => {
    setSelectedQuestions(prev => {
      if (prev.includes(id)) {
        return prev.filter(qId => qId !== id);
      } else {
        return [...prev, id];
      }
    });
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
      topic: '',
      grade: 'Primary 1'
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type by MIME type and extension
      const validTypes = ['text/csv', 'application/csv', 'text/plain'];
      const isValidExtension = file.name.toLowerCase().endsWith('.csv');
      const isValidMimeType = validTypes.includes(file.type);
      
      if (!isValidExtension || (!isValidMimeType && file.type !== '')) {
        setUploadError('Please select a valid CSV file');
        setUploadFile(null);
        return;
      }
      
      setUploadFile(file);
      setUploadResult(null);
      setUploadError('');
    }
  };

  const handleUploadCSV = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file');
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setUploadError('');

    try {
      const result = await uploadQuestionsCSV(uploadFile);
      setUploadResult(result);
      
      // Refresh questions list
      await fetchQuestions();
      
      // Clear file selection
      setUploadFile(null);
    } catch (error) {
      console.error('CSV upload failed:', error);
      setUploadError(error.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `text,choice1,choice2,choice3,choice4,answer,difficulty,subject,topic,grade
"What is 2 + 2?","2","3","4","5","4",1,"Math","Addition","Primary 1"
"What is the capital of France?","London","Berlin","Paris","Rome","Paris",2,"Geography","Capitals","Primary 1"
"Which planet is closest to the sun?","Venus","Mars","Mercury","Earth","Mercury",3,"Science","Solar System","Primary 1"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
        <div className="header-actions">
          <button onClick={() => setShowUpload(true)} className="btn-secondary">
            📤 Upload CSV
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Create Question
          </button>
        </div>
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
          <select 
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          >
            <option value="">All</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Topic:</label>
          <select 
            value={filters.topic}
            onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
          >
            <option value="">All</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Grade:</label>
          <select 
            value={filters.grade}
            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
          >
            <option value="">All</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>

        <button onClick={() => setFilters({ difficulty: '', subject: '', topic: '', grade: '' })} className="btn-clear">
          Clear Filters
        </button>
        
        {questions.length > 0 && (
          <>
            <button onClick={handleSelectAll} className="btn-select-all">
              {selectedQuestions.length === questions.length && questions.length > 0 
                ? '☑ Deselect All' 
                : '☐ Select All'}
            </button>
            
            {selectedQuestions.length > 0 && (
              <button onClick={handleBulkDelete} className="btn-delete-selected">
                🗑 Delete Selected ({selectedQuestions.length})
              </button>
            )}
          </>
        )}
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
                {formData.choices.filter(c => c.trim()).length > 0 ? (
                  <select
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select correct answer</option>
                    {formData.choices.filter(c => c.trim()).map((choice, index) => (
                      <option key={index} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter the correct answer"
                  />
                )}
                <small>
                  {formData.choices.filter(c => c.trim()).length > 0 
                    ? 'Select from the choices above' 
                    : 'Add choices above to select from dropdown'}
                </small>
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

              <div className="form-group">
                <label>Grade</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                >
                  <option value="Primary 1">Primary 1</option>
                  <option value="Primary 2" disabled>Primary 2 (Coming Soon)</option>
                  <option value="Primary 3" disabled>Primary 3 (Coming Soon)</option>
                  <option value="Primary 4" disabled>Primary 4 (Coming Soon)</option>
                  <option value="Primary 5" disabled>Primary 5 (Coming Soon)</option>
                  <option value="Primary 6" disabled>Primary 6 (Coming Soon)</option>
                </select>
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

      {showUpload && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Upload Questions CSV</h2>
            
            <div className="upload-section">
              <div className="info-box">
                <h3>📋 CSV Format Instructions</h3>
                <p>Your CSV should have the following columns:</p>
                <ul>
                  <li><strong>text</strong> - The question text (required)</li>
                  <li><strong>choice1, choice2, choice3, choice4</strong> - Answer choices (optional)</li>
                  <li><strong>answer</strong> - The correct answer (required)</li>
                  <li><strong>difficulty</strong> - Number from 1-5 (default: 3)</li>
                  <li><strong>subject</strong> - Subject name (default: General)</li>
                  <li><strong>topic</strong> - Topic name (optional)</li>
                  <li><strong>grade</strong> - Grade level: Primary 1 to 6 (default: Primary 1)</li>
                </ul>
                <button onClick={downloadTemplate} className="btn-download">
                  📥 Download Template
                </button>
              </div>

              <div className="file-input-section">
                <label htmlFor="csv-file" className="file-label">
                  {uploadFile ? uploadFile.name : 'Choose CSV file'}
                </label>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {uploadError && (
                  <div className="upload-error">
                    ⚠️ {uploadError}
                  </div>
                )}
              </div>

              {uploadResult && (
                <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
                  {uploadResult.success ? (
                    <div>
                      <h4>✅ Upload Successful!</h4>
                      <p>Total questions: {uploadResult.data.total}</p>
                      <p>Successfully uploaded: {uploadResult.data.successful}</p>
                      {uploadResult.data.failed > 0 && (
                        <p className="warning-text">Failed: {uploadResult.data.failed}</p>
                      )}
                      {uploadResult.data.errors && uploadResult.data.errors.length > 0 && (
                        <div className="errors-detail">
                          <h5>Errors:</h5>
                          <ul>
                            {uploadResult.data.errors.slice(0, 5).map((err, i) => (
                              <li key={i}>Line {err.line}: {err.error}</li>
                            ))}
                            {uploadResult.data.errors.length > 5 && (
                              <li>... and {uploadResult.data.errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h4>❌ Upload Failed</h4>
                      <p>{uploadResult.error}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button 
                  onClick={handleUploadCSV} 
                  className="btn-submit"
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload CSV'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowUpload(false);
                    setUploadFile(null);
                    setUploadResult(null);
                    setUploadError('');
                  }} 
                  className="btn-cancel"
                  disabled={uploading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="questions-list">
        {questions.length === 0 ? (
          <p className="no-data">No questions found. Create your first question!</p>
        ) : (
          questions.map((question) => (
            <div key={question._id} className={`question-card ${selectedQuestions.includes(question._id) ? 'selected' : ''}`}>
              <div className="question-selection">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(question._id)}
                  onChange={() => handleQuestionSelect(question._id)}
                  className="question-checkbox"
                />
              </div>
              
              <div className="question-header">
                <span className={`difficulty-badge ${getDifficultyClass(question.difficulty)}`}>
                  {getDifficultyLabel(question.difficulty)}
                </span>
                <span className="subject-badge">{question.subject}</span>
                {question.grade && <span className="grade-badge">{question.grade}</span>}
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
