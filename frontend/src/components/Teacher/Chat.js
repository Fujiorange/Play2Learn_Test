import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function Chat() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadConversations();
  }, [navigate]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.userId);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/conversations`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          receiverId: selectedChat.userId,
          message: message.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage('');
        loadMessages(selectedChat.userId);
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const currentUser = authService.getCurrentUser();

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1400px', margin: '0 auto', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', display: 'flex', height: '700px' },
    header: { padding: '24px 32px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' },
    title: { fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    sidebar: { width: '350px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' },
    conversationList: { flex: 1, overflowY: 'auto' },
    conversationItem: { padding: '16px 20px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' },
    conversationName: { fontSize: '15px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' },
    conversationRole: { fontSize: '11px', color: '#10b981', marginLeft: '8px', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px' },
    conversationMessage: { fontSize: '13px', color: '#6b7280', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    conversationTime: { fontSize: '12px', color: '#9ca3af' },
    unreadBadge: { display: 'inline-block', background: '#10b981', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: '600', marginLeft: '8px' },
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column' },
    chatHeader: { padding: '20px 24px', borderBottom: '1px solid #e5e7eb' },
    chatMessages: { flex: 1, padding: '24px', overflowY: 'auto', background: '#f9fafb' },
    chatInput: { padding: '20px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px' },
    input: { flex: 1, padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit' },
    sendButton: { padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    emptyState: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
    messageBubble: { maxWidth: '70%', padding: '12px 16px', borderRadius: '16px', marginBottom: '12px' },
    sentMessage: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', marginLeft: 'auto', borderBottomRightRadius: '4px' },
    receivedMessage: { background: 'white', color: '#1f2937', marginRight: 'auto', borderBottomLeftRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
    messageTime: { fontSize: '11px', marginTop: '4px', opacity: 0.7 },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading chats...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💬 Chat with Students & Parents</h1>
        <button style={styles.backButton} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
      </div>
      <div style={styles.content}>
        <div style={styles.sidebar}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>
            Conversations ({conversations.length})
          </div>
          <div style={styles.conversationList}>
            {conversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.userId} 
                  style={{...styles.conversationItem, background: selectedChat?.userId === conv.userId ? '#f3f4f6' : 'white'}} 
                  onClick={() => setSelectedChat(conv)}
                >
                  <div style={styles.conversationName}>
                    {conv.name}
                    <span style={styles.conversationRole}>{conv.role}</span>
                    {conv.unreadCount > 0 && <span style={styles.unreadBadge}>{conv.unreadCount}</span>}
                  </div>
                  <div style={styles.conversationMessage}>{conv.lastMessage || 'Start a conversation'}</div>
                  {conv.lastMessageTime && <div style={styles.conversationTime}>{formatTime(conv.lastMessageTime)}</div>}
                </div>
              ))
            )}
          </div>
        </div>
        <div style={styles.chatArea}>
          {selectedChat ? (
            <>
              <div style={styles.chatHeader}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                  {selectedChat.name}
                  <span style={{...styles.conversationRole, marginLeft: '12px'}}>{selectedChat.role}</span>
                </div>
                {selectedChat.class && <div style={{ fontSize: '13px', color: '#6b7280' }}>Class: {selectedChat.class}</div>}
              </div>
              <div style={styles.chatMessages}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                    💬 Start your conversation here
                  </div>
                ) : (
                  messages.map(msg => (
                    <div 
                      key={msg._id}
                      style={{
                        ...styles.messageBubble,
                        ...(msg.senderId?.toString() === currentUser?._id?.toString() ? styles.sentMessage : styles.receivedMessage)
                      }}
                    >
                      <div>{msg.message}</div>
                      <div style={styles.messageTime}>{formatTime(msg.createdAt)}</div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div style={styles.chatInput}>
                <input 
                  type="text" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Type a message..." 
                  style={styles.input} 
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
                  disabled={sending}
                />
                <button style={styles.sendButton} onClick={handleSendMessage} disabled={sending}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
              <p style={{ fontSize: '18px', fontWeight: '600' }}>Select a conversation</p>
              <p>Choose a student or parent to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}