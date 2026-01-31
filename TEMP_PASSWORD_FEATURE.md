# View Temp Password Feature Implementation

## Overview
Added the ability to view temporary passwords for newly created school admins from the school admin management page at `/p2ladmin/school-admins`.

## Problem Statement
Previously, temporary passwords were only shown in a modal immediately after creating school admins. Once the modal was closed, there was no way to view these passwords again, which could be problematic if users forgot to save them.

## Solution
Implemented a persistent temp password storage system using browser session storage that allows P2L admins to view temporary passwords from the admin list cards until they are manually viewed and removed.

## Changes Made

### 1. Frontend Component Updates (`SchoolAdminManagement.js`)

#### New State Management
- Added `tempPasswords` state to store temp password data
- Loads passwords from session storage on component mount
- Persists passwords across page refreshes (until browser session ends)

#### Password Storage on Creation
When admins are created:
```javascript
// Store password data in session
newTempPasswords[admin.id] = {
  password: admin.tempPassword,
  email: admin.email,
  name: admin.name,
  createdAt: new Date().toISOString()
};
sessionStorage.setItem('schoolAdminTempPasswords', JSON.stringify(newTempPasswords));
```

#### View Password Handler
- Added `handleViewTempPasswordFromList()` function
- Shows warning confirmation before revealing password
- Displays password in alert dialog
- Automatically removes password from storage after viewing (one-time view)

#### Updated Admin Card Display
Admin cards now show:
- **Yellow highlight** for admins with available temp passwords
- **Warning notice**: "⚠️ Temporary password available"
- **"View Temp Password" button** - prominently displayed
- One-time viewing with automatic removal after viewing

### 2. CSS Updates (`SchoolAdminManagement.css`)

#### New Styles
- `.admin-card.newly-created` - Yellow-highlighted card for new admins
- `.temp-password-notice` - Warning banner inside card
- `.btn-view-temp-password` - Yellow button style (full-width, prominent)

### 3. User Flow

1. **Create Admin**: P2L admin creates school admin(s)
2. **Modal Shows**: Temp passwords shown in creation modal (existing functionality)
3. **Password Stored**: Passwords stored in session storage
4. **Admin List**: Newly created admin cards show:
   - Yellow highlight
   - "Temporary password available" notice
   - "👁️ View Temp Password" button
5. **View Password**: 
   - Click button
   - Confirm warning dialog
   - Password displayed in alert
   - Password removed from storage (can't be viewed again)
6. **Session Persistence**: Passwords remain available until:
   - Manually viewed and removed
   - Browser session ends
   - Page is refreshed in a new session

## Security Considerations

### Session-Only Storage
- Passwords stored in `sessionStorage` (not `localStorage`)
- Automatically cleared when browser tab/window closes
- Not persisted across browser sessions

### One-Time Viewing
- After viewing, password is immediately removed
- Cannot be viewed multiple times
- User must save password when displayed

### Warning System
- Prominent warnings before viewing
- Clear instructions to save password
- Visual indicators on admin cards

### No Backend Storage
- Temp passwords never stored in database
- Only available in API response during creation
- Backend continues to hash and store securely

## Benefits

1. **Reduced Risk**: Admins can retrieve forgotten passwords without recreating accounts
2. **Better UX**: Clear visual indicators for which admins have available passwords
3. **Flexibility**: Passwords remain available throughout the session
4. **Security**: One-time viewing with automatic cleanup
5. **Persistence**: Survives page refreshes within same session

## Testing Recommendations

1. Create a new school admin
2. Close the creation modal
3. Verify admin card shows yellow highlight and warning
4. Click "View Temp Password" button
5. Confirm warning dialog appears
6. Verify password is displayed
7. Confirm password is removed after viewing
8. Verify button disappears after viewing
9. Test page refresh (password should remain if not viewed)
10. Test browser close/reopen (password should be gone)

## Files Modified
- `/frontend/src/components/P2LAdmin/SchoolAdminManagement.js`
- `/frontend/src/components/P2LAdmin/SchoolAdminManagement.css`

## Backend
No backend changes required. The existing API already returns temp passwords in the creation response.
