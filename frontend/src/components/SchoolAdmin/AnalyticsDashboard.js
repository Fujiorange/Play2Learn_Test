import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (!currentUser.role?.toLowerCase().includes('school')) { navigate('/login'); return; }
    loadAnalytics();
  }, [navigate]);

  const loadAnalytics = async () => {
    try {
      setError('');
      const result = await schoolAdminService.getAnalytics();
      
      if (result.success) {
        // Transform backend data to frontend format
        const transformed = {
          overview: {
            totalStudents: result.overview?.totalStudents || 0,
            activeToday: result.overview?.activeToday || 0,
            totalQuizzes: result.overview?.totalQuizzes || 0,
            avgQuizScore: result.overview?.avgScore || 0
          },
          classPerformance: (result.classPerformance || []).map(c => ({
            class: c._id || 'Unknown',
            students: c.students || 0,
            avgScore: Math.round(c.avgScore || 0),
            avgPoints: Math.round(c.avgPoints || 0),
            quizzesCompleted: c.totalQuizzes || 0,
            trend: 'stable'
          })),
          topStudents: (result.topStudents || []).map((s, i) => ({
            id: s._id,
            name: s.name || 'Unknown',
            class: s.class || '-',
            points: s.points || 0,
            badges: s.badges?.length || 0,
            avgScore: s.average_score || 0
          })),
          strugglingStudents: (result.strugglingStudents || []).map(s => ({
            id: s._id,
            name: s.name || 'Unknown',
            class: s.class || '-',
            points: s.points || 0,
            avgScore: s.average_score || 0,
            lastActive: s.last_active ? getTimeSince(s.last_active) : 'Never',
            issue: (s.average_score || 0) < 60 ? 'Low quiz scores' : 'Inactive'
          })),
          badgeDistribution: [],
          weeklyTrend: []
        };
        setAnalytics(transformed);
      } else {
        setError(result.error || 'Failed to load analytics');
        // Set empty data
        setAnalytics({
          overview: { totalStudents: 0, activeToday: 0, totalQuizzes: 0, avgQuizScore: 0 },
          classPerformance: [],
          topStudents: [],
          strugglingStudents: [],
          badgeDistribution: [],
          weeklyTrend: []
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  if (loading) {
    return <div className="sa-loading"><div className="sa-loading-text">Loading analytics...</div></div>;
  }

  const strugglingClasses = analytics?.classPerformance?.filter(c => c.avgScore < 75) || [];
  const topClasses = analytics?.classPerformance?.filter(c => c.avgScore >= 80) || [];

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn</span>
          </div>
          <button className="sa-button-secondary" onClick={() => navigate('/school-admin')}>← Back to Dashboard</button>
        </div>
      </header>

      <main className="sa-main-wide">
        <h1 className="sa-page-title">📊 Analytics & Performance</h1>
        <p className="sa-page-subtitle">Monitor class performance, identify struggling students, and track trends (Live from Database)</p>

        {error && <div className="sa-message sa-message-error">⚠️ {error}</div>}

        {/* Tabs */}
        <div className="points-tabs">
          {['overview', 'classes', 'students'].map(tab => (
            <button key={tab} className={`points-tab ${activeTab === tab ? 'points-tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' && '📈 Overview'}
              {tab === 'classes' && '🏫 Class Performance'}
              {tab === 'students' && '👥 Students'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="sa-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="sa-stat-card">
                <div className="sa-stat-icon">👥</div>
                <p className="sa-stat-label">Total Students</p>
                <p className="sa-stat-value">{analytics?.overview?.totalStudents || 0}</p>
              </div>
              <div className="sa-stat-card">
                <div className="sa-stat-icon">✅</div>
                <p className="sa-stat-label">Active Today</p>
                <p className="sa-stat-value">{analytics?.overview?.activeToday || 0}</p>
              </div>
              <div className="sa-stat-card">
                <div className="sa-stat-icon">📝</div>
                <p className="sa-stat-label">Total Quizzes Taken</p>
                <p className="sa-stat-value">{analytics?.overview?.totalQuizzes || 0}</p>
              </div>
            </div>

            {/* Alert Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Struggling Classes Alert */}
              {strugglingClasses.length > 0 && (
                <div className="sa-card" style={{ borderLeft: '4px solid #dc2626' }}>
                  <h3 style={{ color: '#dc2626', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠️ Classes Needing Attention ({strugglingClasses.length})
                  </h3>
                  {strugglingClasses.map(cls => (
                    <div key={cls.class} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: '600' }}>{cls.class}</span>
                      <span style={{ color: '#dc2626' }}>Avg: {cls.avgScore}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Performing Classes */}
              {topClasses.length > 0 && (
                <div className="sa-card" style={{ borderLeft: '4px solid #16a34a' }}>
                  <h3 style={{ color: '#16a34a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🌟 Top Performing Classes ({topClasses.length})
                  </h3>
                  {topClasses.map(cls => (
                    <div key={cls.class} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: '600' }}>{cls.class}</span>
                      <span style={{ color: '#16a34a' }}>Avg: {cls.avgScore}%</span>
                    </div>
                  ))}
                </div>
              )}

              {strugglingClasses.length === 0 && topClasses.length === 0 && (
                <div className="sa-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: '#6b7280' }}>No class performance data yet. Assign students to classes to see analytics.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="sa-card">
            <h3 className="points-card-title">🏫 Class Performance Comparison</h3>
            {analytics?.classPerformance?.length > 0 ? (
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Students</th>
                    <th>Avg Score</th>
                    <th>Avg Points</th>
                    <th>Quizzes Done</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.classPerformance.sort((a, b) => b.avgScore - a.avgScore).map((cls, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '600' }}>{cls.class}</td>
                      <td>{cls.students}</td>
                      <td>
                        <span style={{ color: getScoreColor(cls.avgScore), fontWeight: '600' }}>
                          {cls.avgScore}%
                        </span>
                      </td>
                      <td className="points-value">{cls.avgPoints}</td>
                      <td>{cls.quizzesCompleted}</td>
                      <td>
                        {cls.avgScore >= 80 ? (
                          <span className="sa-badge sa-badge-success">Excellent</span>
                        ) : cls.avgScore >= 70 ? (
                          <span className="sa-badge sa-badge-primary">Good</span>
                        ) : (
                          <span className="sa-badge sa-badge-danger">Needs Help</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <p>No class data available. Create classes and assign students to see performance metrics.</p>
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            {/* Struggling Students Alert */}
            <div className="sa-card sa-mb-4" style={{ borderLeft: '4px solid #dc2626' }}>
              <h3 style={{ color: '#dc2626', margin: '0 0 16px 0' }}>⚠️ Students Needing Support</h3>
              {analytics?.strugglingStudents?.length > 0 ? (
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Avg Score</th>
                      <th>Points</th>
                      <th>Last Active</th>
                      <th>Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.strugglingStudents.map(student => (
                      <tr key={student.id}>
                        <td style={{ fontWeight: '600' }}>{student.name}</td>
                        <td><span className="sa-badge sa-badge-primary">{student.class}</span></td>
                        <td style={{ color: '#dc2626', fontWeight: '600' }}>{student.avgScore}%</td>
                        <td>{student.points}</td>
                        <td style={{ color: '#6b7280' }}>{student.lastActive}</td>
                        <td><span className="sa-badge sa-badge-danger">{student.issue}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No struggling students identified. Great job! 🎉</p>
              )}
            </div>

            {/* Top Students */}
            <div className="sa-card">
              <h3 className="points-card-title">🏆 Top Performing Students</h3>
              {analytics?.topStudents?.length > 0 ? (
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Avg Score</th>
                      <th>Points</th>
                      <th>Badges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topStudents.map((student, index) => (
                      <tr key={student.id}>
                        <td style={{ fontSize: '20px' }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </td>
                        <td style={{ fontWeight: '600' }}>{student.name}</td>
                        <td><span className="sa-badge sa-badge-primary">{student.class}</span></td>
                        <td style={{ color: '#16a34a', fontWeight: '600' }}>{student.avgScore}%</td>
                        <td className="points-value">{student.points}</td>
                        <td>{student.badges} 🏆</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No student data yet. Students will appear here after they complete quizzes.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
