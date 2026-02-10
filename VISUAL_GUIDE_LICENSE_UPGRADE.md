# Visual Demonstration Guide - License Upgrade Feature

## Overview
This document provides a step-by-step visual walkthrough of the license upgrade feature. While actual screenshots cannot be provided in this environment, this guide describes exactly what users will see at each step.

---

## Step 1: School License View - Initial State

**URL**: `/school-admin/license`

**What You'll See**:

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                         │
│                                                              │
│ License Information                    [Free Trial]         │
│                                   [⬆️ Upgrade License]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 📅 Free License Active                                 │  │
│ │ Your license expires in 28 days.   [Upgrade Now]      │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ Free trial with basic features - 1 teacher, 5 students...   │
│                                                              │
│ Current Usage                                                │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│ │ TEACHERS │  │ STUDENTS │  │ CLASSES  │                  │
│ │ 👨‍🏫       │  │ 👨‍🎓      │  │ 🏫       │                  │
│ │  0 / 1   │  │  0 / 5   │  │  0 / 1   │                  │
│ │ ▓░░░░░░░░│  │ ▓░░░░░░░░│  │ ▓░░░░░░░░│                  │
│ └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Gray "Back to Dashboard" button (top left)
- Green "Free Trial" badge
- Green "Upgrade License" button (top right)
- Blue expiry notice with "Upgrade Now" button
- Three usage cards showing 0% usage
- Green progress bars

---

## Step 2: Clicking "Upgrade License" Button

**Action**: User clicks the green "⬆️ Upgrade License" button

**What Happens**:
- Modal overlay appears (semi-transparent dark background)
- White modal box slides in from center
- License plans are fetched from database via API call

---

## Step 3: License Selection Modal

**What You'll See**:

```
Background is dimmed with modal overlay

┌─────────────────────────────────────────────────────────────┐
│                Upgrade Your License                      ×  │
│                                                              │
│ Choose a plan that fits your needs:                         │
│                                                              │
│ ┌─────────────────────────────────────┐                    │
│ │  Monthly    |   Yearly (Save 17%)   │ ← Toggle buttons  │
│ │  [Active]   |                       │                    │
│ └─────────────────────────────────────┘                    │
│                                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ Basic Plan   │ │ Standard     │ │ Premium Plan │        │
│ │              │ │ Plan         │ │              │        │
│ │ $250.00      │ │ $500.00      │ │ $1000.00     │        │
│ │ /month       │ │ /month       │ │ /month       │        │
│ ├──────────────┤ ├──────────────┤ ├──────────────┤        │
│ │ Perfect for  │ │ Ideal for    │ │ Unlimited    │        │
│ │ small to     │ │ growing      │ │ features for │        │
│ │ medium       │ │ educational  │ │ large        │        │
│ │ schools      │ │ institutions │ │ organizations│        │
│ │              │ │              │ │              │        │
│ │ 👨‍🏫 50       │ │ 👨‍🏫 100     │ │ 👨‍🏫 250     │        │
│ │ Teachers     │ │ Teachers     │ │ Teachers     │        │
│ │ 👨‍🎓 500      │ │ 👨‍🎓 1000    │ │ 👨‍🎓 2500    │        │
│ │ Students     │ │ Students     │ │ Students     │        │
│ │ 🏫 100       │ │ 🏫 200       │ │ 🏫 500       │        │
│ │ Classes      │ │ Classes      │ │ Classes      │        │
│ │              │ │              │ │              │        │
│ │[Select Plan] │ │[Select Plan] │ │[Select Plan] │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│                                             [Cancel]         │
└─────────────────────────────────────────────────────────────┘
```

**Interactive Elements**:
- **Billing Toggle**: Click to switch between Monthly/Yearly
  - Monthly is selected by default (white background)
  - Yearly option shows "Save 17%"
- **Plan Cards**: Hover shows border highlight in green
- **Select Plan**: Green buttons with hover effect (slight lift)
- **Cancel**: Gray button to close modal

**Price Changes**:
When "Yearly" is selected:
- Basic: $2500.00 /year
- Standard: $5000.00 /year
- Premium: $10000.00 /year

---

## Step 4: Selecting a Plan

**Action**: User clicks "Select Plan" on Basic Plan

