// MarketSurvey Component for P2L Admin Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MarketSurvey.css';

const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : `${window.location.origin}/api`);

function MarketSurvey() {
  const navigate = useNavigate();
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('referrals');

  useEffect(() => {
    fetchSurveyData();
  }, []);

  const fetchSurveyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/p2ladmin/market-survey`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSurveyData(data.data);
      } else {
        setError(data.error || 'Failed to load survey data');
      }
    } catch (err) {
      console.error('Failed to fetch survey data:', err);
      setError('Failed to load survey data');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (data, title) => {
    if (!data || data.length === 0) {
      return <p className="no-data">No data available yet</p>;
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <div className="chart-bars">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
            return (
              <div key={index} className="chart-row">
                <div className="chart-label">
                  <span className="reason-text">{item.reason}</span>
                  <span className="reason-count">{item.count} ({percentage}%)</span>
                </div>
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-total">
          <strong>Total Responses:</strong> {total}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading market survey data...</div>;
  }

  return (
    <div className="market-survey">
      <header className="survey-header">
        <div>
          <h1>📊 Market Survey</h1>
          <p className="survey-subtitle">User feedback and registration insights</p>
        </div>
        <button onClick={() => navigate('/p2ladmin/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
      </header>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="survey-tabs">
        <button 
          className={`tab ${activeTab === 'referrals' ? 'active' : ''}`}
          onClick={() => setActiveTab('referrals')}
        >
          Registration Sources
        </button>
        <button 
          className={`tab ${activeTab === 'auto-renewal' ? 'active' : ''}`}
          onClick={() => setActiveTab('auto-renewal')}
        >
          Auto-Renewal Disable Reasons
        </button>
        <button 
          className={`tab ${activeTab === 'cancellations' ? 'active' : ''}`}
          onClick={() => setActiveTab('cancellations')}
        >
          Subscription Cancellations
        </button>
      </div>

      <div className="survey-content">
        {activeTab === 'referrals' && renderChart(
          surveyData?.registrationReferrals,
          'How did schools hear about us?'
        )}
        
        {activeTab === 'auto-renewal' && renderChart(
          surveyData?.autoRenewalDisableReasons,
          'Why did schools disable auto-renewal?'
        )}
        
        {activeTab === 'cancellations' && renderChart(
          surveyData?.subscriptionCancelReasons,
          'Why did schools cancel their subscription?'
        )}
      </div>

      {surveyData && (
        <div className="survey-summary">
          <div className="summary-card">
            <h4>📈 Total Survey Responses</h4>
            <p className="summary-value">{surveyData.total}</p>
          </div>
          <div className="summary-card">
            <h4>🌐 Registration Sources</h4>
            <p className="summary-value">{surveyData.registrationReferrals?.length || 0} unique sources</p>
          </div>
          <div className="summary-card">
            <h4>🔄 Auto-Renewal Feedback</h4>
            <p className="summary-value">
              {surveyData.autoRenewalDisableReasons?.reduce((sum, item) => sum + item.count, 0) || 0} responses
            </p>
          </div>
          <div className="summary-card">
            <h4>❌ Cancellation Feedback</h4>
            <p className="summary-value">
              {surveyData.subscriptionCancelReasons?.reduce((sum, item) => sum + item.count, 0) || 0} responses
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketSurvey;
