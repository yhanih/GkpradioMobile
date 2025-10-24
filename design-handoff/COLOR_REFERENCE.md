# GKP Radio - Color Reference Guide

Quick reference for all colors used in the GKP Radio app.

## 🎨 Primary Colors (Green - Kingdom/Growth Theme)

### Primary Green Shades

```css
/* Main Brand Color */
--primary-600: #047857
rgb(4, 120, 87)

/* Hover/Active States */
--primary-700: #059669
rgb(5, 150, 105)

/* Light Backgrounds */
--primary-50: rgba(4, 120, 87, 0.1)
rgba(4, 120, 87, 0.1)

/* Very Light Tint */
--primary-25: rgba(4, 120, 87, 0.05)
rgba(4, 120, 87, 0.05)
```

**Usage**:
- Primary buttons (gradient: primary-600 → primary-700)
- Active navigation items
- Links and CTAs
- Icon highlights
- Focus states

---

## 🔴 Accent Colors (Red - Live/Urgent)

### Red Shades

```css
/* Live Indicator, Urgent CTAs */
--red-500: #ef4444
rgb(239, 68, 68)

/* Red Gradient End */
--red-600: #dc2626
rgb(220, 38, 38)

/* Light Red Background */
--red-50: rgba(239, 68, 68, 0.1)
rgba(239, 68, 68, 0.1)
```

**Usage**:
- "LIVE NOW" banners (gradient: red-500 → red-600)
- Live streaming indicators
- Urgent call-to-actions
- Error states
- Pulsing animations

---

## ⚫ Neutral Colors (Grays)

### Dark Grays (Text)

```css
/* Primary Text */
--gray-900: #09090b
rgb(9, 9, 11)

/* Secondary Text */
--gray-600: #71717a
rgb(113, 113, 122)

/* Tertiary Text */
--gray-500: #a1a1aa
rgb(161, 161, 170)
```

### Light Grays (Borders & Backgrounds)

```css
/* Strong Borders */
--gray-300: #d4d4d8
rgb(212, 212, 216)

/* Light Borders */
--gray-200: #e4e4e7
rgb(228, 228, 231)

/* Subtle Borders */
--gray-100: #f4f4f5
rgb(244, 244, 245)

/* Background Tint */
--gray-50: #fafafa
rgb(250, 250, 250)
```

**Usage**:
- gray-900: Headlines, primary text
- gray-600: Body text, captions
- gray-500: Placeholders, disabled text
- gray-300: Input borders
- gray-200: Card borders, dividers
- gray-100: Badge backgrounds
- gray-50: Page backgrounds, hover states

---

## ⚪ Base Colors

### White & Black

```css
/* Pure White */
--white: #ffffff
rgb(255, 255, 255)

/* Pure Black (rarely used) */
--black: #000000
rgb(0, 0, 0)
```

**Usage**:
- white: Main background, card backgrounds, button text
- black: Shadow colors only (with opacity)

---

## ✅ Semantic Colors

### Success

```css
--success-500: #10b981
rgb(16, 185, 129)

--success-50: rgba(16, 185, 129, 0.1)
rgba(16, 185, 129, 0.1)
```

**Usage**: Success messages, confirmed states, prayer answered status

### Error

```css
--error-500: #ef4444
rgb(239, 68, 68)

--error-50: rgba(239, 68, 68, 0.1)
rgba(239, 68, 68, 0.1)
```

**Usage**: Error messages, validation errors, delete actions

### Warning

```css
--warning-500: #f59e0b
rgb(245, 158, 11)

--warning-50: rgba(245, 158, 11, 0.1)
rgba(245, 158, 11, 0.1)
```

**Usage**: Warning messages, pending states

### Info

```css
--info-500: #3b82f6
rgb(59, 130, 246)

--info-50: rgba(59, 130, 246, 0.1)
rgba(59, 130, 246, 0.1)
```

**Usage**: Informational messages, tips, helper text

---

## 🎨 Gradient Combinations

### Primary Button Gradient

```css
background: linear-gradient(135deg, #047857 0%, #059669 100%);
```

### Live Banner Gradient

```css
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
```

### Subtle Icon Background

```css
background: linear-gradient(135deg, rgba(4, 120, 87, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
```

---

## 🌈 Color Usage Guide

### Text Hierarchy

