# Question Bank Filter & Bulk Delete Improvements

## Overview
This document describes the improvements made to the Question Bank feature in the P2L Admin panel.

## Changes Made

### 1. Subject Filter Dropdown
**Before:** The subject filter was a text input field that required exact text matching.
**After:** The subject filter is now a dropdown menu that shows all available subjects in the database.

**Benefits:**
- Easier to use - no need to remember exact subject names
- More accurate filtering - select from existing subjects
- Better user experience with visual feedback

### 2. Bulk Delete with Select All
**New Features:**
- ✅ Checkbox on each question card for selection
- ✅ "Select All" button that selects all currently filtered questions
- ✅ "Deselect All" button to clear all selections
- ✅ "Delete Selected" button to delete multiple questions at once
- ✅ Selected questions are highlighted with a blue border

**Benefits:**
- Faster deletion of multiple questions
- Select All only affects filtered questions (respects current filters)
- Visual feedback shows which questions are selected
- Confirmation dialog before bulk deletion

## Technical Implementation

### Backend Changes

#### 1. New Endpoint: Get Unique Subjects
```javascript
GET /api/p2ladmin/questions-subjects
```
- Returns a sorted list of all unique subjects from the question database
- Filters out empty/null values
- Used to populate the subject dropdown

#### 2. New Endpoint: Bulk Delete Questions
```javascript
POST /api/p2ladmin/questions/bulk-delete
Body: { ids: [array of question IDs] }
```
- Accepts an array of question IDs
- Deletes all questions with matching IDs in a single database operation
- Returns the count of deleted questions

### Frontend Changes

#### 1. QuestionBank Component (`QuestionBank.js`)
**New State Variables:**
- `subjects` - stores the list of available subjects
- `selectedQuestions` - tracks which questions are currently selected

**New Functions:**
- `fetchSubjects()` - fetches unique subjects from the API
- `handleBulkDelete()` - deletes multiple selected questions
- `handleSelectAll()` - toggles selection of all filtered questions
- `handleQuestionSelect(id)` - toggles individual question selection

**Updated UI Elements:**
- Subject filter changed from text input to select dropdown
- Added "Select All" button in filters section
- Added "Delete Selected" button (shows count of selected questions)
- Added checkbox to each question card
- Selected question cards have highlighted border

#### 2. Service Layer (`p2lAdminService.js`)
**New Functions:**
- `getQuestionSubjects()` - fetches unique subjects
- `bulkDeleteQuestions(ids)` - sends bulk delete request

#### 3. Styling (`QuestionBank.css`)
**New Styles:**
- `.btn-select-all` - styling for select all button (cyan color)
- `.btn-delete-selected` - styling for delete selected button (red color)
- `.question-card.selected` - highlighted border for selected questions
- `.question-selection` - checkbox positioning
- `.question-checkbox` - checkbox styling with accent color

## User Experience

### Filtering by Subject
1. Navigate to P2L Admin → Questions
2. Click the "Subject" dropdown
3. Select a subject from the list (or "All" to show all questions)
4. Questions are automatically filtered

### Bulk Delete Workflow
1. Filter questions (optional) - e.g., select "Math" from subject dropdown
2. Click "Select All" to select all visible questions
   - Or individually check questions you want to delete
3. Click "Delete Selected (X)" button where X is the count
4. Confirm deletion in the dialog
5. Selected questions are deleted

### Key Features
- **Smart Select All**: Only selects questions that match current filters
- **Visual Feedback**: Selected questions have a blue highlighted border
- **Clear Indication**: Delete button shows count of selected items
- **Auto-clear**: Selections are cleared when filters change
- **Confirmation**: Asks for confirmation before deleting

## Testing

### Unit Tests Added
- Test that component renders without crashing
- Test that subject dropdown filter is rendered
- Test that select all button appears when questions are loaded

### Manual Testing Checklist
- [ ] Subject dropdown shows all unique subjects
- [ ] Filtering by subject works correctly
- [ ] Select All button selects all filtered questions
- [ ] Individual checkboxes work correctly
- [ ] Delete Selected button deletes selected questions
- [ ] Selections clear when filters change
- [ ] Confirmation dialog appears before deletion
- [ ] Visual highlighting works for selected questions

## Code Quality
- ✅ No syntax errors
- ✅ Follows existing code patterns
- ✅ Minimal changes to existing functionality
- ✅ Backwards compatible with existing API
- ✅ Proper error handling
- ✅ User-friendly alerts and confirmations

## Files Modified
1. `backend/routes/p2lAdminRoutes.js` - Added 2 new endpoints
2. `frontend/src/services/p2lAdminService.js` - Added 2 new service functions
3. `frontend/src/components/P2LAdmin/QuestionBank.js` - Updated component logic and UI
4. `frontend/src/components/P2LAdmin/QuestionBank.css` - Added new styles
5. `frontend/src/components/P2LAdmin/QuestionBank.test.js` - Added tests

## Visual Changes

### Before:
- Subject filter: Text input field
- No bulk delete capability
- No selection mechanism

### After:
- Subject filter: Dropdown menu with all available subjects
- Select All button in filter bar
- Delete Selected button (shows when items selected)
- Checkboxes on each question card
- Visual highlighting for selected questions
- Count display on delete button

## Security Considerations
- ✅ All endpoints require P2L Admin authentication
- ✅ Bulk delete validates input is an array
- ✅ Individual question deletion still requires confirmation
- ✅ No SQL injection risk (using Mongoose ORM)

## Performance Considerations
- ✅ Subject list is cached in component state
- ✅ Only fetched once per component mount or filter change
- ✅ Bulk delete uses single database operation
- ✅ More efficient than multiple individual deletes

## Future Enhancements (Not Implemented)
- Advanced search (text search across question content)
- Topic dropdown filter
- Export selected questions to CSV
- Duplicate selected questions
- Move questions between subjects
