import React, { useState } from 'react';
import authService from '../../services/authService';
import './ChangePassword.css';

function ChangePassword({ onCancel, onSuccess, requireChange = false }) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // If not required to change, validate old password was entered
    if (!requireChange && !formData.oldPassword) {
      setError('Please enter your current password');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.changePassword(
        requireChange ? undefined : formData.oldPassword,
        formData.newPassword
      );

      if (response.success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(response.error || 'Failed to change password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-modal">
      <div className="change-password-container">
        <h2>{requireChange ? 'Change Your Password' : 'Update Password'}</h2>
        
        {requireChange && (
          <div className="alert alert-warning">
            <strong>Password Change Required</strong>
            <p>You must change your password before continuing.</p>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!requireChange && (
            <div className="form-group">
              <label htmlFor="oldPassword">Current Password</label>
              <input
                type="password"
                id="oldPassword"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength="8"
              autoComplete="new-password"
            />
            <small>Must be at least 8 characters long</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="8"
              autoComplete="new-password"
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
            {!requireChange && onCancel && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
