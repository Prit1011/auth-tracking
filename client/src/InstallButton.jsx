import React, { useState, useEffect } from 'react';

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`Install outcome: ${outcome}`);
    setPromptEvent(null);
  };

  if (!promptEvent) return null;

  return (
    <button
      onClick={handleInstall}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 20px',
        backgroundColor: '#1976d2',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        zIndex: 1000
      }}
    >
      Install App
    </button>
  );
}
