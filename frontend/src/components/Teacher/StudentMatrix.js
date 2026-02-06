import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function StudentMatrix() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSkills, setStudentSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [error, setError] = useState('');
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadClasses();
    loadStudents();
  }, [navigate]);

  useEffect(() => {
    loadStudents();
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/my-classes`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setMyClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const url = selectedClass === 'all'
        ? `${API_BASE_URL}/api/mongo/teacher/students`
        : `${API_BASE_URL}/api/mongo/teacher/students?className=${encodeURIComponent(selectedClass)}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.students || []);
      } else {
        setError(data.error || 'Failed to load students');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentSkills = async (student) => {
    setSelectedStudent(student);
    setLoadingSkills(true);
    setStudentSkills([]);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/students/${student._id}/skills`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setStudentSkills(data.skills || []);
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoadingSkills(false);
    }
  };

  const getSkillLevelColor = (level) => {
    if (level >= 4) return '#10b981'; // Green - mastered
    if (level >= 3) return '#3b82f6'; // Blue - proficient
    if (level >= 2) return '#f59e0b'; // Yellow - developing
    if (level >= 1) return '#f97316'; // Orange - beginning
    return '#ef4444'; // Red - not started
  };

  const getSkillLevelLabel = (level) => {
    if (level >= 4) return 'Mastered';
    if (level >= 3) return 'Proficient';
    if (level >= 2) return 'Developing';
    if (level >= 1) return 'Beginning';
    return 'Not Started';
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterContainer: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
    select: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '150px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    studentCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', cursor: 'pointer', transition: 'all 0.2s', border: '2px solid transparent' },
    studentCardActive: { borderColor: '#10b981', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' },
    studentName: { fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' },
    studentClass: { fontSize: '13px', color: '#6b7280', marginBottom: '12px' },
    studentMeta: { display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' },
    skillsPanel: { background: 'white', borderRadius: '16px', padding: '32px', marginTop: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    skillsTitle: { fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '20px' },
    skillsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' },
    skillCard: { padding: '16px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' },
    skillName: { fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' },
    skillLevel: { display: 'flex', alignItems: 'center', gap: '8px' },
    skillBar: { flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
    skillBarFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s' },
    skillLevelText: { fontSize: '12px', fontWeight: '500', minWidth: '80px', textAlign: 'right' },
    emptyState: { textAlign: 'center', padding: '60px 20px', color: '#6b7280' },
    errorState: { textAlign: 'center', padding: '40px', background: '#fee2e2', borderRadius: '12px', color: '#dc2626', marginBottom: '24px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '18px', color: '#6b7280' },
    noSkills: { textAlign: 'center', padding: '40px', color: '#6b7280' },
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
            <h1 style={styles.title}>📊 Skill Matrix</h1>
            <button style={styles.backButton} onClick={() => navigate('/teacher')}>
              ← Back to Dashboard
            </button>
          </div>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            Click on a student to view their skill breakdown
          </p>
          
          <div style={styles.filterContainer}>
            <label style={{ fontWeight: '500', color: '#374151' }}>Filter by Class:</label>
            <select 
              style={styles.select}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">All Classes</option>
              {myClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div style={styles.errorState}>
            <p>⚠️ {error}</p>
            <button onClick={loadStudents} style={{ ...styles.backButton, marginTop: '16px' }}>
              Try Again
            </button>
          </div>
        )}

        {!error && students.length === 0 && (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📊</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No students found</p>
            <p>Students in your classes will appear here</p>
          </div>
        )}

        {!error && students.length > 0 && (
          <div style={styles.grid}>
            {students.map(student => (
              <div 
                key={student._id} 
                style={{
                  ...styles.studentCard,
                  ...(selectedStudent?._id === student._id ? styles.studentCardActive : {})
                }}
                onClick={() => loadStudentSkills(student)}
              >
                <div style={styles.studentName}>{student.name}</div>
                <div style={styles.studentClass}>{student.class || 'No class'}</div>
                <div style={styles.studentMeta}>
                  <span>📚 {student.grade || 'Primary 1'}</span>
                  <span>⭐ {student.points || 0} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedStudent && (
          <div style={styles.skillsPanel}>
            <h2 style={styles.skillsTitle}>
              Skills for {selectedStudent.name}
            </h2>
            
            {loadingSkills && (
              <div style={styles.noSkills}>Loading skills...</div>
            )}
            
            {!loadingSkills && studentSkills.length === 0 && (
              <div style={styles.noSkills}>
                <p>No skill data available yet</p>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>
                  Skills will appear once the student completes quizzes
                </p>
              </div>
            )}
            
            {!loadingSkills && studentSkills.length > 0 && (
              <div style={styles.skillsGrid}>
                {studentSkills.map(skill => (
                  <div key={skill._id} style={styles.skillCard}>
                    <div style={styles.skillName}>{skill.skill_name}</div>
                    <div style={styles.skillLevel}>
                      <div style={styles.skillBar}>
                        <div 
                          style={{
                            ...styles.skillBarFill,
                            width: `${(skill.current_level / 5) * 100}%`,
                            background: getSkillLevelColor(skill.current_level)
                          }}
                        />
                      </div>
                      <span style={{ 
                        ...styles.skillLevelText, 
                        color: getSkillLevelColor(skill.current_level) 
                      }}>
                        {getSkillLevelLabel(skill.current_level)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                      XP: {skill.xp || 0} • Points: {skill.points || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
