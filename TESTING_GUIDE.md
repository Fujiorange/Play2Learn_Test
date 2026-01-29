# Testing Guide: Dynamic Landing Page

This guide provides step-by-step instructions to test the dynamic landing page functionality.

## Prerequisites

1. MongoDB instance running (local or cloud)
2. Backend server running on port 5000
3. Frontend server running on port 3000
4. P2L Admin account credentials

## Test Scenario 1: Initial Setup (First Time)

### Step 1: Seed the Database

```bash
cd backend
node seed-landing-page.js
```

**Expected Result:**
```
🔗 Connecting to MongoDB...
✅ Connected to MongoDB
📝 Creating default landing page...
✅ Default landing page created successfully!
   Created 8 blocks
🔌 Disconnected from MongoDB
```

### Step 2: View the Public Landing Page

1. Open browser to `http://localhost:3000/` (or your production URL)
2. Verify all sections appear in the correct order:
   - Hero section
   - Features section
   - About section
   - Roadmap section
   - Testimonials section
   - Pricing section
   - Contact section
   - Footer section

**Expected Result:** All sections display with default content from the seed data.

## Test Scenario 2: Admin Panel Management

### Step 1: Access Landing Page Manager

1. Log in as P2L Admin
2. Navigate to `/p2ladmin/landing-page`
3. Verify the landing page manager loads

**Expected Result:** You should see a list of 8 blocks with options to edit, delete, and reorder.

### Step 2: Edit a Block (Hero)

1. Click "Edit" on the Hero block
2. Change the title to: "Welcome to Play2Learn - Test Update"
3. Change the content to: "This is a test update to verify dynamic content works!"
4. Click "Save"
5. Click "Save All Changes"
6. Navigate to the public landing page (`/`)
7. Refresh the page

**Expected Result:** The hero section should display the new title and content.

### Step 3: Add a New Block

1. Return to the landing page manager
2. Click "Add New Block"
3. Fill in the form:
   - Type: Features
   - Title: "New Feature Block"
   - Order: 9 (to appear at the bottom)
   - Visible: Checked
4. Click "Save"
5. Click "Save All Changes"
6. Navigate to the public landing page
7. Scroll to the bottom

**Expected Result:** A new features section should appear at the bottom of the page.

### Step 4: Hide a Block

1. Return to the landing page manager
2. Find the "Roadmap" block
3. Click "Edit"
4. Uncheck "Visible"
5. Click "Save"
6. Click "Save All Changes"
7. Navigate to the public landing page
8. Refresh the page

**Expected Result:** The roadmap section should not appear on the landing page.

### Step 5: Reorder Blocks

1. Return to the landing page manager
2. Find the "About" block (should be order 3)
3. Click the down arrow (↓) to move it down
4. Click "Save All Changes"
5. Navigate to the public landing page
6. Refresh the page

**Expected Result:** The About section should now appear after the section it was swapped with.

### Step 6: Delete a Block

1. Return to the landing page manager
2. Find the new "New Feature Block" you created earlier
3. Click "Delete"
4. Confirm the deletion
5. Click "Save All Changes"
6. Navigate to the public landing page
7. Refresh the page

**Expected Result:** The new feature block should no longer appear.

### Step 7: Re-show Hidden Block

1. Return to the landing page manager
2. Find the "Roadmap" block
3. Click "Edit"
4. Check "Visible"
5. Click "Save"
6. Click "Save All Changes"
7. Navigate to the public landing page
8. Refresh the page

**Expected Result:** The roadmap section should reappear.

## Test Scenario 3: Complex Data Updates

### Step 1: Update Features Block with Custom Data

1. Go to landing page manager
2. Edit the "Features" block
3. In a text editor, prepare this JSON for custom_data:

```json
{
  "features": [
    {
      "icon": "🚀",
      "title": "Super Fast Learning",
      "description": "Learn at lightning speed with our optimized platform."
    },
    {
      "icon": "💡",
      "title": "Smart AI Tutor",
      "description": "Get personalized help from our AI-powered tutor."
    },
    {
      "icon": "🎮",
      "title": "Gamified Experience",
      "description": "Make learning fun with our game-based approach."
    }
  ]
}
```

