// P2L Admin Skill Points Configuration Component
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSkillPointsConfig,
  updateSkillPointsConfig
} from '../../services/p2lAdminService';
import './SkillPointsConfig.css';

function SkillPointsConfig() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [config, setConfig] = useState({
    1: { correct: 1, wrong: -2.5 },
    2: { correct: 2, wrong: -2.0 },
    3: { correct: 3, wrong: -1.5 },
    4: { correct: 4, wrong: -1.0 },
    5: { correct: 5, wrong: -0.5 }
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // Check admin auth
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(storedUser);
    if (userData.role !== 'p2ladmin' && userData.role !== 'Platform Admin') {
      navigate('/login');
      return;
    }

    loadConfig();
  }, [navigate]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await getSkillPointsConfig();
      if (response.success) {
        setConfig(response.data.difficultyPoints);
        setLastUpdated(response.data.updatedAt);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handlePointChange = (level, field, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setConfig(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        [field]: numValue
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await updateSkillPointsConfig(config);
      if (response.success) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        setLastUpdated(response.data.updatedAt);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      1: { correct: 1, wrong: -2.5 },
      2: { correct: 2, wrong: -2.0 },
      3: { correct: 3, wrong: -1.5 },
      4: { correct: 4, wrong: -1.0 },
      5: { correct: 5, wrong: -0.5 }
    });
    setMessage({ type: 'info', text: 'Reset to default values. Click Save to apply.' });
  };

  const getDifficultyLabel = (level) => {
    const labels = {
      1: 'Very Easy',
      2: 'Easy',
      3: 'Medium',
      4: 'Hard',
      5: 'Very Hard'
    };
    return labels[level] || `Level ${level}`;
  };

  const getDifficultyColor = (level) => {
    const colors = {
      1: '#10b981',
      2: '#3b82f6',
      3: '#f59e0b',
      4: '#ef4444',
      5: '#7c3aed'
    };
    return colors[level] || '#6b7280';
  };

  if (loading) {
    return <div className="loading">Loading configuration...</div>;
  }

  return (
    <div className="skill-points-config">
      <header className="page-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/p2ladmin/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>⚙️ Skill Points Configuration</h1>
        </div>
      </header>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      <div className="config-container">
        <div className="info-section">
          <h2>📊 How It Works</h2>
          <div className="info-content">
            <p>
              When students take placement quizzes or adaptive quizzes, their skill points 
              are calculated based on the difficulty of questions answered correctly or incorrectly.
            </p>
            <ul>
              <li><strong>Correct Answers:</strong> Add points based on difficulty level</li>
              <li><strong>Wrong Answers:</strong> Deduct points (harder questions = less penalty)</li>
              <li><strong>Minimum:</strong> Skill points cannot go below 0</li>
            </ul>
            <p className="note">
              <strong>Note:</strong> These settings apply to all future quiz attempts. 
              Existing skill points are not affected.
            </p>
          </div>
        </div>

        <div className="config-section">
          <h2>🎯 Points Per Difficulty Level</h2>
          
          <div className="config-table">
            <div className="table-header">
              <div className="header-cell">Difficulty</div>
              <div className="header-cell">Correct Answer (+ points)</div>
              <div className="header-cell">Wrong Answer (- points)</div>
            </div>
            
            {[1, 2, 3, 4, 5].map(level => (
              <div 
                key={level} 
                className="table-row"
                style={{ borderLeftColor: getDifficultyColor(level) }}
              >
                <div className="row-cell difficulty-cell">
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(level) }}
                  >
                    {level}
                  </span>
                  <span>{getDifficultyLabel(level)}</span>
                </div>
                <div className="row-cell">
                  <div className="input-wrapper positive">
                    <span className="input-prefix">+</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={config[level]?.correct || 0}
                      onChange={(e) => handlePointChange(level, 'correct', e.target.value)}
                    />
                  </div>
                </div>
                <div className="row-cell">
                  <div className="input-wrapper negative">
                    <input
                      type="number"
                      step="0.5"
                      max="0"
                      value={config[level]?.wrong || 0}
                      onChange={(e) => handlePointChange(level, 'wrong', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {lastUpdated && (
            <p className="last-updated">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}

          <div className="action-buttons">
            <button 
              className="btn-reset"
              onClick={handleReset}
              disabled={saving}
            >
              🔄 Reset to Defaults
            </button>
            <button 
              className="btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : '💾 Save Configuration'}
            </button>
          </div>
        </div>

        <div className="preview-section">
          <h2>📈 Preview Calculation</h2>
          <div className="preview-content">
            <p>Example: A student answers 3 questions:</p>
            <div className="preview-example">
              <div className="example-row correct">
                <span>✓ Difficulty 3 (Correct)</span>
                <span>+{config[3]?.correct || 0} points</span>
              </div>
              <div className="example-row wrong">
                <span>✗ Difficulty 2 (Wrong)</span>
                <span>{config[2]?.wrong || 0} points</span>
              </div>
              <div className="example-row correct">
                <span>✓ Difficulty 5 (Correct)</span>
                <span>+{config[5]?.correct || 0} points</span>
              </div>
              <div className="example-total">
                <span>Total Change:</span>
                <span className={
                  (config[3]?.correct || 0) + (config[2]?.wrong || 0) + (config[5]?.correct || 0) >= 0 
                    ? 'positive' 
                    : 'negative'
                }>
                  {((config[3]?.correct || 0) + (config[2]?.wrong || 0) + (config[5]?.correct || 0)).toFixed(1)} points
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillPointsConfig;