1. **Headings**: gray-900 (#09090b)
2. **Body Text**: gray-900 (#09090b)
3. **Secondary Text**: gray-600 (#71717a)
4. **Tertiary Text**: gray-500 (#a1a1aa)
5. **Disabled Text**: gray-400 (#a1a1aa)

### Buttons

#### Primary Button
- **Background**: Gradient (primary-600 → primary-700)
- **Text**: white
- **Hover**: Increase brightness
- **Disabled**: gray-400 background

#### Secondary Button
- **Background**: white
- **Border**: gray-300
- **Text**: gray-900
- **Hover**: gray-50 background

#### Tertiary/Ghost Button
- **Background**: transparent
- **Text**: primary-600
- **Hover**: primary-50 background

### Cards

- **Background**: white
- **Border**: gray-200 or none
- **Shadow**: rgba(0, 0, 0, 0.1)
- **Hover Shadow**: rgba(0, 0, 0, 0.15)

### Form Inputs

- **Background**: white
- **Border**: gray-300
- **Focus Border**: primary-600
- **Focus Ring**: primary-50
- **Placeholder**: gray-500
- **Error Border**: error-500
- **Error Ring**: error-50

### Icons

- **Primary**: primary-600
- **Secondary**: gray-600
- **Active**: primary-700
- **Inactive**: gray-400

---

## 📐 Shadow Colors

All shadows use black with varying opacity:

```css
/* Small Shadow */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

/* Medium Shadow */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* Large Shadow */
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);

/* Extra Large Shadow */
box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);

/* Primary Color Shadow (for green elements) */
box-shadow: 0 4px 12px rgba(4, 120, 87, 0.2);

/* Red Shadow (for live elements) */
box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
```

---

## 🎯 Tailwind CSS Classes Quick Reference

If you're using Tailwind CSS (recommended):

### Primary Colors
- `bg-primary-600` / `bg-[#047857]`
- `text-primary-600` / `text-[#047857]`
- `border-primary-600` / `border-[#047857]`

### Text Colors
- `text-gray-900` - Primary text
- `text-gray-600` - Secondary text
- `text-gray-500` - Tertiary text

### Backgrounds
- `bg-white` - Card backgrounds
- `bg-gray-50` - Page backgrounds
- `bg-gray-100` - Badge backgrounds

### Borders
- `border-gray-200` - Light borders
- `border-gray-300` - Input borders

### Gradients
```html
<div class="bg-gradient-to-r from-[#047857] to-[#059669]">
  Primary Button
</div>

<div class="bg-gradient-to-r from-[#ef4444] to-[#dc2626]">
  Live Banner
</div>
```

---

## ♿ Accessibility Notes

### Color Contrast Ratios (WCAG AA)

✅ **Passing Combinations**:
- gray-900 on white: 21:1 (AAA)
- gray-600 on white: 7.1:1 (AA)
- primary-600 on white: 4.6:1 (AA)
- white on primary-600: 4.6:1 (AA)
- white on red-500: 4.5:1 (AA)

❌ **Failing Combinations** (avoid):
- gray-500 on white: 3.9:1 (Fails AA for text)
- primary-50 on white: Too low (use for backgrounds only)

**Best Practices**:
- Use gray-900 or gray-600 for body text
- Use white text on primary-600 or red-500 backgrounds
- Don't use gray-500 for body text (only for large text or icons)

---

## 🎨 Design Token Variables (CSS)

Copy this into your CSS for consistent colors:

```css
:root {
  /* Primary */
  --primary-600: #047857;
  --primary-700: #059669;
  --primary-50: rgba(4, 120, 87, 0.1);
  
  /* Accent */
  --red-500: #ef4444;
  --red-600: #dc2626;
  --red-50: rgba(239, 68, 68, 0.1);
  
  /* Neutrals */
  --gray-900: #09090b;
  --gray-600: #71717a;
  --gray-500: #a1a1aa;
  --gray-400: #a1a1aa;
  --gray-300: #d4d4d8;
  --gray-200: #e4e4e7;
  --gray-100: #f4f4f5;
  --gray-50: #fafafa;
  
  /* Semantic */
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
  
  /* Base */
  --white: #ffffff;
  --black: #000000;
}
```

---

**Use this reference for quick color lookups while building the web app!** 🎨
