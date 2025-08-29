// path: client/src/components/layout/MainLayout.tsx
// version: 2.6 (Final Component Key Fix)
// last-modified: 29 สิงหาคม 2568 15:05

import React, { useState } from 'react';
import PriceRequestList from '../../pages/PriceRequestList';
import CreateRequest from '../../pages/CreateRequest';
import MasterData from '../../pages/MasterData';

type Page = 'dashboard' | 'requests' | 'create-request' | 'master-data' | 'reports';

const MainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('requests');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [requestsVersion, setRequestsVersion] = useState(0);

  const navigateTo = (page: Page) => {
    setActivePage(page);
    if (page === 'create-request') {
      setEditingRequestId(null);
    }
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleEditRequest = (requestId: string) => {
    setEditingRequestId(requestId);
    setActivePage('create-request');
  };

  const handleRequestSuccess = () => {
    setRequestsVersion(v => v + 1);
    navigateTo('requests');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'requests':
        return <PriceRequestList onNavigate={navigateTo} onEdit={handleEditRequest} version={requestsVersion} />;
      case 'create-request':
        return <CreateRequest 
                  onCancel={() => navigateTo('requests')} 
                  onSuccess={handleRequestSuccess}
                  requestId={editingRequestId}
               />;
      case 'master-data':
        // แก้ไข: ใช้ Date.now() เป็น key เพื่อบังคับให้ Component remount ใหม่ทุกครั้งที่เข้าหน้านี้
        // ซึ่งจะช่วยแก้ปัญหา State ค้าง และทำให้หน้าจอแสดงผลถูกต้องเสมอ
        return <MasterData key={Date.now()} />;
      default:
        return <PriceRequestList onNavigate={navigateTo} onEdit={handleEditRequest} version={requestsVersion} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* --- Sidebar --- */}
      <aside className={`fixed lg:relative z-20 h-full w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4">
          <h1 className="text-xl font-bold">FG Pricing</h1>
        </div>
        <nav className="p-4 space-y-2">
          <a href="#" onClick={() => navigateTo('requests')} className={`flex items-center px-4 py-2 rounded-lg ${activePage === 'requests' || activePage === 'create-request' ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
            Price Requests
          </a>
          <a href="#" onClick={() => navigateTo('master-data')} className={`flex items-center px-4 py-2 rounded-lg ${activePage === 'master-data' ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
            Master Data
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
         {/* Mobile Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 z-10 lg:hidden">
            <div className="h-16 flex items-center justify-between px-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-600 hover:text-slate-900">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                </button>
                <div className="text-lg font-semibold">FG Pricing</div>
                <div></div>
            </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
      
      {/* Overlay for mobile */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-10 lg:hidden"></div>}
    </div>
  );
};

export default MainLayout;

