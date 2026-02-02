import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function StudentList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [myClasses, setMyClasses] = useState([]);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mongo/teacher/students`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }),
        fetch(`${API_BASE_URL}/api/mongo/teacher/my-classes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
      ]);

      const [studentsData, classesData] = await Promise.all([
        studentsRes.json(),
        classesRes.json()
      ]);

      if (studentsData.success) {
        setStudents(studentsData.students || []);
      } else {
        setError(studentsData.error || 'Failed to load students');
      }

      if (classesData.success) {
        setMyClasses(classesData.classes || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || student.class === filterClass;
    return matchesSearch && matchesClass;
  }), [students, searchTerm, filterClass]);

  const uniqueClasses = useMemo(() => ['all', ...myClasses], [myClasses]);

  const averagePoints = useMemo(() => {
    if (students.length === 0) return 0;
    return Math.round(students.reduce((acc, s) => acc + (s.points || 0), 0) / students.length);
  }, [students]);

  const activeStudentsCount = useMemo(() => {
    return students.filter(s => s.accountActive !== false).length;
  }, [students]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '32px',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    headerTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0,
    },
    backButton: {
      padding: '10px 20px',
      background: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    filterSection: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
    },
    searchInput: {
      flex: 1,
      minWidth: '250px',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '15px',
      fontFamily: 'inherit',
    },
    filterSelect: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '15px',
      cursor: 'pointer',
      fontFamily: 'inherit',
      minWidth: '150px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    statLabel: {
      fontSize: '13px',
      color: '#6b7280',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
    },
    tableContainer: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      borderBottom: '2px solid #e5e7eb',
      fontSize: '13px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
    },
    td: {
      padding: '16px 12px',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '14px',
      color: '#1f2937',
    },
    studentRow: {
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block',
    },
    activeStatus: {
      background: '#d1fae5',
      color: '#065f46',
    },
    inactiveStatus: {
      background: '#fee2e2',
      color: '#991b1b',
    },
    actionButton: {
      padding: '6px 16px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#6b7280',
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
    loadingText: {
      fontSize: '24px',
      color: '#6b7280',
      fontWeight: '600',
    },
    errorAlert: {
      padding: '12px 16px',
      background: '#fee2e2',
      color: '#991b1b',
      borderRadius: '8px',
      marginBottom: '20px',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading students...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>My Students</h1>
            <button
              style={styles.backButton}
              onClick={() => navigate('/teacher')}
              onMouseEnter={(e) => e.target.style.background = '#4b5563'}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
            >
              ← Back to Dashboard
            </button>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}

          <div style={styles.filterSection}>
            <input
              type="text"
              placeholder="🔍 Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={styles.filterSelect}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>
                  {cls === 'all' ? 'All Classes' : cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Students</div>
            <div style={styles.statValue}>{students.length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Active Students</div>
            <div style={styles.statValue}>{activeStudentsCount}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Average Points</div>
            <div style={styles.statValue}>{averagePoints}</div>
          </div>
        </div>

        <div style={styles.tableContainer}>
          {filteredStudents.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Points</th>
                  <th style={styles.th}>Level</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr
                    key={student._id}
                    style={styles.studentRow}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={styles.td}>
                      <strong>{student.name}</strong>
                    </td>
                    <td style={styles.td}>{student.class || '-'}</td>
                    <td style={styles.td}>{student.gradeLevel || '-'}</td>
                    <td style={styles.td}>{(student.points || 0).toLocaleString()}</td>
                    <td style={styles.td}>Level {student.level || 1}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge, 
                        ...(student.accountActive !== false ? styles.activeStatus : styles.inactiveStatus)
                      }}>
                        {student.accountActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.actionButton}
                        onClick={() => navigate('/teacher/students/performance', { state: { student } })}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
              <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                {myClasses.length === 0 ? 'No classes assigned' : 'No students found'}
              </p>
              <p>
                {myClasses.length === 0 
                  ? 'Please contact your school administrator to assign classes to you.'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}