# How to Test the Question Bank Improvements

## Prerequisites

1. **Start the Application**
   ```bash
   # Install dependencies (if not already done)
   npm run install-all
   
   # Start in development mode
   npm run dev
   
   # OR start backend and frontend separately
   # Terminal 1:
   cd backend && npm run dev
   
   # Terminal 2:
   cd frontend && npm start
   ```

2. **Login as P2L Admin**
   - Navigate to the login page
   - Use P2L Admin credentials
   - You should be redirected to the P2L Admin Dashboard

3. **Navigate to Question Bank**
   - From P2L Admin Dashboard, click "Question Bank" or
   - Navigate directly to `/p2ladmin/questions`

## What to Test

### Test 1: Subject Dropdown Filter

**Steps:**
1. Look at the filter section at the top of the page
2. Find the "Subject:" label
3. Verify it's a **dropdown menu** (not a text input)
4. Click the dropdown

**Expected Results:**
- ✅ Subject filter is a dropdown select element
- ✅ Dropdown shows "All" as the first option
- ✅ Dropdown lists all unique subjects from your questions database
- ✅ Subjects are sorted alphabetically
- ✅ No empty or null values in the list

**What Changed:**
- BEFORE: Text input box where you had to type exact subject name
- AFTER: Dropdown menu showing all available subjects

---

### Test 2: Filter Questions by Subject

**Steps:**
1. Select a subject from the dropdown (e.g., "Math")
2. Observe the questions list below

**Expected Results:**
- ✅ Only questions with the selected subject are displayed
- ✅ Question count updates to show filtered results
- ✅ All displayed questions have the selected subject badge
- ✅ Selections are cleared (no questions selected)

**Try:**
- Select different subjects and verify filtering works
- Select "All" to show all questions again
- Click "Clear Filters" to reset

---

### Test 3: Select All Button

**Steps:**
1. Filter by a subject (or show all questions)
2. Look for the "☐ Select All" button in the filter section
3. Click the button

**Expected Results:**
- ✅ "Select All" button appears when there are questions
- ✅ All visible questions get checkboxes checked
- ✅ All visible question cards get blue borders
- ✅ Button text changes to "☑ Deselect All"
- ✅ "Delete Selected (X)" button appears showing count
- ✅ Only filtered questions are selected (not all questions in database)

**Important Test:**
1. Filter by "Math" (assume 3 questions)
2. Click "Select All"
3. Verify only 3 questions are selected (not all questions)
4. Change filter to "Science"
5. Verify selections are cleared
6. Verify "Select All" button is back to unselected state

---

### Test 4: Individual Question Selection

**Steps:**
1. Find a question card
2. Look for the checkbox in the top-right corner
3. Click the checkbox

**Expected Results:**
- ✅ Each question card has a checkbox in the top-right
- ✅ Clicking checkbox selects/deselects that question
- ✅ Selected question gets blue border
- ✅ Checkbox shows checkmark when selected
- ✅ "Delete Selected (X)" button appears with count
- ✅ Can select/deselect multiple questions individually

**Try:**
- Select 2-3 questions individually
- Verify count in "Delete Selected" button is correct
- Deselect one question
- Verify count decreases

---

### Test 5: Bulk Delete

**Steps:**
1. Select 2-3 questions (using checkboxes or "Select All")
2. Click the "🗑 Delete Selected (X)" button
3. Confirm in the dialog

**Expected Results:**
- ✅ "Delete Selected" button only appears when questions are selected
- ✅ Button shows correct count of selected questions
- ✅ Confirmation dialog asks "Are you sure you want to delete X question(s)?"
- ✅ Clicking "OK" deletes all selected questions
- ✅ Success message appears
- ✅ Questions list refreshes
- ✅ Deleted questions are removed from the list
- ✅ Selections are cleared

**Try:**
- Select all questions with "Select All"
- Delete them all
- Verify they're all removed

---

### Test 6: Filter Change Clears Selection

**Steps:**
1. Select some questions
2. Change the difficulty or subject filter
3. Observe selections

**Expected Results:**
- ✅ Selections are cleared when filter changes
- ✅ "Delete Selected" button disappears
- ✅ Blue borders are removed from question cards
- ✅ Question list updates based on new filter

---

### Test 7: No Questions State

