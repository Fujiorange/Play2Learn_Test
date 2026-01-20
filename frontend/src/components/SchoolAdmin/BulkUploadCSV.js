// frontend/src/components/SchoolAdmin/BulkUploadCSV.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolAdmin.css';

export default function BulkUploadCSV() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [userType, setUserType] = useState(''); // students, teachers, parents
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setMessage({ type: '', text: '' });
    } else {
      setMessage({ type: 'error', text: 'Please select a valid CSV file' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    if (!userType) {
      setMessage({ type: 'error', text: 'Please select user type' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });
    setUploadResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token'); // Get auth token if available

      const response = await fetch(`http://localhost:5000/api/mongo/school-admin/bulk-import-${userType}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResults(data.results);
        setMessage({ 
          type: 'success', 
          text: `✅ ${data.results.created} ${userType} created! ${data.results.emailsSent} emails sent.` 
        });
        setFile(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = (type) => {
    let csvContent = '';
    
    switch(type) {
      case 'students':
        csvContent = 'Name,Email,Class,GradeLevel,ParentEmail\nAhmad Ali,ahmad.ali@student.edu.sg,1A,Primary 1,ahmad.father@gmail.com\nSarah Chen,sarah.chen@student.edu.sg,1A,Primary 1,sarah.mother@gmail.com\n';
        break;
      case 'teachers':
        csvContent = 'Name,Email,Subject\nJohn Tan,john.tan@school.edu.sg,Mathematics\nMary Lee,mary.lee@school.edu.sg,English\n';
        break;
      case 'parents':
        csvContent = 'ParentName,ParentEmail,StudentEmail,Relationship\nAhmad Father,ahmad.father@gmail.com,ahmad.ali@student.edu.sg,Father\nSarah Mother,sarah.mother@gmail.com,sarah.chen@student.edu.sg,Mother\n';
        break;
      default:
        csvContent = 'name,email,role\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_bulk_upload_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn</span>
          </div>
          <button className="sa-button-small" onClick={() => navigate('/school-admin')}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="sa-main">
        <h1 className="sa-page-title">Bulk Upload Users (CSV)</h1>
        <p className="sa-page-subtitle">Upload multiple users at once. Welcome emails will be sent automatically.</p>

        <div className="sa-card">
          {message.text && (
            <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
              {message.text}
            </div>
          )}

          {/* User Type Selection */}
          <div className="sa-form-group">
            <label className="sa-label">Select User Type *</label>
            <select 
              value={userType} 
              onChange={(e) => setUserType(e.target.value)} 
              className="sa-select"
            >
              <option value="">Choose user type...</option>
              <option value="students">Students</option>
              <option value="teachers">Teachers</option>
              <option value="parents">Parents</option>
            </select>
          </div>

          {/* Download Template */}
          {userType && (
            <div className="sa-mb-4">
              <button 
                className="sa-button-secondary" 
                onClick={() => downloadTemplate(userType)}
              >
                📥 Download {userType.charAt(0).toUpperCase() + userType.slice(1)} CSV Template
              </button>
            </div>
          )}

          {/* File Upload */}
          <div className="sa-form-group">
            <label className="sa-label">Select CSV File *</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="sa-file-input"
            />
            {file && (
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          {/* Upload Button */}
          <div className="sa-mt-4">
            <button 
              className="sa-button-primary" 
              onClick={handleUpload}
              disabled={uploading || !file || !userType}
              style={{ opacity: uploading || !file || !userType ? 0.5 : 1 }}
            >
              {uploading ? '📤 Uploading & Sending Emails...' : '📤 Upload & Send Welcome Emails'}
            </button>
          </div>

          {/* Upload Results */}
          {uploadResults && (
            <div className="sa-mt-4" style={{ 
              padding: '16px', 
              background: '#f0fdf4', 
              border: '2px solid #bbf7d0',
              borderRadius: '8px', 
              fontSize: '14px', 
              color: '#16a34a' 
            }}>
              <strong>📊 Upload Summary:</strong>
              <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
                <li>✅ Accounts Created: {uploadResults.created}</li>
                <li>📧 Emails Sent: {uploadResults.emailsSent}</li>
                {uploadResults.emailsFailed > 0 && (
                  <li style={{ color: '#dc2626' }}>⚠️ Emails Failed: {uploadResults.emailsFailed}</li>
                )}
                {uploadResults.failed > 0 && (
                  <li style={{ color: '#dc2626' }}>❌ Accounts Failed: {uploadResults.failed}</li>
                )}
              </ul>

              {uploadResults.errors && uploadResults.errors.length > 0 && (
                <details style={{ marginTop: '12px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>View Errors ({uploadResults.errors.length})</summary>
                  <ul style={{ marginTop: '8px' }}>
                    {uploadResults.errors.map((err, idx) => (
                      <li key={idx} style={{ color: '#dc2626', fontSize: '13px' }}>
                        {err.email}: {err.error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {/* CSV Format Help */}
          {userType === 'students' && (
            <div className="sa-mt-4" style={{ 
              padding: '16px', 
              background: '#eff6ff', 
              borderRadius: '8px', 
              fontSize: '14px', 
              color: '#1e40af' 
            }}>
              <strong>📌 Students CSV Format:</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                <code>Name, Email, Class, GradeLevel, ParentEmail (optional)</code><br/>
                Example: Ahmad Ali, ahmad@student.edu.sg, 1A, Primary 1, parent@gmail.com
              </p>
              <p style={{ margin: '12px 0 0 0', fontSize: '13px' }}>
                💡 <strong>Tip:</strong> If ParentEmail is provided, credentials will be sent to parents automatically!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}