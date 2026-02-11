// src/components/Student/QuizJourney.js
// Dedicated page for Adaptive Quiz Journey

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Gameboard from './Gameboard';
import studentService from '../../services/studentService';

export default function QuizJourney() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const result = await studentService.getMathProfile();
      if (!result?.success) {
        setError("Failed to load progress data");
        setProfileData(null);
        return;
      }
      const mp = result.mathProfile || {};
      setProfileData({
        current_level: mp.current_profile || 1,
        total_points: mp.total_points || 0,
        quizzes_completed: mp.quizzes_today || 0,
        character: mp.character_type || '😊',
      });
    } catch (e) {
      setError("Failed to load progress data");
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLevelQuiz = () => {
    // Navigate to adaptive quiz for current level
    navigate('/student/adaptive-quiz/1');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div style={{ fontSize: '24px', color: '#6b7280', fontWeight: '600' }}>Loading progress...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Gameboard currentLevel={profileData?.current_level || 1} characterType={profileData?.character || '😊'} />
        {/* Progress Section */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ fontWeight: '700', fontSize: '18px', color: '#1f2937' }}>📊 Your Progress</div>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>CURRENT LEVEL</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#10b981' }}>{profileData?.current_level || 1}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>TOTAL POINTS</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#3b82f6' }}>{profileData?.total_points || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>QUIZZES COMPLETED</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#f59e42' }}>{profileData?.quizzes_completed || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>CHARACTER</div>
              <div style={{ fontSize: '22px' }}>{profileData?.character || '😊'}</div>
            </div>
          </div>
          <button
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s',
              width: '100%',
              marginTop: '16px',
            }}
            onClick={handleStartLevelQuiz}
          >
            🚀 Start Level 1 Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
