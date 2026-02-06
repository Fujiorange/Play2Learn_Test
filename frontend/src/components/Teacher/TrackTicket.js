// frontend/src/components/Teacher/TrackTicket.js
// ✅ FIXED VERSION - Uses real API
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function TrackTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const loadTickets = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/support-tickets`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setTickets(data.tickets || []);
        } else {
          setError('Failed to load support tickets');
          setTickets([]);
        }
      } catch (error) {
        console.error('Load tickets error:', error);
        setError('Failed to load support tickets');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, [navigate]);

  const getStatusColor = (status) => {
    const colors = {
      open: { bg: '#fef3c7', text: '#92400e', label: '🟡 Open' },
      'in-progress': { bg: '#dbeafe', text: '#1e40af', label: '🔵 In Progress' },
      resolved: { bg: '#d1fae5', text: '#065f46', label: '✅ Resolved' },
      closed: { bg: '#e5e7eb', text: '#374151', label: '⬜ Closed' }
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority] || colors.medium;
  };

  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filter);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterButtons: { display: 'flex', gap: '8px' },
    filterButton: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: 'white' },
    filterButtonActive: { borderColor: '#10b981', background: '#d1fae5', color: '#065f46' },
    ticketGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
    ticketCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' },
    ticketId: { fontSize: '14px', fontWeight: '700', color: '#10b981' },
    ticketSubject: { fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' },
    ticketInfo: { display: 'flex', gap: '16px', marginBottom: '12px' },
    ticketMeta: { display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' },
    badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    ticketDescription: { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 16px 0' },
    ticketFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontSize: '14px', color: '#6b7280' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    createButton: { padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
    ticketList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #e5e7eb',
            borderTop: '5px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}></div>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🎫 Track Support Tickets</h1>
            <button style={styles.backButton} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
          </div>
          
          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}
          
          <div style={styles.filterButtons}>
            {['all', 'open', 'in-progress', 'resolved'].map(status => (
              <button key={status} onClick={() => setFilter(status)} style={{...styles.filterButton, ...(filter === status ? styles.filterButtonActive : {})}}>
                {status === 'all' ? 'All' : status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        {filteredTickets.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎫</div>
            <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
              {filter === 'all' ? 'No support tickets yet' : `No ${filter} tickets`}
            </p>
            <button
              style={{ ...styles.createButton, marginTop: '20px' }}
              onClick={() => navigate('/teacher/support/create')}
            >
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div style={styles.ticketList}>
            {filteredTickets.map((ticket) => {
              const statusStyle = getStatusColor(ticket.status);
              return (
                <div key={ticket._id} style={styles.ticketCard}>
                  <div style={styles.ticketHeader}>
                    <div>
                      <h3 style={styles.ticketSubject}>{ticket.subject}</h3>
                      <span style={styles.ticketId}>Ticket #{ticket._id?.slice(-6) || 'N/A'}</span>
                    </div>
                  </div>
                  <div style={styles.ticketMeta}>
                    <span style={{
                      ...styles.badge,
                      background: statusStyle.bg,
                      color: statusStyle.text
                    }}>
                      {statusStyle.label}
                    </span>
                    <span style={{
                      ...styles.badge,
                      background: `${getPriorityColor(ticket.priority)}20`,
                      color: getPriorityColor(ticket.priority)
                    }}>
                      {ticket.priority || 'medium'} priority
                    </span>
                    <span style={{
                      ...styles.badge,
                      background: '#f3f4f6',
                      color: '#6b7280'
                    }}>
                      {ticket.category || 'general'}
                    </span>
                  </div>
                  <p style={styles.ticketDescription}>
                    {ticket.description?.length > 200 
                      ? ticket.description.substring(0, 200) + '...' 
                      : ticket.description}
                  </p>
                  <div style={styles.ticketFooter}>
                    <span>Created: {formatDate(ticket.createdAt)}</span>
                    {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                      <span>Updated: {formatDate(ticket.updatedAt)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
