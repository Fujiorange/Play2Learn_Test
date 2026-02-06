import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getXPRewards, updateXPReward } from '../../services/p2lAdminService';
import './SkillMatrixConfig.css';

function SkillMatrixConfig() {
  const navigate = useNavigate();
  const [rewardMatrix, setRewardMatrix] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState(null);
  const [activeCalibrator, setActiveCalibrator] = useState(null);
  const [scenarioType, setScenarioType] = useState('mixed');
  const [draftChanges, setDraftChanges] = useState({});
  const [animateCard, setAnimateCard] = useState(null);

  const tierLabels = ['Starter', 'Rising', 'Skilled', 'Elite', 'Champion'];
  const tierSymbols = ['🎯', '🚀', '💎', '⚡', '🔥'];

  useEffect(() => {
    loadRewardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRewardData = async () => {
    try {
      const apiResponse = await getXPRewards();
      if (apiResponse.success) {
        // Backend returns 'rewardSettings' not 'data'
        setRewardMatrix(apiResponse.rewardSettings || apiResponse.data || []);
      } else {
        displayNotification('Unable to fetch reward data', 'alert');
      }
    } catch (err) {
      displayNotification(`System error: ${err.message}`, 'alert');
    } finally {
      setIsLoadingData(false);
    }
  };

  const displayNotification = (msg, category) => {
    setStatusUpdate({ content: msg, style: category });
    setTimeout(() => setStatusUpdate(null), 4000);
  };

  const activateEditor = (tier) => {
    const current = rewardMatrix.find(r => r.challengeLevel === tier);
    setDraftChanges({
      tier,
      gainValue: current.successReward,
      lossValue: current.failurePenalty
    });
    setActiveCalibrator(tier);
    setAnimateCard(tier);
    setTimeout(() => setAnimateCard(null), 300);
  };

  const abandonChanges = () => {
    setActiveCalibrator(null);
    setDraftChanges({});
  };

  const commitChanges = async () => {
    try {
      const apiResponse = await updateXPReward(draftChanges.tier, {
        successReward: draftChanges.gainValue,
        failurePenalty: draftChanges.lossValue
      });

      if (apiResponse.success) {
        displayNotification(`🎉 Tier ${draftChanges.tier} calibrated!`, 'confirm');
        setActiveCalibrator(null);
        setDraftChanges({});
        loadRewardData();
      } else {
        displayNotification(apiResponse.error || 'Update failed', 'alert');
      }
    } catch (err) {
      displayNotification(`Error: ${err.message}`, 'alert');
    }
  };

  const modifyDraft = (attribute, newValue) => {
    setDraftChanges({ ...draftChanges, [attribute]: parseFloat(newValue) || 0 });
  };

  const runExperiment = () => {
    const experimentPatterns = {
      mixed: [2, 3, 3, 4, 2, 3, 1, 4, 3, 2],
      beginner: [1, 1, 2, 1, 2, 1, 2, 1, 1, 2],
      advanced: [4, 5, 4, 5, 4, 5, 5, 4, 5, 5],
      growth: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]
    };

    const challenges = experimentPatterns[scenarioType];
    let runningScore = 0;
    const journey = [];

    challenges.forEach((difficulty, idx) => {
      const tierConfig = rewardMatrix.find(r => r.challengeLevel === difficulty);
      if (!tierConfig) return;

      const conquered = Math.random() > 0.35;
      const delta = conquered ? tierConfig.successReward : -tierConfig.failurePenalty;
      runningScore += delta;

      journey.push({
        step: idx + 1,
        difficulty,
        conquered,
        delta,
        accumulated: runningScore
      });
    });

    return { journey, finalScore: runningScore };
  };

  const experimentResults = rewardMatrix.length > 0 ? runExperiment() : null;

  const computeProjection = (tier, winCount, loseCount) => {
    const config = activeCalibrator === tier && draftChanges.tier === tier
      ? { successReward: draftChanges.gainValue, failurePenalty: draftChanges.lossValue }
      : rewardMatrix.find(r => r.challengeLevel === tier);
    
    if (!config) return 0;
    return (config.successReward * winCount) - (config.failurePenalty * loseCount);
  };

  if (isLoadingData) {
    return (
      <div className="matrix-configurator">
        <div className="data-loader">
          <div className="pulse-ring"></div>
          <p>Initializing Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matrix-configurator">
      <nav className="top-navigation">
        <button onClick={() => navigate('/p2ladmin/dashboard')} className="nav-return">
          ← Dashboard
        </button>
        <div className="nav-branding">
          <h1>🎮 XP Matrix Calibrator</h1>
          <p className="nav-tagline">Power-up the learning progression engine</p>
        </div>
      </nav>

      {statusUpdate && (
        <div className={`notification-banner ${statusUpdate.style}`}>
          {statusUpdate.content}
          <button onClick={() => setStatusUpdate(null)} className="dismiss-btn">✕</button>
        </div>
      )}

      <div className="configurator-workspace">
        <section className="calibration-zone">
          <h2 className="zone-title">⚙️ Tier Calibration</h2>
          <div className="tier-grid">
            {rewardMatrix.map((config) => {
              const isActive = activeCalibrator === config.challengeLevel;
              const currentGain = isActive ? draftChanges.gainValue : config.successReward;
              const currentLoss = isActive ? draftChanges.lossValue : config.failurePenalty;

              return (
                <div 
                  key={config.challengeLevel}
                  className={`tier-module tier-style-${config.challengeLevel} ${isActive ? 'active-module' : ''} ${animateCard === config.challengeLevel ? 'pulse-anim' : ''}`}
                >
                  <div className="tier-badge">
                    <span className="badge-symbol">{tierSymbols[config.challengeLevel - 1]}</span>
                    <span className="badge-number">{config.challengeLevel}</span>
                  </div>
                  
                  <h3 className="tier-label">{tierLabels[config.challengeLevel - 1]}</h3>

                  <div className="power-meters">
                    <div className="meter-group gain-meter">
                      <label>Victory Gain</label>
                      {isActive ? (
                        <div className="value-adjuster">
                          <button onClick={() => modifyDraft('gainValue', currentGain - 0.5)} className="adj-btn">−</button>
                          <input
                            type="number"
                            step="0.5"
                            value={currentGain}
                            onChange={(e) => modifyDraft('gainValue', e.target.value)}
                            className="value-input"
                          />
                          <button onClick={() => modifyDraft('gainValue', currentGain + 0.5)} className="adj-btn">+</button>
                        </div>
                      ) : (
                        <div className="value-display gain-color">+{currentGain}</div>
                      )}
                    </div>

                    <div className="meter-group loss-meter">
                      <label>Defeat Cost</label>
                      {isActive ? (
                        <div className="value-adjuster">
                          <button onClick={() => modifyDraft('lossValue', currentLoss - 0.5)} className="adj-btn">−</button>
                          <input
                            type="number"
                            step="0.5"
                            value={currentLoss}
                            onChange={(e) => modifyDraft('lossValue', e.target.value)}
                            className="value-input"
                          />
                          <button onClick={() => modifyDraft('lossValue', currentLoss + 0.5)} className="adj-btn">+</button>
                        </div>
                      ) : (
                        <div className="value-display loss-color">−{currentLoss}</div>
                      )}
                    </div>
                  </div>

                  <div className="impact-preview">
                    <div className="preview-row">
                      <span>4W/1L:</span>
                      <strong className="outcome-pos">+{computeProjection(config.challengeLevel, 4, 1).toFixed(1)}</strong>
                    </div>
                    <div className="preview-row">
                      <span>2W/3L:</span>
                      <strong className={computeProjection(config.challengeLevel, 2, 3) >= 0 ? 'outcome-pos' : 'outcome-neg'}>
                        {computeProjection(config.challengeLevel, 2, 3) >= 0 ? '+' : ''}{computeProjection(config.challengeLevel, 2, 3).toFixed(1)}
                      </strong>
                    </div>
                  </div>

                  <div className="tier-controls">
                    {isActive ? (
                      <>
                        <button onClick={commitChanges} className="control-apply">Apply</button>
                        <button onClick={abandonChanges} className="control-cancel">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => activateEditor(config.challengeLevel)} className="control-calibrate">
                        Calibrate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="experiment-lab">
          <h2 className="zone-title">🧪 Performance Simulator</h2>
          <p className="lab-description">Watch how XP accumulates through different learning paths</p>

          <div className="scenario-picker">
            <label className="picker-label">Learning Journey:</label>
            <div className="scenario-buttons">
              <button 
                onClick={() => setScenarioType('mixed')}
                className={`scenario-btn ${scenarioType === 'mixed' ? 'active-scenario' : ''}`}
              >
                Mixed Path
              </button>
              <button 
                onClick={() => setScenarioType('beginner')}
                className={`scenario-btn ${scenarioType === 'beginner' ? 'active-scenario' : ''}`}
              >
                Foundation Builder
              </button>
              <button 
                onClick={() => setScenarioType('advanced')}
                className={`scenario-btn ${scenarioType === 'advanced' ? 'active-scenario' : ''}`}
              >
                Master Track
              </button>
              <button 
                onClick={() => setScenarioType('growth')}
                className={`scenario-btn ${scenarioType === 'growth' ? 'active-scenario' : ''}`}
              >
                Progression Arc
              </button>
            </div>
          </div>

          {experimentResults && (
            <div className="experiment-output">
              <div className="journey-graph">
                {experimentResults.journey.map((event) => (
                  <div key={event.step} className="graph-node">
                    <div className="node-header">
                      <span className="node-step">Step {event.step}</span>
                      <span className={`node-tier tier-${event.difficulty}`}>
                        T{event.difficulty}
                      </span>
                    </div>
                    <div className="node-body">
                      <div className={`result-indicator ${event.conquered ? 'won' : 'lost'}`}>
                        {event.conquered ? '🎯' : '💔'}
                      </div>
                      <div className="delta-display">
                        <span className={event.delta >= 0 ? 'delta-up' : 'delta-down'}>
                          {event.delta >= 0 ? '+' : ''}{event.delta.toFixed(1)}
                        </span>
                        <span className="cumulative-xp">{event.accumulated.toFixed(1)} total</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="experiment-summary">
                <h3>Journey Complete</h3>
                <div className={`final-tally ${experimentResults.finalScore >= 0 ? 'tally-positive' : 'tally-negative'}`}>
                  <div className="tally-label">Net XP</div>
                  <div className="tally-value">
                    {experimentResults.finalScore >= 0 ? '+' : ''}{experimentResults.finalScore.toFixed(1)}
                  </div>
                </div>
                <div className="analytics-grid">
                  <div className="analytic-cell">
                    <div className="cell-label">Victories</div>
                    <div className="cell-value">{experimentResults.journey.filter(e => e.conquered).length}</div>
                  </div>
                  <div className="analytic-cell">
                    <div className="cell-label">Defeats</div>
                    <div className="cell-value">{experimentResults.journey.filter(e => !e.conquered).length}</div>
                  </div>
                  <div className="analytic-cell">
                    <div className="cell-label">Avg/Step</div>
                    <div className="cell-value">{(experimentResults.finalScore / experimentResults.journey.length).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="guidance-panel">
          <h3>💡 Calibration Guide</h3>
          <div className="guide-tips">
            <div className="tip-card">
              <div className="tip-icon">🎯</div>
              <div className="tip-text">
                <strong>Reward Progress</strong>
                <p>Higher tiers should offer greater rewards to motivate advancement</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">⚖️</div>
              <div className="tip-text">
                <strong>Balance Risk</strong>
                <p>Keep penalties reasonable to encourage challenging attempts</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">📊</div>
              <div className="tip-text">
                <strong>Test Impact</strong>
                <p>Use the simulator to validate changes before applying</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default SkillMatrixConfig;
