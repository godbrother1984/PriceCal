import React, { useState } from 'react';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
import MainLayout from './components/layout/MainLayout'; // (ใหม่) Component สำหรับหน้า UI หลัก

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ตรวจสอบสถานะการติดตั้งจาก localStorage
  const isInitialSetupDone = localStorage.getItem('setupComplete') === 'true';

  // ฟังก์ชันที่จะถูกเรียกเมื่อ Login สำเร็จ
  const handleLoginSuccess = () => {
    // ในระบบจริง เราจะบันทึก Token ไว้ที่นี่
    // แต่ตอนนี้ เราจะแค่เปลี่ยน State เพื่อแสดงหน้า UI หลัก
    setIsAuthenticated(true);
  };

  // 1. ตรวจสอบว่าติดตั้งเสร็จแล้วหรือยัง
  if (!isInitialSetupDone) {
    return <SetupWizard />;
  }

  // 2. ถ้าติดตั้งแล้ว แต่ยังไม่ Login ให้ไปหน้า Login
  // สังเกตว่าเราได้ส่งฟังก์ชัน handleLoginSuccess เข้าไปยัง Component Login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. ถ้า Login สำเร็จแล้ว ให้แสดงหน้า UI หลัก (MainLayout)
  return <MainLayout />;
};

export default App;
