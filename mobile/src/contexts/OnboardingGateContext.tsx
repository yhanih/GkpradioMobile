import React, { createContext, useContext } from 'react';

interface OnboardingGateContextValue {
  replayOnboarding: () => Promise<void>;
}

const OnboardingGateContext = createContext<OnboardingGateContextValue | undefined>(undefined);

export function OnboardingGateProvider({
  children,
  replayOnboarding,
}: {
  children: React.ReactNode;
  replayOnboarding: () => Promise<void>;
}) {
  return (
    <OnboardingGateContext.Provider value={{ replayOnboarding }}>
      {children}
    </OnboardingGateContext.Provider>
  );
}

export function useOnboardingGate() {
  const context = useContext(OnboardingGateContext);
  if (!context) {
    throw new Error('useOnboardingGate must be used within OnboardingGateProvider');
  }
  return context;
}
