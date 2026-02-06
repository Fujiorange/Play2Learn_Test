// School Admin Support Ticket Management Component
// For managing school-related tickets from students, teachers, parents
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

function SupportTicketManagement() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, pending: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const [ticketsResponse, statsResponse] = await Promise.all([
        schoolAdminService.getSupportTickets({ 
          status: statusFilter, 
          sortBy, 
          sortOrder,
          search: searchTerm 
        }),
        schoolAdminService.getSupportTicketStats()
      ]);
      
      if (ticketsResponse.success) {
        setTickets(ticketsResponse.data || []);
      }
      if (statsResponse.success) {
        setStats(statsResponse.data || { open: 0, pending: 0, closed: 0, total: 0 });
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
      setMessage({ type: 'error', text: 'Failed to load support tickets' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    // Check admin auth
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(storedUser);
    if (userData.role !== 'School Admin') {
      navigate('/login');
      return;
    }

    loadTickets();
  }, [navigate, loadTickets]);

  const handleViewTicket = async (ticketId) => {
    try {
      const response = await schoolAdminService.getSupportTicket(ticketId);
      if (response.success) {
        setSelectedTicket(response.data);
        setReplyText(response.data.admin_response || '');
      }
    } catch (error) {
      console.error('Failed to load ticket:', error);
      setMessage({ type: 'error', text: 'Failed to load ticket details' });
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      setMessage({ type: 'error', text: 'Please enter a reply message' });
      return;
    }

    try {
      setSubmitting(true);
      const response = await schoolAdminService.replySupportTicket(selectedTicket._id, replyText);
      if (response.success) {
        setMessage({ type: 'success', text: 'Reply sent successfully' });
        setSelectedTicket({ ...selectedTicket, admin_response: replyText });
        loadTickets();
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      setMessage({ type: 'error', text: 'Failed to send reply' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    try {
      setSubmitting(true);
      const response = await schoolAdminService.closeSupportTicket(selectedTicket._id);
      if (response.success) {
        setMessage({ type: 'success', text: 'Ticket closed successfully' });
        setSelectedTicket({ ...selectedTicket, status: 'closed' });
        loadTickets();
      }
    } catch (error) {
      console.error('Failed to close ticket:', error);
      setMessage({ type: 'error', text: 'Failed to close ticket' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      open: { background: '#dbeafe', color: '#1e40af' },
      pending: { background: '#fef3c7', color: '#92400e' },
      closed: { background: '#d1fae5', color: '#065f46' }
    };
    const style = statusStyles[status] || { background: '#f3f4f6', color: '#6b7280' };
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.background,
        color: style.color
      }}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      Student: { background: '#dbeafe', color: '#1e40af' },
      Teacher: { background: '#dcfce7', color: '#166534' },
      Parent: { background: '#fce7f3', color: '#be185d' }
    };
    const style = roleStyles[role] || { background: '#f3f4f6', color: '#6b7280' };
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.background,
        color: style.color
      }}>
        {role}
      </span>
    );
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1400px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
    statCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' },
    statValue: { fontSize: '28px', fontWeight: '700', color: '#1f2937' },
    statLabel: { fontSize: '14px', color: '#6b7280', marginTop: '4px' },
    filters: { background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    filterLabel: { fontSize: '12px', fontWeight: '600', color: '#6b7280' },
    select: { padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' },
    searchInput: { padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', width: '250px' },
    layoutContainer: { display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 400px' : '1fr', gap: '24px' },
    ticketsTable: { background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '16px', textAlign: 'left', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', fontSize: '14px', fontWeight: '600', color: '#374151' },
    td: { padding: '16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#4b5563' },
    viewButton: { padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    detailPanel: { background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', position: 'sticky', top: '32px' },
    detailHeader: { padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    detailTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937' },
    closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' },
    detailContent: { padding: '20px' },
    detailRow: { marginBottom: '16px' },
    detailLabel: { fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' },
    detailValue: { fontSize: '14px', color: '#1f2937' },
    messageBox: { background: '#f9fafb', padding: '16px', borderRadius: '8px', fontSize: '14px', color: '#4b5563', marginBottom: '20px' },
    replySection: { marginTop: '20px' },
    textarea: { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
    actionButtons: { display: 'flex', gap: '12px', marginTop: '16px' },
    replyButton: { flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    closeTicketButton: { flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    messageAlert: { padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    successAlert: { background: '#d1fae5', color: '#065f46' },
    errorAlert: { background: '#fee2e2', color: '#991b1b' },
    emptyState: { padding: '60px 20px', textAlign: 'center', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' }
  };

  if (loading && tickets.length === 0) {
    return <div style={styles.loadingContainer}><div style={styles.loadingText}>Loading support tickets...</div></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎫 School Support Tickets</h1>
          <button style={styles.backButton} onClick={() => navigate('/school-admin')}>
            ← Back to Dashboard
          </button>
        </div>

        {message.text && (
          <div style={{...styles.messageAlert, ...(message.type === 'success' ? styles.successAlert : styles.errorAlert)}}>
            {message.text}
            <button onClick={() => setMessage({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>
        )}

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, borderLeft: '4px solid #3b82f6'}}>
            <div style={styles.statValue}>{stats.open}</div>
            <div style={styles.statLabel}>Open</div>
          </div>
          <div style={{...styles.statCard, borderLeft: '4px solid #f59e0b'}}>
            <div style={styles.statValue}>{stats.pending}</div>
            <div style={styles.statLabel}>Pending</div>
          </div>
          <div style={{...styles.statCard, borderLeft: '4px solid #10b981'}}>
            <div style={styles.statValue}>{stats.closed}</div>
            <div style={styles.statLabel}>Closed</div>
          </div>
          <div style={{...styles.statCard, borderLeft: '4px solid #6b7280'}}>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total</div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Sort By:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.select}>
              <option value="created_at">Date Created</option>
              <option value="updated_at">Last Updated</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Order:</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={styles.select}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search:</label>
            <input
              type="text"
              placeholder="Search by name, email, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.layoutContainer}>
          {/* Tickets Table */}
          <div style={styles.ticketsTable}>
            <h2 style={{ padding: '16px 20px', margin: 0, borderBottom: '1px solid #e5e7eb', fontSize: '16px', fontWeight: '600' }}>
              School-Related Tickets ({tickets.length})
            </h2>
            {tickets.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
                <p style={{ fontSize: '18px', fontWeight: '600' }}>No tickets found</p>
                <p>There are no school-related support tickets</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr 
                      key={ticket._id}
                      style={{ background: selectedTicket?._id === ticket._id ? '#f0fdf4' : 'transparent' }}
                    >
                      <td style={styles.td}>{getStatusBadge(ticket.status)}</td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '600' }}>{ticket.user_name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{ticket.user_email}</div>
                      </td>
                      <td style={styles.td}>{getRoleBadge(ticket.user_role)}</td>
                      <td style={styles.td}>{ticket.subject}</td>
                      <td style={styles.td}>{formatDate(ticket.created_at)}</td>
                      <td style={styles.td}>
                        <button 
                          style={styles.viewButton}
                          onClick={() => handleViewTicket(ticket._id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Ticket Detail Panel */}
          {selectedTicket && (
            <div style={styles.detailPanel}>
              <div style={styles.detailHeader}>
                <h2 style={styles.detailTitle}>Ticket Details</h2>
                <button style={styles.closeButton} onClick={() => setSelectedTicket(null)}>×</button>
              </div>

              <div style={styles.detailContent}>
                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Status</div>
                  <div>{getStatusBadge(selectedTicket.status)}</div>
                </div>
                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>User</div>
                  <div style={styles.detailValue}>{selectedTicket.user_name} ({selectedTicket.user_role})</div>
                </div>
                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Email</div>
                  <div style={styles.detailValue}>{selectedTicket.user_email}</div>
                </div>
                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Subject</div>
                  <div style={styles.detailValue}>{selectedTicket.subject}</div>
                </div>
                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Created</div>
                  <div style={styles.detailValue}>{formatDate(selectedTicket.created_at)}</div>
                </div>
                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Priority</div>
                  <div style={styles.detailValue}>{selectedTicket.priority}</div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Message</div>
                  <div style={styles.messageBox}>
                    {selectedTicket.message}
                  </div>
                </div>

                <div style={styles.replySection}>
                  <div style={styles.detailLabel}>Admin Reply:</div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    disabled={submitting || selectedTicket.status === 'closed'}
                    style={styles.textarea}
                  />
                  
                  {selectedTicket.responded_at && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                      Last response: {formatDate(selectedTicket.responded_at)}
                    </div>
                  )}
                </div>

                <div style={styles.actionButtons}>
                  <button
                    style={{...styles.replyButton, opacity: submitting || selectedTicket.status === 'closed' ? 0.5 : 1}}
                    onClick={handleReply}
                    disabled={submitting || selectedTicket.status === 'closed'}
                  >
                    {submitting ? 'Sending...' : '📤 Send Reply'}
                  </button>
                  {selectedTicket.status !== 'closed' && (
                    <button
                      style={{...styles.closeTicketButton, opacity: submitting ? 0.5 : 1}}
                      onClick={handleCloseTicket}
                      disabled={submitting}
                    >
                      {submitting ? 'Closing...' : '✓ Close Ticket'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupportTicketManagement;
