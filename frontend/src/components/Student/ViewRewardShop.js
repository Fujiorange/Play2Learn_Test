// frontend/src/components/Student/ViewRewardShop.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function ViewRewardShop() {
  const navigate = useNavigate();
  const [shopItems, setShopItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [shopResult, purchasesResult, dashboardResult] = await Promise.all([
        studentService.getShopItems(),
        studentService.getPurchases(),
        studentService.getDashboard()
      ]);

      if (shopResult.success) {
        setShopItems(shopResult.items || []);
      }

      if (purchasesResult.success) {
        setPurchases(purchasesResult.purchases || []);
      }

      if (dashboardResult.success) {
        const points = dashboardResult.dashboard?.totalPoints ?? 
                      dashboardResult.data?.points ?? 0;
        setCurrentPoints(points);
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
      setMessage({ type: 'error', text: 'Failed to load shop' });
    } finally {
      setLoading(false);
    }
  };

  const isPurchased = (itemId) => {
    return purchases.some(p => p.item_id === itemId);
  };

  const canAfford = (cost) => {
    return currentPoints >= cost;
  };

  const handlePurchaseClick = (item) => {
    if (isPurchased(item._id)) {
      setMessage({ type: 'info', text: 'You already own this item!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (!canAfford(item.cost)) {
      setMessage({ type: 'error', text: `Not enough points! You need ${item.cost - currentPoints} more points.` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setSelectedItem(item);
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    try {
      const result = await studentService.purchaseShopItem(selectedItem._id);
      
      if (result.success) {
        setMessage({ type: 'success', text: `✅ Successfully purchased ${selectedItem.name}!` });
        setShowPurchaseModal(false);
        setSelectedItem(null);
        loadData(); // Reload data to update points and purchases
      } else {
        setMessage({ type: 'error', text: result.error || 'Purchase failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to complete purchase' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      cosmetic: '🎨',
      booster: '⚡',
      special: '✨'
    };
    return icons[category] || '🎁';
  };

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading shop...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoArea}>
            <div style={styles.logo}>P</div>
            <h1 style={styles.logoText}>Play2Learn</h1>
          </div>
          <div style={styles.userArea}>
            <div style={styles.pointsBadge}>
              <span style={styles.pointsIcon}>⭐</span>
              <span style={styles.pointsText}>{currentPoints} Points</span>
            </div>
            <button style={styles.backButton} onClick={() => navigate('/student')}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.titleSection}>
          <div>
            <h2 style={styles.pageTitle}>🛒 Reward Shop</h2>
            <p style={styles.pageSubtitle}>Spend your hard-earned points on rewards!</p>
          </div>
          <button 
            style={styles.historyButton}
            onClick={() => setShowPurchaseHistory(!showPurchaseHistory)}
          >
            📜 Purchase History
          </button>
        </div>

        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.messageSuccess : 
                message.type === 'error' ? styles.messageError : styles.messageInfo)
          }}>
            {message.text}
          </div>
        )}

        {/* Category Filter */}
        <div style={styles.filterSection}>
          <button 
            style={{...styles.filterButton, ...(selectedCategory === 'all' ? styles.filterButtonActive : {})}}
            onClick={() => setSelectedCategory('all')}
          >
            All Items ({shopItems.length})
          </button>
          <button 
            style={{...styles.filterButton, ...(selectedCategory === 'cosmetic' ? styles.filterButtonActive : {})}}
            onClick={() => setSelectedCategory('cosmetic')}
          >
            🎨 Cosmetic ({shopItems.filter(i => i.category === 'cosmetic').length})
          </button>
          <button 
            style={{...styles.filterButton, ...(selectedCategory === 'booster' ? styles.filterButtonActive : {})}}
            onClick={() => setSelectedCategory('booster')}
          >
            ⚡ Booster ({shopItems.filter(i => i.category === 'booster').length})
          </button>
          <button 
            style={{...styles.filterButton, ...(selectedCategory === 'special' ? styles.filterButtonActive : {})}}
            onClick={() => setSelectedCategory('special')}
          >
            ✨ Special ({shopItems.filter(i => i.category === 'special').length})
          </button>
        </div>

        {/* Purchase History Panel */}
        {showPurchaseHistory && (
          <div style={styles.historyPanel}>
            <h3 style={styles.historyTitle}>📜 Your Purchases</h3>
            {purchases.length === 0 ? (
              <p style={styles.emptyText}>You haven't purchased anything yet!</p>
            ) : (
              <div style={styles.historyList}>
                {purchases.map(purchase => (
                  <div key={purchase._id} style={styles.historyItem}>
                    <span style={styles.historyIcon}>{purchase.item_icon}</span>
                    <div style={styles.historyInfo}>
                      <strong>{purchase.item_name}</strong>
                      <span style={styles.historyDate}>
                        {new Date(purchase.purchased_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span style={styles.historyCost}>-{purchase.cost} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shop Items Grid */}
        {filteredItems.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>🛒</p>
            <p style={styles.emptyTitle}>No items available</p>
            <p style={styles.emptySubtitle}>Check back later for new rewards!</p>
          </div>
        ) : (
          <div style={styles.itemsGrid}>
            {filteredItems.map(item => {
              const purchased = isPurchased(item._id);
              const affordable = canAfford(item.cost);
              const outOfStock = item.stock === 0;

              return (
                <div key={item._id} style={styles.itemCard}>
                  {/* Category Badge */}
                  <div style={styles.categoryBadge}>
                    {getCategoryIcon(item.category)} {item.category}
                  </div>

                  {/* Item Icon */}
                  <div style={styles.itemIcon}>{item.icon}</div>

                  {/* Item Info */}
                  <h3 style={styles.itemName}>{item.name}</h3>
                  <p style={styles.itemDescription}>{item.description}</p>

                  {/* Stock Info */}
                  {item.stock !== -1 && (
                    <div style={styles.stockInfo}>
                      Stock: {item.stock === 0 ? 'Out of Stock' : `${item.stock} left`}
                    </div>
                  )}

                  {/* Cost & Purchase Button */}
                  <div style={styles.itemFooter}>
                    <div style={styles.itemCost}>
                      <span style={styles.costIcon}>⭐</span>
                      <span style={styles.costValue}>{item.cost}</span>
                    </div>
                    
                    {purchased ? (
                      <button style={styles.ownedButton} disabled>
                        ✓ Owned
                      </button>
                    ) : outOfStock ? (
                      <button style={styles.outOfStockButton} disabled>
                        Out of Stock
                      </button>
                    ) : !affordable ? (
                      <button style={styles.cannotAffordButton} disabled>
                        Not Enough Points
                      </button>
                    ) : (
                      <button 
                        style={styles.buyButton}
                        onClick={() => handlePurchaseClick(item)}
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && selectedItem && (
        <div style={styles.modal} onClick={() => setShowPurchaseModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Confirm Purchase</h2>
            <div style={styles.modalItem}>
              <div style={styles.modalItemIcon}>{selectedItem.icon}</div>
              <h3>{selectedItem.name}</h3>
              <p style={styles.modalItemDescription}>{selectedItem.description}</p>
            </div>
            <div style={styles.modalCost}>
              <span>Cost: </span>
              <span style={styles.modalCostValue}>⭐ {selectedItem.cost} points</span>
            </div>
            <div style={styles.modalBalance}>
              <span>Your Balance: </span>
              <span>{currentPoints} points</span>
            </div>
            <div style={styles.modalBalance}>
              <span>After Purchase: </span>
              <span style={styles.modalNewBalance}>{currentPoints - selectedItem.cost} points</span>
            </div>
            <div style={styles.modalButtons}>
              <button 
                style={styles.modalCancelButton}
                onClick={() => {
                  setShowPurchaseModal(false);
                  setSelectedItem(null);
                }}
              >
                Cancel
              </button>
              <button 
                style={styles.modalConfirmButton}
                onClick={confirmPurchase}
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    backgroundColor: '#fff',
    padding: '15px 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#10b981',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  logoText: {
    margin: 0,
    fontSize: '20px',
    color: '#111827',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  pointsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fef3c7',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '2px solid #fbbf24',
  },
  pointsIcon: {
    fontSize: '20px',
  },
  pointsText: {
    fontWeight: 'bold',
    color: '#92400e',
  },
  backButton: {
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px',
  },
  titleSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  pageSubtitle: {
    color: '#6b7280',
    marginTop: '8px',
  },
  historyButton: {
    backgroundColor: '#fff',
    border: '2px solid #e5e7eb',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  message: {
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: '600',
  },
  messageSuccess: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    border: '1px solid #10b981',
  },
  messageError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #ef4444',
  },
  messageInfo: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    border: '1px solid #3b82f6',
  },
  filterSection: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '10px 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
    color: '#fff',
    borderColor: '#10b981',
  },
  historyPanel: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  historyTitle: {
    margin: '0 0 16px 0',
    fontSize: '20px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  historyIcon: {
    fontSize: '32px',
  },
  historyInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  historyDate: {
    fontSize: '13px',
    color: '#6b7280',
  },
  historyCost: {
    fontWeight: 'bold',
    color: '#ef4444',
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
  },
  categoryBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#f3f4f6',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  itemIcon: {
    fontSize: '64px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  itemName: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#111827',
  },
  itemDescription: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '16px',
    minHeight: '40px',
  },
  stockInfo: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
  },
  itemCost: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
  },
  costIcon: {
    fontSize: '18px',
  },
  costValue: {},
  buyButton: {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background 0.2s',
  },
  ownedButton: {
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'not-allowed',
    fontWeight: 'bold',
  },
  outOfStockButton: {
    backgroundColor: '#e5e7eb',
    color: '#9ca3af',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'not-allowed',
    fontWeight: 'bold',
  },
  cannotAffordButton: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'not-allowed',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '64px',
    margin: '0 0 16px 0',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#6b7280',
    margin: '0 0 8px 0',
  },
  emptySubtitle: {
    color: '#9ca3af',
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '400px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center',
  },
  modalItem: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  modalItemIcon: {
    fontSize: '64px',
    marginBottom: '12px',
  },
  modalItemDescription: {
    color: '#6b7280',
    fontSize: '14px',
  },
  modalCost: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  modalCostValue: {
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBalance: {
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  modalNewBalance: {
    fontWeight: 'bold',
    color: '#10b981',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  modalCancelButton: {
    flex: 1,
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#10b981',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingSpinner: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #10b981',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '15px',
    color: '#6b7280',
  },
};