4. Paste this into the Custom Data field (if available in the UI)
5. Or update directly in MongoDB:

```javascript
db.landingpages.updateOne(
  { "blocks.type": "features" },
  { 
    $set: { 
      "blocks.$.custom_data": {
        features: [
          {
            icon: "🚀",
            title: "Super Fast Learning",
            description: "Learn at lightning speed with our optimized platform."
          },
          {
            icon: "💡",
            title: "Smart AI Tutor",
            description: "Get personalized help from our AI-powered tutor."
          },
          {
            icon: "🎮",
            title: "Gamified Experience",
            description: "Make learning fun with our game-based approach."
          }
        ]
      }
    }
  }
)
```

6. Refresh the public landing page

**Expected Result:** The features section should display the three new features with custom icons and descriptions.

## Test Scenario 4: API Testing

### Test Public Endpoint (No Auth)

```bash
curl http://localhost:5000/api/public/landing
```

**Expected Result:** JSON response with all visible blocks.

### Test Admin Endpoint (With Auth)

```bash
# First, login and get token
curl -X POST http://localhost:5000/api/mongo/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Use the token in subsequent requests
curl http://localhost:5000/api/p2ladmin/landing \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Result:** JSON response with all blocks (including hidden ones).

## Test Scenario 5: Fallback Behavior

### Test 1: No Landing Page in Database

1. Delete all landing pages from MongoDB:
```javascript
db.landingpages.deleteMany({})
```

2. Navigate to the public landing page
3. Refresh the page

**Expected Result:** The page should display default hardcoded content (fallback behavior).

### Test 2: Empty Blocks Array

1. Create a landing page with empty blocks:
```javascript
db.landingpages.insertOne({
  blocks: [],
  is_active: true,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

2. Navigate to the public landing page
3. Refresh the page

**Expected Result:** The page should display default hardcoded content.

## Test Scenario 6: Browser Compatibility

Test the landing page on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome on Android)

**Expected Result:** The landing page should render correctly on all browsers.

## Validation Checklist

After completing all tests, verify:

- [x] Public landing page loads without errors
- [x] All sections render in correct order
- [x] P2L Admin can access landing page manager
- [x] Blocks can be created
- [x] Blocks can be edited
- [x] Block content updates appear on public page
- [x] Blocks can be reordered
- [x] Blocks can be hidden/shown
- [x] Blocks can be deleted
- [x] Custom data fields work correctly
- [x] Public API endpoint works without auth
- [x] Admin API endpoints require auth
- [x] Fallback behavior works when no data exists
- [x] Page is responsive on mobile devices
- [x] No console errors on public page
- [x] No console errors in admin panel

## Common Issues and Solutions

### Issue: "Cannot read property 'blocks' of null"
**Solution:** Run the seeder script to create initial landing page data.

### Issue: Changes not appearing on public page
**Solution:** 
1. Make sure you clicked "Save All Changes"
2. Clear browser cache
3. Check that the block is marked as visible

### Issue: 404 on `/api/public/landing`
**Solution:** 
1. Verify backend server is running
2. Check that publicRoutes.js is properly registered in server.js
3. Check CORS settings allow requests from frontend

### Issue: Unauthorized when accessing admin endpoints
**Solution:** 
1. Verify you're logged in as P2L Admin
2. Check that the JWT token is being sent in Authorization header
3. Verify token hasn't expired

## Performance Testing

1. **Load Time**: Landing page should load in < 2 seconds
2. **API Response**: `/api/public/landing` should respond in < 200ms
3. **Large Data**: Test with 20+ blocks to ensure performance remains good

## Security Testing

1. **Public Access**: Verify non-authenticated users can view landing page
2. **Admin Protection**: Verify only P2L Admins can modify content
3. **Input Validation**: Test with malicious input (XSS, SQL injection attempts)
4. **CORS**: Verify CORS headers are correctly configured

## Conclusion

If all tests pass, the dynamic landing page feature is working correctly and ready for production use!
