# Market Survey Feature - Visual Overview

## User Journey Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW                            │
└─────────────────────────────────────────────────────────────────┘

User visits /register
    ↓
Fills form with optional "How did you hear about us?" dropdown
    ↓
Selects option (e.g., "Social Media", "Friend or Colleague", etc.)
    ↓
Submits registration
    ↓
Backend saves to MarketSurvey: type='registration_referral'


┌─────────────────────────────────────────────────────────────────┐
│                 AUTO-RENEWAL DISABLE FLOW                        │
└─────────────────────────────────────────────────────────────────┘

School Admin visits /school-admin/license
    ↓
Clicks toggle to disable auto-renewal
    ↓
Modal appears with dropdown menu:
    - Switching to a different plan
    - Cost concerns
    - Not using features enough
    - Seasonal usage
    - Trying alternative solutions
    - Budget constraints
    - Prefer manual renewal
    - Other → [Text Input Required]
    ↓
Selects reason and clicks "Disable Auto-Renewal"
    ↓
Backend saves to MarketSurvey: type='auto_renewal_disable'


┌─────────────────────────────────────────────────────────────────┐
│               SUBSCRIPTION CANCELLATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

School Admin visits /school-admin/license
    ↓
Clicks "Cancel Subscription" button
    ↓
Modal appears with dropdown menu:
    - Too expensive
    - Not using enough features
    - Switching to another platform
    - Technical issues
    - Lack of support
    - School closure or restructuring
    - Just wanted to try it out
    - Other → [Text Input Required]
    ↓
Selects reason and clicks "Yes, Cancel Subscription"
    ↓
Backend saves to MarketSurvey: type='subscription_cancel'


┌─────────────────────────────────────────────────────────────────┐
│                  MARKET SURVEY DASHBOARD                         │
└─────────────────────────────────────────────────────────────────┘

P2LAdmin visits /p2ladmin/market-survey
    ↓
Dashboard displays three tabs:
    
    [Tab 1: Registration Sources]
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Social Media          ████████████ 35% (120)
    Friend or Colleague   ██████████   28% (96)
    Search Engine         ████████     21% (72)
    Advertisement         ████         11% (38)
    Other                 ██            5% (17)
    
    [Tab 2: Auto-Renewal Disable Reasons]
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Cost concerns         ████████████ 42% (18)
    Seasonal usage        ██████████   29% (12)
    Budget constraints    ████████     18% (8)
    Other                 ████         11% (5)
    
    [Tab 3: Subscription Cancellations]
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Too expensive         ████████████████ 45% (23)
    Switching platform    ██████████       28% (14)
    Not using features    ████████         18% (9)
    Other                 ████             9% (5)
```

## Database Schema

```
MarketSurvey Collection
┌────────────────────────────────────────────────────┐
│ _id: ObjectId                                      │
│ type: String                                       │
│   ├─ 'registration_referral'                       │
│   ├─ 'auto_renewal_disable'                        │
│   └─ 'subscription_cancel'                         │
│                                                     │
│ reason: String (dropdown selection)                │
│ otherReason: String (if reason='other')            │
│                                                     │
│ schoolId: ObjectId (ref: School)                   │
│ schoolName: String                                 │
│ userEmail: String                                  │
│                                                     │
│ createdAt: Date                                    │
└────────────────────────────────────────────────────┘
```

## API Endpoints

```
POST /api/mongo/school-admin/toggle-auto-renewal
Request Body: {
  autoRenew: Boolean,
  reason: String,          // required if autoRenew=false
  otherReason: String      // required if reason='other'
}

POST /api/mongo/school-admin/cancel-subscription
Request Body: {
  reason: String,          // required
  otherReason: String      // required if reason='other'
}

POST /api/mongo/auth/register-school-admin
Request Body: {
  email: String,
  password: String,
  institutionName: String,
  referralSource: String   // optional
}

