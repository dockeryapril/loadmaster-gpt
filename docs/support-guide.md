# LoadMaster GPT - Technical Support Guide

**Version:** 2.0  
**Last Updated:** January 2024  
**Target Audience:** Support Team, Troubleshooters, Technical Staff

## Table of Contents
1. [Support Overview](#support-overview)
2. [Common Issues](#common-issues)
3. [Diagnostic Procedures](#diagnostic-procedures)
4. [Rate Limiting Issues](#rate-limiting-issues)
5. [OCR Troubleshooting](#ocr-troubleshooting)
6. [Authentication Problems](#authentication-problems)
7. [Performance Issues](#performance-issues)
8. [Billing & Subscription Support](#billing-subscription-support)
9. [Feature Usage Questions](#feature-usage-questions)
10. [Escalation Procedures](#escalation-procedures)

---

## Support Overview

### Support Tier Structure

**Free User Support:**
- **Response Time:** 48-72 hours
- **Channels:** Email only (support@loadmastergpt.com)
- **Scope:** Bug reports, basic functionality, account issues
- **Escalation:** Technical issues to development team

**Pro User Support:**
- **Response Time:** 24 hours guaranteed
- **Channels:** Priority email queue, scheduled calls
- **Scope:** All Free support plus feature training, optimization
- **Escalation:** Direct access to senior technical staff

### Support Metrics & Goals
- **First Response Time:** Free 48hrs, Pro 24hrs
- **Resolution Rate:** 85% resolved within first contact
- **Customer Satisfaction:** Target 4.5/5.0 rating
- **Escalation Rate:** <15% of tickets escalated to development

### Ticket Categories & Volume
**Common Issue Distribution:**
- OCR/Processing Issues: 40%
- Authentication Problems: 25%
- Billing & Subscriptions: 20%
- Feature Usage Questions: 15%

---

## Common Issues

### Issue Priority Classification

**P1 - Critical (Response: 2 hours)**
- Complete system outage
- Data loss or corruption
- Security vulnerabilities
- Payment processing failures

**P2 - High (Response: 8 hours)**
- OCR processing failures affecting all users
- Authentication system issues
- Performance degradation
- Subscription activation problems

**P3 - Medium (Response: 24-48 hours)**
- Individual user OCR accuracy issues
- Feature usage questions
- Minor UI/UX problems
- CSV export issues

**P4 - Low (Response: 72+ hours)**
- Feature enhancement requests
- Documentation updates
- Cosmetic issues
- General usage questions

### Most Common Support Tickets

**1. OCR Accuracy Issues (25% of tickets)**
- **Symptoms:** Fields not detected correctly, low accuracy
- **Common Causes:** Poor image quality, unsupported document types
- **Resolution:** Image quality guidance, manual correction training

**2. Rate Limit Exceeded (15% of tickets)**
- **Symptoms:** "Daily limit reached" error, upload blocked
- **Common Causes:** Free user exceeding 4/week limit
- **Resolution:** Explain limits, offer Pro upgrade, manual entry option

**3. Login/Authentication Failures (12% of tickets)**
- **Symptoms:** Cannot sign in, "Invalid credentials" error
- **Common Causes:** Typos, unverified email, forgotten password
- **Resolution:** Password reset, email verification, account verification

**4. Calculation Questions (10% of tickets)**
- **Symptoms:** "RPM seems wrong", confusion about Pro features
- **Common Causes:** Misunderstanding business setup, incorrect input
- **Resolution:** Business setup review, calculation explanation

**5. Upgrade/Billing Issues (8% of tickets)**
- **Symptoms:** Payment failed, features not activated, cancellation
- **Common Causes:** Payment method issues, Stripe sync delays
- **Resolution:** Payment method update, manual activation, billing support

---

## Diagnostic Procedures

### Initial Ticket Triage

**Information Gathering Checklist:**
```
□ User email and account status (Free/Pro)
□ Browser and operating system
□ Error message (exact text)
□ Steps to reproduce issue
□ Frequency (one-time or recurring)
□ Recent changes (settings, browser, etc.)
□ Screenshots of error/issue
```

**Standard Response Template:**
```
Subject: LoadMaster Support - [Ticket #12345] - [Brief Issue Description]

Hello [Name],

Thank you for contacting LoadMaster GPT support. I understand you're experiencing [brief issue summary].

To help resolve this quickly, I've reviewed your account and [initial findings].

[Specific troubleshooting steps or solution]

If this doesn't resolve the issue, please reply with:
- The exact error message you see
- A screenshot of the problem
- Your browser and device information

We're here to help!
Best regards,
[Support Agent Name]
LoadMaster GPT Support Team
```

### Account Information Lookup

**Supabase Admin Panel Access:**
```sql
-- User account lookup
SELECT 
  auth.users.email,
  auth.users.created_at as signup_date,
  auth.users.email_confirmed_at,
  user_settings.weekly_upload_count,
  user_settings.week_start_date,
  business_setup.equipment_type
FROM auth.users
LEFT JOIN user_settings ON auth.users.id = user_settings.user_id
LEFT JOIN business_setup ON auth.users.id = business_setup.user_id
WHERE auth.users.email = 'user@example.com';
```

**Usage Statistics Query:**
```sql
-- Recent usage analysis
SELECT 
  COUNT(*) as total_loads,
  AVG(rpm) as avg_rpm,
  MAX(created_at) as last_activity,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as loads_this_week
FROM loads 
WHERE user_id = 'user-uuid-here'
AND created_at > NOW() - INTERVAL '30 days';
```

### Debug Mode Activation

**Enable Debug Mode for User:**
1. Add `?debug=1` to URL: `app.loadmastergpt.com/?debug=1`
2. Instruct user to reproduce issue
3. Debug panel shows detailed logs
4. Browser console contains technical details
5. Screenshot debug output for analysis

**Debug Information Includes:**
- OCR processing stages and timing
- API request/response details
- Authentication state changes
- Calculation step-by-step breakdown
- Error stack traces

### Browser Console Analysis

**Common Console Errors:**
```javascript
// Authentication errors
"Supabase auth error: Invalid JWT token"
"Session expired, please sign in again"

// OCR processing errors  
"Tesseract worker initialization failed"
"OpenAI function call failed: 429 Rate Limited"

// Network errors
"Failed to fetch: CORS policy"
"NetworkError: Failed to load resource"

// Calculation errors
"TypeError: Cannot read property 'miles' of undefined"
"Invalid business setup configuration"
```

---

## Rate Limiting Issues

### Understanding Rate Limits

**Current Limits:**
- **Free Users:** 4 OCR uploads per week (resets Sunday midnight)
- **Pro Users:** 100 OCR uploads per week (resets Sunday midnight)
- **Manual Entry:** Unlimited for all users
- **API Calls:** Standard Supabase rate limits apply

### Rate Limit Error Messages

**Error Types:**
```
"Rate limit exceeded. You've used 4 of 4 weekly uploads."
"Daily limit reached. Try again tomorrow or upgrade to Pro."
"Too many requests. Please try again in a few minutes."
```

### Troubleshooting Rate Limit Issues

**Step 1: Verify Current Usage**
```sql
-- Check user's current upload count
SELECT 
  weekly_upload_count,
  week_start_date,
  (CURRENT_DATE - week_start_date) as days_since_reset
FROM user_settings 
WHERE user_id = 'user-uuid';
```

**Step 2: Check Reset Schedule**
- Weekly limits reset every Sunday at midnight UTC
- If user reports incorrect count, verify week_start_date
- Manual reset may be needed if user upgraded mid-week

**Step 3: Manual Reset (If Needed)**
```sql
-- Reset weekly counter (use with caution)
UPDATE user_settings 
SET weekly_upload_count = 0,
    week_start_date = CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER % 7)
WHERE user_id = 'user-uuid';
```

### Rate Limit Support Responses

**Free User Exceeded Limit:**
```
I see you've reached your weekly limit of 4 OCR uploads. Here are your options:

1. **Wait for Reset:** Your limit resets this Sunday at midnight
2. **Use Manual Entry:** Unlimited manual load entry is always available
3. **Upgrade to Pro:** Get 100 uploads per week for $10/month

Would you like help with manual entry or information about upgrading to Pro?
```

**Pro User Rate Limit (Rare):**
```
I see you've reached the Pro limit of 100 uploads this week - you're a power user! 

Your limit will reset this Sunday at midnight. In the meantime, you can continue using unlimited manual entry.

If you consistently need more than 100 uploads per week, please let me know and we can discuss enterprise options.
```

---

## OCR Troubleshooting

### OCR Accuracy Issues

**Common Accuracy Problems:**
- Numbers detected as letters (8→B, 0→O, 1→I)
- Missing decimal points ($1000 instead of $10.00)
- Incorrect city names (partial recognition)
- Miles confused with other numbers

**Diagnostic Questions:**
1. What type of document? (load board, email, PDF)
2. Is the image clear and well-lit?
3. What specific fields are wrong?
4. Can you provide the original screenshot?

**Troubleshooting Steps:**

**Step 1: Image Quality Assessment**
- Check image resolution (minimum 300px width)
- Verify text is readable to human eye
- Look for blur, glare, or low contrast
- Ensure proper cropping (load info only)

**Step 2: OCR Processing Review**
- Enable debug mode to see OCR output
- Compare Tesseract raw text to final fields
- Identify if error is in OCR or AI extraction
- Check confidence scores for each field

**Step 3: Manual Correction Guidance**
```
The OCR detected most fields correctly. Here's how to fix the issues:

1. Click "Edit" on the incorrect field
2. Update the value manually
3. The app will remember your corrections for similar documents
4. All calculations will update automatically

For better results next time:
- Crop the image to show only load information
- Ensure good lighting when taking screenshots
- Use the highest quality setting on your phone camera
```

### OCR Processing Failures

**Complete OCR Failure:**
- Error: "Failed to process image"
- Cause: File format, size, or corruption issues
- Solution: File format guidance, alternative upload methods

**Partial Processing:**
- Error: Some fields detected, others blank
- Cause: Document layout, poor image quality
- Solution: Manual completion guidance, image improvement tips

**Timeout Errors:**
- Error: "Processing timeout"
- Cause: Large file size, server overload
- Solution: Image compression, retry guidance

### OCR Improvement Guidance

**Image Quality Best Practices:**
```
For best OCR results:

📱 Mobile Screenshots:
• Use highest camera quality setting
• Ensure good lighting (natural light is best)
• Hold phone steady to avoid blur
• Crop to show only the load information

💻 Computer Screenshots:
• Use full resolution screenshot tools
• Avoid browser zoom (use 100% zoom)
• Ensure text is sharp and clear
• Save as PNG or high-quality JPG

📄 Document Types:
• Load board screenshots work best
• Email screenshots are good if text is clear
• PDF conversions should be high resolution
• Avoid photos of computer screens
```

---

## Authentication Problems

### Common Authentication Issues

**Login Failures:**
- Incorrect password (most common)
- Unverified email address
- Account not found
- Session expired

**Account Access Issues:**
- Email verification pending
- Password reset not working
- Account locked/suspended
- Multiple account confusion

### Authentication Troubleshooting

**Step 1: Verify Account Exists**
```sql
-- Check if user account exists
SELECT email, email_confirmed_at, created_at
FROM auth.users 
WHERE email ILIKE 'user@example.com';
```

**Step 2: Check Email Verification Status**
- If `email_confirmed_at` is NULL, email not verified
- Check spam folder for verification email
- Resend verification if needed

**Step 3: Password Reset Process**
1. User clicks "Forgot Password" on login page
2. Enters email address
3. Receives password reset email
4. Clicks link and creates new password
5. Signs in with new password

### Email Verification Issues

**Verification Email Not Received:**
```
I can help you with email verification. Let's try these steps:

1. **Check Spam/Junk Folder:** Verification emails sometimes get filtered
2. **Check Email Address:** Verify you're using the correct email
3. **Resend Verification:** I can trigger a new verification email
4. **Alternative Email:** We can update your account to use a different email

Would you like me to resend the verification email to [email address]?
```

**Verification Link Expired:**
```
Verification links expire after 24 hours for security. Here's what we can do:

1. I'll send you a fresh verification link
2. Check your email (including spam folder) in the next few minutes
3. Click the new link within 24 hours
4. You'll be automatically signed in after verification

New verification email sent to [email address].
```

### Password Reset Support

**Password Reset Not Working:**
1. Verify email address is correct
2. Check spam folder for reset email
3. Ensure link hasn't expired (24 hour limit)
4. Try different browser if link issues persist

**Account Security Verification:**
For account security, we verify identity before making changes:
- Confirm account creation date
- Verify recent activity (loads entered, settings changed)
- Confirm business setup details
- Use secondary verification if available

---

## Performance Issues

### Performance Problem Categories

**Loading Speed Issues:**
- Slow initial app load
- Slow page transitions
- Slow OCR processing
- Slow calculation updates

**Mobile Performance:**
- App crashes on mobile
- Slow response to touches
- Memory issues
- Battery drain

**Network-Related Issues:**
- Intermittent connectivity
- Failed API calls
- Timeout errors
- Offline functionality

### Performance Diagnostics

**Browser Performance Check:**
1. **Browser Version:** Ensure modern browser (Chrome 90+, Safari 14+)
2. **Available Memory:** Close other tabs/apps
3. **Network Speed:** Test internet connection
4. **Cache Issues:** Clear browser cache and cookies

**Mobile Performance Check:**
1. **Device Age:** Older devices may struggle
2. **Available Storage:** Ensure adequate free space
3. **Background Apps:** Close unnecessary apps
4. **iOS/Android Version:** Check OS compatibility

**Network Diagnostics:**
```
Please try these network troubleshooting steps:

1. **Speed Test:** Visit speedtest.net and check your connection
2. **Different Network:** Try cellular data or different WiFi
3. **VPN/Firewall:** Temporarily disable VPN or firewall
4. **Browser Test:** Try a different browser (Chrome, Safari, Firefox)

If the issue persists, please share:
- Your internet speed test results
- Whether the issue happens on all networks
- If other websites work normally
```

### Performance Optimization

**Browser Optimization:**
- Clear cache and cookies
- Disable unnecessary extensions
- Close unused tabs
- Restart browser

**Mobile Optimization:**
- Restart device
- Clear app cache (if using PWA)
- Update iOS/Android OS
- Free up storage space

**Network Optimization:**
- Use stable WiFi connection
- Avoid public/slow networks for OCR
- Consider data usage on cellular
- Use airplane mode reset if needed

---

## Billing & Subscription Support

### Subscription Management

**Pro Subscription Status Check:**
```sql
-- Check subscription status (via Stripe webhook data)
SELECT 
  u.email,
  us.weekly_upload_count,
  us.pro_subscription_active,
  us.subscription_end_date
FROM auth.users u
JOIN user_settings us ON u.id = us.user_id
WHERE u.email = 'user@example.com';
```

**Common Billing Issues:**
- Payment method declined
- Subscription not activated after payment
- Cancellation requests
- Refund requests
- Payment method updates

### Payment Processing Issues

**Payment Method Declined:**
```
I see your payment was declined. This usually happens for these reasons:

1. **Insufficient Funds:** Check your account balance
2. **Expired Card:** Verify your card expiration date
3. **Incorrect Information:** Double-check card number, CVV, billing address
4. **Bank Block:** Some banks block online subscriptions - call your bank
5. **International Card:** Some international cards have restrictions

To update your payment method:
1. Go to Account Settings > Billing
2. Click "Update Payment Method"
3. Enter new card information
4. Your subscription will automatically retry

Would you like me to manually retry your payment after you update your card?
```

**Subscription Not Activated:**
- Check Stripe webhook delivery status
- Verify payment actually processed
- Manual activation if webhook failed
- Investigate timing delays

### Cancellation & Refunds

**Cancellation Process:**
1. User can cancel anytime through Account Settings
2. Service continues until end of billing period
3. No automatic renewal after cancellation
4. Data remains accessible in Free tier limits

**Refund Policy:**
- Pro-rated refunds for cancellations within 7 days
- No refunds for partial month usage after 7 days
- Exceptional circumstances reviewed case-by-case
- Processing time: 5-10 business days

**Cancellation Support Response:**
```
I can help you cancel your Pro subscription. Here are the details:

**What happens when you cancel:**
- Your Pro features remain active until [end date]
- After [end date], you'll automatically move to our Free plan
- All your data and load history will be preserved
- You can upgrade again anytime in the future

**To cancel:**
1. Go to Account Settings > Billing
2. Click "Cancel Subscription"
3. Confirm cancellation

Would you like me to process the cancellation for you, or do you have questions about what happens after cancellation?
```

---

## Feature Usage Questions

### Business Setup Support

**Common Business Setup Questions:**
- "What equipment type should I choose?"
- "How do I calculate my revenue split?"
- "What are realistic RPM thresholds?"
- "Why are my calculations different from other apps?"

**Business Setup Guidance:**
```
Let me help you configure your business setup for accurate calculations:

**Equipment Type:**
- Cargo Van: Up to 2,500 lbs, expedited freight
- Straight Truck: 10,000-26,000 lbs, dock-to-dock delivery  
- Hotshot: Pickup + trailer, oilfield/construction equipment

**Revenue Split:**
- 100%: You're an owner-operator keeping all revenue
- 80/20: You keep 80%, company keeps 20% (common)
- 70/30: You keep 70%, company keeps 30% (includes more services)

**Weekly Fixed Costs (examples):**
- Truck payment: $400-800
- Insurance: $200-400  
- Maintenance reserve: $200-400

Would you like me to walk through setting up your specific situation?
```

### Calculation Explanations

**RPM Calculation Questions:**
```
Here's how LoadMaster calculates your RPM (Revenue Per Mile):

**Basic RPM:** Total Rate ÷ Total Miles
Example: $1,000 rate ÷ 500 miles = $2.00/mile

**Pro Enhanced RPM (for Pro users with business setup):**
- **Gross RPM:** Same as basic RPM
- **Net Take-Home RPM:** After revenue split and fixed costs
  
Example with 80/20 split and $1,000 weekly costs:
- Gross: $2.00/mile  
- Revenue Split (80%): $1.60/mile
- Fixed Costs ($1,000 ÷ 2,500 weekly miles): -$0.40/mile
- Net Take-Home: $1.20/mile

This shows your actual profit per mile after all business expenses.
```

### Pro Feature Training

**Negotiation Workspace Training:**
```
The Pro Negotiation Workspace helps you write professional messages:

**AI Enhancement:**
1. Type your basic message: "Can you do better on rate?"
2. Select tone (Professional/Direct/Friendly)
3. Choose channel (Phone/Email/Load Board)
4. AI transforms it into: "I appreciate the load offer. Given current market conditions and my operating costs for this 500-mile run, I would need $2.50/mile to make this work profitably..."

**Message Templates:**
- Pre-written templates for common situations
- Customize templates for your business
- Quick access during negotiations

**Tips for Best Results:**
- Be specific about your needs
- Include load details in your input
- Adjust tone based on relationship with broker
```

### Export & Data Management

**CSV Export Support:**
```
Here's how to export your load data:

1. **From Dashboard:** Click "View All Loads"
2. **Export Button:** Click "Export CSV" at top right
3. **Date Range:** Select specific time period if needed
4. **Download:** File downloads automatically

**CSV includes:**
- All load details (origin, destination, miles, rate)
- Calculated fields (RPM, fuel cost, profit)
- Timestamps and load numbers
- Business breakdown (Pro users)

**Common Uses:**
- Tax preparation
- Performance analysis
- Broker evaluation
- Business reporting

The file opens in Excel, Google Sheets, or any spreadsheet program.
```

---

## Escalation Procedures

### When to Escalate

**Technical Escalation Criteria:**
- Bug affecting multiple users
- Data integrity issues
- Security vulnerabilities
- System performance degradation
- Feature requests requiring development

**Billing Escalation Criteria:**
- Payment processing failures
- Stripe integration issues
- Refund requests over $100
- Subscription activation problems
- Multiple failed payment attempts

### Escalation Process

**Step 1: Internal Research**
- Search knowledge base for similar issues
- Check system status and recent changes
- Review user account thoroughly
- Attempt standard troubleshooting

**Step 2: Escalation Documentation**
```
Escalation Template:

**Issue Summary:** [Brief description]
**User:** [Email and account status]
**Urgency:** [P1/P2/P3/P4]
**Troubleshooting Attempted:** [List steps taken]
**User Impact:** [How many users affected]
**Business Impact:** [Revenue/reputation implications]
**Requested Action:** [Specific development needed]

**User Communication:**
- Last response: [timestamp]
- Next expected update: [timestamp]
- Escalation communicated: [yes/no]
```

**Step 3: Development Team Handoff**
- Assign to appropriate developer
- Set priority and timeline
- Maintain user communication
- Track progress and resolution

### Communication During Escalations

**Initial Escalation Response:**
```
Thank you for your patience. I've escalated your issue to our technical team for investigation.

**What's happening now:**
- Senior developer assigned to your case
- Expected timeline: [X hours/days]
- I'll update you within [timeframe] with progress

**What you can expect:**
- Regular updates on our progress
- Direct developer involvement if needed
- Complete resolution with explanation

Ticket #[12345] - I'll personally ensure this gets resolved quickly.
```

**Progress Updates:**
```
Quick update on ticket #[12345]:

**Progress:** [What's been done]
**Current Status:** [Where we are now]
**Next Steps:** [What happens next]
**Timeline:** [When to expect resolution]

I'll send another update by [date/time] with more progress.
```

**Resolution Communication:**
```
Great news! We've resolved the issue with [brief description].

**What was wrong:** [Technical explanation in simple terms]
**What we fixed:** [Actions taken]
**Testing completed:** [How we verified the fix]
**Prevention:** [Steps to prevent recurrence]

Please try [specific action] and let me know if everything is working correctly. Your patience helped us improve the system for all users.
```

### Follow-up Procedures

**Post-Resolution Follow-up:**
- 24-hour follow-up email
- User satisfaction survey
- Document resolution in knowledge base
- Review for process improvements

**Knowledge Base Updates:**
- Add new troubleshooting steps
- Update common issue documentation
- Share learnings with team
- Update escalation procedures if needed

---

## Appendices

### A. Error Code Reference
Complete list of system error codes with meanings and resolution steps.

### B. SQL Query Library
Common database queries for account lookup, usage analysis, and troubleshooting.

### C. Browser Compatibility Matrix
Supported browsers, versions, and known compatibility issues.

### D. Mobile Device Support
iOS and Android version support, known issues, and workarounds.

### E. Stripe Integration Guide
Payment processing workflows, webhook handling, and billing troubleshooting.

---

*This support guide is updated regularly based on new issues and resolutions. Check the version number for the latest information and procedures.*