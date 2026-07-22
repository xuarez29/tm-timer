// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root component; owns the navigation state (home ↔ timer ↔ bell)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import TimerScreen from './components/TimerScreen';
import BellScreen, { DEFAULT_SOUND } from './components/BellScreen';

export default function App() {
  // null → home screen | object → timer screen with that mode config
  const [activeMode, setActiveMode] = useState(null);
  // Whether the desk-bell screen is showing
  const [showBell, setShowBell] = useState(false);
  // Lives here, not in BellScreen, so the pick survives a trip to the timer
  // and back — but resets to the classic bell on every app launch.
  const [bellSound, setBellSound] = useState(DEFAULT_SOUND);

  // Android's back gesture (and the browser's back button) should return to the
  // menu rather than leave the app. Entering a sub-screen pushes a history
  // entry, and popping it is what actually changes the screen — so hardware
  // back and the in-app buttons both travel the same path.
  useEffect(() => {
    const onPopState = () => {
      setActiveMode(null);
      setShowBell(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openTimer = (mode) => {
    window.history.pushState({ screen: 'timer' }, '');
    setActiveMode(mode);
  };

  const openBell = () => {
    window.history.pushState({ screen: 'bell' }, '');
    setShowBell(true);
  };

  // Pops the entry pushed on the way in, which triggers onPopState above
  const goHome = () => window.history.back();

  if (showBell) {
    return (
      <BellScreen
        onBack={goHome}
        sound={bellSound}
        onSoundChange={setBellSound}
      />
    );
  }

  if (activeMode) return <TimerScreen mode={activeMode} onBack={goHome} />;

  return <HomeScreen onSelectMode={openTimer} onOpenBell={openBell} />;
}
