import React, { useState, useRef, useEffect } from 'react';

/**
 * ChildSelector - Dropdown component for selecting which child to view
 * 
 * @param {Array} children - Array of linked students from parent dashboard
 * @param {Object} selectedChild - Currently selected child
 * @param {Function} onChange - Callback when child selection changes
 */
export default function ChildSelector({ children, selectedChild, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (child) => {
    onChange(child);
    setIsOpen(false);
  };

  const styles = {
    container: {
      position: 'relative',
      width: '100%',
      maxWidth: '400px',
      marginBottom: '24px'
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#6b7280',
      marginBottom: '8px',
      display: 'block'
    },
    selectedButton: {
      width: '100%',
      padding: '16px',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    },
    selectedButtonHover: {
      borderColor: '#10b981',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    },
    selectedContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '18px',
      fontWeight: '700'
    },
    selectedInfo: {
      textAlign: 'left'
    },
    selectedName: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '2px'
    },
    selectedDetails: {
      fontSize: '13px',
      color: '#6b7280'
    },
    arrow: {
      fontSize: '20px',
      color: '#6b7280',
      transition: 'transform 0.2s'
    },
    arrowOpen: {
      transform: 'rotate(180deg)'
    },
    dropdown: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      right: 0,
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      maxHeight: '300px',
      overflowY: 'auto',
      zIndex: 1000
    },
    dropdownItem: {
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      borderBottom: '1px solid #f3f4f6'
    },
    dropdownItemHover: {
      background: '#f9fafb'
    },
    dropdownItemSelected: {
      background: '#d1fae5'
    },
    itemInfo: {
      flex: 1
    },
    itemName: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '2px'
    },
    itemDetails: {
      fontSize: '12px',
      color: '#6b7280'
    },
    checkmark: {
      fontSize: '18px',
      color: '#10b981'
    },
    emptyState: {
      padding: '32px 16px',
      textAlign: 'center',
      color: '#6b7280'
    }
  };

  // Handle no children case
  if (!children || children.length === 0) {
    return (
      <div style={styles.container}>
        <label style={styles.label}>👦 Viewing Child</label>
        <div style={{...styles.selectedButton, cursor: 'not-allowed', opacity: 0.6}}>
          <div style={styles.selectedContent}>
            <div style={styles.selectedInfo}>
              <div style={styles.selectedName}>No Children Linked</div>
              <div style={styles.selectedDetails}>Contact administrator to link children</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle single child case (no dropdown needed)
  if (children.length === 1) {
    const child = children[0];
    return (
      <div style={styles.container}>
        <label style={styles.label}>👦 Viewing Child</label>
        <div style={styles.selectedButton}>
          <div style={styles.selectedContent}>
            <div style={styles.avatar}>
              {child.studentName?.charAt(0).toUpperCase()}
            </div>
            <div style={styles.selectedInfo}>
              <div style={styles.selectedName}>{child.studentName}</div>
              <div style={styles.selectedDetails}>
                {child.gradeLevel} • {child.class}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple children - show dropdown
  return (
    <div style={styles.container} ref={dropdownRef}>
      <label style={styles.label}>👦 Viewing Child</label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.selectedButton,
          ...(isOpen ? styles.selectedButtonHover : {})
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#10b981';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
          }
        }}
      >
        <div style={styles.selectedContent}>
          <div style={styles.avatar}>
            {selectedChild?.studentName?.charAt(0).toUpperCase()}
          </div>
          <div style={styles.selectedInfo}>
            <div style={styles.selectedName}>{selectedChild?.studentName}</div>
            <div style={styles.selectedDetails}>
              {selectedChild?.gradeLevel} • {selectedChild?.class}
            </div>
          </div>
        </div>
        <div style={{
          ...styles.arrow,
          ...(isOpen ? styles.arrowOpen : {})
        }}>
          ▼
        </div>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          {children.map((child, index) => {
            const isSelected = child.studentId === selectedChild?.studentId;
            
            return (
              <div
                key={child.studentId || index}
                onClick={() => handleSelect(child)}
                style={{
                  ...styles.dropdownItem,
                  ...(isSelected ? styles.dropdownItemSelected : {})
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={styles.avatar}>
                  {child.studentName?.charAt(0).toUpperCase()}
                </div>
                <div style={styles.itemInfo}>
                  <div style={styles.itemName}>{child.studentName}</div>
                  <div style={styles.itemDetails}>
                    {child.gradeLevel} • {child.class} • {child.relationship}
                  </div>
                </div>
                {isSelected && (
                  <div style={styles.checkmark}>✓</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}