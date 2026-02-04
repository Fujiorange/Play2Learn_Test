import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function BulkUploadCSV() {
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [userType, setUserType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
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
    navigate('/school-admin');
  };

  const downloadTemplate = () => {
    const csvTemplate = `Name,Email,Role,Salutation,Class,GradeLevel,ParentEmail,StudentEmail,Relationship,Subject,ContactNumber,Gender,DateOfBirth
John Tan,john.tan@student.com,Student,,1A,Primary 1,parent.tan@email.com,,,Mathematics,+6591234567,male,15/03/2019
David Lee,david.lee@teacher.com,Teacher,Mr,,,,,,,+6591234567,male,15/03/1985
Lim Mei Ling,parent.lim@email.com,Parent,Mrs,,,,john.tan@student.com,Mother,,+6598765432,female,22/07/1980`;

    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userType}_upload_template_p1_math.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
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
      setResult(null);
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
    setResult(null);

    try {
      // REAL API CALL - Uploads to database!
      const response = await schoolAdminService.bulkUploadUsers(file);

      if (response.success) {
        // ✅ FIXED: Handle both response structures
        // Students/Teachers use response.results.*
        // Parents use response.summary.*
        const dataSource = response.summary || response.results || {};
        
        setResult({
          success: true,
          message: response.message,
          created: dataSource.created || 0,
          updated: dataSource.updated || 0,  // Only for parents
          failed: dataSource.failed || 0,
          emailsSent: dataSource.emailsSent || 0,
          errors: response.errors || dataSource.errors || []
        });
        setFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        setError(response.error || 'Upload failed');
      }

    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    header: { background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 0' },
    headerContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { display: 'flex', alignItems: 'center' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px', marginRight: '12px' },
    logoText: { fontSize: '20px', fontWeight: '700', color: '#1f2937' },
    backButton: { padding: '8px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    main: { maxWidth: '800px', margin: '0 auto', padding: '32px' },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    pageSubtitle: { fontSize: '15px', color: '#6b7280', marginBottom: '32px' },
    card: { background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    infoBox: { background: '#f0f9ff', border: '2px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '14px', color: '#1e40af' },
    infoTitle: { fontWeight: '700', marginBottom: '8px' },
    infoList: { margin: '8px 0 0 20px', paddingLeft: '0' },
    formGroup: { marginBottom: '24px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    select: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box' },
    fileInput: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box' },
    fileInfo: { marginTop: '12px', padding: '12px 16px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '8px', color: '#16a34a', fontSize: '14px', fontWeight: '500' },
    buttonGroup: { display: 'flex', gap: '12px', marginTop: '24px' },
    uploadButton: { flex: 1, padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit' },
    cancelButton: { flex: 1, padding: '14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit' },
    templateButton: { width: '100%', padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', marginBottom: '24px' },
    successBox: { marginTop: '20px', padding: '16px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '8px', color: '#16a34a' },
    successTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '12px' },
    successStats: { fontSize: '14px', marginBottom: '4px' },
    errorBox: { marginTop: '20px', padding: '16px', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '8px', color: '#dc2626' },
    errorTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '8px' },
    errorList: { fontSize: '13px', marginTop: '8px', maxHeight: '150px', overflowY: 'auto' },
    errorItem: { padding: '4px 0', borderBottom: '1px solid #fecaca' },
  };

  const getInfoContent = () => {
    if (userType === 'student') {
      return (
        <>
          <div style={styles.infoTitle}>📋 Student CSV Format Requirements:</div>
          <ul style={styles.infoList}>
            <li><strong>Required:</strong> Name, Email, Role (Student)</li>
            <li><strong>Optional:</strong> Class, GradeLevel, ParentEmail, ContactNumber, Gender, DateOfBirth</li>
            <li>GradeLevel: Only "Primary 1" is currently available (Primary 2-6 coming soon)</li>
            <li>If ParentEmail provided, credentials will be sent to parent</li>
            <li>Date format: DD/MM/YYYY or YYYY-MM-DD</li>
            <li>Gender: male or female</li>
          </ul>
        </>
      );
    } else if (userType === 'teacher') {
      return (
        <>
          <div style={styles.infoTitle}>📋 Teacher CSV Format Requirements:</div>
          <ul style={styles.infoList}>
            <li><strong>Required:</strong> Name, Email, Role (Teacher)</li>
            <li><strong>Optional:</strong> Salutation, Subject, ContactNumber, Gender, DateOfBirth</li>
            <li>Salutation: Mr, Mrs, Ms, Miss, Dr, Prof, Mdm</li>
            <li>Subject defaults to "Mathematics"</li>
            <li>Date format: DD/MM/YYYY or YYYY-MM-DD</li>
            <li>Gender: male or female</li>
          </ul>
        </>
      );
    } else {
      return (
        <>
          <div style={styles.infoTitle}>📋 Mixed CSV Format Requirements:</div>
          <ul style={styles.infoList}>
            <li><strong>Required for all:</strong> Name, Email, Role (Student/Teacher/Parent)</li>
            <li><strong>For Students:</strong> GradeLevel (only Primary 1 available), Class (optional), ParentEmail (optional)</li>
            <li><strong>For Teachers:</strong> Salutation (Mr, Mrs, Ms, Miss, Dr, Prof, Mdm), Subject (optional)</li>
            <li><strong>For Parents:</strong> Salutation, StudentEmail (required - student must exist), Relationship (e.g., Father, Mother, Guardian)</li>
            <li><strong>Common optional:</strong> ContactNumber, Gender (male/female), DateOfBirth (DD/MM/YYYY or YYYY-MM-DD)</li>
          </ul>
        </>
      );
    }
  };

  return (
    <div style={styles.container}>
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

      <main style={styles.main}>
        <h1 style={styles.pageTitle}>Bulk Upload Users (CSV)</h1>
        <p style={styles.pageSubtitle}>
           Upload multiple users at once using a single CSV file with roles defined per row.
        </p>

        <div style={styles.card}>
             <div style={styles.formGroup}>
               <label style={styles.label}>User Type</label>
               <select
                 value={userType}
                 onChange={(e) => {
                   setUserType(e.target.value);
                   setFile(null);
                   setResult(null);
                   setError('');
                 }}
                 style={styles.select}
                 disabled={uploading}
               >
                 <option value="all">All Roles (mixed CSV)</option>
               </select>
             </div>

          <div style={styles.infoBox}>
            {getInfoContent()}
          </div>

          <button
            style={styles.templateButton}
            onClick={downloadTemplate}
            onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
          >
            📥 Download {userType.charAt(0).toUpperCase() + userType.slice(1)} CSV Template
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
                {uploading ? 'Uploading...' : `Upload ${userType.charAt(0).toUpperCase() + userType.slice(1)}s`}
              </button>
            </div>

            {result && result.success && (
              <div style={styles.successBox}>
                <div style={styles.successTitle}>✅ Upload Complete!</div>
                <div style={styles.successStats}>📊 Created: {result.created} users</div>
                {result.failed > 0 && (
                  <div style={styles.successStats}>⚠️ Failed: {result.failed} users</div>
                )}
                {result.emailsSent > 0 && (
                  <div style={styles.successStats}>📧 Emails Sent: {result.emailsSent}</div>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div style={styles.errorList}>
                    <strong>Errors:</strong>
                    {result.errors.map((err, idx) => (
                      <div key={idx} style={styles.errorItem}>
                        {err.email || err.parentEmail}: {err.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={styles.errorBox}>
                <div style={styles.errorTitle}>⚠️ Upload Failed</div>
                <div>{error}</div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
