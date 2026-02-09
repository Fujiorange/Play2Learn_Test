# Deployment Checklist - License System Updates

## Pre-Deployment Review ✅

### Code Changes Verified
- [x] Backend model updated with `isDeletable` field
- [x] Backend routes protect against deleting non-deletable licenses
- [x] Frontend UI disables delete button for protected licenses
- [x] Frontend button size reduced
- [x] Seed script updated with correct Free Trial specs
- [x] All changes are minimal and surgical

### Documentation Complete
- [x] Setup guide created (`FREE_TRIAL_LICENSE_SETUP.md`)
- [x] Implementation summary created (`LICENSE_IMPLEMENTATION_SUMMARY.md`)
- [x] UI changes documented (`UI_CHANGES_VISUAL.md`)
- [x] Visual mockups created (`UI_MOCKUP_VISUAL.md`)
- [x] Test script created (`backend/test-license-protection.js`)
- [x] Init script created (`backend/init-trial-license.js`)

---

## Deployment Steps

### Step 1: Merge PR
```bash
# Review and merge the PR on GitHub
# Branch: copilot/create-default-trial-license
```

### Step 2: Deploy to Production
```bash
# If using Render, deployment happens automatically on merge
# If manual deployment needed:
git pull origin main
# Deploy using your deployment method
```

### Step 3: Initialize Free Trial License
```bash
# SSH into production server or use Render shell
cd backend
node init-trial-license.js
```

**Expected Output:**
```
🔗 Connecting to MongoDB...
✅ Connected to MongoDB
✅ Created Free Trial license successfully
   - Name: Free Trial
   - Type: free
   - Max Teachers: 1
   - Max Students: 5
   - Max Classes: 1
   - Deletable: false

✅ Free Trial license is ready!
```

### Step 4: Verify Installation
```bash
cd backend
node test-license-protection.js
```

**Expected Output:**
```
Test 1: Checking if Free Trial license exists
✅ Free Trial license found
✅ Free Trial is correctly protected from deletion

Test 2: Checking for multiple licenses of same type
✅ Found X free license(s)
✅ Found Y paid license(s)

Test 3: Checking license name uniqueness
✅ All license names are unique

Test 4: All licenses in database
🔒 Free Trial (free)
   Deletable: No (Protected)
[... other licenses ...]

✅ All tests completed!
```

---

## Post-Deployment Testing

### Test 1: Institute Registration ✓
1. Navigate to institute registration page
2. Fill in form:
   - Email: test@example.com
   - Password: Test123!
   - Institution Name: Test Institute
3. Click Register
4. **Expected**: Registration succeeds
5. **Expected**: New institute gets Free Trial license
6. **Expected**: Can log in and see institute dashboard

### Test 2: License Management UI ✓
1. Log in as P2L Admin
2. Navigate to `/p2ladmin/licenses`
3. **Expected**: "+ Create License" button is smaller (not "+ Create New License")
4. **Expected**: Free Trial license is displayed
5. **Expected**: Free Trial's delete button is grayed out/disabled
6. **Expected**: Hovering over disabled delete button shows tooltip

### Test 3: License Deletion Protection ✓
1. As P2L Admin, on `/p2ladmin/licenses`
2. Try to click disabled delete button on Free Trial
3. **Expected**: Button doesn't respond (is disabled)
4. Try to delete via API (if possible):
   ```bash
   curl -X DELETE \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-app.com/api/licenses/FREE_TRIAL_ID
   ```
5. **Expected**: Returns 403 error with message: "This license is protected and cannot be deleted"

### Test 4: Multiple Licenses Same Type ✓
1. As P2L Admin, on `/p2ladmin/licenses`
2. Click "+ Create License"
3. Create new license:
   - Name: "Free Limited"
   - Type: "Free"
   - Prices: $0
   - Limits: 2 teachers, 10 students, 2 classes
4. **Expected**: License created successfully
5. **Expected**: Now have two "free" licenses
6. Create another:
   - Name: "Basic Plus"
   - Type: "Paid"
   - Prices: $300/$3000
