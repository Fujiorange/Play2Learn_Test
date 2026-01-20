import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BulkUploadCSV() {
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => {
    navigate('/school-admin');
  };

  const downloadTemplate = () => {
    const csvTemplate = `name,email,role,password,gender,contact,gradeLevel
John Tan,john.tan@student.com,student,password123,male,+6512345678,Primary 1
Mary Lim,mary.lim@student.com,student,password123,female,+6587654321,Primary 2
Mr. David Lee,david.lee@teacher.com,teacher,teacher123,male,+6591234567,`;

    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Basic validation
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // TODO: Replace with actual API call
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/school-admin/users/bulk-upload', {
      //   method: 'POST',
      //   body: formData
      // });
      // const result = await response.json();

      // TEMPORARY: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Uploading file:', file.name);
      setSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFile(null);
        setSuccess(false);
      }, 2000);

    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
    header: {
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 0',
    },
    headerContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '18px',
      marginRight: '12px',
    },
    logoText: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f2937',
    },
    backButton: {
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    main: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '32px',
    },
    pageTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px',
    },
    pageSubtitle: {
      fontSize: '15px',
      color: '#6b7280',
      marginBottom: '32px',
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    infoBox: {
      background: '#f0f9ff',
      border: '2px solid #bfdbfe',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      fontSize: '14px',
      color: '#1e40af',
    },
    infoTitle: {
      fontWeight: '700',
      marginBottom: '8px',
    },
    infoList: {
      margin: '8px 0 0 20px',
      paddingLeft: '0',
    },
    formGroup: {
      marginBottom: '24px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px',
      display: 'block',
    },
    fileInput: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '15px',
      background: '#f9fafb',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    fileInfo: {
      marginTop: '12px',
      padding: '12px 16px',
      background: '#f0fdf4',
      border: '2px solid #bbf7d0',
      borderRadius: '8px',
      color: '#16a34a',
      fontSize: '14px',
      fontWeight: '500',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    uploadButton: {
      flex: 1,
      padding: '14px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
    },
    cancelButton: {
      flex: 1,
      padding: '14px',
      background: '#f3f4f6',
      color: '#374151',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
    },
    templateButton: {
      width: '100%',
      padding: '12px',
      background: '#f3f4f6',
      color: '#374151',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      marginBottom: '24px',
    },
    successMessage: {
      marginTop: '20px',
      padding: '12px 16px',
      background: '#f0fdf4',
      border: '2px solid #bbf7d0',
      borderRadius: '8px',
      color: '#16a34a',
      fontSize: '14px',
      fontWeight: '500',
    },
    errorMessage: {
      marginTop: '20px',
      padding: '12px 16px',
      background: '#fef2f2',
      border: '2px solid #fecaca',
      borderRadius: '8px',
      color: '#dc2626',
      fontSize: '14px',
      fontWeight: '500',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logoText}>Play2Learn</span>
          </div>
          <button
            style={styles.backButton}
            onClick={handleBack}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <h1 style={styles.pageTitle}>Bulk Upload Users (CSV)</h1>
        <p style={styles.pageSubtitle}>
          Upload multiple users at once using a CSV file.
        </p>

        <div style={styles.card}>
          <div style={styles.infoBox}>
            <div style={styles.infoTitle}>📋 CSV Format Requirements:</div>
            <ul style={styles.infoList}>
              <li><strong>Required columns:</strong> name, email, role, password</li>
              <li><strong>Optional columns:</strong> gender, contact, gradeLevel</li>
              <li>Role must be: student, teacher, or parent</li>
              <li>Password must be at least 8 characters</li>
              <li>Maximum file size: 5MB</li>
            </ul>
          </div>

          <button
            style={styles.templateButton}
            onClick={downloadTemplate}
            onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
          >
            📥 Download CSV Template
          </button>

          <form onSubmit={handleUpload}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={styles.fileInput}
                disabled={uploading}
              />
              {file && (
                <div style={styles.fileInfo}>
                  ✅ {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={handleBack}
                disabled={uploading}
                onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  ...styles.uploadButton,
                  opacity: uploading || !file ? 0.7 : 1,
                  cursor: uploading || !file ? 'not-allowed' : 'pointer',
                }}
                disabled={uploading || !file}
                onMouseEnter={(e) => !uploading && file && (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {uploading ? 'Uploading...' : 'Upload Users'}
              </button>
            </div>

            {/* Success Message */}
            {success && (
              <div style={styles.successMessage}>
                ✅ Users uploaded successfully!
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}