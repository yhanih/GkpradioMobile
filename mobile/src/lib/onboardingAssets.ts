import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import type { ImageSource } from 'expo-image';

export const ONBOARDING_SLIDE_IMAGES = [
  require('../../assets/onboarding/onboarding-radio.png'),
  require('../../assets/onboarding/onboarding-community.png'),
  require('../../assets/onboarding/onboarding-media.png'),
  require('../../assets/onboarding/onboarding-events.png'),
] as const;

export const ONBOARDING_LOGO_IMAGE = require('../../assets/icon-onboarding.png');

const ALL_ONBOARDING_MODULES = [...ONBOARDING_SLIDE_IMAGES, ONBOARDING_LOGO_IMAGE] as const;

let preloadPromise: Promise<void> | null = null;

/** Decode onboarding bitmaps once; safe to call multiple times. */
export function preloadOnboardingAssets(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = (async () => {
      const assets = await Asset.loadAsync([...ALL_ONBOARDING_MODULES]);
      await Promise.all(
        assets.map((asset) => {
          const uri = asset.localUri ?? asset.uri;
          return uri ? Image.prefetch(uri) : Promise.resolve();
        })
      );
    })().catch((error) => {
      preloadPromise = null;
      console.warn('[onboardingAssets] preload failed:', error);
      throw error;
    });
  }
  return preloadPromise;
}

export type OnboardingImageSource = ImageSource;