7. **Expected**: License created successfully
8. **Verify**: Multiple licenses of same type exist

### Test 5: License Name Uniqueness ✓
1. As P2L Admin, try to create a license with name "Free Trial"
2. **Expected**: Error: "License name already exists"
3. Try to edit an existing license to have the same name as another
4. **Expected**: Error: "License name already exists"

---

## Rollback Procedure (If Needed)

### Quick Rollback
```bash
# 1. Revert to previous version
git revert HEAD~3..HEAD

# 2. Deploy previous version
git push origin main

# 3. Manual database cleanup (optional)
# Connect to MongoDB and run:
db.licenses.updateMany({}, { $unset: { isDeletable: "" } })
```

### Database State Cleanup
If you need to remove the new field without full rollback:
```javascript
// In MongoDB shell or via script
db.licenses.updateMany(
  {},
  { $unset: { isDeletable: "" } }
)
```

---

## Monitoring

### After Deployment, Monitor:

1. **Institute Registrations**
   - Check that new registrations succeed
   - Verify they get Free Trial license
   - Monitor error logs for "Trial license not configured"

2. **License Management**
   - Verify admins can view licenses
   - Verify admins can create/edit licenses
   - Verify Free Trial cannot be deleted

3. **Database**
   - Check Free Trial license exists
   - Verify isDeletable field is set correctly
   - Monitor for duplicate license names

---

## Success Criteria

Deployment is successful if:
- [x] Free Trial license exists in database
- [x] Free Trial has `isDeletable: false`
- [x] Institute registration works without errors
- [x] UI shows smaller "+ Create License" button
- [x] UI shows disabled delete button for Free Trial
- [x] Multiple licenses can have same type
- [x] License names remain unique
- [x] Delete API returns 403 for protected licenses

---

## Troubleshooting

### Issue: "Trial license not configured" error
**Solution:**
```bash
cd backend
node init-trial-license.js
```

### Issue: Free Trial license exists but is deletable
**Solution:**
```bash
cd backend
node init-trial-license.js
# This will update the existing license
```

### Issue: Can't connect to MongoDB
**Check:**
- `MONGODB_URI` environment variable is set
- MongoDB server is running
- Network/firewall allows connection
- Credentials are correct

### Issue: Button still looks large
**Check:**
- Frontend deployed correctly
- Browser cache cleared (Ctrl+Shift+R)
- CSS file updated
- React build completed successfully

### Issue: Delete button not disabled
**Check:**
- Frontend deployed correctly
- Free Trial has `isDeletable: false` in database
- Browser cache cleared
- React build completed

---

## Support Contacts

For issues during deployment:
- Backend issues: Check `FREE_TRIAL_LICENSE_SETUP.md`
- Database issues: Run `node test-license-protection.js`
- Frontend issues: Check `UI_CHANGES_VISUAL.md`

---

## Completion Checklist

After deployment, verify:
- [ ] Merged PR to main branch
- [ ] Deployment completed successfully
- [ ] Ran `init-trial-license.js` in production
- [ ] Ran `test-license-protection.js` - all tests pass
- [ ] Tested institute registration - works
- [ ] Verified UI changes in production - correct
- [ ] Tested license deletion protection - works
- [ ] Tested creating multiple licenses of same type - works
- [ ] Updated team/stakeholders
- [ ] Closed related issues/tickets

---

## Notes

- The init script is idempotent - safe to run multiple times
- Existing licenses are not affected
- No data migration needed for existing data
- Changes are backward compatible
- No breaking changes to API

---

## Timeline

Estimated deployment time: **15-30 minutes**

1. Merge PR: 2 minutes
2. Auto-deploy (Render): 5-10 minutes
3. Run init script: 1 minute
4. Run test script: 1 minute
5. Manual testing: 10-15 minutes
6. Documentation: 1 minute

**Total: ~30 minutes maximum**

---

## Sign-off

Deployment completed by: ___________________

Date: ___________________

All tests passed: [ ] Yes [ ] No

Issues encountered: ___________________

Rollback needed: [ ] Yes [ ] No

