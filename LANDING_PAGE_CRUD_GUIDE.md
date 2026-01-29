# Landing Page CRUD Guide

## Overview

The P2L Admin Landing Page Manager now provides comprehensive CRUD (Create, Read, Update, Delete) functionality for all landing page content. Admins can easily modify all aspects of the landing page including complex nested data structures.

## Accessing the Landing Page Manager

1. Log in as a P2L Admin at `/p2ladmin`
2. Navigate to the Dashboard
3. Click on "Landing Page Manager" or go to `/p2ladmin/landing-page`

## Features

### 1. View All Landing Page Blocks

The main page displays all landing page blocks in order with:
- **Block Type Badge**: Shows the type of block (HERO, FEATURES, etc.)
- **Title and Content Preview**: Quick overview of the block content
- **Custom Data Summary**: Shows counts for complex data (e.g., "3 features", "4 testimonials")
- **Visibility Indicator**: Hidden blocks are shown with reduced opacity and a "Hidden" badge
- **Action Buttons**: Reorder (↑↓), Edit, and Delete

### 2. Add New Block

Click the **"+ Add Block"** button to create a new block:
1. Select the block type from the dropdown
2. Fill in basic fields (Title, Content, Image URL)
3. Set visibility (checkbox)
4. Fill in type-specific custom data (see details below)
5. Click "Add" to create the block

### 3. Edit Existing Block

Click the **"Edit"** button on any block card to modify it:
1. All fields are pre-populated with current values
2. Modify any field as needed
3. Click "Update" to save changes

### 4. Delete Block

Click the **"Delete"** button on any block card. A confirmation dialog will appear to prevent accidental deletion.

### 5. Reorder Blocks

Use the **↑** and **↓** buttons to change the order of blocks on the landing page.

### 6. Save Changes

After making changes (add, edit, delete, reorder), click the **"💾 Save Changes"** button in the header to persist all changes to the database.

## Block Types and Custom Data

### Hero Block
**Purpose**: Main banner/header of the landing page

**Fields**:
- Title
- Content (tagline)
- Image URL
- Visibility

**Custom Data**: None (uses basic fields only)

### Features Block
**Purpose**: Display platform features with icons

**Custom Data Structure**:
- **Features Array**: Each feature contains:
  - Icon/Emoji (e.g., 🎯, 🏆, 📊)
  - Title
  - Description

**Editor Features**:
- Add unlimited features with "+ Add Feature" button
- Remove individual features
- Each feature is displayed in its own card

**Example**:
```javascript
{
  features: [
    {
      icon: '🎯',
      title: 'Adaptive Learning Paths',
      description: 'AI-powered personalized learning journeys...'
    },
    {
      icon: '🏆',
      title: 'Incentive System',
      description: 'Gamified rewards and recognition...'
    }
  ]
}
```

### About Block
**Purpose**: Display company mission, vision, goals, and statistics

**Custom Data Structure**:
- **Mission**: Text area for mission statement
- **Vision**: Text area for vision statement
- **Goals**: Array of goal strings
- **Stats**: Array of statistics with:
  - Value (e.g., "50+")
  - Label (e.g., "Schools Partnered")

**Editor Features**:
- Simple text areas for mission and vision
- Add/remove goals with inline editor
- Add/remove statistics with paired value/label fields

**Example**:
```javascript
{
  mission: 'To transform education...',
  vision: 'A world where every learner...',
  goals: [
    'Increase student engagement by 70%',
    'Improve learning outcomes by 50%'
  ],
  stats: [
    { value: '50+', label: 'Schools Partnered' },
    { value: '10,000+', label: 'Active Students' }
  ]
}
```

### Roadmap Block
**Purpose**: Display learning journey or product roadmap steps

**Custom Data Structure**:
- **Steps Array**: Each step contains:
  - Step Number
  - Title
  - Description
  - Duration

**Editor Features**:
- Add steps with auto-incrementing step numbers
- Remove steps individually
- Full control over all step fields

**Example**:
```javascript
{
  steps: [
    {
      step: 1,
      title: 'Assessment & Onboarding',
      description: 'Initial student assessment...',
      duration: '1-2 weeks'
    },
    {
      step: 2,
      title: 'Personalized Learning Path',
      description: 'AI creates customized...',
      duration: 'Ongoing'
    }
  ]
}
```

