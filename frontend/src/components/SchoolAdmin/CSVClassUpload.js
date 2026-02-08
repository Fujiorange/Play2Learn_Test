import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function CSVClassUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'School Admin') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const handleBack = () => {
    navigate('/school-admin/classes/manage');
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setValidationResult(null);
    setUploadResult(null);

    // Auto-validate on file selection
    setValidating(true);
    const result = await schoolAdminService.validateCSV(selectedFile);
    setValidating(false);

    if (result.success) {
      setValidationResult(result);
    } else {
      setError(result.error || 'Validation failed');
      setValidationResult(result);
    }
  };

  const handleDownloadTemplate = async () => {
    const result = await schoolAdminService.downloadCSVTemplate();
    if (!result.success) {
      setError(result.error || 'Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (validationResult && !validationResult.valid) {
      setError('Please fix validation errors before uploading');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResult(null);

    const result = await schoolAdminService.uploadCSV(file);
    setUploading(false);

    if (result.success) {
      setUploadResult(result);
      setFile(null);
      setValidationResult(null);
    } else {
      setError(result.error || 'Upload failed');
      setUploadResult(result);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '32px'
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      margin: '0 0 8px 0'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '16px'
    },
    buttonRow: {
      display: 'flex',
      gap: '12px',
      marginBottom: '20px'
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white'
    },
    secondaryButton: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white'
    },
    backButton: {
      background: '#f3f4f6',
      color: '#374151'
    },
    uploadArea: {
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      padding: '40px',
      textAlign: 'center',
      background: '#f9fafb',
      marginBottom: '20px',
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    uploadAreaActive: {
      borderColor: '#10b981',
      background: '#f0fdf4'
    },
    fileInput: {
      display: 'none'
    },
    validationBox: {
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    errorBox: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    successBox: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      color: '#166534',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    warningBox: {
      background: '#fffbeb',
      border: '1px solid #fde68a',
      color: '#92400e',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    previewBox: {
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px'
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginTop: '16px'
    },
    statCard: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center'
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280',
      marginBottom: '4px'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📤 Upload Classes & Users via CSV</h1>
          <p style={styles.subtitle}>
            Bulk create classes, teachers, students, and parents in one operation
          </p>
        </div>

        {/* Template Download Section */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>📥 Step 1: Download CSV Template</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            Download the CSV template and fill it with your class and user data.
          </p>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={handleDownloadTemplate}
          >
            📥 Download CSV Template
          </button>
        </div>

        {/* File Upload Section */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>📤 Step 2: Upload Your CSV File</h2>
          
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={styles.fileInput}
            id="csv-file-input"
          />
          
          <label
            htmlFor="csv-file-input"
            style={{
              ...styles.uploadArea,
              ...(file ? styles.uploadAreaActive : {})
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              {file ? file.name : 'Click to select CSV file or drag and drop'}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {file ? 'Click to change file' : 'CSV files only'}
            </div>
          </label>

          {validating && (
            <div style={styles.validationBox}>
              <p>🔍 Validating CSV file...</p>
            </div>
          )}

          {validationResult && validationResult.valid && (
            <div style={styles.successBox}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                ✅ Validation Successful
              </h3>
              <div style={styles.statGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Classes</div>
                  <div style={styles.statValue}>{validationResult.preview.classesCount}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Teachers</div>
                  <div style={styles.statValue}>{validationResult.preview.teachersCount}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Students</div>
                  <div style={styles.statValue}>{validationResult.preview.studentsCount}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Parents</div>
                  <div style={styles.statValue}>{validationResult.preview.parentsCount}</div>
                </div>
              </div>
            </div>
          )}

          {validationResult && !validationResult.valid && validationResult.errors && (
            <div style={styles.errorBox}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                ❌ Validation Errors
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {validationResult.errors.map((err, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <div style={styles.buttonRow}>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handleUpload}
              disabled={uploading || !file || (validationResult && !validationResult.valid)}
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload & Process CSV'}
            </button>
            <button
              style={{ ...styles.button, ...styles.backButton }}
              onClick={handleBack}
            >
              ← Back to Class Management
            </button>
          </div>
        </div>

        {/* Upload Results Section */}
        {uploadResult && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>📊 Upload Results</h2>
            
            {uploadResult.success && (
              <div style={styles.successBox}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                  ✅ Upload Completed Successfully
                </h3>
                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Classes Created</div>
                    <div style={styles.statValue}>{uploadResult.results.created.classes}</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Teachers Created</div>
                    <div style={styles.statValue}>{uploadResult.results.created.teachers}</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Teachers Updated</div>
                    <div style={styles.statValue}>{uploadResult.results.updated.teachers}</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Students Created</div>
                    <div style={styles.statValue}>{uploadResult.results.created.students}</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Parents Created</div>
                    <div style={styles.statValue}>{uploadResult.results.created.parents}</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Parents Updated</div>
                    <div style={styles.statValue}>{uploadResult.results.updated.parents}</div>
                  </div>
                </div>
              </div>
            )}

            {uploadResult.results && uploadResult.results.warnings && uploadResult.results.warnings.length > 0 && (
              <div style={{ ...styles.warningBox, marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                  ⚠️ Warnings
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {uploadResult.results.warnings.map((warning, idx) => (
                    <li key={idx} style={{ marginBottom: '4px', fontSize: '13px' }}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {uploadResult.results && uploadResult.results.errors && uploadResult.results.errors.length > 0 && (
              <div style={{ ...styles.errorBox, marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                  ❌ Errors
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {uploadResult.results.errors.map((err, idx) => (
                    <li key={idx} style={{ marginBottom: '4px', fontSize: '13px' }}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {uploadResult.success && (
              <div style={{ marginTop: '20px' }}>
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={handleBack}
                >
                  ✅ Done - Go to Class Management
                </button>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>📖 CSV Format Instructions</h2>
          <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
            <p><strong>The CSV file should contain the following sections:</strong></p>
            <ul>
              <li><strong>[Classes]</strong> - Define your classes with ClassName, GradeLevel, and Subjects</li>
              <li><strong>[Teachers]</strong> - Create teachers and assign them to classes</li>
              <li><strong>[Students]</strong> - Create students and assign them to classes</li>
              <li><strong>[Parents]</strong> - Create parents and link them to students</li>
            </ul>
            <p><strong>Important Notes:</strong></p>
            <ul>
              <li>Student emails must be unique and not already exist in the system</li>
              <li>Teacher emails can already exist - they will be updated with new class assignments</li>
              <li>Parent emails can already exist - they will be linked to additional students</li>
              <li>All new users will receive welcome emails with login credentials</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
