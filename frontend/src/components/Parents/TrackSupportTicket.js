// TrackSupportTicket.js - UPDATED with admin reply display and notification
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import parentService from '../../services/parentService';

export default function TrackSupportTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);

  useEffect(() => {
    const loadTickets = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const result = await parentService.getSupportTickets();
        
        if (result.success) {
          setTickets(result.tickets || []);
          setError(null);
        } else {
          console.error('Failed to load tickets:', result.error);
          setError(result.error || 'Failed to load support tickets');
          setTickets([]);
        }
      } catch (error) {
        console.error('Error loading tickets:', error);
        setError('Failed to load support tickets. Please try again.');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [navigate]);

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const unreadReplies = tickets.filter(t => t.hasReply).length;

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return { bg: '#dbeafe', color: '#1e40af' };
      case 'pending': return { bg: '#fef3c7', color: '#92400e' };
      case 'in-progress': return { bg: '#fef3c7', color: '#92400e' };
      case 'resolved': return { bg: '#d1fae5', color: '#065f46' };
      case 'closed': return { bg: '#f3f4f6', color: '#6b7280' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return { bg: '#fee2e2', color: '#991b1b' };
      case 'medium': case 'normal': return { bg: '#fef3c7', color: '#92400e' };
      case 'low': return { bg: '#d1fae5', color: '#065f46' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleTicketExpand = (ticketId) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' },
    buttonGroup: { display: 'flex', gap: '12px' },
    button: { padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    backButton: { background: '#6b7280', color: 'white' },
    createButton: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' },
    filterButtons: { display: 'flex', gap: '8px' },
    filterButton: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: 'white' },
    filterButtonActive: { borderColor: '#10b981', background: '#d1fae5', color: '#065f46' },
    ticketsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
    ticketCard: { background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden', transition: 'all 0.3s ease' },
    ticketCardHeader: { padding: '24px', cursor: 'pointer' },
    ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' },
    ticketIdRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    ticketId: { fontSize: '14px', fontWeight: '700', color: '#6b7280', marginBottom: '4px' },
    replyBadge: { 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px',
      padding: '4px 8px', 
      background: '#ef4444', 
      color: 'white', 
      borderRadius: '12px', 
      fontSize: '11px', 
      fontWeight: '700'
    },
    ticketSubject: { fontSize: '18px', fontWeight: '600', color: '#1f2937' },
    ticketMeta: { display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: '#6b7280', flexWrap: 'wrap' },
    badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginLeft: '8px' },
    expandedContent: { 
      padding: '0 24px 24px 24px', 
      borderTop: '1px solid #e5e7eb',
      background: '#f9fafb'
    },
    messageSection: { marginBottom: '20px' },
    sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
    messageBox: { 
      background: 'white', 
      padding: '16px', 
      borderRadius: '8px', 
      border: '1px solid #e5e7eb',
      fontSize: '14px',
      color: '#4b5563',
      lineHeight: '1.6'
    },
    replySection: { 
      marginTop: '20px',
      padding: '16px',
      background: '#dcfce7',
      borderRadius: '8px',
      border: '1px solid #86efac'
    },
    replySectionTitle: { 
      fontSize: '14px', 
      fontWeight: '600', 
      color: '#166534', 
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    replyBox: { 
      background: 'white', 
      padding: '16px', 
      borderRadius: '8px', 
      border: '1px solid #86efac',
      fontSize: '14px',
      color: '#4b5563',
      lineHeight: '1.6'
    },
    replyMeta: {
      marginTop: '8px',
      fontSize: '12px',
      color: '#6b7280'
    },
    noReply: {
      padding: '16px',
      background: '#fef3c7',
      borderRadius: '8px',
      border: '1px solid #fcd34d',
      color: '#92400e',
      fontSize: '14px'
    },
    clickToExpand: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '8px'
    },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    errorMessage: { background: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #f87171' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
    notificationBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '24px',
      height: '24px',
      background: '#ef4444',
      color: 'white',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '700',
      padding: '0 6px'
    }
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>
              🎫 Support Tickets
              {unreadReplies > 0 && (
                <span style={styles.notificationBadge} title={`${unreadReplies} ticket(s) with replies`}>
                  {unreadReplies}
                </span>
              )}
            </h1>
            <div style={styles.buttonGroup}>
              <button style={{...styles.button, ...styles.backButton}} onClick={() => navigate('/parent')}>← Back</button>
              <button style={{...styles.button, ...styles.createButton}} onClick={() => navigate('/parent/support/create')}>+ New Ticket</button>
            </div>
          </div>
          <div style={styles.filterButtons}>
            {['all', 'open', 'pending', 'closed'].map(status => (
              <button 
                key={status} 
                onClick={() => setFilter(status)} 
                style={{
                  ...styles.filterButton, 
                  ...(filter === status ? styles.filterButtonActive : {})
                }}
              >
                {status === 'all' ? 'All' : status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {filteredTickets.length > 0 ? (
          <div style={styles.ticketsList}>
            {filteredTickets.map(ticket => {
              const statusColors = getStatusColor(ticket.status);
              const priorityColors = getPriorityColor(ticket.priority);
              const ticketKey = ticket.ticketId || ticket.id;
              return (
                <div key={ticketKey} style={styles.ticketCard}>
                  <div 
                    style={styles.ticketCardHeader}
                    onClick={() => toggleTicketExpand(ticketKey)}
                  >
                    <div style={styles.ticketHeader}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.ticketIdRow}>
                          <span style={styles.ticketId}>{ticket.id}</span>
                          {ticket.hasReply && (
                            <span style={styles.replyBadge}>
                              💬 Reply
                            </span>
                          )}
                        </div>
                        <div style={styles.ticketSubject}>{ticket.subject}</div>
                        <div style={styles.ticketMeta}>
                          <span>📁 {ticket.category}</span>
                          <span>📅 Created: {formatDate(ticket.createdAt)}</span>
                          <span>🔄 Updated: {formatDate(ticket.updatedAt)}</span>
                        </div>
                      </div>
                      <div>
                        <span style={{...styles.badge, background: statusColors.bg, color: statusColors.color}}>
                          {ticket.status?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                        <span style={{...styles.badge, background: priorityColors.bg, color: priorityColors.color}}>
                          {ticket.priority === 'high' && '🔴'} {ticket.priority === 'normal' && '🟡'} {ticket.priority === 'low' && '🟢'} {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div style={styles.clickToExpand}>
                      {expandedTicket === ticketKey ? '▲ Click to collapse' : '▼ Click to view details'}
                    </div>
                  </div>

                  {expandedTicket === ticketKey && (
                    <div style={styles.expandedContent}>
                      <div style={styles.messageSection}>
                        <div style={styles.sectionTitle}>📝 Your Message:</div>
                        <div style={styles.messageBox}>
                          {ticket.message || ticket.description || 'No message content'}
                        </div>
                      </div>

                      {ticket.hasReply ? (
                        <div style={styles.replySection}>
                          <div style={styles.replySectionTitle}>
                            💬 Admin Response
                          </div>
                          <div style={styles.replyBox}>
                            {ticket.admin_response}
                          </div>
                          {ticket.responded_at && (
                            <div style={styles.replyMeta}>
                              Replied on: {formatDate(ticket.responded_at)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={styles.noReply}>
                          ⏳ Awaiting admin response. We'll get back to you soon!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No tickets found</p>
            <p>You don't have any {filter === 'all' ? '' : filter} tickets yet</p>
            <button 
              style={{
                ...styles.button, 
                ...styles.createButton,
                marginTop: '16px'
              }} 
              onClick={() => navigate('/parent/support/create')}
            >
              + Create First Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
