import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../utils/pwaUtils';
import { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Show "back online" message briefly
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="max-w-[428px] w-full px-4 pt-2">
        <div
          className={`
            pointer-events-auto px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border
            flex items-center gap-3 animate-slide-down
            ${
              isOnline
                ? 'bg-emerald-500/95 border-emerald-400/20 text-white'
                : 'bg-slate-900/95 border-slate-700/20 text-white'
            }
          `}
        >
          {isOnline ? (
            <>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm">Back Online</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm">You're Offline</p>
                <p className="text-xs text-white/70">Some features may be limited</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