**What Happens**:
- Plan selection screen slides out
- Payment form slides in
- Selected plan details shown at top

---

## Step 5: Payment Form

**What You'll See**:

```
┌─────────────────────────────────────────────────────────────┐
│                Payment Information                       ×  │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Selected Plan: Basic Plan                              │  │
│ │ Billing Cycle: Monthly                                 │  │
│ │ ─────────────────────────────────────────────────────  │  │
│ │ Amount: $250.00                                        │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ Card Number *                                                │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ [                                                     ]│  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌──────────────────────┐  ┌──────────────────────┐         │
│ │ Expiry Date *        │  │ CVV *                │         │
│ │ ┌──────────────────┐ │  │ ┌──────────────────┐ │         │
│ │ │ MM/YY            │ │  │ │ 123              │ │         │
│ │ └──────────────────┘ │  │ └──────────────────┘ │         │
│ └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🔒 This is a simulated payment for demonstration      │  │
│ │    purposes. No actual charges will be made.          │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│                                 [Back] [Complete Payment]   │
└─────────────────────────────────────────────────────────────┘
```

**Form Behavior**:

**Card Number Field**:
- As you type: `1234567890123456`
- Automatically formatted: `1234 5678 9012 3456`
- Border changes from gray to green on focus
- Green glow shadow when focused

**Expiry Date Field**:
- As you type: `1225`
- Automatically formatted: `12/25`
- Validates month (01-12)
- Checks if date is not expired

**CVV Field**:
- Maximum 3 digits
- Only accepts numbers
- No formatting

**Info Box**:
- Light blue background
- Lock icon (🔒)
- Clear message about simulation

---

## Step 6: Form Validation Errors

**Example**: User enters invalid data

**What You'll See**:

```
Card Number *
┌───────────────────────────────────────────────────────┐
│ 123                                                   │ ← Red border
└───────────────────────────────────────────────────────┘
⚠️ Card number must be 16 digits                        ← Red error text

┌──────────────────────┐  ┌──────────────────────┐
│ Expiry Date *        │  │ CVV *                │
│ ┌──────────────────┐ │  │ ┌──────────────────┐ │
│ │ 01/20            │ │  │ │ 12               │ │ ← Red borders
│ └──────────────────┘ │  │ └──────────────────┘ │
│ ⚠️ Card has expired  │  │ ⚠️ CVV must be 3    │
│                      │  │    digits            │
└──────────────────────┘  └──────────────────────┘
```

**Error States**:
- Input field border turns red
- Red error icon (⚠️)
- Red error message below field
- Submit button remains enabled
- Clicking submit validates all fields again

---

## Step 7: Valid Form Entry

**Example**: User enters valid data

**Card Number**: `1234567890123456` → Displays as `1234 5678 9012 3456`  
**Expiry Date**: `1230` → Displays as `12/30`  
**CVV**: `123`

All borders return to gray (or green when focused). No error messages shown.

---

## Step 8: Processing Payment

**Action**: User clicks "Complete Payment" with valid data

**What You'll See**:

```
Card Number *
┌───────────────────────────────────────────────────────┐
│ 1234 5678 9012 3456              [DISABLED]          │ ← Grayed out
└───────────────────────────────────────────────────────┘

Expiry Date *              CVV *
┌──────────────────┐      ┌──────────────────┐
│ 12/30 [DISABLED] │      │ 123 [DISABLED]   │ ← Grayed out
└──────────────────┘      └──────────────────┘

                          [Back]  [Processing...]
                          ^^^^^^  ^^^^^^^^^^^^^^^^
                          Gray    Green but disabled
                          (disabled)
```

**Processing State**:
- All input fields become disabled (grayed out, no cursor)
- "Back" button disabled
- "Complete Payment" button shows "Processing..."
- Button shows loading state (disabled, no hover effect)
- User cannot close modal during processing

**Duration**: Approximately 1 second

---

## Step 9: Success Message

**What You'll See**:

Browser shows native alert dialog:

```
┌─────────────────────────────────────────────────────┐
│  🎉 Payment successful! Your license has been       │
│     upgraded.                                        │
│                                                      │
│                                         [ OK ]       │
└─────────────────────────────────────────────────────┘
```

**What Happens**:
1. Alert appears
2. User clicks "OK"
3. Modal closes automatically
4. License information refreshes

