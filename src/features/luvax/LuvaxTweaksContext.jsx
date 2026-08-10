import { createContext, useContext } from 'react';
import { TWEAK_DEFAULTS } from './constants/data';

/**
 * Display preferences shared by the authenticated shell and its screens.
 *
 * These were props threaded down from the screen switch. Screens are route
 * elements now and no parent renders them directly, so the values travel
 * through context instead. This carries appearance settings only: navigation
 * state lives in the URL.
 */
const LuvaxTweaksContext = createContext({
  tweaks: TWEAK_DEFAULTS,
  setTweak: () => {},
  viewport: 'desktop',
});

export function LuvaxTweaksProvider({ value, children }) {
  return <LuvaxTweaksContext.Provider value={value}>{children}</LuvaxTweaksContext.Provider>;
}

export function useLuvaxTweaks() {
  return useContext(LuvaxTweaksContext);
}
