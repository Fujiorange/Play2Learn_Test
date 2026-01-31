import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './SchoolAdmin.css';

const knowledgeBase = {
  categories: [
    {
      id: 'getting-started',
      name: '🚀 Getting Started',
      icon: '🚀',
      articles: [
        {
          id: 'dashboard-overview',
          title: 'Dashboard Overview',
          content: `<h4>Welcome to the School Admin Dashboard!</h4>
            <p>Your dashboard is the central hub for managing Play2Learn at your school. Here's what you can see at a glance:</p>
            <ul>
              <li><strong>📊 Stats Cards</strong> - Total students, teachers, and classes</li>
              <li><strong>🔐 Account Management</strong> - Add users manually or via CSV upload</li>
              <li><strong>👥 User Management</strong> - Permissions, password resets, account status</li>
              <li><strong>🏫 Class Management</strong> - Create and manage classes</li>
              <li><strong>🎮 Gamification</strong> - Badges and points system</li>
            </ul>
            <p><strong>💡 Tip:</strong> Click any menu item to navigate directly to that feature!</p>`,
          helpful: 45,
          notHelpful: 2
        },
        {
          id: 'first-steps',
          title: 'First Steps After Login',
          content: `<h4>Recommended Setup Order</h4>
            <ol>
              <li><strong>Add Teachers First</strong> - They'll need accounts to manage their classes</li>
              <li><strong>Create Classes</strong> - Set up P1-A, P1-B, etc.</li>
              <li><strong>Add Students</strong> - Use CSV upload for bulk import</li>
              <li><strong>Configure Badges</strong> - Set up achievement badges students can earn</li>
              <li><strong>Review Point Rules</strong> - Adjust how students earn points</li>
            </ol>
            <p><strong>💡 Tip:</strong> Use the CSV upload feature for adding multiple users at once!</p>`,
          helpful: 38,
          notHelpful: 1
        }
      ]
    },
    {
      id: 'points-system',
      name: '💰 Points System',
      icon: '💰',
      articles: [
        {
          id: 'how-points-work',
          title: 'How the Points System Works',
          content: `<h4>Understanding Points</h4>
            <p>Points are the core currency in Play2Learn's gamification system. Students earn points automatically through various activities:</p>
            <h5>📋 Default Point Rules:</h5>
            <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
              <tr style="background:#f1f5f9;"><th style="padding:8px; text-align:left;">Activity</th><th style="padding:8px; text-align:right;">Points</th></tr>
              <tr><td style="padding:8px;">Daily Login</td><td style="padding:8px; text-align:right; color:#16a34a; font-weight:600;">+5</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;">7-Day Login Streak</td><td style="padding:8px; text-align:right; color:#16a34a; font-weight:600;">+20</td></tr>
              <tr><td style="padding:8px;">Complete Quiz</td><td style="padding:8px; text-align:right; color:#16a34a; font-weight:600;">+10</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;">Score 90%+</td><td style="padding:8px; text-align:right; color:#16a34a; font-weight:600;">+15</td></tr>
              <tr><td style="padding:8px;">Perfect Score (100%)</td><td style="padding:8px; text-align:right; color:#16a34a; font-weight:600;">+25</td></tr>
            </table>
            <p><strong>💡 Key Point:</strong> Points are ONLY earned, never deducted! This keeps the experience positive for young learners.</p>`,
          helpful: 52,
          notHelpful: 3
        },
        {
          id: 'adjusting-points',
          title: 'Manually Adjusting Student Points',
          content: `<h4>When to Adjust Points</h4>
            <p>Sometimes you may need to manually adjust a student's points. Common reasons:</p>
            <ul>
              <li>✅ Reward for helping classmates</li>
              <li>✅ Recognition for classroom participation</li>
              <li>✅ Compensation for technical issues</li>
              <li>✅ Special achievements outside the platform</li>
            </ul>
            <h5>How to Adjust:</h5>
            <ol>
              <li>Go to <strong>Points & Shop</strong> → <strong>Students</strong> tab</li>
              <li>Find the student using the search bar</li>
              <li>Click <strong>Adjust Points</strong></li>
              <li>Select amount (+5, +10, -5, -10)</li>
              <li>Enter a reason (required for accountability)</li>
              <li>Click <strong>Award</strong> or <strong>Deduct</strong></li>
            </ol>
            <p><strong>⚠️ Note:</strong> All adjustments are logged in the transaction history for transparency.</p>`,
          helpful: 41,
          notHelpful: 0
        },
        {
          id: 'shop-items',
          title: 'Managing the Shop',
          content: `<h4>Shop Item Types</h4>
            <p>The shop contains two types of items students can purchase with their points:</p>
            <h5>🦄 Cosmetic Badges</h5>
            <p>Profile decorations that don't affect gameplay:</p>
            <ul>
              <li>Unicorn Badge (75 pts)</li>
              <li>Dragon Badge (100 pts)</li>
              <li>Rainbow Badge (50 pts)</li>
            </ul>
            <h5>⚡ Point Boosters</h5>
            <p>Temporary multipliers for earning more points:</p>
            <ul>
              <li>Turbo Boost - 2x points for 1 day (150 pts)</li>
              <li>Rocket Boost - 1.5x points for 3 days (200 pts)</li>
            </ul>
            <p><strong>💡 Tip:</strong> Keep cosmetics affordable (40-100 pts) so even struggling students can participate!</p>`,
          helpful: 36,
          notHelpful: 1
        }
      ]
    },
    {
      id: 'badges-system',
      name: '🏆 Badges System',
      icon: '🏆',
      articles: [
        {
          id: 'how-badges-work',
          title: 'How Badges Work',
          content: `<h4>Automatic Badge Unlocking</h4>
            <p>Badges are achievements that students unlock automatically when they meet certain criteria. This encourages continued engagement!</p>
            <h5>Default Badges:</h5>
            <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
              <tr style="background:#f1f5f9;"><th style="padding:8px;">Badge</th><th style="padding:8px;">Criteria</th><th style="padding:8px;">Rarity</th></tr>
              <tr><td style="padding:8px;">🌟 First Steps</td><td style="padding:8px;">Complete 1 quiz</td><td style="padding:8px;"><span style="background:#9ca3af;color:white;padding:2px 8px;border-radius:4px;">Common</span></td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;">🔥 Streak Master</td><td style="padding:8px;">7-day login streak</td><td style="padding:8px;"><span style="background:#3b82f6;color:white;padding:2px 8px;border-radius:4px;">Rare</span></td></tr>
              <tr><td style="padding:8px;">💯 Perfect Score</td><td style="padding:8px;">Score 100% on any quiz</td><td style="padding:8px;"><span style="background:#8b5cf6;color:white;padding:2px 8px;border-radius:4px;">Epic</span></td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;">👑 Math Champion</td><td style="padding:8px;">Score 90%+ on 10 quizzes</td><td style="padding:8px;"><span style="background:#f59e0b;color:white;padding:2px 8px;border-radius:4px;">Legendary</span></td></tr>
            </table>
            <p><strong>💡 Rarity Levels:</strong> Common → Rare → Epic → Legendary (from easiest to hardest)</p>`,
          helpful: 48,
          notHelpful: 2
        },
        {
          id: 'creating-badges',
          title: 'Creating Custom Badges',
          content: `<h4>Create Your Own Badges</h4>
            <p>You can create custom badges to match your school's goals!</p>
            <h5>Steps:</h5>
            <ol>
              <li>Go to <strong>Gamification</strong> → <strong>Manage Badges</strong></li>
              <li>Click <strong>+ Create Badge</strong></li>
              <li>Enter badge name and description</li>
              <li>Choose an icon from the picker</li>
              <li>Select unlock criteria type</li>
              <li>Set the criteria value (e.g., 5 quizzes)</li>
              <li>Choose rarity level</li>
              <li>Click <strong>Create Badge</strong></li>
            </ol>
            <h5>Available Criteria Types:</h5>
            <ul>
              <li>Quizzes Completed</li>
              <li>Login Streak</li>
              <li>Perfect Scores</li>
              <li>High Scores (90%+)</li>
              <li>Total Points Earned</li>
              <li>Assignments Completed</li>
            </ul>`,
          helpful: 33,
          notHelpful: 0
        }
      ]
    },
    {
      id: 'user-management',
      name: '👥 User Management',
      icon: '👥',
      articles: [
        {
          id: 'csv-upload',
          title: 'Bulk Upload via CSV',
          content: `<h4>CSV Upload Format</h4>
            <p>The fastest way to add multiple users is via CSV upload.</p>
            <h5>Required Columns for Students:</h5>
            <pre style="background:#f1f5f9;padding:12px;border-radius:8px;overflow-x:auto;">Name,Email,Class,GradeLevel,ParentEmail
Alice Tan,alice@school.edu,P1-A,Primary 1,parent@email.com
Bob Lee,bob@school.edu,P1-B,Primary 1,parent2@email.com</pre>
            <h5>Required Columns for Teachers:</h5>
            <pre style="background:#f1f5f9;padding:12px;border-radius:8px;overflow-x:auto;">Name,Email,Subject
Mrs. Tan,mrstan@school.edu,Mathematics
Mr. Lee,mrlee@school.edu,Mathematics</pre>
            <p><strong>💡 Tip:</strong> Passwords are auto-generated and sent to the parent/user email!</p>`,
          helpful: 55,
          notHelpful: 4
        },
        {
          id: 'reset-password',
          title: 'Resetting User Passwords',
          content: `<h4>Password Reset Process</h4>
            <ol>
              <li>Go to <strong>User Management</strong> → <strong>Reset Password</strong></li>
              <li>Search for the user by name or email</li>
              <li>Click <strong>Reset Password</strong> button</li>
              <li>System generates a new temporary password</li>
              <li>New password is shown on screen - copy it!</li>
              <li>Share the password securely with the user</li>
            </ol>
            <p><strong>⚠️ Security Note:</strong> Users should change their password after first login.</p>`,
          helpful: 29,
          notHelpful: 1
        }
      ]
    },
    {
      id: 'analytics',
      name: '📊 Analytics',
      icon: '📊',
      articles: [
        {
          id: 'understanding-analytics',
          title: 'Understanding the Analytics Dashboard',
          content: `<h4>Analytics Overview</h4>
            <p>The Analytics Dashboard helps you monitor school-wide performance and identify areas needing attention.</p>
            <h5>Key Metrics:</h5>
            <ul>
              <li><strong>📈 Overview</strong> - High-level stats and alerts for struggling/top classes</li>
              <li><strong>🏫 Class Performance</strong> - Compare classes by avg score, points, and trends</li>
              <li><strong>👥 Students</strong> - View top performers and students needing support</li>
              <li><strong>📅 Trends</strong> - Weekly performance trends over time</li>
            </ul>
            <h5>Identifying Struggling Classes:</h5>
            <p>Classes with average scores below 75% are flagged in red with a "Needs Help" badge. These classes may benefit from:</p>
            <ul>
              <li>Additional teacher support</li>
              <li>Adjusted quiz difficulty</li>
              <li>More practice assignments</li>
            </ul>`,
          helpful: 42,
          notHelpful: 1
        }
      ]
    }
  ]
};

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (!currentUser.role?.toLowerCase().includes('school')) { navigate('/login'); return; }
    
    setTimeout(() => {
      setSelectedCategory(knowledgeBase.categories[0]);
      setLoading(false);
    }, 300);
  }, [navigate]);

  const handleFeedback = (articleId, isHelpful) => {
    setFeedback({ ...feedback, [articleId]: isHelpful });
  };

  const allArticles = knowledgeBase.categories.flatMap(cat => 
    cat.articles.map(art => ({ ...art, category: cat.name }))
  );

  const filteredArticles = searchTerm 
    ? allArticles.filter(art => 
        art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return <div className="sa-loading"><div className="sa-loading-text">Loading knowledge base...</div></div>;
  }

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn</span>
          </div>
          <button className="sa-button-secondary" onClick={() => navigate('/school-admin')}>← Back to Dashboard</button>
        </div>
      </header>

      <main className="sa-main-wide">
        <h1 className="sa-page-title">📚 Knowledge Base</h1>
        <p className="sa-page-subtitle">Learn how to use Play2Learn's features effectively</p>

        {/* Search Bar */}
        <div className="sa-card sa-mb-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <input 
              type="text" 
              className="sa-input" 
              style={{ marginBottom: 0, flex: 1 }}
              placeholder="Search for help articles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Search Results */}
          {searchTerm && (
            <div style={{ marginTop: '16px' }}>
              {filteredArticles.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No articles found for "{searchTerm}"</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredArticles.map(art => (
                    <div 
                      key={art.id}
                      style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', cursor: 'pointer' }}
                      onClick={() => {
                        const cat = knowledgeBase.categories.find(c => c.name === art.category);
                        setSelectedCategory(cat);
                        setSelectedArticle(art);
                        setSearchTerm('');
                      }}
                    >
                      <div style={{ fontWeight: '600' }}>{art.title}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{art.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          {/* Sidebar - Categories */}
          <div className="sa-card" style={{ height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Categories</h3>
            {knowledgeBase.categories.map(cat => (
              <div
                key={cat.id}
                style={{
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: selectedCategory?.id === cat.id ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f9fafb',
                  color: selectedCategory?.id === cat.id ? 'white' : '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onClick={() => { setSelectedCategory(cat); setSelectedArticle(null); }}
              >
                {cat.icon} {cat.name.replace(cat.icon + ' ', '')}
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div>
            {selectedArticle ? (
              /* Article View */
              <div className="sa-card">
                <button 
                  className="sa-button-secondary" 
                  style={{ marginBottom: '16px', padding: '8px 16px' }}
                  onClick={() => setSelectedArticle(null)}
                >
                  ← Back to {selectedCategory.name}
                </button>
                
                <h2 style={{ margin: '0 0 24px 0', fontSize: '24px' }}>{selectedArticle.title}</h2>
                
                <div 
                  style={{ lineHeight: '1.8', color: '#374151' }}
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
                
                {/* Feedback */}
                <div style={{ marginTop: '32px', padding: '20px', background: '#f9fafb', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>Was this article helpful?</p>
                  {feedback[selectedArticle.id] !== undefined ? (
                    <p style={{ color: '#16a34a' }}>✓ Thanks for your feedback!</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        className="sa-button-primary" 
                        style={{ padding: '10px 24px' }}
                        onClick={() => handleFeedback(selectedArticle.id, true)}
                      >
                        👍 Yes, helpful
                      </button>
                      <button 
                        className="sa-button-secondary"
                        style={{ padding: '10px 24px' }}
                        onClick={() => handleFeedback(selectedArticle.id, false)}
                      >
                        👎 Not helpful
                      </button>
                    </div>
                  )}
                  <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                    {selectedArticle.helpful} people found this helpful
                  </p>
                </div>
              </div>
            ) : (
              /* Article List */
              <div className="sa-card">
                <h2 style={{ margin: '0 0 24px 0' }}>{selectedCategory?.name}</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedCategory?.articles.map(article => (
                    <div
                      key={article.id}
                      style={{
                        padding: '20px',
                        background: '#f9fafb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '2px solid transparent'
                      }}
                      onClick={() => setSelectedArticle(article)}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10b981'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{article.title}</h3>
                          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                            👍 {article.helpful} found helpful
                          </p>
                        </div>
                        <span style={{ fontSize: '20px', color: '#10b981' }}>→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
