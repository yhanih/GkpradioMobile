# App Store Submission Checklist

Use this checklist to ensure you're ready to submit to the App Store.

## ☐ Pre-Development

- [ ] Apple Developer Account created ($99/year)
- [ ] Mac computer available with Xcode installed
- [ ] Project builds successfully on your current setup

## ☐ App Configuration

- [ ] Updated `capacitor.config.ts` with your app details
- [ ] Changed Bundle ID to your unique identifier (e.g., `com.yourcompany.gkpradio`)
- [ ] Set app version to 1.0.0
- [ ] Set build number to 1
- [ ] Configured app name: "GKP Radio"

## ☐ Streaming Setup

- [ ] Azuracast stream URL configured in `/utils/AudioContext.tsx`
- [ ] Stream tested and working
- [ ] OR demo stream is working (if using for initial submission)
- [ ] Background audio capability enabled in Xcode

## ☐ Supabase/Backend (if using)

- [ ] Production Supabase project created
- [ ] Database tables configured
- [ ] Authentication tested
- [ ] API endpoints working
- [ ] OR app works without backend features

## ☐ Visual Assets

### App Icons
- [ ] 1024x1024 App Store icon
- [ ] 180x180 iPhone @3x icon
- [ ] 167x167 iPad Pro icon
- [ ] 152x152 iPad @2x icon
- [ ] 120x120 iPhone @2x icon
- [ ] 87x87 iPhone @3x icon
- [ ] 80x80 iPad @2x icon
- [ ] 76x76 iPad icon
- [ ] 60x60 iPhone icon
- [ ] 58x58 iPad icon
- [ ] 40x40 Spotlight icon
- [ ] 29x29 Settings icon
- [ ] 20x20 Notifications icon

### Screenshots (Required)
- [ ] iPhone 6.7" screenshots (at least 3)
- [ ] iPhone 6.5" screenshots (at least 3)
- [ ] iPad screenshots (if supporting iPad)

### Splash Screen
- [ ] Splash screen created (1242x2688)
- [ ] Added to Xcode project

## ☐ Legal & Privacy

- [ ] Privacy Policy written and hosted publicly
- [ ] Privacy Policy URL accessible
- [ ] Terms of Service written and hosted publicly
- [ ] Terms of Service URL accessible
- [ ] Support URL or email configured
- [ ] Privacy Policy updated in app (ProfileScreen.tsx)
- [ ] Terms updated in app (ProfileScreen.tsx)

### Privacy Policy Must Include:
- [ ] What data you collect
- [ ] How you use the data
- [ ] If you share data with third parties
- [ ] How users can delete their data
- [ ] Contact information

## ☐ App Store Connect

- [ ] App created in App Store Connect
- [ ] App name: "GKP Radio"
- [ ] Subtitle written (max 30 characters)
- [ ] Category selected (Music or Lifestyle)
- [ ] Description written (max 4000 characters)
- [ ] Keywords added (max 100 characters)
- [ ] Support URL added
- [ ] Marketing URL added (optional)
- [ ] Privacy Policy URL added
- [ ] Age rating completed

## ☐ Technical Requirements

- [ ] App builds without errors
- [ ] App tested on iOS Simulator
- [ ] App tested on real iPhone device
- [ ] All features working correctly
- [ ] No crashes or major bugs
- [ ] Loading states work properly
- [ ] Error handling implemented
- [ ] Network errors handled gracefully
- [ ] Audio plays correctly
- [ ] Navigation works smoothly
- [ ] Bottom nav is sticky (infinite scroll working)

## ☐ Content & Functionality

- [ ] All dummy/placeholder content removed OR clearly marked as demo
- [ ] All links working
- [ ] Images loading properly
- [ ] API calls working (or mock data in place)
- [ ] Authentication working (if implemented)
- [ ] Profile features working (if implemented)
- [ ] Community features working (if implemented)
- [ ] Live chat working (if implemented)
- [ ] All screens accessible and functional

## ☐ Xcode Configuration

- [ ] Bundle Identifier set correctly
- [ ] Team selected
- [ ] Signing certificates configured
- [ ] Background Modes capability added
- [ ] Audio background mode enabled
- [ ] Info.plist permissions added:
  - [ ] NSMicrophoneUsageDescription (if using mic)
  - [ ] NSCameraUsageDescription (if using camera)
  - [ ] NSPhotoLibraryUsageDescription (if using photos)
- [ ] All app icons added to Assets.xcassets
- [ ] Launch screen configured
- [ ] App builds on real device successfully

## ☐ Pre-Submission Testing

- [ ] Test all features one final time
- [ ] Test on multiple devices if possible
- [ ] Test with poor internet connection
- [ ] Test offline behavior
- [ ] Test app from fresh install
- [ ] Delete app and reinstall to test first-run experience
- [ ] Check for any console errors or warnings
- [ ] Verify all analytics/tracking working (if implemented)

## ☐ Archive & Upload

- [ ] Created Archive in Xcode
- [ ] Archive validated successfully (no errors)
- [ ] Archive uploaded to App Store Connect
- [ ] Upload confirmed in App Store Connect (wait 5-30 min)
- [ ] Build shows up in App Store Connect

## ☐ App Store Submission

- [ ] Build selected in App Store Connect
- [ ] All metadata fields filled
- [ ] Screenshots uploaded for all required sizes
- [ ] Export compliance answered
- [ ] Content rights answered
- [ ] Advertising identifier answered
- [ ] Review notes added (if needed)
- [ ] Demo account provided (if app requires login)
- [ ] Pricing set (Free or Paid)
- [ ] Availability territories selected
- [ ] Release option selected (manual or automatic)

## ☐ Final Checks Before Submitting

- [ ] Triple-check privacy policy URL works
- [ ] Triple-check terms of service URL works
- [ ] Triple-check support URL/email works
- [ ] All screenshots look professional
- [ ] Description has no typos
- [ ] Keywords are relevant
- [ ] Age rating is appropriate
- [ ] No copyright violations
- [ ] No trademark violations
- [ ] Follows App Store Guidelines

## ☐ Submit!

- [ ] Clicked "Add for Review"
- [ ] Submitted app for review
- [ ] Received confirmation email from Apple

## ☐ Post-Submission

- [ ] Monitor App Store Connect for status updates
- [ ] Check email for Apple updates
- [ ] Respond to any questions from Apple review team (24-48 hours)
- [ ] If rejected: Read feedback, fix issues, resubmit
- [ ] If approved: Release immediately or schedule release

## ☐ After Approval

- [ ] App released to App Store
- [ ] Test download from App Store
- [ ] Share App Store link with users
- [ ] Monitor reviews and ratings
- [ ] Respond to user feedback
- [ ] Plan updates and improvements

---

## Common Issues & Solutions

### "Missing Privacy Policy"
✅ Make sure URL is publicly accessible (not behind login)

### "Broken Links"
✅ Test all URLs in a private browser window

### "Crashes on Launch"
✅ Test on real device, check crash logs in Xcode

### "Missing Permissions"
✅ Add all required permission descriptions in Info.plist

### "Icon Issues"
✅ Ensure all icon sizes provided, no transparency, PNG format

### "Build Not Appearing"
✅ Wait 5-30 minutes after upload, refresh App Store Connect

---

**Estimated Time to Complete Checklist:** 6-10 hours (first time)

**Pro Tip:** Don't rush! Take time to test thoroughly. A rejection adds 2-3 days to your timeline.

Good luck! 🚀
