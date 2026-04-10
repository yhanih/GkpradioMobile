# Google Play Store Assets Automation

This directory contains the automated screenshot capture setup for Google Play using [Maestro](https://maestro.mobile.dev/).

## Folder Structure

- `phone/`: For 4-6 phone screenshots.
- `tablet-7inch/`: For 7-inch tablet screenshots.
- `tablet-10inch/`: For 10-inch tablet screenshots.
- `feature-graphic/`: Place your AI-generated 1024x500 feature graphic here.

## Prerequisites

1. Install Maestro:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. Have Android Studio installed with at least one Phone emulator and one Tablet emulator.
3. Your app must be built and installed on the emulator, or you can run it via Expo (`npx expo run:android`).

## How to Capture Screenshots

### 1. Phone Screenshots

1. Open your **Phone Emulator** in Android Studio.
2. Build and run the app on the emulator:
   ```bash
   cd mobile
   npx expo run:android
   ```
3. Run the Maestro flow to capture screenshots:
   ```bash
   maestro test .maestro/screenshots.yaml
   ```
4. Move the generated screenshots (usually saved in the current directory or `~/.maestro/tests/`) to `play-assets/phone/`.

### 2. Tablet Screenshots

1. Close the phone emulator and open your **Tablet Emulator** (e.g., Pixel C or a generic 10-inch tablet).
2. Run the app on the tablet emulator:
   ```bash
   npx expo run:android
   ```
3. Run the Maestro flow again:
   ```bash
   maestro test .maestro/screenshots.yaml
   ```
4. Move the generated screenshots to `play-assets/tablet-10inch/` (and repeat for a 7-inch emulator if desired, moving to `tablet-7inch/`).

## Recommended Screenshots for Play Console

Based on the app's screens, here are the 4-6 best screenshots to include:
1. **Home Screen**: Showcases the main dashboard and value proposition.
2. **Live Radio/Player**: Highlights the core live audio/video streaming feature.
3. **Media/Podcasts**: Shows the library of sermons, podcasts, and on-demand content.
4. **Community**: Demonstrates user engagement, posts, and interaction.
5. **Profile**: Shows personalization and user settings.

## Remaining Manual Steps (Checklist)

- [ ] Generate a **Feature Graphic** (1024x500) using AI (Midjourney, DALL-E, etc.) and place it in `feature-graphic/`.
- [ ] Write the **App Title**, **Short Description**, and **Full Description** (you can use AI for this).
- [ ] Upload the captured phone screenshots to the Play Console.
- [ ] Upload the captured tablet screenshots to the Play Console.
- [ ] Upload the Feature Graphic and App Icon.
- [ ] Fill out the content rating and privacy policy questionnaires in the Play Console.
