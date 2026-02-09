import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function ChatWithTeacher() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadChats = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockConversations = [
        { id: 1, teacher: 'Ms. Sarah Johnson', subject: 'Mathematics', child: 'Emma Johnson', lastMessage: 'Emma is doing great!', time: '2:30 PM', unread: 2 },
        { id: 2, teacher: 'Mr. David Smith', subject: 'English', child: 'Liam Johnson', lastMessage: 'Thank you for the update', time: '1:15 PM', unread: 0 },
        { id: 3, teacher: 'Dr. Emily Chen', subject: 'Science', child: 'Emma Johnson', lastMessage: 'Let\'s schedule a meeting', time: 'Yesterday', unread: 1 },
      ];
      
      setConversations(mockConversations);
      setLoading(false);
    };

    loadChats();
  }, [navigate]);

  const handleSendMessage = () => {
    if (message.trim() && selectedChat) {
      setMessage('');
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1400px', margin: '0 auto', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', display: 'flex', height: '700px' },
    header: { padding: '24px 32px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' },
    title: { fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    sidebar: { width: '350px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' },
    conversationList: { flex: 1, overflowY: 'auto' },
    conversationItem: { padding: '16px 20px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' },
    conversationTeacher: { fontSize: '15px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' },
    conversationChild: { fontSize: '12px', color: '#10b981', marginBottom: '4px' },
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
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💬 Chat with Teachers</h1>
        <button style={styles.backButton} onClick={() => navigate('/parent')}>← Back to Dashboard</button>
      </div>
      <div style={styles.content}>
        <div style={styles.sidebar}>
          <div style={styles.conversationList}>
            {conversations.map(conv => (
              <div key={conv.id} style={{...styles.conversationItem, background: selectedChat?.id === conv.id ? '#f3f4f6' : 'white'}} onClick={() => setSelectedChat(conv)}>
                <div style={styles.conversationTeacher}>
                  {conv.teacher}
                  {conv.unread > 0 && <span style={styles.unreadBadge}>{conv.unread}</span>}
                </div>
                <div style={styles.conversationChild}>👤 {conv.child} • {conv.subject}</div>
                <div style={styles.conversationMessage}>{conv.lastMessage}</div>
                <div style={styles.conversationTime}>{conv.time}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.chatArea}>
          {selectedChat ? (
            <>
              <div style={styles.chatHeader}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{selectedChat.teacher}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Teaching {selectedChat.subject} to {selectedChat.child}</div>
              </div>
              <div style={styles.chatMessages}>
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>💬 Start your conversation here</div>
              </div>
              <div style={styles.chatInput}>
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." style={styles.input} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                <button style={styles.sendButton} onClick={handleSendMessage}>Send</button>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
              <p style={{ fontSize: '18px', fontWeight: '600' }}>Select a conversation</p>
              <p>Choose a teacher to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}