**Steps:**
1. Filter by a subject that has no questions
2. Or delete all questions

**Expected Results:**
- ✅ Shows "No questions found. Create your first question!"
- ✅ "Select All" button is hidden
- ✅ "Delete Selected" button is hidden

---

### Test 8: Visual Styling

**Things to Check:**
- ✅ Selected question cards have **blue border** (#667eea)
- ✅ "Select All" button is **cyan** (#17a2b8)
- ✅ "Delete Selected" button is **red** (#dc3545)
- ✅ Checkboxes are properly styled with accent color
- ✅ Buttons are properly aligned in filter section
- ✅ Responsive design works on smaller screens

---

### Test 9: Error Handling

**Steps:**
1. Try to delete without selecting any questions
2. Disconnect network and try to filter/delete
3. Cancel the delete confirmation dialog

**Expected Results:**
- ✅ Clicking "Delete Selected" with no selections shows alert
- ✅ Network errors show appropriate error messages
- ✅ Canceling delete confirmation keeps questions selected
- ✅ No errors in browser console during normal operation

---

## Screenshots to Take

Please take screenshots of:

1. **Filter Section with Dropdown**
   - Show the subject dropdown expanded with options

2. **Selected Questions**
   - Show 2-3 questions selected with blue borders
   - Show the "Delete Selected (X)" button

3. **Select All Active**
   - Show all questions selected
   - Show "Deselect All" button state

4. **Before and After Filtering**
   - Show all questions
   - Show filtered questions by subject

---

## Known Behavior

### By Design:
- Selections clear when filters change (prevents accidental deletion)
- "Select All" only selects visible/filtered questions (not all in database)
- Blue border indicates selection (consistent with other admin panels)
- Bulk delete confirmation is required (safety measure)

### Not Included (Future Enhancements):
- Export selected questions
- Move selected questions to different subject
- Duplicate selected questions
- Advanced search/filter by question text

---

## Troubleshooting

### Subject dropdown is empty
- **Cause**: No questions in database
- **Fix**: Create some questions first

### "Select All" button doesn't appear
- **Cause**: No questions match current filters
- **Fix**: Clear filters or create questions

### Changes not visible
- **Cause**: Cache or build issue
- **Fix**: Hard refresh (Ctrl+F5) or rebuild frontend

### 500 error when fetching subjects
- **Cause**: Database connection issue
- **Fix**: Check MongoDB connection and backend logs

---

## Backend API Testing (Optional)

You can also test the backend endpoints directly:

### Get Unique Subjects
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/p2ladmin/questions-subjects
```

Expected response:
```json
{
  "success": true,
  "data": ["English", "Math", "Science"]
}
```

### Bulk Delete Questions
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ids": ["question_id_1", "question_id_2"]}' \
  http://localhost:5000/api/p2ladmin/questions/bulk-delete
```

Expected response:
```json
{
  "success": true,
  "message": "2 question(s) deleted successfully",
  "deletedCount": 2
}
```

---

## Regression Testing

Make sure existing features still work:

- ✅ Create new question
- ✅ Edit existing question
- ✅ Delete single question
- ✅ Upload CSV
- ✅ Filter by difficulty
- ✅ Clear filters
- ✅ Back to dashboard link

---

## Questions to Answer After Testing

1. Does the subject dropdown load correctly?
2. Are subjects sorted alphabetically?
3. Does filtering by subject work as expected?
4. Can you select individual questions?
5. Does "Select All" select only filtered questions?
6. Does bulk delete work correctly?
7. Are selections cleared when filters change?
8. Is the UI visually appealing and intuitive?
9. Any errors in the browser console?
10. Any performance issues with large question lists?

---

## Success Criteria

All of these should be true:

✅ Subject filter is a dropdown menu
✅ Dropdown shows all unique subjects
✅ Filtering by subject works correctly
✅ Checkboxes appear on question cards
✅ Select All selects only filtered questions
✅ Delete Selected deletes multiple questions
✅ Visual feedback (blue borders) works
✅ No browser console errors
✅ Existing features still work
✅ User experience is intuitive

---

## Next Steps After Testing

1. Take screenshots showing the new features
2. Report any bugs or issues found
3. Suggest any UX improvements
4. Confirm everything works as expected

Then this feature will be ready to merge!
