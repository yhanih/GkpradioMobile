import { RefreshCw, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
                setRegistration(reg);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page when the new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 flex justify-center">
      <div className="w-full max-w-md bg-gradient-to-r from-blue-500 to-blue-600 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-400/20 p-4 animate-slide-up text-white">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
            <RefreshCw className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="mb-1">Update Available</h4>
            <p className="text-sm text-white/90">
              A new version of GKP Radio is ready
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 rounded-xl text-white hover:bg-white/10 transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-white/90 transition-all shadow-lg"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}
