// School License View Component for School Admin Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolLicenseView.css';

const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : `${window.location.origin}/api`);

function SchoolLicenseView() {
  const navigate = useNavigate();
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [availableLicenses, setAvailableLicenses] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchLicenseInfo();
  }, []);

  const fetchLicenseInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/mongo/school-admin/license-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setLicenseInfo(data.license);
      } else {
        setError(data.error || 'Failed to load license information');
      }
    } catch (error) {
      console.error('Failed to fetch license info:', error);
      setError('Failed to load license information');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current, max) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#ef4444'; // Red
    if (percentage >= 70) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const fetchAvailableLicenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/licenses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // Filter out free licenses and only show paid, active licenses
        const paidLicenses = data.licenses.filter(license => 
          license.type === 'paid' && license.isActive
        );
        setAvailableLicenses(paidLicenses);
      }
    } catch (error) {
      console.error('Failed to fetch available licenses:', error);
    }
  };

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
    fetchAvailableLicenses();
  };

  const handleLicenseSelect = (license) => {
    setSelectedLicense(license);
    setShowPaymentForm(true);
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number (remove spaces, limit to 16 digits)
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/\D/g, '').slice(0, 16);
      // Add space every 4 digits for display
      formattedValue = formattedValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    // Format expiry date (MM/YY)
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    }

    // Format CVV (3 digits only)
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setPaymentData({
      ...paymentData,
      [name]: formattedValue
    });

    // Clear error for this field
    setPaymentErrors({
      ...paymentErrors,
      [name]: ''
    });
  };

  const validatePayment = () => {
    const errors = {};

    // Validate card number (16 digits)
    const cardNumberClean = paymentData.cardNumber.replace(/\s/g, '');
    if (!cardNumberClean) {
      errors.cardNumber = 'Card number is required';
    } else if (cardNumberClean.length !== 16) {
      errors.cardNumber = 'Card number must be 16 digits';
    } else if (!/^\d{16}$/.test(cardNumberClean)) {
      errors.cardNumber = 'Card number must contain only digits';
    }

    // Validate expiry date (MM/YY format and not expired)
    if (!paymentData.expiryDate) {
      errors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
      errors.expiryDate = 'Expiry date must be in MM/YY format';
    } else {
      const [month, year] = paymentData.expiryDate.split('/');
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt('20' + year, 10);
      
      if (monthNum < 1 || monthNum > 12) {
        errors.expiryDate = 'Invalid month (must be 01-12)';
      } else {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
          errors.expiryDate = 'Card has expired';
        }
      }
    }

    // Validate CVV (3 digits)
    if (!paymentData.cvv) {
      errors.cvv = 'CVV is required';
    } else if (paymentData.cvv.length !== 3) {
      errors.cvv = 'CVV must be 3 digits';
    } else if (!/^\d{3}$/.test(paymentData.cvv)) {
      errors.cvv = 'CVV must contain only digits';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!validatePayment()) {
      return;
    }

    setProcessingPayment(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/mongo/school-admin/upgrade-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          licenseId: selectedLicense._id,
          billingCycle: billingCycle,
          paymentInfo: {
            cardNumber: paymentData.cardNumber.replace(/\s/g, ''),
            expiryDate: paymentData.expiryDate,
            cvv: paymentData.cvv
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Reset states
        setShowUpgradeModal(false);
        setShowPaymentForm(false);
        setSelectedLicense(null);
        setPaymentData({ cardNumber: '', expiryDate: '', cvv: '' });
        
        // Show success message
        alert('🎉 Payment successful! Your license has been upgraded.');
        
        // Refresh license info
        await fetchLicenseInfo();
      } else {
        setError(data.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment processing failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleBackFromPayment = () => {
    setShowPaymentForm(false);
    setSelectedLicense(null);
    setPaymentData({ cardNumber: '', expiryDate: '', cvv: '' });
    setPaymentErrors({});
  };

  const handleCloseModal = () => {
    setShowUpgradeModal(false);
    setShowPaymentForm(false);
    setSelectedLicense(null);
    setPaymentData({ cardNumber: '', expiryDate: '', cvv: '' });
    setPaymentErrors({});
    setError('');
  };

  if (loading) {
    return (
      <div className="school-license-view loading">
        <div className="loading-spinner">Loading license information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="school-license-view error">
        <div className="error-message">⚠️ {error}</div>
      </div>
    );
  }

  if (!licenseInfo) {
    return (
      <div className="school-license-view error">
        <div className="error-message">No license information available</div>
      </div>
    );
  }

  const teacherPercentage = getUsagePercentage(licenseInfo.usage.currentTeachers, licenseInfo.limits.maxTeachers);
  const studentPercentage = getUsagePercentage(licenseInfo.usage.currentStudents, licenseInfo.limits.maxStudents);
  const classPercentage = getUsagePercentage(licenseInfo.usage.currentClasses, licenseInfo.limits.maxClasses);

  return (
    <div className="school-license-view">
      {/* Back to Dashboard Button */}
      <div className="back-to-dashboard">
        <button 
          className="btn-back-dashboard"
          onClick={() => navigate('/school-admin')}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="license-header">
        <div className="license-title-section">
          <h2>License Information</h2>
          <span className={`license-badge ${licenseInfo.type}`}>
            {licenseInfo.name}
          </span>
        </div>
        
        {licenseInfo.type === 'free' && (
          <button 
            className="btn-upgrade"
            onClick={handleUpgradeClick}
          >
            ⬆️ Upgrade License
          </button>
        )}
      </div>

      {/* Free License Expiry Warning */}
      {licenseInfo.type === 'free' && licenseInfo.expiresAt && (
        <div className={`expiry-notice ${licenseInfo.isExpired ? 'expired' : licenseInfo.isNearExpiry ? 'warning' : 'info'}`}>
          <div className="notice-icon">
            {licenseInfo.isExpired ? '🚫' : licenseInfo.isNearExpiry ? '⚠️' : '📅'}
          </div>
          <div className="notice-content">
            <strong>
              {licenseInfo.isExpired 
                ? 'License Expired' 
                : licenseInfo.isNearExpiry 
                  ? 'License Expiring Soon' 
                  : 'Free License Active'}
            </strong>
            <p>
              {licenseInfo.isExpired 
                ? 'Your license has expired. Please upgrade to continue using all features.' 
                : `Your license expires in ${licenseInfo.daysRemaining} day${licenseInfo.daysRemaining !== 1 ? 's' : ''}.`}
            </p>
          </div>
          {!licenseInfo.isExpired && (
            <button 
              className="btn-upgrade-small"
              onClick={handleUpgradeClick}
            >
              Upgrade Now
            </button>
          )}
        </div>
      )}

      {/* License Description */}
      {licenseInfo.description && (
        <div className="license-description">
          <p>{licenseInfo.description}</p>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="usage-section">
        <h3>Current Usage</h3>
        
        <div className="usage-grid">
          {/* Teachers */}
          <div className="usage-card">
            <div className="usage-header">
              <span className="usage-icon">👨‍🏫</span>
              <span className="usage-label">Teachers</span>
            </div>
            <div className="usage-stats">
              <span className="usage-current">{licenseInfo.usage.currentTeachers}</span>
              <span className="usage-separator">/</span>
              <span className="usage-limit">
                {licenseInfo.limits.maxTeachers === -1 ? '∞' : licenseInfo.limits.maxTeachers}
              </span>
            </div>
            {licenseInfo.limits.maxTeachers !== -1 && (
              <div className="usage-bar">
                <div 
                  className="usage-bar-fill" 
                  style={{ 
                    width: `${teacherPercentage}%`,
                    backgroundColor: getUsageColor(teacherPercentage)
                  }}
                />
              </div>
            )}
            {teacherPercentage >= 90 && (
              <div className="usage-warning">Near limit!</div>
            )}
          </div>

          {/* Students */}
          <div className="usage-card">
            <div className="usage-header">
              <span className="usage-icon">👨‍🎓</span>
              <span className="usage-label">Students</span>
            </div>
            <div className="usage-stats">
              <span className="usage-current">{licenseInfo.usage.currentStudents}</span>
              <span className="usage-separator">/</span>
              <span className="usage-limit">
                {licenseInfo.limits.maxStudents === -1 ? '∞' : licenseInfo.limits.maxStudents}
              </span>
            </div>
            {licenseInfo.limits.maxStudents !== -1 && (
              <div className="usage-bar">
                <div 
                  className="usage-bar-fill" 
                  style={{ 
                    width: `${studentPercentage}%`,
                    backgroundColor: getUsageColor(studentPercentage)
                  }}
                />
              </div>
            )}
            {studentPercentage >= 90 && (
              <div className="usage-warning">Near limit!</div>
            )}
          </div>

          {/* Classes */}
          <div className="usage-card">
            <div className="usage-header">
              <span className="usage-icon">🏫</span>
              <span className="usage-label">Classes</span>
            </div>
            <div className="usage-stats">
              <span className="usage-current">{licenseInfo.usage.currentClasses}</span>
              <span className="usage-separator">/</span>
              <span className="usage-limit">
                {licenseInfo.limits.maxClasses === -1 ? '∞' : licenseInfo.limits.maxClasses}
              </span>
            </div>
            {licenseInfo.limits.maxClasses !== -1 && (
              <div className="usage-bar">
                <div 
                  className="usage-bar-fill" 
                  style={{ 
                    width: `${classPercentage}%`,
                    backgroundColor: getUsageColor(classPercentage)
                  }}
                />
              </div>
            )}
            {classPercentage >= 90 && (
              <div className="usage-warning">Near limit!</div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content upgrade-modal" onClick={(e) => e.stopPropagation()}>
            {!showPaymentForm ? (
              <>
                <h3>Upgrade Your License</h3>
                <p>Choose a plan that fits your needs:</p>

                {/* Billing Cycle Toggle */}
                <div className="billing-toggle">
                  <button
                    className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    className={`billing-option ${billingCycle === 'yearly' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('yearly')}
                  >
                    Yearly (Save 17%)
                  </button>
                </div>

                {/* Available Licenses */}
                <div className="available-licenses">
                  {availableLicenses.length === 0 ? (
                    <p className="no-licenses">No upgrade plans available at the moment.</p>
                  ) : (
                    availableLicenses.map(license => (
                      <div key={license._id} className="license-plan-card">
                        <div className="plan-header">
                          <h4>{license.name}</h4>
                          <div className="plan-price">
                            <span className="price-amount">
                              ${billingCycle === 'monthly' ? license.priceMonthly.toFixed(2) : license.priceYearly.toFixed(2)}
                            </span>
                            <span className="price-period">
                              /{billingCycle === 'monthly' ? 'month' : 'year'}
                            </span>
                          </div>
                        </div>
                        
                        {license.description && (
                          <p className="plan-description">{license.description}</p>
                        )}
                        
                        <div className="plan-features">
                          <div className="feature-item">
                            <span className="feature-icon">👨‍🏫</span>
                            <span>{license.maxTeachers === -1 ? 'Unlimited' : license.maxTeachers} Teachers</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-icon">👨‍🎓</span>
                            <span>{license.maxStudents === -1 ? 'Unlimited' : license.maxStudents} Students</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-icon">🏫</span>
                            <span>{license.maxClasses === -1 ? 'Unlimited' : license.maxClasses} Classes</span>
                          </div>
                        </div>
                        
                        <button
                          className="btn-select-plan"
                          onClick={() => handleLicenseSelect(license)}
                        >
                          Select Plan
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Payment Information</h3>
                <div className="payment-summary">
                  <p><strong>Selected Plan:</strong> {selectedLicense.name}</p>
                  <p><strong>Billing Cycle:</strong> {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</p>
                  <p className="payment-amount">
                    <strong>Amount:</strong> ${billingCycle === 'monthly' ? selectedLicense.priceMonthly.toFixed(2) : selectedLicense.priceYearly.toFixed(2)}
                  </p>
                </div>

                {error && <div className="payment-error">{error}</div>}

                <form onSubmit={handlePaymentSubmit} className="payment-form">
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number *</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={handlePaymentInputChange}
                      placeholder="1234 5678 9012 3456"
                      className={paymentErrors.cardNumber ? 'error' : ''}
                      disabled={processingPayment}
                    />
                    {paymentErrors.cardNumber && (
                      <span className="field-error">{paymentErrors.cardNumber}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryDate">Expiry Date *</label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={paymentData.expiryDate}
                        onChange={handlePaymentInputChange}
                        placeholder="MM/YY"
                        className={paymentErrors.expiryDate ? 'error' : ''}
                        disabled={processingPayment}
                      />
                      {paymentErrors.expiryDate && (
                        <span className="field-error">{paymentErrors.expiryDate}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cvv">CVV *</label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={paymentData.cvv}
                        onChange={handlePaymentInputChange}
                        placeholder="123"
                        className={paymentErrors.cvv ? 'error' : ''}
                        disabled={processingPayment}
                      />
                      {paymentErrors.cvv && (
                        <span className="field-error">{paymentErrors.cvv}</span>
                      )}
                    </div>
                  </div>

                  <div className="payment-note">
                    <p>🔒 This is a simulated payment for demonstration purposes. No actual charges will be made.</p>
                  </div>

                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={handleBackFromPayment}
                      disabled={processingPayment}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={processingPayment}
                    >
                      {processingPayment ? 'Processing...' : 'Complete Payment'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolLicenseView;
