# Landing Page Manager - Preview Mode Guide

## What's New

The Landing Page Manager now includes a **Preview Mode** that allows administrators to view the entire landing page as it will appear to visitors, not just edit individual blocks.

## Features

### 1. Dual View Modes

The Landing Page Manager now has two modes:

- **✏️ Edit Mode** (Default): Manage blocks in a list view with edit, delete, and reorder controls
- **👁️ Preview Mode**: View the complete landing page as it will appear to visitors

### 2. Easy Mode Switching

- Toggle between Edit and Preview modes using the buttons in the header
- Both modes are accessible at any time without losing your work
- Preview updates in real-time based on your current block configuration

### 3. Preview Features

The preview mode shows:
- All visible blocks in the order they'll appear on the landing page
- Proper styling and layout for each block type (Hero, Features, About, Testimonials, Pricing, Contact, Footer)
- Hidden blocks are excluded from the preview (just like the live site)
- A notice banner indicating you're in preview mode

## How to Use

### Accessing the Landing Page Manager

1. Log in as a P2L Admin
2. Navigate to the P2L Admin Dashboard
3. Click on "Landing Page Manager"

### Switching Between Modes

**Edit Mode:**
- Click the "✏️ Edit Mode" button in the header
- Add, edit, delete, and reorder blocks
- See blocks in a compact list view with action buttons

**Preview Mode:**
- Click the "👁️ Preview" button in the header
- See the full landing page layout
- Review how blocks will appear to visitors
- No editing controls visible in this mode

### Workflow Recommendation

1. Start in **Edit Mode** to create or modify blocks
2. Switch to **Preview Mode** to see how changes look
3. Switch back to **Edit Mode** to make adjustments
4. Use **Preview Mode** for final review before saving
5. Click "💾 Save Changes" to publish (works in both modes)

## Block Types and Preview

Each block type has a distinct appearance in preview mode:

- **Hero**: Large header with gradient background, title, content, and optional image
- **Features**: Clean section with title and feature descriptions
- **About**: Information section with text and optional image
- **Testimonials**: Testimonial display with styled formatting
- **Pricing**: Pricing information display
- **Contact**: Contact information section
- **Footer**: Dark footer at the bottom of the page

## Tips

- **Use Preview Mode frequently**: Switch to preview mode often to see how your changes affect the overall page layout
- **Check on different screen sizes**: The preview is responsive, but test the actual page on mobile devices for best results
- **Hidden blocks don't show**: Blocks marked as "not visible" won't appear in preview mode or on the live site
- **Block order matters**: The order in Edit Mode determines the order in Preview Mode

## Render Deployment Notes

### Environment Variables

When deploying to Render, ensure the following environment variables are set in your Render dashboard:

#### Frontend Service
No special environment variables needed for the landing page manager feature.

#### Backend Service
The landing page manager uses existing backend endpoints. Ensure these are set:
```
MONGODB_URI=your-mongodb-connection-string
PORT=5000
```

### Build Configuration

The landing page manager is built with the standard React build process:

```bash
npm run install-all
npm run build
```

This is already configured in the root `package.json` under the `render-build` script.

### Static File Serving

When deploying the frontend to Render:
1. Build command: `npm run build`
2. Publish directory: `build`
3. The landing page manager will be accessible at `/p2ladmin/landing-page`

### API Endpoints

The landing page manager uses these API endpoints (already implemented):
- `GET /api/p2ladmin/landing` - Fetch landing page blocks
- `POST /api/p2ladmin/landing` - Save landing page blocks
- `PUT /api/p2ladmin/landing/:id` - Update landing page blocks

### No Additional Configuration Required

The preview mode is a frontend-only feature that doesn't require:
- Additional database tables
- New environment variables
- Special server configuration
- External dependencies

## Technical Details

### Implementation

- **Component**: `frontend/src/components/P2LAdmin/LandingPageManager.js`
- **Styles**: `frontend/src/components/P2LAdmin/LandingPageManager.css`
- **State Management**: React hooks (useState)
- **API Integration**: Existing p2lAdminService

### Preview Rendering

The preview mode renders blocks using a dedicated `renderBlockPreview()` function that:
- Takes block data (type, title, content, image_url)
- Returns styled JSX matching the block type
- Respects the `is_visible` flag
- Maintains consistent ordering based on the `order` field

### Responsive Design

The preview mode includes responsive styles for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## Support

For issues or questions:
1. Check that you're logged in as a P2L Admin
2. Verify your blocks have content (empty blocks show placeholder text)
3. Ensure blocks are marked as "visible" to appear in preview
4. Check browser console for any JavaScript errors

## Future Enhancements

Potential improvements:
- Side-by-side edit and preview
- Click-to-edit from preview mode
- Mobile preview simulator
- Undo/redo functionality
- Preview themes and color schemes
