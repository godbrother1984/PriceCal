import React from 'react';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';

const App: React.FC = () => {
  const isInitialSetupDone = false; // <-- ตรวจสอบว่าค่าเป็น false

  if (!isInitialSetupDone) {
    return <SetupWizard />;
  }

  return <Login />;
};

export default App;