import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

const rarityColors = {
  common: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
  rare: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
  epic: { bg: '#f5f3ff', color: '#8b5cf6', border: '#ddd6fe' },
  legendary: { bg: '#fffbeb', color: '#f59e0b', border: '#fcd34d' }
};

export default function StudentBadgesShop() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('badges');
  const [badges, setBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [badgesResult, shopResult, purchasesResult, pointsResult] = await Promise.all([
        studentService.getMyBadges(),
        studentService.getShopItems(),
        studentService.getMyPurchases(),
        studentService.getPoints()
      ]);

      if (badgesResult.success) {
        setBadges(badgesResult.badges || []);
        setEarnedBadges(badgesResult.earnedBadges || []);
      }
      if (shopResult.success) {
        setShopItems(shopResult.items || []);
        setPoints(shopResult.studentPoints || 0);
      }
      if (purchasesResult.success) {
        setPurchases(purchasesResult.purchases || []);
      }
      if (pointsResult.success) {
        setPoints(pointsResult.points || 0);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item) => {
    if (item.owned) {
      setMessage({ type: 'error', text: 'You already own this item!' });
      return;
    }
    if (!item.canAfford) {
      setMessage({ type: 'error', text: 'Not enough points!' });
      return;
    }

    setPurchasing(item._id);
    try {
      const result = await studentService.purchaseItem(item._id);
      if (result.success) {
        setMessage({ type: 'success', text: `🎉 ${result.message}` });
        setPoints(result.newPoints);
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Purchase failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Purchase failed' });
    } finally {
      setPurchasing(null);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' }}>
        <div style={{ fontSize: '24px', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>P</div>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Play2Learn</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', padding: '8px 20px', borderRadius: '20px', fontWeight: '700', fontSize: '16px' }}>
              💰 {points} Points
            </div>
            <button onClick={() => navigate('/student')} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>🏆 Badges & Rewards Shop</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Earn badges through achievements and spend your points on cool rewards!</p>

        {message.text && (
          <div style={{
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            fontWeight: '500'
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['badges', 'shop', 'inventory'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'white',
                color: activeTab === tab ? 'white' : '#374151',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              {tab === 'badges' && `🏆 My Badges (${earnedBadges.length}/${badges.length})`}
              {tab === 'shop' && `🛒 Rewards Shop (${shopItems.length})`}
              {tab === 'inventory' && `🎒 My Items (${purchases.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'badges' && (
          <div>
            {earnedBadges.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>🌟 Earned Badges</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {earnedBadges.map(badge => {
                    const rarity = rarityColors[badge.rarity] || rarityColors.common;
                    return (
                      <div key={badge._id} style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        textAlign: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        border: `3px solid ${rarity.border}`
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>{badge.icon}</div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{badge.name}</h3>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280' }}>{badge.description}</p>
                        <span style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '12px', background: rarity.bg, color: rarity.color, fontWeight: '600' }}>
                          {badge.rarity?.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>🎯 Available Badges</h2>
            {badges.filter(b => !b.earned).length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</p>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>You've earned all available badges!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {badges.filter(b => !b.earned).map(badge => (
                  <div key={badge._id} style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    opacity: 0.7,
                    border: '2px dashed #e5e7eb'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px', filter: 'grayscale(100%)' }}>{badge.icon}</div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#9ca3af' }}>{badge.name}</h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#9ca3af' }}>{badge.description}</p>
                    <span style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '12px', background: '#f3f4f6', color: '#6b7280' }}>🔒 Locked</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'shop' && (
          <div>
            {shopItems.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</p>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>No items in the shop yet!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {shopItems.map(item => (
                  <div key={item._id} style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    opacity: item.owned ? 0.7 : 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ fontSize: '48px' }}>{item.icon}</div>
                      {item.owned && (
                        <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>✓ Owned</span>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>{item.name}</h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280', minHeight: '40px' }}>{item.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>{item.cost} 💰</span>
                      {!item.owned && (
                        <button
                          onClick={() => handlePurchase(item)}
                          disabled={!item.canAfford || purchasing === item._id}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: item.canAfford ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e5e7eb',
                            color: item.canAfford ? 'white' : '#9ca3af',
                            fontWeight: '600',
                            cursor: item.canAfford ? 'pointer' : 'not-allowed',
                            fontSize: '14px'
                          }}
                        >
                          {purchasing === item._id ? 'Buying...' : item.canAfford ? 'Buy Now' : 'Need More Points'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            {purchases.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎒</p>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>No items yet. Visit the shop!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {purchases.map(purchase => (
                  <div key={purchase._id} style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #d1fae5'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>{purchase.item_name}</h3>
                    <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
                      Purchased: {new Date(purchase.purchasedAt).toLocaleDateString()}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#f59e0b' }}>
                      Cost: {purchase.cost} points
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
