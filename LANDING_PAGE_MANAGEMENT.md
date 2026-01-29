# Dynamic Landing Page Management

## Overview

The Play2Learn landing page is now fully dynamic and can be managed through the P2L Admin panel. All content is stored in the database and can be modified without changing code.

## Features

- **Database-Driven**: All landing page content is stored in MongoDB
- **No-Code Management**: P2L Admins can modify the landing page through the admin panel
- **CRUD Operations**: Create, Read, Update, and Delete landing page blocks
- **Block Types**: Support for 8 different block types
- **Flexible Ordering**: Change the order of blocks on the page
- **Visibility Control**: Show or hide blocks without deleting them
- **Custom Data**: Store complex data structures for each block type

## Supported Block Types

1. **Hero** - Main banner section with title, content, and optional image
2. **Features** - Features grid with icons, titles, and descriptions
3. **About** - About section with mission, vision, goals, and stats
4. **Roadmap** - Learning journey timeline with steps
5. **Testimonials** - Success stories from users
6. **Pricing** - Pricing plans with features
7. **Contact** - Contact information and FAQs
8. **Footer** - Footer section with links

## How It Works

### Backend

1. **Public API Endpoint**: `GET /api/public/landing`
   - No authentication required
   - Returns all visible blocks sorted by order
   - Fallback to most recent landing page if no active page exists

2. **Admin API Endpoints**: All require P2L Admin authentication
   - `GET /api/p2ladmin/landing` - Get landing page for editing
   - `POST /api/p2ladmin/landing` - Create new landing page
   - `PUT /api/p2ladmin/landing/:id` - Update existing landing page
   - `DELETE /api/p2ladmin/landing` - Delete active landing page

### Frontend

1. **Dynamic Rendering**: The `LandingPage` component fetches blocks from the API
2. **Component Mapping**: Each block type maps to a React component
3. **Props System**: Components receive data through props with sensible defaults
4. **Fallback**: If no blocks exist in database, displays default content

## For P2L Admins: Managing the Landing Page

### Accessing the Landing Page Manager

1. Log in as a P2L Admin
2. Navigate to the Admin Dashboard
3. Click on "Landing Page Manager"

### Creating/Editing Blocks

1. Click "Add New Block" to create a new block
2. Select the block type from the dropdown
3. Fill in the required fields:
   - **Title**: Main heading for the block
   - **Content**: Descriptive text or subtitle
   - **Image URL**: (Optional) URL to an image
   - **Order**: Position on the page (lower numbers appear first)
   - **Visible**: Toggle to show/hide the block
   - **Custom Data**: Advanced JSON data for complex blocks

4. Click "Save" to add the block
5. Click "Save All Changes" to publish changes to the live site

### Block-Specific Fields

#### Hero Block
- `title`: Main headline
- `content`: Subtitle or description
- `image_url`: Hero image URL

#### Features Block
- `title`: Section title (e.g., "Platform Features")
- `custom_data.features`: Array of feature objects
  ```json
  {
    "features": [
      {
        "icon": "🎯",
        "title": "Feature Name",
        "description": "Feature description"
      }
    ]
  }
  ```

#### About Block
- `title`: Section title
- `custom_data.mission`: Mission statement
- `custom_data.vision`: Vision statement
- `custom_data.goals`: Array of goal strings
- `custom_data.stats`: Array of stat objects
  ```json
  {
    "stats": [
      {
        "value": "50+",
        "label": "Schools Partnered"
      }
    ]
  }
  ```

#### Testimonials Block
- `title`: Section title
- `content`: Section subtitle
- `custom_data.testimonials`: Array of testimonial objects
  ```json
  {
    "testimonials": [
      {
        "id": 1,
        "name": "Person Name",
        "role": "Their Role",
        "quote": "What they said",
        "image": "Image URL"
      }
    ]
  }
  ```

#### Roadmap Block
- `title`: Section title
- `custom_data.steps`: Array of step objects
  ```json
  {
    "steps": [
      {
        "step": 1,
        "title": "Step Title",
        "description": "Step description",
        "duration": "Time estimate"
      }
    ]
  }
  ```

### Reordering Blocks

- Use the ↑ and ↓ buttons to move blocks up or down
- The order determines the sequence on the landing page
- Lower order numbers appear first

### Hiding Blocks

- Uncheck the "Visible" checkbox to hide a block
- Hidden blocks remain in the database but don't appear on the landing page
- You can re-enable them later without recreating the content

### Deleting Blocks

- Click the "Delete" button next to a block
- Confirm the deletion
- Remember to click "Save All Changes" to apply the deletion

## For Developers

### Seeding Initial Data

To populate the landing page with default content:

```bash
cd backend
node seed-landing-page.js
```

This will create a default landing page with all 8 block types if none exists.

### Adding New Block Types

1. Add the new type to the enum in `backend/models/LandingPage.js`
2. Create a new React component in `frontend/src/components/`
3. Add the component to the `componentMap` in `frontend/src/components/LandingPage/LandingPage.js`
4. Update the dropdown in `frontend/src/components/P2LAdmin/LandingPageManager.js`

### Testing Locally

1. Start the backend: `cd backend && npm start`
2. Start the frontend: `cd frontend && npm start`
3. Visit `http://localhost:3000/` to see the landing page
4. Visit `http://localhost:3000/p2ladmin/landing-page` to manage content

## Database Schema

```javascript
{
  blocks: [{
    type: String,           // Block type (hero, features, etc.)
    title: String,          // Block title
    content: String,        // Block content/description
    image_url: String,      // Image URL
    order: Number,          // Display order
    is_visible: Boolean,    // Visibility toggle
    custom_data: Mixed      // Complex data structures
  }],
  is_active: Boolean,       // Whether this is the active landing page
  version: Number,          // Version number
  updated_by: ObjectId,     // User who last updated
  createdAt: Date,          // Creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

## Troubleshooting

### Landing page shows default content
- Check if a landing page exists in the database
- Run the seed script to create initial data
- Verify blocks have `is_visible: true`

### Changes not appearing
- Make sure you clicked "Save All Changes" in the admin panel
- Check browser console for errors
- Clear browser cache and refresh

### API errors
- Verify MongoDB connection is working
- Check backend logs for error messages
- Ensure you're logged in as P2L Admin when making changes

## Security

- Public API endpoint (`/api/public/landing`) requires no authentication - it's meant to be public
- Admin endpoints (`/api/p2ladmin/landing/*`) require P2L Admin authentication
- Only P2L Admins can create, update, or delete landing page content
- Regular users and unauthenticated visitors can only view the published landing page
