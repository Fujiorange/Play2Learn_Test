// TrackTicket.js - UPDATED with admin reply display and notification
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
  const [expandedTicket, setExpandedTicket] = useState(null);

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
      } catch (err) {
        console.error('Load tickets error:', err);
        setError('Failed to load support tickets');
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
    if (status === 'open') return { background: '#dbeafe', color: '#1e40af' };
    if (status === 'pending') return { background: '#fef3c7', color: '#92400e' };
    if (status === 'in-progress') return { background: '#fef3c7', color: '#92400e' };
    if (status === 'resolved' || status === 'closed') return { background: '#d1fae5', color: '#065f46' };
    return { background: '#f3f4f6', color: '#6b7280' };
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
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterButtons: { display: 'flex', gap: '8px' },
    filterButton: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: 'white' },
    filterButtonActive: { borderColor: '#10b981', background: '#d1fae5', color: '#065f46' },
    ticketGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
    ticketCard: { background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden', transition: 'all 0.3s ease' },
    ticketCardHeader: { padding: '24px', cursor: 'pointer' },
    ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' },
    ticketIdRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    ticketId: { fontSize: '14px', fontWeight: '700', color: '#10b981' },
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
    ticketSubject: { fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' },
    ticketInfo: { display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' },
    badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
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
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
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

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading tickets...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>
              🎫 Track Support Tickets
              {unreadReplies > 0 && (
                <span style={styles.notificationBadge} title={`${unreadReplies} ticket(s) with replies`}>
                  {unreadReplies}
                </span>
              )}
            </h1>
            <button style={styles.backButton} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
          </div>
          
          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}
          
          <div style={styles.filterButtons}>
            {['all', 'open', 'pending', 'closed'].map(status => (
              <button 
                key={status} 
                onClick={() => setFilter(status)} 
                style={{...styles.filterButton, ...(filter === status ? styles.filterButtonActive : {})}}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredTickets.length > 0 ? (
          <div style={styles.ticketGrid}>
            {filteredTickets.map(ticket => (
              <div key={ticket.ticketId || ticket.id} style={styles.ticketCard}>
                <div 
                  style={styles.ticketCardHeader}
                  onClick={() => toggleTicketExpand(ticket.ticketId || ticket.id)}
                >
                  <div style={styles.ticketHeader}>
                    <div style={styles.ticketIdRow}>
                      <span style={styles.ticketId}>{ticket.id}</span>
                      {ticket.hasReply && (
                        <span style={styles.replyBadge}>
                          💬 Reply
                        </span>
                      )}
                    </div>
                    <span style={{...styles.badge, ...getStatusColor(ticket.status)}}>
                      {ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1)}
                    </span>
                  </div>
                  <div style={styles.ticketSubject}>{ticket.subject}</div>
                  <div style={styles.ticketInfo}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>📁 {ticket.category}</span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>🔔 {ticket.priority} priority</span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>📅 Created: {ticket.createdOn}</span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>🔄 Updated: {ticket.lastUpdate}</span>
                  </div>
                  <div style={styles.clickToExpand}>
                    {expandedTicket === (ticket.ticketId || ticket.id) ? '▲ Click to collapse' : '▼ Click to view details'}
                  </div>
                </div>

                {expandedTicket === (ticket.ticketId || ticket.id) && (
                  <div style={styles.expandedContent}>
                    <div style={styles.messageSection}>
                      <div style={styles.sectionTitle}>📝 Your Message:</div>
                      <div style={styles.messageBox}>
                        {ticket.message || 'No message content'}
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
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No tickets found</p>
            <p>You don't have any {filter === 'all' ? '' : filter} support tickets</p>
          </div>
        )}
      </div>
    </div>
  );
}
