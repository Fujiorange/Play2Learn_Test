# Testing Guide for Bug Fixes

## Overview
This guide outlines how to test the fixes made to address the reported issues.

## 1. Testimonials Display on Landing Page

### Issue Fixed
- Testimonials marked as "Add to Landing Page" were not appearing in preview or on the actual landing page

### How to Test
1. **Login as P2L Admin**
   - Navigate to `/p2ladmin/landing-page`
   
2. **Approve and Add Testimonial to Landing Page**
   - Click "Load Testimonials" button
   - Find a testimonial and click "✅ Approve" 
   - Then click "📄 Add to Landing" button
   - The button should change to "🌐 On Landing"

3. **Verify in Preview Mode**
   - Ensure there's a testimonial block in the landing page configuration
   - Toggle to "👁️ Preview" mode
   - You should see the approved testimonials displayed in the testimonial section

4. **Verify on Actual Landing Page**
   - Go to the public landing page at `/`
   - Scroll to the testimonials section
   - The approved testimonials should be visible

### Expected Behavior
- Testimonials with `display_on_landing: true` automatically populate testimonial blocks
- Both preview and public landing page show the same testimonials
- Maximum of 10 most recent approved testimonials are displayed

---

## 2. Sentiment Analysis Improvement

### Issue Fixed
- Sentiment analysis was inaccurate, relying too heavily on star rating
- Example: 5-star rating with negative message incorrectly showed as positive

### How to Test
1. **Submit a Test Testimonial** (as Parent or Student)
   - Use a 5-star rating
   - Write a message with negative keywords like: "This was a terrible and bad experience"
   - Submit the testimonial

2. **Check Sentiment in Admin Panel**
   - Login as P2L Admin
   - Navigate to `/p2ladmin/landing-page`
   - Click "Load Testimonials"
   - Find your test testimonial
   - Check the sentiment label (should show 😞 negative despite 5-star rating)

### Expected Behavior
- Text content has strong influence through keyword detection
- Each negative keyword: -3 points (e.g., "bad", "terrible", "awful")
- Each positive keyword: +3 points (e.g., "great", "excellent", "amazing")
- Star rating provides minor adjustment: (rating - 3) × 0.5
  - 1-star = -1.0, 3-star = 0.0, 5-star = +1.0
- Keywords have 3× stronger impact than rating per match
- Overlapping phrases counted only once (e.g., "terrible experience" = -3, not -6)
- Sentiment thresholds: score > 1 = positive, score < -1 = negative

---

## 3. School Admin Creation

### Issue Fixed
- "API request failed" error when creating school admins
- Enhanced error logging for better diagnostics

### How to Test
1. **Login as P2L Admin**
   - Navigate to `/p2ladmin/school-admins`

2. **Select a School**
   - Choose a school from the dropdown

3. **Create a School Admin**
   - Click "➕ Add School Admin"
   - Fill in: Name, Email, Contact
   - Click "Create Admin(s)"

4. **Verify Success**
   - Should show success message
   - Temporary password should be displayed
   - Admin should appear in the list

### Expected Behavior
- No "API request failed" error
- If error occurs, detailed error message should be shown
- Backend logs will show detailed error information including stack trace

---

## 4. Maintenance Broadcast User Selection

### Issue Fixed
- Could not unselect "All Users" to select specific roles only
- Broadcasts not appearing for guests and new users

### How to Test (Part 1: User Selection)
1. **Login as P2L Admin**
   - Navigate to `/p2ladmin/maintenance`

2. **Create a Broadcast for Specific Roles**
   - Click "Create Broadcast"
   - Check "All Users" (it should be checked by default)
   - Uncheck "All Users" - it should now be possible
   - Select only "Student" and "Teacher"
   - Fill in other fields and create the broadcast

3. **Verify Role Selection**
   - Edit the broadcast
   - Verify that only selected roles are checked
   - "All Users" should not be checked

### How to Test (Part 2: Guest Visibility)
1. **Create a Broadcast for All Users**
   - Navigate to `/p2ladmin/maintenance`
   - Create a new broadcast
   - Ensure "All Users" is checked
   - Set type (e.g., "Info")
   - Enter title and message
   - Create the broadcast

2. **Test as Guest**
   - Logout or open an incognito window
   - Visit the website homepage
   - The maintenance banner should appear at the top
   - It should be visible on all pages (except landing page)

3. **Test as New User**
   - Create a new user account
   - Before logging in, check if banner is visible
   - After logging in, banner should still be visible

### Expected Behavior
- "All Users" checkbox can be unchecked to allow specific role selection
- When no roles selected, defaults back to "All Users"
- Broadcasts with target_roles=['all'] visible to everyone including guests
- Banner appears globally across all routes
- Users can dismiss banners (stored in localStorage)

---

## Additional Notes

### Database Requirements
- MongoDB must be running
- Required collections: Users, Schools, Testimonials, LandingPage, Maintenance

### API Endpoints Modified
- `GET /api/public/landing-page` - Injects testimonials dynamically
- `GET /api/p2ladmin/landing` - Injects testimonials for preview
- `POST /api/p2ladmin/school-admins` - Enhanced error logging
- `POST /api/mongo/parent/testimonials` - Improved sentiment analysis
- `POST /api/mongo/student/testimonials` - Improved sentiment analysis

### Frontend Components Modified
- `MaintenanceBroadcastManager.js` - Role selection logic
- `MaintenanceBanner.js` - Already had correct visibility logic

---

## Troubleshooting

### Testimonials not showing
- Check if testimonial is both approved AND has display_on_landing = true
- Ensure landing page has a testimonial block configured
- Check browser console for API errors

### Sentiment analysis not accurate
- Clear any cached testimonials
- Submit a new testimonial to test
- Check admin panel immediately after submission

### School admin creation failing
- Check backend console logs for detailed error
- Verify School exists in database
- Ensure email is not already registered

### Maintenance banner not visible
- Check if broadcast is active (is_active: true)
- Verify start_date is in the past
- Check if end_date has passed
- Clear localStorage to see dismissed banners
