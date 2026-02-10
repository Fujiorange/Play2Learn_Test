// Reusable PIN Confirmation Modal Component
import React, { useState, useEffect } from 'react';
import './PinConfirmationModal.css';

const CORRECT_PIN = '1234';

function PinConfirmationModal({ isOpen, onConfirm, onCancel, title = 'Confirm Delete Action' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4); // Only digits, max 4
    setPin(value);
    setError(''); // Clear error when typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pin) {
      setError('Please enter PIN');
      return;
    }

    if (pin !== CORRECT_PIN) {
      setError('Incorrect PIN. Please try again.');
      setPin('');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch (err) {
      setError('Operation failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    setError('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="pin-modal-overlay" onClick={handleCancel}>
      <div className="pin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="pin-modal-header">
          <h3>🔒 {title}</h3>
          <button className="pin-modal-close" onClick={handleCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="pin-modal-body">
            <p>This action requires administrator confirmation.</p>
            <p>Please enter your 4-digit PIN to continue:</p>
            
            <div className="pin-input-group">
              <input
                type="password"
                className="pin-input"
                value={pin}
                onChange={handlePinChange}
                placeholder="Enter PIN"
                maxLength="4"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            
            {error && <div className="pin-error">{error}</div>}
          </div>
          
          <div className="pin-modal-footer">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-confirm"
              disabled={isSubmitting || !pin}
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PinConfirmationModal;
