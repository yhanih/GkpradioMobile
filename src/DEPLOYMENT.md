# GKP Radio - Apple Deployment Guide

## Pre-Deployment Checklist

### 1. App Configuration
- ✅ Mobile-first design with max-width 428px (iPhone sizing)
- ✅ Responsive viewport settings configured
- ✅ PWA manifest.json created
- ✅ Authentication system with optional sign-in
- ✅ Privacy Policy and Terms of Service included

### 2. Required Assets for Apple App Store

#### App Icons
You need to provide the following icon sizes:
- **App Icon (iOS)**: 1024x1024px (Required for App Store)
- **iPhone**: 180x180px, 120x120px, 87x87px, 80x80px, 58x58px, 60x60px, 40x40px
- **iPad**: 167x167px, 152x152px, 76x76px
- **App Store**: 1024x1024px

Save these as PNG files in the `/public` directory.

#### Screenshots
Required screenshots for App Store listing:
- **iPhone 6.7"** (iPhone 14 Pro Max): 1290 x 2796 pixels
- **iPhone 6.5"** (iPhone 11 Pro Max): 1242 x 2688 pixels
- **iPhone 5.5"** (iPhone 8 Plus): 1242 x 2208 pixels

### 3. App Store Information

#### App Name
- **Primary Name**: GKP Radio
- **Subtitle**: God Kingdom Principles Radio - 24/7 Faith Broadcasting

#### Description
```
GKP Radio brings you 24/7 faith-based radio broadcasting with an engaged community of believers.

FEATURES:
• Live Radio - Listen to continuous Christian programming 24/7
• Podcasts - Access sermon archives and teaching series
• Video - Watch recorded services and special events
• Community - Join prayer requests, share testimonies, and engage in discussions
• Real-time Chat - Connect with listeners worldwide during live broadcasts

COMMUNITY:
Sign in to participate in our faith community:
• Post and respond to prayer requests
• Share your testimonies of God's faithfulness
• Engage in Bible discussions and fellowship
• Connect with 2,500+ members worldwide

Note: You can listen to all content without an account. Sign in is only required for community interactions.

ABOUT GKP RADIO:
God Kingdom Principles Radio is dedicated to spreading the gospel and building a global community of faith. Our mission is to provide continuous Christian programming, foster spiritual growth, and create a space for believers to support one another.
```

#### Keywords
```
christian radio, gospel, faith, prayer, church, worship, bible, testimony, christian community, live radio
```

#### Category
- **Primary**: Music
- **Secondary**: Lifestyle

#### Age Rating
- **Rating**: 4+ (No objectionable content)

### 4. Technical Requirements

#### App Privacy Details (Apple Requirement)
You must declare what data you collect:

**Data Used to Track You**: None

**Data Linked to You**:
- Email Address (for account creation)
- Name (optional, for community features)
- User Content (prayer requests, testimonies, comments)

**Data Not Linked to You**: None

#### Support Information
- **Support URL**: https://www.gkpradio.com/support
- **Marketing URL**: https://www.gkpradio.com
- **Privacy Policy URL**: (Set in app settings)

### 5. Build Configuration

#### For React Native/Capacitor Deployment:

1. **Install Capacitor** (if not already):
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "GKP Radio" "com.gkpradio.app"
```

2. **Build for iOS**:
```bash
npm run build
npx cap add ios
npx cap sync
npx cap open ios
```

3. **Xcode Configuration**:
- Set Bundle Identifier: `com.gkpradio.app`
- Set Version: `1.0.0`
- Set Build Number: `1`
- Configure capabilities:
  - Background Modes (for audio playback)
  - Push Notifications (if needed)
- Add App Icons in Assets.xcassets
- Set Launch Screen

#### For Progressive Web App (PWA):

If deploying as a PWA that can be added to home screen:
- Ensure HTTPS is enabled
- Service worker is registered
- manifest.json is linked in HTML
- Apple touch icons are provided

### 6. Testing Checklist

Before submission, test:
- [ ] Audio playback works in background
- [ ] Authentication flow (sign up, sign in, sign out)
- [ ] All navigation works correctly
- [ ] Forms submit properly (prayer requests, testimonies)
- [ ] App works on various iPhone screen sizes
- [ ] Network error handling
- [ ] Offline behavior (for cached content)
- [ ] Privacy Policy and Terms are accessible
- [ ] No console errors or warnings

### 7. Compliance

#### Required Legal Documents
- ✅ Privacy Policy (included in app)
- ✅ Terms of Service (included in app)
- ⚠️ Ensure these are also hosted on your website

#### Content Guidelines
- All content must comply with Apple App Store Review Guidelines
- Religious content is permitted
- Ensure community moderation for user-generated content
- No hate speech or discriminatory content

### 8. Supabase Configuration

Before deploying, ensure:
1. Supabase project is set up
2. Environment variables are configured:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Database tables are initialized (KV store is auto-created)
4. Row Level Security (RLS) policies are configured if needed

### 9. Backend Deployment

The Supabase Edge Function at `/supabase/functions/server/` needs to be deployed:

```bash
supabase functions deploy make-server-ca328713
```

Ensure all environment variables are set in Supabase dashboard.

### 10. Post-Launch

After approval:
- Monitor crash reports in App Store Connect
- Respond to user reviews
- Plan for regular updates
- Monitor Supabase usage and scaling

## Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)

## Support

For technical support or questions about deployment, contact:
- Technical Support: tech@gkpradio.com
- General Inquiries: support@gkpradio.com