### Testimonials Block
**Purpose**: Display user testimonials and reviews

**Custom Data Structure**:
- **Testimonials Array**: Each testimonial contains:
  - ID (auto-incremented)
  - Name
  - Role (e.g., "Parent of a 5-year-old")
  - Quote
  - Image URL

**Editor Features**:
- Add unlimited testimonials
- Remove individual testimonials
- Each testimonial has its own card with all fields

**Example**:
```javascript
{
  testimonials: [
    {
      id: 1,
      name: 'Alex Johnson',
      role: 'Parent of a 5-year-old',
      quote: 'Play2Learn has transformed my child\'s learning...',
      image: 'https://via.placeholder.com/100x100?text=AJ'
    }
  ]
}
```

### Pricing, Contact, and Footer Blocks
**Purpose**: Flexible blocks for various content types

**Custom Data Structure**: Free-form JSON

**Editor Features**:
- JSON text editor with syntax highlighting
- Real-time JSON validation
- Full flexibility for any data structure

**Usage**:
1. Edit the JSON directly in the text area
2. Ensure valid JSON format
3. The frontend landing page component can interpret the JSON as needed

**Example for Contact**:
```json
{
  "email": "contact@play2learn.com",
  "phone": "+1 (555) 123-4567",
  "address": "123 Education St, Learning City, LC 12345"
}
```

## Best Practices

### 1. Content Organization
- Keep blocks in logical order (Hero → Features → About → Testimonials → Pricing → Contact → Footer)
- Use the reorder buttons to maintain proper flow
- Hide blocks that are not ready instead of deleting them

### 2. Image URLs
- Use HTTPS URLs for security
- Optimize images before uploading to external hosting
- Consider using placeholder services (e.g., placeholder.com) for development

### 3. Visibility Management
- Use the visibility checkbox to hide blocks without deleting them
- Hidden blocks won't appear on the public landing page
- This is useful for A/B testing or seasonal content

### 4. Regular Saves
- Click "Save Changes" frequently to avoid losing work
- The system saves all blocks together, not individually
- There's no auto-save, so remember to save manually

### 5. Custom Data Validation
- For JSON editors (Pricing, Contact, Footer), ensure valid JSON syntax
- The editor will show errors if JSON is invalid
- Test your changes on the frontend landing page after saving

## Troubleshooting

### Changes Not Appearing on Landing Page
1. Ensure you clicked "Save Changes" button
2. Check browser console for errors
3. Refresh the public landing page
4. Verify the block is marked as visible

### Lost Data After Page Refresh
- The Landing Page Manager loads data from the database on each visit
- If you didn't save before refreshing, changes are lost
- Always save before navigating away

### Invalid JSON Error
- For Pricing, Contact, and Footer blocks, ensure JSON is properly formatted
- Use online JSON validators if needed
- Common issues: missing quotes, trailing commas, unescaped characters

### Block Not Displaying
- Check if the block is marked as visible
- Verify the block has required content
- Ensure the frontend LandingPage component handles your block type

## Technical Details

### API Endpoints Used
- `GET /api/p2ladmin/landing` - Fetch landing page data
- `POST /api/p2ladmin/landing` - Save landing page (creates new version)
- `PUT /api/p2ladmin/landing/:id` - Update existing landing page
- `DELETE /api/p2ladmin/landing` - Delete landing page

### Database Schema
Each landing page document contains:
- `blocks`: Array of block objects
- `is_active`: Boolean indicating active version
- `version`: Version number
- `updated_by`: Reference to admin who made changes
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Supported Block Types
The schema enforces these block types:
- `hero`
- `features`
- `about`
- `roadmap`
- `testimonials`
- `pricing`
- `contact`
- `footer`

## Future Enhancements

Potential improvements that could be added:
1. **Image Upload**: Direct image upload instead of URL input
2. **Live Preview**: See changes before saving
3. **Version History**: View and restore previous versions
4. **Drag-and-Drop Reordering**: More intuitive reordering
5. **Rich Text Editor**: WYSIWYG editor for content fields
6. **Block Templates**: Pre-configured block templates
7. **Import/Export**: JSON import/export for blocks
8. **Multi-language Support**: Manage translations

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify your P2L Admin credentials
3. Contact technical support with error details
