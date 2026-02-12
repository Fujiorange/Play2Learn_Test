import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

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
  const [classOptions, setClassOptions] = useState([]);

  const getToken = () => localStorage.getItem('token');
  const isObjectId = (str) => str && typeof str === 'string' && /^[a-f\d]{24}$/i.test(str);
  
  const getClassDisplayName = (studentClass) => {
    if (!studentClass) return 'Unassigned';
    if (!isObjectId(studentClass)) return studentClass;
    if (myClasses.length > 0) return myClasses[0];
    return 'Primary 1';
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadClasses();
    loadStudents();
  }, [navigate]);

  useEffect(() => { loadStudents(); }, [selectedClass]);

  const loadClasses = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/my-classes`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (data.success) {
      // Store BOTH class names AND their corresponding IDs
      const options = [];
      
      // data.classes = class names array
      // data.classIds = class IDs array
      if (data.classIds && data.classIds.length > 0) {
        // Map IDs to names
        for (let i = 0; i < data.classIds.length; i++) {
          options.push({
            id: data.classIds[i],
            name: data.classes[i] || `Class ${i+1}`
          });
        }
      } else {
        // Fallback: use names as IDs
        options.push(...data.classes.map(name => ({ id: name, name })));
      }
      
      setClassOptions(options);
      setMyClasses(data.classes || []);
    }
  } catch (err) { 
    console.error('Error loading classes:', err); 
  }
};


  const loadStudents = async () => {
  try {
    setLoading(true);
    setError('');
    
    let url;
    
    if (selectedClass === 'all') {
      url = `${API_BASE_URL}/api/mongo/teacher/students`;
    } else {
      // Find the class ID for the selected class name
      const selectedOption = classOptions.find(opt => opt.name === selectedClass);
      
      if (selectedOption && selectedOption.id) {
        // Send the ID, not the name
        url = `${API_BASE_URL}/api/mongo/teacher/students?className=${encodeURIComponent(selectedOption.id)}`;
        console.log('🔍 Filtering by class ID:', selectedOption.id);
      } else {
        // Fallback: send the name as is
        url = `${API_BASE_URL}/api/mongo/teacher/students?className=${encodeURIComponent(selectedClass)}`;
      }
    }
    
    console.log('📡 Fetching students from:', url);
    
    const res = await fetch(url, { 
      headers: { 'Authorization': `Bearer ${getToken()}` } 
    });
    const data = await res.json();
    
    if (data.success) {
      setStudents(data.students || []);
    } else {
      setError(data.error || data.message || 'Failed to load students');
    }
  } catch (err) {
    console.error('Error loading students:', err);
    setError('Failed to connect to server');
  } finally { 
    setLoading(false); 
  }
};

  const loadStudentSkills = async (student) => {
    const displayClass = getClassDisplayName(student.class);
    setSelectedStudent({ ...student, displayClass });
    setLoadingSkills(true);
    setStudentSkills([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/students/${student._id}/skills`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        // Filter to Math skills only
        const mathSkills = (data.skills || []).filter(s => 
          !['English', 'Science', 'english', 'science'].includes(s.skill_name)
        );
        setStudentSkills(mathSkills);
      }
    } catch (err) { console.error('Error:', err); }
    finally { setLoadingSkills(false); }
  };

  const getSkillColor = (level) => {
    if (level >= 4) return '#10b981';
    if (level >= 3) return '#3b82f6';
    if (level >= 2) return '#f59e0b';
    if (level >= 1) return '#f97316';
    return '#ef4444';
  };

  const getSkillLabel = (level) => {
    if (level >= 4) return 'Mastered';
    if (level >= 3) return 'Proficient';
    if (level >= 2) return 'Developing';
    if (level >= 1) return 'Beginning';
    return 'Not Started';
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    select: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '150px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' },
    card: { background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.2s' },
    cardActive: { borderColor: '#10b981', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' },
    studentName: { fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' },
    classBadge: { display: 'inline-block', padding: '2px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: '8px', fontSize: '12px', fontWeight: '500', marginBottom: '8px' },
    studentMeta: { display: 'flex', gap: '12px', fontSize: '13px', color: '#6b7280' },
    skillsPanel: { background: 'white', borderRadius: '16px', padding: '24px', marginTop: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    skillsTitle: { fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' },
    skillsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' },
    skillCard: { padding: '12px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #e5e7eb' },
    skillName: { fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' },
    skillBar: { height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', flex: 1 },
    empty: { textAlign: 'center', padding: '60px 20px', color: '#6b7280', background: 'white', borderRadius: '16px' },
    error: { textAlign: 'center', padding: '40px', background: '#fee2e2', borderRadius: '12px', color: '#dc2626', marginBottom: '24px' },
    loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
  };

  if (loading && students.length === 0) return <div style={styles.loading}><div>Loading students...</div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>📊 Math Skill Matrix</h1>
            <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
          </div>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>Click on a student to view their math skill breakdown</p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontWeight: '500' }}>Filter by Class:</label>
          <select style={styles.select} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="all">All Classes</option>
            {/* ✅ FIXED - Use classOptions with proper name display */}
            {classOptions.map(option => (
              <option key={option.id} value={option.name}>
                {option.name}
              </option>
            ))}
        </select>
      </div>
    </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        {!error && students.length === 0 && (
          <div style={styles.empty}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📊</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No students found</p>
          </div>
        )}

        {!error && students.length > 0 && (
          <div style={styles.grid}>
            {students.map((student) => (
              <div 
                key={student._id} 
                style={{ ...styles.card, ...(selectedStudent?._id === student._id ? styles.cardActive : {}) }}
                onClick={() => loadStudentSkills(student)}
              >
                <div style={styles.studentName}>{student.name}</div>
                <div style={styles.classBadge}>{getClassDisplayName(student.class)}</div>
                <div style={styles.studentMeta}>
                  <span>⭐ {student.points || 0} pts</span>
                  <span>Lv {student.level || 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedStudent && (
          <div style={styles.skillsPanel}>
            <h2 style={styles.skillsTitle}>
              Math Skills for {selectedStudent.name} 
              <span style={{ ...styles.classBadge, marginLeft: '12px' }}>{selectedStudent.displayClass}</span>
            </h2>
            {loadingSkills && <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>Loading skills...</div>}
            {!loadingSkills && studentSkills.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                <p>No math skill data yet</p>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>Skills appear after completing quizzes</p>
              </div>
            )}
            {!loadingSkills && studentSkills.length > 0 && (
              <div style={styles.skillsGrid}>
                {studentSkills.map(skill => (
                  <div key={skill._id} style={styles.skillCard}>
                    <div style={styles.skillName}>{skill.skill_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={styles.skillBar}>
                        <div style={{ height: '100%', width: `${(skill.current_level / 5) * 100}%`, background: getSkillColor(skill.current_level), borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '500', color: getSkillColor(skill.current_level), minWidth: '60px' }}>
                        {getSkillLabel(skill.current_level)}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                      XP: {skill.xp || 0} • Pts: {skill.points || 0}
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
