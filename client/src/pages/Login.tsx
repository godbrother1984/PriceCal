// path: client/src/pages/Login.tsx
// version: 2.0 (JWT Token Storage)
// last-modified: 14 ตุลาคม 2568 16:15

import React, { useState } from 'react';

// (ใหม่) เพิ่ม Props interface เพื่อรับฟังก์ชัน onLoginSuccess
interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      // ✅ รับ JWT token จาก Backend response
      const data = await response.json();
      const token = data.access_token;

      if (token) {
        // ✅ เก็บ JWT token ใน localStorage
        localStorage.setItem('authToken', token);
        console.log('[Login] JWT token saved to localStorage');

        // เรียกฟังก์ชัน onLoginSuccess
        onLoginSuccess();
      } else {
        throw new Error('No token received from server');
      }

    } catch (err) {
      console.error('[Login] Login error:', err);
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">FG Pricing System</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div className="mb-6">
            <label>Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
