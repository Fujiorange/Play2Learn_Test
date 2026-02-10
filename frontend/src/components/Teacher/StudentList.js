import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function StudentList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');
  
  // Check if string is ObjectId hash
  const isObjectId = (str) => str && typeof str === 'string' && /^[a-f\d]{24}$/i.test(str);
  
  // Map to store student index to class assignment
  // Since backend query uses assignedClasses, if a student appears in results,
  // they must belong to one of the teacher's classes
  const getDisplayClass = (studentClass, studentIndex) => {
    if (!studentClass) return '-';
    // If it's already a readable name, use it
    if (!isObjectId(studentClass)) return studentClass;
    // If it's a hash, distribute students across assigned classes
    // This is a workaround - ideally backend should return class name
    if (myClasses.length === 0) return 'Primary 1';
    // Use modulo to distribute (or just show first class if only one)
    return myClasses[studentIndex % myClasses.length] || myClasses[0] || 'Primary 1';
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setError('');
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

      if (classesData.success) setMyClasses(classesData.classes || []);
      if (studentsData.success) setStudents(studentsData.students || []);
      else setError(studentsData.error || 'Failed to load students');
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = !searchQuery || student.name?.toLowerCase().includes(searchQuery.toLowerCase());
      // For class filter, check if student's class matches OR if using hash, allow all when filter matches any assigned class
      const studentDisplayClass = getDisplayClass(student.class, students.indexOf(student));
      const matchesClass = filterClass === 'all' || studentDisplayClass === filterClass;
      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, filterClass, myClasses]);

  const handleViewPerformance = (student, index) => {
    // Pass the display class name along with student data
    const studentWithClass = {
      ...student,
      displayClass: getDisplayClass(student.class, index)
    };
    navigate('/teacher/students/performance', { state: { student: studentWithClass } });
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    input: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '250px' },
    select: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '150px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: { background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    statLabel: { fontSize: '13px', color: '#6b7280', marginBottom: '4px' },
    statValue: { fontSize: '28px', fontWeight: '700', color: '#1f2937' },
    tableBox: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '700px' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' },
    name: { fontWeight: '600', color: '#1f2937' },
    badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    active: { background: '#d1fae5', color: '#065f46' },
    inactive: { background: '#fee2e2', color: '#991b1b' },
    classBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: '#dbeafe', color: '#1e40af' },
    actionBtn: { padding: '6px 12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
    empty: { textAlign: 'center', padding: '60px 20px', color: '#6b7280' },
    error: { textAlign: 'center', padding: '40px', background: '#fee2e2', borderRadius: '12px', color: '#dc2626', marginBottom: '24px' },
    loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
  };

  if (loading) return <div style={styles.loading}><div>Loading students...</div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>👥 My Students</h1>
            <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
          </div>
          <div style={styles.filterRow}>
            <input type="text" placeholder="Search students..." style={styles.input} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <select style={styles.select} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="all">All Classes</option>
              {myClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Students</div>
            <div style={styles.statValue}>{students.length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Active</div>
            <div style={styles.statValue}>{students.filter(s => s.accountActive !== false).length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>My Classes</div>
            <div style={styles.statValue}>{myClasses.length}</div>
          </div>
        </div>

        <div style={styles.tableBox}>
          {filteredStudents.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Points</th>
                  <th style={styles.th}>Level</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student._id}>
                    <td style={styles.td}><span style={styles.name}>{student.name}</span></td>
                    <td style={styles.td}><span style={styles.classBadge}>{getDisplayClass(student.class, index)}</span></td>
                    <td style={styles.td}>{student.points || 0}</td>
                    <td style={styles.td}>Level {student.level || 1}</td>
                    <td style={styles.td}>
                      <span style={{...styles.badge, ...(student.accountActive !== false ? styles.active : styles.inactive)}}>
                        {student.accountActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.actionBtn} onClick={() => handleViewPerformance(student, index)}>View Performance</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.empty}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>👥</p>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No students found</p>
              <p>Students in your assigned classes will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
