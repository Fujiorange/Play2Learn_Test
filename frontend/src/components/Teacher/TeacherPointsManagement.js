import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import teacherService from '../../services/teacherService';

export default function TeacherPointsManagement() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pointHistory, setPointHistory] = useState([]);
  const [adjustForm, setAdjustForm] = useState({ amount: 0, reason: '' });
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const user = authService.getCurrentUser();
    if (user.role?.toLowerCase() !== 'teacher') {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [classesResult, studentsResult] = await Promise.all([
        teacherService.getMyClasses(),
        teacherService.getMyStudents()
      ]);

      if (classesResult.success) {
        setClasses(classesResult.classes || []);
      }
      if (studentsResult.success) {
        setStudents(studentsResult.students || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = (student) => {
    setSelectedStudent(student);
    setAdjustForm({ amount: 0, reason: '' });
    setShowAdjustModal(true);
  };

  const openHistoryModal = async (student) => {
    setSelectedStudent(student);
    setShowHistoryModal(true);
    try {
      const result = await teacherService.getStudentPointHistory(student.id);
      if (result.success) {
        setPointHistory(result.history || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleAdjustPoints = async () => {
    if (!adjustForm.reason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason' });
      return;
    }
    if (adjustForm.amount === 0) {
      setMessage({ type: 'error', text: 'Amount cannot be zero' });
      return;
    }

    setAdjusting(true);
    try {
      const result = await teacherService.adjustStudentPoints(
        selectedStudent.id,
        adjustForm.amount,
        adjustForm.reason
      );

      if (result.success) {
        setMessage({ type: 'success', text: `Points ${adjustForm.amount >= 0 ? 'added' : 'deducted'} successfully!` });
        setShowAdjustModal(false);
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to adjust points' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to adjust points' });
    } finally {
      setAdjusting(false);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const filteredStudents = students
    .filter(s => selectedClass === 'all' || s.class === selectedClass)
    .filter(s => 
      searchTerm === '' ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' }}>
        <div style={{ fontSize: '24px', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>P</div>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Play2Learn</span>
          </div>
          <button onClick={() => navigate('/teacher')} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>💰 Student Points Management</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Award or deduct points for your students based on their performance</p>

        {message.text && (
          <div style={{
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            fontWeight: '500'
          }}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Filter by Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.name} value={cls.name}>{cls.name} ({cls.studentCount} students)</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '2', minWidth: '300px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Search Students</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Students Table */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {filteredStudents.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>👥</p>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>No students found</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Student</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Class</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Current Points</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Level</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Avg Score</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{student.name}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{student.email}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 12px', background: '#eff6ff', color: '#2563eb', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}>
                        {student.class || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>{student.points || 0} 💰</span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600' }}>Lv.{student.level || 1}</span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: '600', 
                        color: (student.average_score || 0) >= 80 ? '#16a34a' : (student.average_score || 0) >= 60 ? '#d97706' : '#dc2626' 
                      }}>
                        {student.average_score || 0}%
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => openAdjustModal(student)}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          marginRight: '8px'
                        }}
                      >
                        ±  Adjust
                      </button>
                      <button
                        onClick={() => openHistoryModal(student)}
                        style={{
                          padding: '8px 16px',
                          background: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}
                      >
                        📜 History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Adjust Points Modal */}
      {showAdjustModal && selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAdjustModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>💰 Adjust Points</h2>
            <p style={{ margin: '0 0 24px 0', color: '#6b7280' }}>
              Student: <strong>{selectedStudent.name}</strong> (Current: {selectedStudent.points || 0} pts)
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Amount (+ to add, - to deduct)</label>
              <input
                type="number"
                value={adjustForm.amount}
                onChange={(e) => setAdjustForm({ ...adjustForm, amount: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '16px' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {[10, 25, 50, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, amount: val })}
                    style={{ flex: 1, padding: '8px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    +{val}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {[-10, -25, -50, -100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, amount: val })}
                    style={{ flex: 1, padding: '8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Reason *</label>
              <textarea
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="e.g., Excellent homework submission, Class participation..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAdjustModal(false)}
                style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustPoints}
                disabled={adjusting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: adjustForm.amount >= 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {adjusting ? 'Processing...' : adjustForm.amount >= 0 ? `Add ${adjustForm.amount} Points` : `Deduct ${Math.abs(adjustForm.amount)} Points`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Point History Modal */}
      {showHistoryModal && selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowHistoryModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>📜 Point History</h2>
            <p style={{ margin: '0 0 24px 0', color: '#6b7280' }}>
              Student: <strong>{selectedStudent.name}</strong>
            </p>

            {pointHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <p>No point history yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pointHistory.map((item, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    background: item.amount >= 0 ? '#f0fdf4' : '#fef2f2',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${item.amount >= 0 ? '#16a34a' : '#dc2626'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: item.amount >= 0 ? '#16a34a' : '#dc2626', fontSize: '18px' }}>
                          {item.amount >= 0 ? '+' : ''}{item.amount} points
                        </div>
                        <div style={{ color: '#374151', marginTop: '4px' }}>{item.reason}</div>
                        {item.adjustedByName && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>By: {item.adjustedByName}</div>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowHistoryModal(false)}
              style={{ width: '100%', marginTop: '24px', padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
