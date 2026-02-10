import React, { useState, useEffect } from 'react';
import './Gameboard.css';

/**
 * Gameboard Component for Adaptive Quiz System
 * Displays a monopoly-style gameboard with 10 levels
 * Shows character avatar that moves based on quiz performance
 */
const Gameboard = ({ 
  currentLevel = 1, 
  targetLevel = null, 
  characterType = 'neutral', 
  showAnimation = false,
  onAnimationComplete = () => {} 
}) => {
  const [animatingPosition, setAnimatingPosition] = useState(currentLevel);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (showAnimation && targetLevel !== null && targetLevel !== currentLevel) {
      setIsAnimating(true);
      
      // Animate character movement
      const steps = Math.abs(targetLevel - currentLevel);
      const direction = targetLevel > currentLevel ? 1 : -1;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setAnimatingPosition(prev => prev + direction);
        
        if (currentStep >= steps) {
          clearInterval(interval);
          setTimeout(() => {
            setIsAnimating(false);
            onAnimationComplete();
          }, 500);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [showAnimation, targetLevel, currentLevel, onAnimationComplete]);

  // Generate character emoji based on gender/type
  const getCharacterEmoji = (type) => {
    switch (type) {
      case 'male':
        return '👦';
      case 'female':
        return '👧';
      default:
        return '😊';
    }
  };

  // Generate level badge (locked/unlocked/current)
  const getLevelBadge = (level) => {
    const position = showAnimation && isAnimating ? animatingPosition : currentLevel;
    
    if (level === position) {
      return '⭐'; // Current position
    } else if (level < position) {
      return '✅'; // Completed
    } else {
      return '🔒'; // Locked
    }
  };

  // Get level color based on status
  const getLevelColor = (level) => {
    const position = showAnimation && isAnimating ? animatingPosition : currentLevel;
    
    if (level === position) {
      return '#10b981'; // Green for current
    } else if (level < position) {
      return '#3b82f6'; // Blue for completed
    } else {
      return '#9ca3af'; // Gray for locked
    }
  };

  return (
    <div className="gameboard-container">
      <div className="gameboard-header">
        <h3>🎮 Quiz Adventure Board</h3>
        <p>Level {currentLevel} of 10</p>
      </div>

      <div className="gameboard-track">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
          const position = showAnimation && isAnimating ? animatingPosition : currentLevel;
          const isCurrentPosition = level === position;
          
          return (
            <div 
              key={level} 
              className={`gameboard-space ${isCurrentPosition ? 'current' : ''} ${level < position ? 'completed' : ''}`}
              style={{ borderColor: getLevelColor(level) }}
            >
              <div className="level-number">{level}</div>
              <div className="level-badge">{getLevelBadge(level)}</div>
              
              {isCurrentPosition && (
                <div className={`character-avatar ${isAnimating ? 'bouncing' : ''}`}>
                  {getCharacterEmoji(characterType)}
                </div>
              )}
              
              <div className="level-label">
                {level === 1 ? 'Start' : level === 10 ? 'Master' : `Level ${level}`}
              </div>
            </div>
          );
        })}
      </div>

      {showAnimation && isAnimating && (
        <div className="animation-overlay">
          <div className="animation-message">
            {targetLevel > currentLevel ? '🎉 Moving Forward!' : '⬅️ Moving Back'}
          </div>
        </div>
      )}

      <div className="gameboard-legend">
        <div className="legend-item">
          <span className="legend-icon">⭐</span>
          <span>Current Level</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">✅</span>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🔒</span>
          <span>Locked</span>
        </div>
      </div>
    </div>
  );
};

export default Gameboard;
