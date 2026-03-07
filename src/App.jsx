// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root component; owns the navigation state (home ↔ timer)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import TimerScreen from './components/TimerScreen';

export default function App() {
  // null → home screen | object → timer screen with that mode config
  const [activeMode, setActiveMode] = useState(null);

  return activeMode ? (
    <TimerScreen mode={activeMode} onBack={() => setActiveMode(null)} />
  ) : (
    <HomeScreen onSelectMode={setActiveMode} />
  );
}
