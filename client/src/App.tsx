// path: client/src/App.tsx
// version: 2.0 (localStorage Removal Fix)
// last-modified: 31 สิงหาคม 2568

import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
import MainLayout from './components/layout/MainLayout';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ตรวจสอบสถานะการติดตั้งจาก Backend
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        // ตรวจสอบจาก Backend ว่าระบบได้ถูกติดตั้งแล้วหรือยัง
        const response = await fetch('http://localhost:3000/setup/status');
        if (response.ok) {
          const data = await response.json();
          setIsSetupComplete(data.isSetupComplete || false);
        } else {
          // หากไม่สามารถเชื่อมต่อได้ ให้ถือว่ายังไม่ได้ติดตั้ง
          setIsSetupComplete(false);
        }
      } catch (error) {
        console.log('Setup status check failed, assuming not setup yet');
        setIsSetupComplete(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSetupStatus();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleSetupComplete = () => {
    setIsSetupComplete(true);
  };

  // แสดง Loading spinner ขณะตรวจสอบสถานะ
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 1. ตรวจสอบว่าติดตั้งเสร็จแล้วหรือยัง
  if (!isSetupComplete) {
    return <SetupWizard onSetupComplete={handleSetupComplete} />;
  }

  // 2. ถ้าติดตั้งแล้ว แต่ยังไม่ Login ให้ไปหน้า Login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. ถ้า Login สำเร็จแล้ว ให้แสดงหน้า UI หลัก
  return <MainLayout />;
};

export default App;