// path: client/src/App.tsx
// version: 3.1 (Add Toast Provider)
// last-modified: 28 ตุลาคม 2568 17:10

import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
import MainLayout from './components/layout/MainLayout';
import { API_CONFIG, APP_CONFIG } from './config/env';
import { ToastProvider } from './contexts/ToastContext';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ตรวจสอบสถานะการติดตั้งจาก Backend และ localStorage
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        // ตรวจสอบจาก localStorage ก่อน
        const localSetupStatus = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SETUP_COMPLETE);

        if (localSetupStatus === 'true') {
          console.log('[App] Setup status found in localStorage');
          setIsSetupComplete(true);
          setIsLoading(false);
          return;
        }

        // ถ้าไม่มีใน localStorage ให้ตรวจสอบจาก Backend
        console.log('[App] Checking setup status from backend...');
        // ✅ ใช้ API_CONFIG.getUrl() (แก้ที่ไฟล์ config ที่เดียวแล้วจบ)
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SETUP_STATUS));

        if (response.ok) {
          const data = await response.json();
          const setupComplete = data.isSetupComplete || false;

          setIsSetupComplete(setupComplete);

          // เก็บสถานะใน localStorage เพื่อไม่ให้ต้องเช็คใหม่
          if (setupComplete) {
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SETUP_COMPLETE, 'true');
            console.log('[App] Setup complete - saved to localStorage');
          }
        } else {
          // หากไม่สามารถเชื่อมต่อได้ ให้ถือว่ายังไม่ได้ติดตั้ง
          console.log('[App] Backend unavailable, assuming not setup yet');
          setIsSetupComplete(false);
        }
      } catch (error) {
        console.log('[App] Setup status check failed, assuming not setup yet:', error);
        setIsSetupComplete(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSetupStatus();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // เก็บสถานะ login ใน sessionStorage (หายเมื่อปิด browser)
    sessionStorage.setItem(APP_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    console.log('[App] User logged in successfully');
  };

  const handleSetupComplete = () => {
    setIsSetupComplete(true);
    // เก็บสถานะ setup ใน localStorage (ถาวร)
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SETUP_COMPLETE, 'true');
    console.log('[App] Setup completed - saved to localStorage');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // ลบข้อมูล authentication (ใช้ keys จาก config)
    sessionStorage.removeItem(APP_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    console.log('[App] User logged out successfully');
  };

  // ตรวจสอบสถานะ authentication จาก sessionStorage
  useEffect(() => {
    const authStatus = sessionStorage.getItem(APP_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED);
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      console.log('[App] Authentication status restored from sessionStorage');
    }
  }, []);

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
    return (
      <ToastProvider>
        <SetupWizard onSetupComplete={handleSetupComplete} />
      </ToastProvider>
    );
  }

  // 2. ถ้าติดตั้งแล้ว แต่ยังไม่ Login ให้ไปหน้า Login
  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <Login onLoginSuccess={handleLoginSuccess} />
      </ToastProvider>
    );
  }

  // 3. ถ้า Login สำเร็จแล้ว ให้แสดงหน้า UI หลัก
  return (
    <ToastProvider>
      <MainLayout onLogout={handleLogout} />
    </ToastProvider>
  );
};

export default App;