import React, { useState } from 'react';
import './PinModal.css';

function PinModal({ isOpen, onConfirm, onCancel, message }) {
  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(pin);
    setPin(''); // Clear pin after submission
  };

  const handleCancel = () => {
    setPin(''); // Clear pin on cancel
    onCancel();
  };

  return (
    <div className="pin-modal-overlay">
      <div className="pin-modal">
        <h3>PIN Verification Required</h3>
        <p>{message || 'Please enter PIN to confirm this action:'}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            autoFocus
            className="pin-input"
          />
          <div className="pin-modal-actions">
            <button type="button" onClick={handleCancel} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-confirm">
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PinModal;
