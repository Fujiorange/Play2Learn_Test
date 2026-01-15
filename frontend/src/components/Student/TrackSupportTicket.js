// TrackSupportTicket.js - UPDATED with real backend connection
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function TrackSupportTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTickets = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // REAL API CALL - Get tickets from database
        const result = await studentService.getSupportTickets();

        if (result.success) {
          setTickets(result.tickets || []);
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

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const getStatusColor = (status) => {
    if (status === 'open') return { background: '#dbeafe', color: '#1e40af' };
    if (status === 'in-progress') return { background: '#fef3c7', color: '#92400e' };
    if (status === 'resolved') return { background: '#d1fae5', color: '#065f46' };
    return { background: '#f3f4f6', color: '#6b7280' };
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterButtons: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    filterButton: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: 'white' },
    filterButtonActive: { borderColor: '#10b981', background: '#d1fae5', color: '#065f46' },
    ticketGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
    ticketCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' },
    ticketId: { fontSize: '14px', fontWeight: '700', color: '#10b981' },
    ticketSubject: { fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' },
    ticketInfo: { display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' },
    badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🎫 My Support Tickets</h1>
            <button style={styles.backButton} onClick={() => navigate('/student')}>← Back to Dashboard</button>
          </div>
          
          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}
          
          <div style={styles.filterButtons}>
            {['all', 'open', 'in-progress', 'resolved'].map(status => (
              <button 
                key={status} 
                onClick={() => setFilter(status)} 
                style={{...styles.filterButton, ...(filter === status ? styles.filterButtonActive : {})}}
              >
                {status === 'all' ? 'All' : status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredTickets.length > 0 ? (
          <div style={styles.ticketGrid}>
            {filteredTickets.map(ticket => (
              <div key={ticket.id} style={styles.ticketCard}>
                <div style={styles.ticketHeader}>
                  <div style={styles.ticketId}>{ticket.id}</div>
                  <span style={{...styles.badge, ...getStatusColor(ticket.status)}}>
                    {ticket.status === 'in-progress' ? 'In Progress' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                </div>
                <div style={styles.ticketSubject}>{ticket.subject}</div>
                <div style={styles.ticketInfo}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>📁 {ticket.category}</span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>🔔 {ticket.priority} priority</span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>📅 Created: {ticket.createdOn}</span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>🔄 Updated: {ticket.lastUpdate}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No tickets found</p>
            <p>You don't have any {filter === 'all' ? '' : filter} support tickets</p>
            <button
              onClick={() => navigate('/student/support/create')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Create New Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}