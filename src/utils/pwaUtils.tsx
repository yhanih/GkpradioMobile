import { useEffect, useState } from 'react';

// PWA Install Prompt Hook
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] Install prompt available');
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('[PWA] App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        setInstallPrompt(null);
        setIsInstallable(false);
        return true;
      } else {
        console.log('[PWA] User dismissed install');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  };

  return { isInstallable, isInstalled, promptInstall };
}

// Online/Offline Detection Hook
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] Connection restored');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[PWA] Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Service Worker Registration
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available');
              
              // Notify user about update
              if (window.confirm('A new version is available. Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      // Handle controller change (new SW activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('[PWA] Service Worker not supported');
    return null;
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Check if running as installed PWA
export function isRunningAsPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
}

// Get device type
export function getDeviceType() {
  const ua = navigator.userAgent;
  
  if (/iPad|iPhone|iPod/.test(ua)) {
    return 'ios';
  } else if (/android/i.test(ua)) {
    return 'android';
  } else {
    return 'desktop';
  }
}

// iOS specific: Prevent bounce effect
export function preventIOSBounce() {
  let startY = 0;

  document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].pageY;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].pageY;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    // Prevent pull-to-refresh
    if (scrollTop <= 0 && currentY > startY) {
      e.preventDefault();
    }

    // Prevent bottom bounce
    if (scrollTop + clientHeight >= scrollHeight && currentY < startY) {
      e.preventDefault();
    }
  }, { passive: false });
}

// Add to home screen instructions
export function getInstallInstructions() {
  const device = getDeviceType();
  
  if (device === 'ios') {
    return {
      title: 'Install GKP Radio',
      steps: [
        'Tap the Share button',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to confirm',
        'The app will appear on your home screen'
      ],
      icon: '⬆️' // Share icon representation
    };
  } else if (device === 'android') {
    return {
      title: 'Install GKP Radio',
      steps: [
        'Tap the menu button (⋮)',
        'Tap "Add to Home Screen" or "Install App"',
        'Tap "Install" to confirm',
        'The app will appear on your home screen'
      ],
      icon: '📱'
    };
  } else {
    return {
      title: 'Install GKP Radio',
      steps: [
        'Click the install button in the address bar',
        'Or click the menu and select "Install GKP Radio"',
        'The app will be added to your applications'
      ],
      icon: '💻'
    };
  }
}

// Cache audio files for offline playback
export async function cacheAudioForOffline(urls: string[]) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      urls: urls
    });
  }
}

// Background sync for offline actions
export async function registerBackgroundSync(tag: string) {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[PWA] Background sync failed:', error);
      return false;
    }
  }
  return false;
}
