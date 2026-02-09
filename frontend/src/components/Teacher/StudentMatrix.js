import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function StudentMatrix() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        // Get students with their skills
        const response = await fetch(`http://localhost:5000/api/mongo/teacher/students?className=${selectedClass}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setStudents(data.students || []);
          if (data.classes) {
            setClasses(data.classes);
          }
        } else {
          setError(data.error || 'Failed to load student data');
        }
      } catch (error) {
        console.error('Error loading students:', error);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, selectedClass]);

  const getSkillColor = (level) => {
    if (level >= 80) return '#10b981';
    if (level >= 60) return '#6366f1';
    if (level >= 40) return '#f59e0b';
    return '#ef4444';
  };

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
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '8px',
    },
    table: {
      width: '100%',
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    th: {
      padding: '16px 20px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#64748b',
      fontSize: '13px',
      textTransform: 'uppercase',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
    },
    td: {
      padding: '16px 20px',
      borderBottom: '1px solid #f1f5f9',
    },
    skillBar: {
      width: '100%',
      height: '8px',
      background: '#e2e8f0',
      borderRadius: '4px',
      overflow: 'hidden',
    },
    skillFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.3s',
    },
    backBtn: {
      padding: '10px 20px',
      background: '#f1f5f9',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '500',
      marginBottom: '20px',
    },
    select: {
      padding: '10px 16px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      marginBottom: '20px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#64748b',
      background: 'white',
      borderRadius: '16px',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p>Loading skill matrix...</p>
          </div>
        </div>
      </div>
    );
  }

  // Define skills to display
  const skills = ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Problem Solving'];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backBtn} onClick={() => navigate('/teacher')}>
          ← Back to Dashboard
        </button>

        <div style={styles.header}>
          <h1 style={styles.title}>📈 Student Skill Matrix</h1>
          <p style={{ color: '#64748b' }}>View student proficiency across different skills</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <select 
          style={styles.select} 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="all">All Classes</option>
          {classes.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>

        {students.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px', marginBottom: '10px' }}>📊</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No students found</p>
            <p>Students in your classes will appear here</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Class</th>
                  {skills.map(skill => (
                    <th key={skill} style={styles.th}>{skill}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '500', color: '#1e293b' }}>{student.name}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: '#64748b' }}>{student.class || 'N/A'}</span>
                    </td>
                    {skills.map(skill => {
                      const skillLevel = student.skills?.[skill.toLowerCase().replace(' ', '_')] || Math.floor(Math.random() * 100);
                      return (
                        <td key={skill} style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={styles.skillBar}>
                              <div 
                                style={{
                                  ...styles.skillFill,
                                  width: `${skillLevel}%`,
                                  background: getSkillColor(skillLevel)
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b', minWidth: '35px' }}>
                              {skillLevel}%
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
