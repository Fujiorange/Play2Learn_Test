import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function TrackSupportTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadTickets();
  }, [navigate]);

  const loadTickets = async () => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/mongo/parent/support-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return { bg: '#fef3c7', color: '#92400e', border: '#f59e0b' };
      case 'in-progress': return { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' };
      case 'resolved': return { bg: '#d1fae5', color: '#065f46', border: '#10b981' };
      case 'closed': return { bg: '#f3f4f6', color: '#374151', border: '#9ca3af' };
      default: return { bg: '#f3f4f6', color: '#374151', border: '#9ca3af' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': case 'normal': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    ticketList: { display: 'flex', flexDirection: 'column', gap: '16px' },
    ticketCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', cursor: 'pointer', transition: 'all 0.2s', border: '2px solid transparent' },
    ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
    ticketSubject: { fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 },
    ticketMeta: { display: 'flex', gap: '8px', alignItems: 'center' },
    badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    ticketInfo: { display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' },
    emptyState: { background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    emptyIcon: { fontSize: '48px', marginBottom: '16px' },
    emptyTitle: { fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' },
    emptyText: { color: '#6b7280', marginBottom: '24px' },
    createButton: { padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 },
    closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' },
    detailRow: { marginBottom: '16px' },
    detailLabel: { fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' },
    detailValue: { fontSize: '15px', color: '#1f2937' },
    responseSection: { marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' },
    responseItem: { background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '12px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading tickets...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📩 My Support Tickets</h1>
          <button style={styles.backButton} onClick={() => navigate('/parent')}>← Back to Dashboard</button>
        </div>

        {tickets.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎫</div>
            <h2 style={styles.emptyTitle}>No Support Tickets</h2>
            <p style={styles.emptyText}>You haven't created any support tickets yet.</p>
            <button style={styles.createButton} onClick={() => navigate('/parent/support/create')}>
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div style={styles.ticketList}>
            {tickets.map((ticket) => {
              const statusStyle = getStatusColor(ticket.status);
              return (
                <div 
                  key={ticket._id} 
                  style={styles.ticketCard}
                  onClick={() => setSelectedTicket(ticket)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#10b981'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div style={styles.ticketHeader}>
                    <h3 style={styles.ticketSubject}>{ticket.subject}</h3>
                    <div style={styles.ticketMeta}>
                      <span style={{ ...styles.badge, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
                        {ticket.status || 'open'}
                      </span>
                      <span style={{ ...styles.badge, background: '#f3f4f6', color: getPriorityColor(ticket.priority) }}>
                        {ticket.priority || 'medium'}
                      </span>
                    </div>
                  </div>
                  <div style={styles.ticketInfo}>
                    <span>📁 {ticket.category}</span>
                    <span>📅 {formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div style={styles.modal} onClick={() => setSelectedTicket(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Ticket Details</h2>
              <button style={styles.closeButton} onClick={() => setSelectedTicket(null)}>×</button>
            </div>

            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Subject</div>
              <div style={styles.detailValue}>{selectedTicket.subject}</div>
            </div>

            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ ...styles.detailRow, flex: 1 }}>
                <div style={styles.detailLabel}>Category</div>
                <div style={styles.detailValue}>{selectedTicket.category}</div>
              </div>
              <div style={{ ...styles.detailRow, flex: 1 }}>
                <div style={styles.detailLabel}>Priority</div>
                <div style={{ ...styles.detailValue, color: getPriorityColor(selectedTicket.priority) }}>
                  {selectedTicket.priority}
                </div>
              </div>
              <div style={{ ...styles.detailRow, flex: 1 }}>
                <div style={styles.detailLabel}>Status</div>
                <div style={styles.detailValue}>{selectedTicket.status}</div>
              </div>
            </div>

            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Description</div>
              <div style={{ ...styles.detailValue, whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</div>
            </div>

            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Created</div>
              <div style={styles.detailValue}>{formatDate(selectedTicket.createdAt)}</div>
            </div>

            {selectedTicket.responses && selectedTicket.responses.length > 0 && (
              <div style={styles.responseSection}>
                <div style={styles.detailLabel}>Responses ({selectedTicket.responses.length})</div>
                {selectedTicket.responses.map((response, idx) => (
                  <div key={idx} style={styles.responseItem}>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{response.author || 'Support Team'}</div>
                    <div style={{ marginBottom: '8px' }}>{response.message}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(response.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
