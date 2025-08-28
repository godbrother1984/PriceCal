import React from 'react';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';

const App: React.FC = () => {
  // --- EDIT: Check setup status from localStorage ---
  const isInitialSetupDone = localStorage.getItem('setupComplete') === 'true';

  if (!isInitialSetupDone) {
    return <SetupWizard />;
  }

  return <Login />;
};

export default App;
