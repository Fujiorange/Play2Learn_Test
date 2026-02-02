// Utility functions for user authentication and broadcast management

/**
 * Get the current user's ID from localStorage
 * @returns {string|null} User ID or null if not found
 */
export const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || user._id || null;
  } catch {
    return null;
  }
};

/**
 * Get the current user's role from localStorage
 * @returns {string|null} User role or null if not found
 */
export const getUserRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || null;
  } catch {
    return null;
  }
};

/**
 * Get dismissed broadcast IDs for the current user
 * @returns {Array} Array of dismissed broadcast IDs
 */
export const getDismissedBroadcasts = () => {
  const userId = getUserId();
  const storageKey = userId ? `dismissedBroadcasts_${userId}` : 'dismissedBroadcasts';
  return JSON.parse(localStorage.getItem(storageKey) || '[]');
};

/**
 * Save dismissed broadcast IDs for the current user
 * @param {Array} dismissedIds Array of dismissed broadcast IDs
 */
export const saveDismissedBroadcasts = (dismissedIds) => {
  const userId = getUserId();
  const storageKey = userId ? `dismissedBroadcasts_${userId}` : 'dismissedBroadcasts';
  localStorage.setItem(storageKey, JSON.stringify(dismissedIds));
};
