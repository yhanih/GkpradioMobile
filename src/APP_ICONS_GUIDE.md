# App Icon Design Guide

## Icon Requirements

For App Store submission, you need app icons in these sizes:

### iOS App Icon Sizes

| Size | Usage | Filename |
|------|-------|----------|
| 1024x1024 | App Store | AppIcon-1024.png |
| 180x180 | iPhone @3x | AppIcon-180.png |
| 167x167 | iPad Pro | AppIcon-167.png |
| 152x152 | iPad @2x | AppIcon-152.png |
| 120x120 | iPhone @2x | AppIcon-120.png |
| 87x87 | iPhone @3x | AppIcon-87.png |
| 80x80 | iPad @2x | AppIcon-80.png |
| 76x76 | iPad | AppIcon-76.png |
| 60x60 | iPhone | AppIcon-60.png |
| 58x58 | iPad | AppIcon-58.png |
| 40x40 | Spotlight | AppIcon-40.png |
| 29x29 | Settings | AppIcon-29.png |
| 20x20 | Notifications | AppIcon-20.png |

## Design Guidelines

### Your Brand Colors
- **Primary Green**: #00A86B
- **White**: #FFFFFF
- **Background**: Light gradient with green tones

### Icon Design Recommendations

1. **Simple & Clean**
   - Use your GKP Radio logo
   - Keep it simple - icons are small
   - Avoid text (except maybe "GKP")

2. **Suggested Design**
   - Green gradient background (#00A86B to lighter teal)
   - White radio wave symbol or microphone icon
   - Clean, modern look matching your glass UI

3. **What NOT to do**
   - ❌ Don't use transparency (iOS will add black background)
   - ❌ Don't use rounded corners (iOS adds them automatically)
   - ❌ Don't include religious symbols that might violate guidelines
   - ❌ Don't use small text (unreadable at small sizes)

## Creating Your Icons

### Option 1: Design Tool (Recommended)
Use Figma, Canva, or Adobe Illustrator:

1. Create 1024x1024 design
2. Export in all required sizes
3. Save as PNG with NO transparency

### Option 2: Online Icon Generator
Use a tool like:
- https://appicon.co
- https://makeappicon.com

Upload your 1024x1024 design and it generates all sizes.

### Option 3: Hire a Designer
- Fiverr: $5-50
- Upwork: $50-200
- 99designs: $200-500

## Example Icon Concept

```
┌─────────────────────┐
│                     │
│   ╔═══════════╗    │  Green gradient background
│   ║           ║    │  (#00A86B → #00C97F)
│   ║  📻 GKP   ║    │  White radio icon
│   ║           ║    │  Clean typography
│   ╚═══════════╝    │
│                     │
└─────────────────────┘
```

## Quick Design Prompt

If using AI tools like Midjourney or DALL-E:

```
"Modern minimalist app icon for Christian radio app, green gradient background #00A86B, white radio wave symbol, clean professional design, iOS app icon style, no rounded corners, flat design"
```

## Splash Screen

Also create a splash screen (1242x2688):
- Same green background
- Centered logo
- "GKP Radio" text
- Optional: "God Kingdom Principles" subtitle

## Where to Add Icons in Xcode

1. Open Xcode project: `npx cap open ios`
2. Navigate to: `App/Assets.xcassets/AppIcon.appiconset`
3. Drag and drop each icon size into the corresponding slot
4. Make sure all slots are filled

## Validation

Before submitting, validate your icons:
1. Build app in Xcode
2. Check if icons appear correctly
3. Test on different devices
4. Verify no warnings about missing icons

## Pro Tips

✅ Use same icon across all platforms (iOS, web, etc.)
✅ Test icon at small sizes - does it still look good?
✅ Ensure good contrast for visibility
✅ Keep it memorable and unique
✅ Match your app's branding

---

Need help? Most designers can create app icons in 1-2 days for reasonable prices!
