import { X, Download, Share } from 'lucide-react';
import { useInstallPrompt, getDeviceType, getInstallInstructions } from '../utils/pwaUtils';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const device = getDeviceType();
  const instructions = getInstallInstructions();

  useEffect(() => {
    // Show prompt after 30 seconds if installable and not dismissed
    const dismissed = localStorage.getItem('installPromptDismissed');
    
    if (isInstallable && !dismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await promptInstall();
    
    if (!success && device === 'ios') {
      // On iOS, show manual instructions
      setShowManualInstructions(true);
    } else {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (isInstalled || (!showPrompt && !showManualInstructions)) {
    return null;
  }

  if (showManualInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-emerald-600 p-6 relative">
            <button
              onClick={() => setShowManualInstructions(false)}
              className="absolute top-4 right-4 text-white/90 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Share className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-white text-xl">{instructions.title}</h3>
                <p className="text-white/80 text-sm">Follow these steps</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6 space-y-4">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  {index + 1}
                </div>
                <p className="text-slate-700 pt-1">{step}</p>
              </div>
            ))}

            <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-sm text-slate-600">
                💡 Installing the app gives you quick access and an app-like experience with offline support!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 flex justify-center">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 animate-slide-up">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <Download className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-slate-900 mb-1">Install GKP Radio</h4>
            <p className="text-sm text-slate-600">
              Get quick access and use offline
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-white hover:shadow-lg transition-all"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