---

## Step 10: Updated License View

**URL**: `/school-admin/license` (still on same page)

**What You'll See**:

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                         │
│                                                              │
│ License Information                    [Basic Plan]         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Perfect for small to medium schools                         │
│                                                              │
│ Current Usage                                                │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│ │ TEACHERS │  │ STUDENTS │  │ CLASSES  │                  │
│ │ 👨‍🏫       │  │ 👨‍🎓      │  │ 🏫       │                  │
│ │  0 / 50  │  │  0 / 500 │  │  0 / 100 │  ← Increased!   │
│ │ ░░░░░░░░░│  │ ░░░░░░░░░│  │ ░░░░░░░░░│                  │
│ └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

**Changes**:
- Badge changed from "Free Trial" (green) to "Basic Plan" (blue)
- Expiry notice removed (paid licenses don't expire)
- Limits increased:
  - Teachers: 1 → 50
  - Students: 5 → 500
  - Classes: 1 → 100
- "Upgrade License" button removed (already on paid plan)
- Description updated to plan's description

---

## Platform Admin View

**URL**: `/p2ladmin/schools`

School admins can verify the update is also visible to platform admins:

**What Platform Admins See**:

```
School List
┌─────────────────────────────────────────────────────────────┐
│ School Name        | License      | Teachers | Students     │
├─────────────────────────────────────────────────────────────┤
│ ABC High School    | Basic Plan   | 0/50     | 0/500       │
│                    | ^^^^^^^^^^^                            │
│                    | Updated!                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Reference

### Buttons
- **Back to Dashboard**: Light gray (#f3f4f6) with dark gray border
- **Upgrade License**: Green gradient (#10b981 → #059669)
- **Select Plan**: Green gradient (#10b981 → #059669)
- **Complete Payment**: Green gradient (#10b981 → #059669)
- **Cancel/Back**: Light gray (#f3f4f6)

### Badges
- **Free Trial**: Green gradient
- **Basic/Standard/Premium**: Blue gradient (#3b82f6 → #2563eb)

### Form States
- **Default**: Gray border (#e5e7eb)
- **Focus**: Green border (#10b981) with green glow
- **Error**: Red border (#ef4444)
- **Disabled**: Light gray background (#f3f4f6)

### Messages
- **Info (Simulation notice)**: Blue background (#dbeafe)
- **Success**: Green background
- **Error**: Red background (#fef2f2)
- **Warning (Expiry)**: Yellow background (#fef3c7)

### Progress Bars
- **< 70% usage**: Green (#10b981)
- **70-90% usage**: Orange (#f59e0b)
- **> 90% usage**: Red (#ef4444)

---

## Responsive Behavior

### Desktop (> 768px)
- License plans shown in a row (up to 3 columns)
- Payment form fields side-by-side (expiry + CVV)
- All elements at comfortable spacing

### Mobile (< 768px)
- License plans stacked vertically
- Payment form fields stacked vertically
- Buttons full-width
- Larger touch targets
- Adjusted padding

---

## Accessibility

- All form fields have visible labels
- Error messages are clearly associated with fields
- Color is not the only indicator (icons + text)
- Keyboard navigation works throughout
- Focus states are visible
- Screen reader compatible

---

## Testing This Feature

1. **Login** as a School Admin with a Free Trial license
2. **Navigate** to `/school-admin/license`
3. **Click** "← Back to Dashboard" to verify navigation
4. **Navigate** back to `/school-admin/license`
5. **Click** "⬆️ Upgrade License"
6. **Toggle** between Monthly and Yearly billing
7. **Click** "Select Plan" on any license
8. **Enter invalid data**:
   - Card: `123`
   - Expiry: `01/20`
   - CVV: `12`
9. **Click** "Complete Payment" - See validation errors
10. **Enter valid data**:
    - Card: `1234567890123456`
    - Expiry: `12/30`
    - CVV: `123`
11. **Click** "Complete Payment"
12. **Wait** for processing (1 second)
13. **Click** "OK" on success alert
14. **Verify** license updated with new limits

---

**End of Visual Guide**

For more information, see:
- LICENSE_UPGRADE_GUIDE.md (detailed implementation guide)
- IMPLEMENTATION_SUMMARY_LICENSE_UPGRADE.md (overview)
