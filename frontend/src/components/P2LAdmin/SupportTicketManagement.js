// P2L Admin Support Ticket Management Component
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSupportTickets,
  getSupportTicket,
  replySupportTicket,
  closeSupportTicket,
  getSupportTicketStats
} from '../../services/p2lAdminService';
import './SupportTicketManagement.css';

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
        getSupportTickets({ 
          status: statusFilter, 
          sortBy, 
          sortOrder,
          search: searchTerm 
        }),
        getSupportTicketStats()
      ]);
      
      if (ticketsResponse.success) {
        setTickets(ticketsResponse.data);
      }
      if (statsResponse.success) {
        setStats(statsResponse.data);
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
    if (userData.role !== 'p2ladmin' && userData.role !== 'Platform Admin') {
      navigate('/login');
      return;
    }

    loadTickets();
  }, [navigate, loadTickets]);

  const handleViewTicket = async (ticketId) => {
    try {
      const response = await getSupportTicket(ticketId);
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
      const response = await replySupportTicket(selectedTicket._id, replyText);
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
      const response = await closeSupportTicket(selectedTicket._id);
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
    const statusClasses = {
      open: 'status-badge status-open',
      pending: 'status-badge status-pending',
      closed: 'status-badge status-closed'
    };
    return <span className={statusClasses[status] || 'status-badge'}>{status}</span>;
  };

  const getRoleBadge = (role) => {
    const roleClasses = {
      Student: 'role-badge role-student',
      Teacher: 'role-badge role-teacher',
      Parent: 'role-badge role-parent'
    };
    return <span className={roleClasses[role] || 'role-badge'}>{role}</span>;
  };

  if (loading && tickets.length === 0) {
    return <div className="loading">Loading support tickets...</div>;
  }

  return (
    <div className="support-ticket-management">
      <header className="page-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/p2ladmin/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>🎫 Support Ticket Management</h1>
        </div>
      </header>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card stat-open">
          <h3>Open</h3>
          <p className="stat-value">{stats.open}</p>
        </div>
        <div className="stat-card stat-pending">
          <h3>Pending</h3>
          <p className="stat-value">{stats.pending}</p>
        </div>
        <div className="stat-card stat-closed">
          <h3>Closed</h3>
          <p className="stat-value">{stats.closed}</p>
        </div>
        <div className="stat-card stat-total">
          <h3>Total</h3>
          <p className="stat-value">{stats.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created_at">Date Created</option>
            <option value="updated_at">Last Updated</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Order:</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
        <div className="filter-group search-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by name, email, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="content-layout">
        {/* Tickets List */}
        <div className="tickets-list">
          <h2>Website-Related Tickets ({tickets.length})</h2>
          {tickets.length === 0 ? (
            <p className="no-tickets">No tickets found</p>
          ) : (
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr 
                    key={ticket._id} 
                    className={selectedTicket?._id === ticket._id ? 'selected' : ''}
                  >
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td>
                      <div className="user-info">
                        <strong>{ticket.user_name}</strong>
                        <small>{ticket.user_email}</small>
                      </div>
                    </td>
                    <td>{getRoleBadge(ticket.user_role)}</td>
                    <td className="subject-cell">{ticket.subject}</td>
                    <td>{formatDate(ticket.created_at)}</td>
                    <td>
                      <button 
                        className="btn-view"
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
          <div className="ticket-detail">
            <div className="detail-header">
              <h2>Ticket Details</h2>
              <button className="btn-close-panel" onClick={() => setSelectedTicket(null)}>×</button>
            </div>

            <div className="detail-content">
              <div className="detail-row">
                <strong>Status:</strong>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <div className="detail-row">
                <strong>User:</strong>
                <span>{selectedTicket.user_name} ({selectedTicket.user_role})</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{selectedTicket.user_email}</span>
              </div>
              <div className="detail-row">
                <strong>School:</strong>
                <span>{selectedTicket.school_name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Subject:</strong>
                <span>{selectedTicket.subject}</span>
              </div>
              <div className="detail-row">
                <strong>Created:</strong>
                <span>{formatDate(selectedTicket.created_at)}</span>
              </div>
              <div className="detail-row">
                <strong>Priority:</strong>
                <span className={`priority-${selectedTicket.priority}`}>
                  {selectedTicket.priority}
                </span>
              </div>

              <div className="message-section">
                <h3>Message:</h3>
                <div className="message-content">
                  {selectedTicket.message}
                </div>
              </div>

              <div className="reply-section">
                <h3>Admin Reply:</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  disabled={submitting || selectedTicket.status === 'closed'}
                />
                
                {selectedTicket.responded_at && (
                  <small>Last response: {formatDate(selectedTicket.responded_at)}</small>
                )}
              </div>

              <div className="action-buttons">
                <button
                  className="btn-reply"
                  onClick={handleReply}
                  disabled={submitting || selectedTicket.status === 'closed'}
                >
                  {submitting ? 'Sending...' : '📤 Send Reply'}
                </button>
                {selectedTicket.status !== 'closed' && (
                  <button
                    className="btn-close-ticket"
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
  );
}

export default SupportTicketManagement;
