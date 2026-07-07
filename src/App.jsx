// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root component; owns the navigation state (home ↔ timer)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import TimerScreen from './components/TimerScreen';
import BellScreen from './components/BellScreen';

export default function App() {
  // null → home screen | object → timer screen with that mode config
  const [activeMode, setActiveMode] = useState(null);
  // Whether the desk-bell screen is showing
  const [showBell, setShowBell] = useState(false);

  if (showBell) return <BellScreen onBack={() => setShowBell(false)} />;

  if (activeMode) return <TimerScreen mode={activeMode} onBack={() => setActiveMode(null)} />;

  return <HomeScreen onSelectMode={setActiveMode} onOpenBell={() => setShowBell(true)} />;
}