GET /api/p2ladmin/market-survey
Response: {
  success: true,
  data: {
    registrationReferrals: [{reason, count}, ...],
    autoRenewalDisableReasons: [{reason, count}, ...],
    subscriptionCancelReasons: [{reason, count}, ...],
    total: Number,
    recentSurveys: [...]
  }
}
```

## Component Structure

```
Frontend Components
├── SchoolAdmin/
│   └── SchoolLicenseView.js
│       ├── Auto-renewal toggle modal with dropdown
│       └── Cancel subscription modal with dropdown
│
└── P2LAdmin/
    ├── P2LAdminDashboard.js (added Market Survey link)
    ├── MarketSurvey.js (new component)
    │   ├── Tabbed interface
    │   ├── Bar charts with percentages
    │   └── Summary statistics
    └── MarketSurvey.css (styling)

Backend Components
├── models/
│   └── MarketSurvey.js (new model)
│
└── routes/
    ├── schoolAdminRoutes.js (modified)
    ├── mongoAuthRoutes.js (modified)
    └── p2lAdminRoutes.js (modified)
```

## Validation Flow

```
Frontend Validation
    ↓
    ├─ Dropdown must have selection
    ├─ "Other" requires text input
    └─ Display error messages in modal
    
    ↓ (if valid)

Backend Validation
    ↓
    ├─ Verify reason is provided
    ├─ Verify otherReason if reason='other'
    ├─ Return 400 error if invalid
    └─ Descriptive error messages
    
    ↓ (if valid)

Database Save
    ↓
    └─ Create MarketSurvey document
```

## User Interface Preview

### Auto-Renewal Disable Modal
```
┌────────────────────────────────────────────┐
│  ⚠️ Disable Auto-Renewal?                  │
├────────────────────────────────────────────┤
│  Are you sure you want to disable          │
│  auto-renewal? Your subscription will      │
│  end on 10/03/2026.                        │
│                                             │
│  Please tell us why you're disabling       │
│  auto-renewal: *                           │
│  ┌──────────────────────────────────────┐  │
│  │ [Select a reason ▼]                  │  │
│  │  • Switching to a different plan     │  │
│  │  • Cost concerns                     │  │
│  │  • Not using features enough         │  │
│  │  • Seasonal usage                    │  │
│  │  • Trying alternative solutions      │  │
│  │  • Budget constraints                │  │
│  │  • Prefer manual renewal             │  │
│  │  • Other                             │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [if "Other" selected]                     │
│  ┌──────────────────────────────────────┐  │
│  │ Please provide more details...       │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [Keep Auto-Renewal] [Disable Auto-Renewal]│
└────────────────────────────────────────────┘
```

### Market Survey Dashboard
```
┌────────────────────────────────────────────────────────────┐
│  📊 Market Survey                    [← Back to Dashboard] │
│  User feedback and registration insights                   │
├────────────────────────────────────────────────────────────┤
│  [Registration Sources] [Auto-Renewal] [Cancellations]     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  How did schools hear about us?                            │
│                                                             │
│  Social Media          ████████████ 120 (35.0%)            │
│  Friend or Colleague   ██████████    96 (28.0%)            │
│  Search Engine         ████████      72 (21.0%)            │
│  Advertisement         ████          38 (11.0%)            │
│  Other                 ██            17 ( 5.0%)            │
│                                                             │
│  Total Responses: 343                                      │
│                                                             │
├────────────────────────────────────────────────────────────┤
│  📈 Total Survey       🌐 Registration    🔄 Auto-Renewal  │
│     Responses              Sources           Feedback      │
│     543                    343 responses     43 responses  │
│                                                             │
│  ❌ Cancellation                                            │
│     Feedback                                               │
│     51 responses                                           │
└────────────────────────────────────────────────────────────┘
```

---

This implementation provides a complete, user-friendly system for collecting
and analyzing market feedback across three key touchpoints in the user journey.
