import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function TrackSupportTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadTickets = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockTickets = [
        { id: 'TKT-1001', subject: 'Unable to access child progress', category: 'technical', priority: 'high', status: 'open', created: '2024-12-10', updated: '2024-12-10' },
        { id: 'TKT-1002', subject: 'Question about billing cycle', category: 'account', priority: 'medium', status: 'in-progress', created: '2024-12-08', updated: '2024-12-09' },
        { id: 'TKT-1003', subject: 'Request for additional learning resources', category: 'feature', priority: 'low', status: 'resolved', created: '2024-12-05', updated: '2024-12-07' },
      ];
      
      setTickets(mockTickets);
      setLoading(false);
    };

    loadTickets();
  }, [navigate]);

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return { bg: '#dbeafe', color: '#1e40af' };
      case 'in-progress': return { bg: '#fef3c7', color: '#92400e' };
      case 'resolved': return { bg: '#d1fae5', color: '#065f46' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return { bg: '#fee2e2', color: '#991b1b' };
      case 'medium': return { bg: '#fef3c7', color: '#92400e' };
      case 'low': return { bg: '#d1fae5', color: '#065f46' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    buttonGroup: { display: 'flex', gap: '12px' },
    button: { padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    backButton: { background: '#6b7280', color: 'white' },
    createButton: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' },
    filterButtons: { display: 'flex', gap: '8px' },
    filterButton: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: 'white' },
    filterButtonActive: { borderColor: '#10b981', background: '#d1fae5', color: '#065f46' },
    ticketsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
    ticketCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' },
    ticketId: { fontSize: '14px', fontWeight: '700', color: '#6b7280', marginBottom: '4px' },
    ticketSubject: { fontSize: '18px', fontWeight: '600', color: '#1f2937' },
    ticketMeta: { display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: '#6b7280' },
    badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginLeft: '8px' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🎫 Support Tickets</h1>
            <div style={styles.buttonGroup}>
              <button style={{...styles.button, ...styles.backButton}} onClick={() => navigate('/parent')}>← Back</button>
              <button style={{...styles.button, ...styles.createButton}} onClick={() => navigate('/parent/support/create')}>+ New Ticket</button>
            </div>
          </div>
          <div style={styles.filterButtons}>
            {['all', 'open', 'in-progress', 'resolved'].map(status => (
              <button key={status} onClick={() => setFilter(status)} style={{...styles.filterButton, ...(filter === status ? styles.filterButtonActive : {})}}>
                {status === 'all' ? 'All' : status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredTickets.length > 0 ? (
          <div style={styles.ticketsList}>
            {filteredTickets.map(ticket => {
              const statusColors = getStatusColor(ticket.status);
              const priorityColors = getPriorityColor(ticket.priority);
              return (
                <div key={ticket.id} style={styles.ticketCard}>
                  <div style={styles.ticketHeader}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.ticketId}>#{ticket.id}</div>
                      <div style={styles.ticketSubject}>{ticket.subject}</div>
                      <div style={styles.ticketMeta}>
                        <span>📁 {ticket.category}</span>
                        <span>📅 Created: {ticket.created}</span>
                        <span>🔄 Updated: {ticket.updated}</span>
                      </div>
                    </div>
                    <div>
                      <span style={{...styles.badge, background: statusColors.bg, color: statusColors.color}}>
                        {ticket.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                      <span style={{...styles.badge, background: priorityColors.bg, color: priorityColors.color}}>
                        {ticket.priority === 'high' && '🔴'} {ticket.priority === 'medium' && '🟡'} {ticket.priority === 'low' && '🟢'} {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No tickets found</p>
            <p>You don't have any {filter === 'all' ? '' : filter} tickets yet</p>
          </div>
        )}
      </div>
    </div>
  );
}